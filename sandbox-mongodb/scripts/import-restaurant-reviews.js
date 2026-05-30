const dbName = "nyc_food";
const endpoint = "https://raw.githubusercontent.com/OpenIntroStat/openintro/main/data-raw/nyc/nyc.csv";
const env = typeof process !== "undefined" && process.env ? process.env : {};
const maxRows = Number(env.NYC_IMPORT_MAX_ROWS || 1000);

// Dans mongosh, `db` représente la base courante au moment où le script démarre.
// `getSiblingDB("nyc_food")` sélectionne explicitement la base de travail, même
// si l'utilisateur est connecté à `admin`, `test` ou une autre base.
const workDb = db.getSiblingDB(dbName);

// Télécharge le CSV source depuis OpenIntro. Le script tourne dans mongosh, où
// fetch est disponible sur les versions récentes utilisées par l'image MongoDB.
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  return response.text();
}

// Parse une ligne CSV en gérant les guillemets et les virgules dans les champs.
// Le dataset est petit, donc un parseur local suffit pour garder le script autonome.
function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      i++;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

// Transforme le CSV complet en objets JavaScript simples avec les en-têtes
// comme clés. maxRows permet de réduire le volume pour une démo rapide.
function parseCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1, maxRows + 1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || null;
      return row;
    }, {});
  });
}

// Les données CSV arrivent sous forme de chaînes. On convertit explicitement
// les champs numériques pour que les filtres MongoDB ($gte, $lte, $avg) soient fiables.
function numberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Première normalisation : on garde une collection brute proche du CSV, mais
// avec des noms de champs cohérents et les types numériques convertis.
function cleanRow(row) {
  return {
    source_case: numberOrNull(row.case),
    restaurant: row.restaurant || null,
    price: numberOrNull(row.price),
    food: numberOrNull(row.food),
    decor: numberOrNull(row.decor),
    service: numberOrNull(row.service),
    east: numberOrNull(row.east),
    imported_at: new Date()
  };
}

// Classe les notes Zagat sur l'échelle pédagogique utilisée dans le cours.
function ratingBand(score) {
  if (score === null) return null;
  if (score <= 9) return "poor_to_fair";
  if (score <= 15) return "fair_to_good";
  if (score <= 19) return "good_to_very_good";
  if (score <= 25) return "very_good_to_excellent";
  return "extraordinary_to_perfection";
}

// Convertit le prix brut en tranche lisible pour les exercices de recherche.
function priceTier(price) {
  if (price === null) return null;
  if (price < 35) return "$";
  if (price < 50) return "$$";
  if (price < 70) return "$$$";
  return "$$$$";
}

// Le dataset réel ne contient pas de cuisine. On l'infère de manière déterministe
// pour enrichir les exercices find/aggregate sans masquer l'origine des données.
function inferredCuisine(index) {
  const cuisines = ["Italian", "French", "American", "Japanese", "Mediterranean", "Steakhouse", "Seafood", "Bistro"];
  return cuisines[index % cuisines.length];
}

// Les tags sont aussi inférés à partir des notes et du prix. Ils servent à
// illustrer les tableaux, les requêtes multikey et les index sur tableaux.
function inferredTags(row, index) {
  const tags = [];
  if (row.food >= 24) tags.push("top_food");
  if (row.service >= 24) tags.push("great_service");
  if (row.decor >= 24) tags.push("stylish");
  if (row.price < 35) tags.push("good_value");
  if (row.price >= 70) tags.push("fine_dining");
  tags.push(index % 2 === 0 ? "dinner" : "lunch");
  return tags;
}

// Étape 1 : importer la donnée source dans une collection brute.
// Cette collection permet de comparer le CSV d'origine au modèle documentaire.
async function importRawRows() {
  workDb.nyc_restaurant_reviews_raw.drop();

  const csvText = await fetchText(endpoint);
  const rows = parseCsv(csvText).map(cleanRow);

  if (rows.length > 0) {
    workDb.nyc_restaurant_reviews_raw.insertMany(rows, { ordered: false });
  }

  // Index simples utiles pour explorer la collection brute dans les premiers TP.
  workDb.nyc_restaurant_reviews_raw.createIndex({ restaurant: 1 });
  workDb.nyc_restaurant_reviews_raw.createIndex({ food: -1, service: -1 });
  workDb.nyc_restaurant_reviews_raw.createIndex({ price: 1 });

  return rows.length;
}

