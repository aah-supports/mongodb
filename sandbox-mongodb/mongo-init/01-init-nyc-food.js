db = db.getSiblingDB("nyc_food");

db.createUser({
  user: "student",
  pwd: "studentpass",
  roles: [{ role: "readWrite", db: "nyc_food" }]
});

db.neighborhoods.drop();

db.neighborhoods.insertMany([
  { name: "Midtown", borough: "Manhattan", center: { type: "Point", coordinates: [-73.9855, 40.7580] } },
  { name: "Flushing", borough: "Queens", center: { type: "Point", coordinates: [-73.8370, 40.7675] } },
  { name: "Brooklyn Heights", borough: "Brooklyn", center: { type: "Point", coordinates: [-73.9958, 40.6960] } },
  { name: "Belmont", borough: "Bronx", center: { type: "Point", coordinates: [-73.8860, 40.8540] } },
  { name: "St. George", borough: "Staten Island", center: { type: "Point", coordinates: [-74.0735, 40.6435] } }
]);

db.neighborhoods.createIndex({ center: "2dsphere" });

print("nyc_food sandbox initialized. Run /scripts/import-restaurant-reviews.js to load the restaurant reviews dataset.");
