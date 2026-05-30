const dbName = "nyc_food";
const seedPath = "/seed/nyc-food-seed.json";

// Dans mongosh, `db` représente la base courante au moment où le script démarre.
// `getSiblingDB("nyc_food")` sélectionne explicitement la base de travail, même
// si l'utilisateur est connecté à `admin`, `test` ou une autre base.
const workDb = db.getSiblingDB(dbName);

// Ce script importe un snapshot JSON local, sans téléchargement réseau.
// Le dossier racine data/ du dépôt est monté dans le conteneur sous /seed.
// mongosh expose require("fs"), ce qui permet de lire le fichier depuis le conteneur.
const fs = require("fs");
const seed = EJSON.parse(fs.readFileSync(seedPath, "utf8"));
const collections = seed.collections || {};

function replaceCollection(name, documents) {
  workDb.getCollection(name).drop();
  if (documents.length > 0) {
    workDb.getCollection(name).insertMany(documents, { ordered: false });
  }
  print(`${name}: ${documents.length}`);
}

replaceCollection("nyc_restaurant_reviews_raw", collections.nyc_restaurant_reviews_raw || []);
replaceCollection("restaurants", collections.restaurants || []);
replaceCollection("reviews", collections.reviews || []);
replaceCollection("neighborhoods", collections.neighborhoods || []);

// Les collections générées dépendent des restaurants. Après import du seed,
// relancer generate-volume.js si orders, review_details et events sont nécessaires.
workDb.orders.drop();
workDb.review_details.drop();
workDb.events.drop();
workDb.restaurant_kpis.drop();

// Index alignés sur les requêtes du cours et les exercices.
workDb.nyc_restaurant_reviews_raw.createIndex({ restaurant: 1 });
workDb.nyc_restaurant_reviews_raw.createIndex({ food: -1, service: -1 });
workDb.nyc_restaurant_reviews_raw.createIndex({ price: 1 });
workDb.restaurants.createIndex({ restaurant_id: 1 }, { unique: true });
workDb.restaurants.createIndex({ cuisine: 1, price_tier: 1 });
workDb.restaurants.createIndex({ "ratings.overall": -1 });
workDb.restaurants.createIndex({ location_area: 1, "ratings.food": -1 });
workDb.restaurants.createIndex({ tags: 1 });
workDb.reviews.createIndex({ restaurant_id: 1, reviewed_at: -1 });
workDb.reviews.createIndex({ sentiment: 1, "scores.overall": -1 });
workDb.reviews.createIndex({ highlights: 1 });
workDb.neighborhoods.createIndex({ center: "2dsphere" });

print(`Seed import completed from ${seedPath}`);
