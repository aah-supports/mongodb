const dbName = "nyc_food";
const env = typeof process !== "undefined" && process.env ? process.env : {};
const targetOrders = Number(env.NYC_GENERATE_ORDERS || 100000);
const targetEvents = Number(env.NYC_GENERATE_EVENTS || 300000);
const targetReviewDetails = Number(env.NYC_GENERATE_REVIEW_DETAILS || 50000);
const batchSize = 5000;

const workDb = db.getSiblingDB(dbName);
const restaurantIds = workDb.restaurants.distinct("restaurant_id");

if (restaurantIds.length === 0) {
  throw new Error("No restaurants found. Start the sandbox first.");
}

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

workDb.orders.createIndex({ restaurant_id: 1, created_at: -1 });
workDb.orders.createIndex({ created_at: -1, status: 1 });
workDb.review_details.createIndex({ restaurant_id: 1, reviewed_at: -1 });
workDb.review_details.createIndex({ sentiment: 1, rating: -1 });
workDb.review_details.createIndex({ visit_reason: 1, reviewed_at: -1 });
workDb.events.createIndex({ restaurant_id: 1, occurred_at: -1 });
workDb.events.createIndex({ event_type: 1, occurred_at: -1 });

print("Volume generation completed");
