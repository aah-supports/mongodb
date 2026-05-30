const dbName = "nyc_food";
const env = typeof process !== "undefined" && process.env ? process.env : {};
const targetOrders = Number(env.NYC_GENERATE_ORDERS || 100000);
const targetEvents = Number(env.NYC_GENERATE_EVENTS || 300000);
const targetReviewDetails = Number(env.NYC_GENERATE_REVIEW_DETAILS || 50000);
const batchSize = 5000;

// Dans mongosh, `db` représente la base courante au moment où le script démarre.
// `getSiblingDB("nyc_food")` sélectionne explicitement la base de travail, même
// si l'utilisateur est connecté à `admin`, `test` ou une autre base.
const workDb = db.getSiblingDB(dbName);
const restaurantIds = workDb.restaurants.distinct("restaurant_id");

// Les volumes générés s'appuient sur les restaurants importés. On force donc
// l'ordre pédagogique : import-restaurant-reviews.js doit être lancé avant ce script.
if (restaurantIds.length === 0) {
  throw new Error("No restaurants found. Start the sandbox first.");
}

// Insère les documents par lots pour éviter de construire un énorme tableau en mémoire.
// buildDoc reçoit l'index courant et produit un document déterministe.
function insertBatches(collectionName, total, buildDoc) {
  let batch = [];
  for (let i = 0; i < total; i++) {
    batch.push(buildDoc(i));
    if (batch.length === batchSize) {
      workDb[collectionName].insertMany(batch, { ordered: false });
      batch = [];
      print(`${collectionName}: ${i + 1}/${total}`);
    }
  }
  if (batch.length > 0) {
    workDb[collectionName].insertMany(batch, { ordered: false });
  }
}

// Valeurs cycliques utilisées pour générer des données répétables. Le but est
// de créer du volume exploitable en cours, pas de simuler un hasard parfait.
const channels = ["web", "mobile", "delivery_partner", "walk_in"];
const statuses = ["paid", "paid", "paid", "cancelled", "refunded"];
const eventTypes = ["restaurant_view", "search", "order_started", "order_paid", "review_opened", "favorite_added"];
const sentiments = ["excellent", "positive", "positive", "mixed", "negative"];
const visitReasons = ["date_night", "business_lunch", "family_dinner", "solo_meal", "tourist_stop"];
const reviewTexts = [
  "Great food and attentive service.",
  "Good value for the neighborhood.",
  "Beautiful room but service was uneven.",
  "Reliable dinner spot with strong dishes.",
  "Too expensive for the overall experience."
];

// Commandes simulées : collection principale pour les exercices de volume,
// de tri par date, de filtre par statut et d'agrégation de chiffre d'affaires.
insertBatches("orders", targetOrders, (i) => {
  const restaurant_id = restaurantIds[i % restaurantIds.length];
  return {
    order_id: `BULK-ORD-${String(i + 1).padStart(9, "0")}`,
    restaurant_id,
    created_at: new Date(Date.UTC(2025, i % 12, 1 + (i % 28), i % 24, i % 60)),
    channel: channels[i % channels.length],
    status: statuses[i % statuses.length],
    amount: Number((6 + (i % 80) + ((i % 9) * 0.35)).toFixed(2)),
    items_count: 1 + (i % 9),
    customer: {
      loyalty_tier: ["none", "bronze", "silver", "gold"][i % 4],
      zipcode: ["10001", "10003", "10011", "10016", "10019", "10021", "10024", "10028"][i % 8]
    }
  };
});

// Avis détaillés simulés : complète la collection reviews, qui reste agrégée.
// Cette collection sert aux exercices sur sentiments, notes et visites vérifiées.
insertBatches("review_details", targetReviewDetails, (i) => {
  const restaurant_id = restaurantIds[i % restaurantIds.length];
  const rating = 2 + (i % 4) + ((i % 10) / 10);
  return {
    review_detail_id: `REV-DETAIL-${String(i + 1).padStart(9, "0")}`,
    restaurant_id,
    reviewed_at: new Date(Date.UTC(2025, i % 12, 1 + (i % 28), i % 24, i % 60)),
    rating: Number(Math.min(rating, 5).toFixed(1)),
    sentiment: sentiments[i % sentiments.length],
    visit_reason: visitReasons[i % visitReasons.length],
    channel: ["web", "mobile", "partner"][i % 3],
    verified_visit: i % 5 !== 0,
    helpful_votes: i % 37,
    text: reviewTexts[i % reviewTexts.length]
  };
});

// Événements applicatifs simulés : utiles pour discuter d'activité produit,
// de séries temporelles simples et d'index sur type d'événement/date.
insertBatches("events", targetEvents, (i) => {
  const restaurant_id = restaurantIds[i % restaurantIds.length];
  return {
    event_id: `EVT-${String(i + 1).padStart(10, "0")}`,
    restaurant_id,
    event_type: eventTypes[i % eventTypes.length],
    occurred_at: new Date(Date.UTC(2025, i % 12, 1 + (i % 28), i % 24, i % 60, i % 60)),
    session_id: `S-${Math.floor(i / 6)}`,
    device: ["desktop", "ios", "android"][i % 3],
    latency_ms: 20 + (i % 900)
  };
});

// Index créés après insertion pour accélérer les requêtes prévues dans les exercices.
// Ils couvrent surtout les filtres par restaurant, date, statut et sentiment.
workDb.orders.createIndex({ restaurant_id: 1, created_at: -1 });
workDb.orders.createIndex({ created_at: -1, status: 1 });
workDb.review_details.createIndex({ restaurant_id: 1, reviewed_at: -1 });
workDb.review_details.createIndex({ sentiment: 1, rating: -1 });
workDb.review_details.createIndex({ visit_reason: 1, reviewed_at: -1 });
workDb.events.createIndex({ restaurant_id: 1, occurred_at: -1 });
workDb.events.createIndex({ event_type: 1, occurred_at: -1 });

print("Volume generation completed");
