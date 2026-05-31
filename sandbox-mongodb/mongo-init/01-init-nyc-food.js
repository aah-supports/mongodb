db = db.getSiblingDB("nyc_food");

db.createUser({
  user: "student",
  pwd: "studentpass",
  roles: [{ role: "readWrite", db: "nyc_food" }]
});

function loadJsonArrayCollection(collectionName) {
  const path = `/seed/nyc-food/${collectionName}.json`;
  const documents = EJSON.parse(require("fs").readFileSync(path, "utf8"));

  db.getCollection(collectionName).drop();
  if (documents.length > 0) {
    db.getCollection(collectionName).insertMany(documents);
  }

  print(`${collectionName}: ${documents.length} documents loaded`);
}

loadJsonArrayCollection("nyc_restaurant_reviews_raw");
loadJsonArrayCollection("restaurants");
loadJsonArrayCollection("reviews");
loadJsonArrayCollection("neighborhoods");

db.nyc_restaurant_reviews_raw.createIndex({ restaurant: 1 });
db.nyc_restaurant_reviews_raw.createIndex({ food: -1, service: -1 });
db.nyc_restaurant_reviews_raw.createIndex({ price: 1 });
db.restaurants.createIndex({ restaurant_id: 1 }, { unique: true });
db.restaurants.createIndex({ cuisine: 1, price_tier: 1 });
db.restaurants.createIndex({ "ratings.overall": -1 });
db.restaurants.createIndex({ location_area: 1, "ratings.food": -1 });
db.restaurants.createIndex({ tags: 1 });
db.reviews.createIndex({ restaurant_id: 1, reviewed_at: -1 });
db.reviews.createIndex({ sentiment: 1, "scores.overall": -1 });
db.reviews.createIndex({ highlights: 1 });
db.neighborhoods.createIndex({ center: "2dsphere" });

load("/scripts/generate-volume.js");

print("nyc_food sandbox initialized with base and generated collections.");
