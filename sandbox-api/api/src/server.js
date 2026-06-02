import express from "express";
import { MongoClient } from "mongodb";
import { RestaurantQuerySchema } from "./schemas.js";

const app = express();

const port = Number(process.env.PORT ?? 3000);
const mongoUri =
  process.env.MONGODB_URI ?? "mongodb://api_user:api_pass@mongodb:27017/nyc_food";
const mongoDbName = process.env.MONGODB_DB ?? "nyc_food";

const client = new MongoClient(mongoUri);
await client.connect();

const db = client.db(mongoDbName);
const restaurants = db.collection("restaurants");

app.get("/api/restaurants", async (req, res) => {
  const query = RestaurantQuerySchema.safeParse(req.query);

  if (!query.success) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      issues: query.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
    return;
  }

  const filter = {};

  if (query.data.cuisine) {
    filter.cuisine = query.data.cuisine;
  }

  if (query.data.minOverall !== undefined) {
    filter["ratings.overall"] = { $gte: query.data.minOverall };
  }

  const data = await restaurants
    .find(filter, {
      projection: {
        _id: 0,
        restaurant_id: 1,
        name: 1,
        cuisine: 1,
        location_area: 1,
        price_for_two: 1,
        ratings: 1
      }
    })
    .sort({ "ratings.overall": -1, name: 1 })
    .limit(query.data.limit)
    .toArray();

  res.json({ data });
});

app.listen(port, () => {
  console.log(`Sandbox API listening on port ${port}`);
});
