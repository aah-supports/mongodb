db = db.getSiblingDB("nyc_food");

db.createUser({
  user: "api_user",
  pwd: "api_pass",
  roles: [{ role: "read", db: "nyc_food" }]
});

const restaurants = EJSON.parse(
  require("fs").readFileSync("/seed/nyc-food/restaurants.json", "utf8")
);

db.restaurants.drop();

if (restaurants.length > 0) {
  db.restaurants.insertMany(restaurants);
}

db.restaurants.createIndex({ restaurant_id: 1 }, { unique: true });
db.restaurants.createIndex({ cuisine: 1, "ratings.overall": -1 });
db.restaurants.createIndex({ "ratings.overall": -1 });

print(`restaurants: ${restaurants.length} documents loaded`);