// Étape 2 : transformer les lignes brutes en deux collections applicatives :
// - restaurants : document principal orienté établissement ;
// - reviews : notation agrégée orientée avis, reliée par restaurant_id.
function transformCollections() {
  workDb.restaurants.drop();
  workDb.reviews.drop();

  // On supprime aussi les collections générées, car elles dépendent des restaurants.
  // Après un nouvel import, il faut relancer generate-volume.js.
  workDb.orders.drop();
  workDb.review_details.drop();
  workDb.events.drop();
  workDb.restaurant_kpis.drop();

  const rawRows = workDb.nyc_restaurant_reviews_raw.find().sort({ source_case: 1 }).toArray();
  const restaurants = [];
  const reviews = [];

  rawRows.forEach((row, index) => {
    // Identifiant stable partagé par restaurants, reviews et les futures données générées.
    const restaurantId = `NYC-ZAGAT-${String(row.source_case || index + 1).padStart(4, "0")}`;
    const overall = Number(((row.food + row.decor + row.service) / 3).toFixed(1));
    const locationSide = row.east === 1 ? "East of 5th Avenue" : "West of 5th Avenue";

    restaurants.push({
      restaurant_id: restaurantId,
      name: row.restaurant,
      cuisine: inferredCuisine(index),
      location_area: locationSide,
      price_for_two: row.price,
      price_tier: priceTier(row.price),
      ratings: {
        food: row.food,
        decor: row.decor,
        service: row.service,
        overall
      },
      rating_band: ratingBand(overall),
      tags: inferredTags(row, index),
      source: {
        name: "OpenIntro nyc Zagat restaurant ratings",
        url: endpoint,
        case: row.source_case
      }
    });

    reviews.push({
      review_id: `ZAGAT-${String(row.source_case || index + 1).padStart(4, "0")}`,
      restaurant_id: restaurantId,
      reviewed_at: new Date(Date.UTC(2025, index % 12, 1 + (index % 28))),
      reviewer_type: index % 3 === 0 ? "local" : index % 3 === 1 ? "visitor" : "critic_panel",
      scores: {
        food: row.food,
        decor: row.decor,
        service: row.service,
        overall
      },
      price_for_two: row.price,
      sentiment: overall >= 24 ? "excellent" : overall >= 20 ? "positive" : overall >= 16 ? "mixed" : "negative",
      highlights: inferredTags(row, index),
      source: {
        name: "OpenIntro nyc Zagat restaurant ratings",
        url: endpoint,
        case: row.source_case
      }
    });
  });

  if (restaurants.length > 0) {
    workDb.restaurants.insertMany(restaurants, { ordered: false });
    workDb.reviews.insertMany(reviews, { ordered: false });
  }

  // Index alignés sur les requêtes du cours : filtre par cuisine/prix,
  // tri par note, recherche par tags et jointures sur restaurant_id.
  workDb.restaurants.createIndex({ restaurant_id: 1 }, { unique: true });
  workDb.restaurants.createIndex({ cuisine: 1, price_tier: 1 });
  workDb.restaurants.createIndex({ "ratings.overall": -1 });
  workDb.restaurants.createIndex({ location_area: 1, "ratings.food": -1 });
  workDb.restaurants.createIndex({ tags: 1 });
  workDb.reviews.createIndex({ restaurant_id: 1, reviewed_at: -1 });
  workDb.reviews.createIndex({ sentiment: 1, "scores.overall": -1 });
  workDb.reviews.createIndex({ highlights: 1 });
}

// Point d'entrée : import brut, transformation documentaire, puis résumé lisible.
(async () => {
  const imported = await importRawRows();
  transformCollections();

  print(`Review import completed: ${imported} raw rows`);
  print(`restaurants: ${workDb.restaurants.countDocuments()}`);
  print(`reviews: ${workDb.reviews.countDocuments()}`);
})();
