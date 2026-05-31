# Correction TP 03 - Maîtriser `aggregate`

## 1. Nombre de restaurants par cuisine

```javascript
db.restaurants.aggregate([
  { $match: { cuisine: { $ne: null } } },
  { $group: { _id: "$cuisine", restaurants: { $sum: 1 } } },
  { $sort: { restaurants: -1 } }
])
```

## 2. Score sanitaire moyen par borough

```javascript
db.restaurants.aggregate([
  { $match: { latest_score: { $ne: null }, borough: { $ne: null } } },
  {
    $group: {
      _id: "$borough",
      average_score: { $avg: "$latest_score" },
      restaurants: { $sum: 1 }
    }
  },
  { $sort: { average_score: -1 } }
])
```

## 3. Cuisines dont le score moyen est supérieur à 15

```javascript
db.restaurants.aggregate([
  { $match: { latest_score: { $ne: null }, cuisine: { $ne: null } } },
  {
    $group: {
      _id: "$cuisine",
      average_score: { $avg: "$latest_score" },
      restaurants: { $sum: 1 }
    }
  },
  { $match: { average_score: { $gt: 15 } } },
  { $sort: { average_score: -1 } }
])
```

## 4. Chiffre d'affaires par canal de vente

Les collections `orders`, `review_details` et `events` sont créées automatiquement au premier lancement d'un volume MongoDB vide.

Pipeline :

```javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  {
    $group: {
      _id: "$channel",
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 },
      average_basket: { $avg: "$amount" }
    }
  },
  { $sort: { revenue: -1 } }
])
```

## 5. Panier moyen par borough avec `$lookup`

```javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  {
    $lookup: {
      from: "restaurants",
      localField: "restaurant_id",
      foreignField: "restaurant_id",
      as: "restaurant"
    }
  },
  { $unwind: "$restaurant" },
  {
    $group: {
      _id: "$restaurant.borough",
      average_basket: { $avg: "$amount" },
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 }
    }
  },
  { $sort: { average_basket: -1 } }
])
```

## 6. Restaurants avec score sanitaire élevé et revenus importants

```javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  {
    $group: {
      _id: "$restaurant_id",
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "restaurants",
      localField: "_id",
      foreignField: "restaurant_id",
      as: "restaurant"
    }
  },
  { $unwind: "$restaurant" },
  { $match: { "restaurant.latest_score": { $gte: 20 } } },
  {
    $project: {
      _id: 0,
      restaurant_id: "$_id",
      name: "$restaurant.name",
      borough: "$restaurant.borough",
      cuisine: "$restaurant.cuisine",
      latest_score: "$restaurant.latest_score",
      revenue: 1,
      orders: 1
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 20 }
])
```

## 7. Créer une collection matérialisée `restaurant_kpis`

```javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  {
    $group: {
      _id: "$restaurant_id",
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 },
      average_basket: { $avg: "$amount" },
      last_order_at: { $max: "$created_at" }
    }
  },
  {
    $lookup: {
      from: "restaurants",
      localField: "_id",
      foreignField: "restaurant_id",
      as: "restaurant"
    }
  },
  { $unwind: "$restaurant" },
  {
    $project: {
      _id: 0,
      restaurant_id: "$_id",
      name: "$restaurant.name",
      borough: "$restaurant.borough",
      cuisine: "$restaurant.cuisine",
      latest_score: "$restaurant.latest_score",
      current_grade: "$restaurant.current_grade",
      revenue: 1,
      orders: 1,
      average_basket: 1,
      last_order_at: 1,
      generated_at: "$$NOW"
    }
  },
  {
    $merge: {
      into: "restaurant_kpis",
      on: "restaurant_id",
      whenMatched: "replace",
      whenNotMatched: "insert"
    }
  }
])
```

Vérifier :

```javascript
db.restaurant_kpis.find().sort({ revenue: -1 }).limit(10)
```
