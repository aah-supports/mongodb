# Correction TP 02 - Maîtriser `find`

## 1. Restaurants avec note globale supérieure ou égale à 23

```javascript
db.restaurants.find(
  { "ratings.overall": { $gte: 23 } },
  { _id: 0, name: 1, cuisine: 1, price_tier: 1, "ratings.overall": 1 }
).sort({ "ratings.overall": -1 })
```

## 2. Restaurants dont le prix pour deux est inférieur ou égal à 40 dollars

```javascript
db.restaurants.find(
  { price_for_two: { $lte: 40 } },
  { _id: 0, name: 1, cuisine: 1, price_for_two: 1, price_tier: 1 }
).sort({ price_for_two: 1 })
```

## 3. Restaurants `$$` ou `$$$`, triés par note de service décroissante

```javascript
db.restaurants.find(
  { price_tier: { $in: ["$$", "$$$"] } },
  { _id: 0, name: 1, cuisine: 1, price_tier: 1, "ratings.service": 1 }
).sort({ "ratings.service": -1 })
```

## 4. Afficher uniquement `name`, `cuisine`, `price_tier` et `ratings`

```javascript
db.restaurants.find(
  {},
  { _id: 0, name: 1, cuisine: 1, price_tier: 1, ratings: 1 }
).limit(20)
```

## 5. Restaurants avec les tags `top_food` et `great_service`

```javascript
db.restaurants.find(
  { tags: { $all: ["top_food", "great_service"] } },
  { _id: 0, name: 1, cuisine: 1, tags: 1, ratings: 1 }
)
```

## 6. Restaurants dont le nom contient `cafe`, `bistro` ou `ristorante`

```javascript
db.restaurants.find(
  { name: { $regex: "cafe|bistro|ristorante", $options: "i" } },
  { _id: 0, name: 1, cuisine: 1, price_tier: 1 }
)
```

## 7. Avis agrégés `reviews` avec sentiment `excellent`

```javascript
db.reviews.find(
  { sentiment: "excellent" },
  { _id: 0, review_id: 1, restaurant_id: 1, sentiment: 1, scores: 1 }
).sort({ "scores.overall": -1 })
```

## 8. Les 10 commandes les plus récentes d'un restaurant existant

Générer les collections de volume si nécessaire :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" /scripts/generate-volume.js
```

Dans `mongosh` :

```javascript
const restaurantId = db.restaurants.findOne({}, { restaurant_id: 1 }).restaurant_id

db.orders.find(
  { restaurant_id: restaurantId },
  { _id: 0, order_id: 1, restaurant_id: 1, created_at: 1, amount: 1, status: 1 }
).sort({ created_at: -1 }).limit(10)
```

## 9. Avis détaillés vérifiés avec une note supérieure ou égale à 4.5

```javascript
db.review_details.find(
  { verified_visit: true, rating: { $gte: 4.5 } },
  { _id: 0, review_detail_id: 1, restaurant_id: 1, rating: 1, sentiment: 1, visit_reason: 1 }
).sort({ rating: -1 }).limit(20)
```

## 10. Requêtes qui devraient avoir un index

Index pertinents :

```javascript
db.restaurants.createIndex({ "ratings.overall": -1 })
db.restaurants.createIndex({ cuisine: 1, price_tier: 1 })
db.restaurants.createIndex({ tags: 1 })
db.reviews.createIndex({ sentiment: 1, "scores.overall": -1 })
db.orders.createIndex({ restaurant_id: 1, created_at: -1 })
db.orders.createIndex({ status: 1, amount: -1 })
db.review_details.createIndex({ verified_visit: 1, rating: -1 })
```

Justification :

- `ratings.overall` accélère les seuils et classements par note ;
- `cuisine + price_tier` accélère les filtres métier fréquents ;
- `tags` crée un index multikey utile aux recherches dans le tableau ;
- `sentiment + scores.overall` accélère l'analyse des avis agrégés ;
- `restaurant_id + created_at` accélère l'historique de commandes ;
- `status + amount` accélère les commandes payées au-dessus d'un seuil ;
- `verified_visit + rating` accélère les avis détaillés exploitables.
