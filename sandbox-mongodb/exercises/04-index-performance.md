# TP 04 - Index et Performance

## Objectifs

- Mesurer une requête avec `explain()`.
- Comprendre le `COLLSCAN`.
- Créer des index adaptés aux requêtes `find` et `aggregate`.
- Justifier l'ordre des champs dans un index composé.

## Mesurer une requête

Choisir un restaurant existant :

```javascript
const restaurantId = db.restaurants.findOne({}, { restaurant_id: 1 }).restaurant_id
```

Mesurer une recherche de commandes :

```javascript
db.orders.find({
  restaurant_id: restaurantId,
  status: "paid"
}).sort({ created_at: -1 }).explain("executionStats")
```

Points à observer :

- `executionTimeMillis`
- `totalDocsExamined`
- `totalKeysExamined`
- `stage`

## Créer un index composé

```javascript
db.orders.createIndex({ restaurant_id: 1, status: 1, created_at: -1 })
```

Relancer `explain()` et comparer.

## Index sur champs imbriqués

Les notes sont stockées dans `ratings`.

```javascript
db.restaurants.createIndex({ "ratings.overall": -1, price_for_two: 1 })
```

Requête :

```javascript
db.restaurants.find({
  "ratings.overall": { $gte: 23 },
  price_for_two: { $lte: 50 }
}).sort({ "ratings.overall": -1 }).explain("executionStats")
```

## Index multikey sur tableau

Le champ `tags` est un tableau. MongoDB crée alors un index multikey.

```javascript
db.restaurants.createIndex({ tags: 1, "ratings.food": -1 })
```

Requête :

```javascript
db.restaurants.find({
  tags: "top_food",
  "ratings.food": { $gte: 24 }
}).sort({ "ratings.food": -1 }).explain("executionStats")
```

## Index pour agrégation

Un pipeline qui commence par `$match` peut utiliser un index.

```javascript
db.review_details.createIndex({ sentiment: 1, rating: -1 })

db.review_details.aggregate([
  { $match: { sentiment: "excellent", rating: { $gte: 4.5 } } },
  { $group: { _id: "$restaurant_id", reviews: { $sum: 1 } } },
  { $sort: { reviews: -1 } }
]).explain("executionStats")
```

## Exercices

1. Relever les performances d'une requête sans index pertinent.
2. Proposer un index composé pour une recherche par `restaurant_id`, `status` et date.
3. Justifier l'ordre des champs dans l'index.
4. Comparer avant/après avec `explain("executionStats")`.
5. Créer un index sur `ratings.overall` et `price_for_two`.
6. Créer un index multikey sur `tags`.
7. Optimiser une agrégation sur `review_details` qui commence par `$match`.
8. Identifier un index inutile ou redondant avec `db.collection.getIndexes()`.
