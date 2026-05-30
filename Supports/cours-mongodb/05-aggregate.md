# Cours - Analyser avec `aggregate`

## Objectifs

À la fin de cette partie, l'apprenant doit savoir :

- construire un pipeline d'agrégation ;
- filtrer, projeter, grouper et trier ;
- manipuler des tableaux avec `$unwind` ;
- relier deux collections avec `$lookup` ;
- créer une collection de résultats avec `$merge` ;
- construire des indicateurs métier sur les restaurants et avis clients.

## Principe

`aggregate` exécute une suite d'étapes appelées pipeline.

```javascript
db.collection.aggregate([
  { stage1 },
  { stage2 },
  { stage3 }
])
```

Chaque étape reçoit des documents, les transforme, puis transmet le résultat à l'étape suivante.

## `$match`

`$match` filtre les documents. Il est souvent placé au début pour réduire le volume traité.

```javascript
db.restaurants.aggregate([
  { $match: { "ratings.overall": { $gte: 22 } } }
])
```

## `$project`

`$project` choisit les champs et peut créer des champs calculés.

```javascript
db.restaurants.aggregate([
  {
    $project: {
      _id: 0,
      name: 1,
      cuisine: 1,
      price_for_two: 1,
      overall_rating: "$ratings.overall"
    }
  }
])
```

## `$set`

`$set` ajoute ou modifie un champ en conservant les autres.

```javascript
db.restaurants.aggregate([
  {
    $set: {
      value_score: {
        $round: [
          { $divide: ["$ratings.overall", "$price_for_two"] },
          3
        ]
      }
    }
  },
  { $sort: { value_score: -1 } },
  { $limit: 10 }
])
```

## `$group`

Nombre de restaurants par cuisine :

```javascript
db.restaurants.aggregate([
  { $group: { _id: "$cuisine", restaurants: { $sum: 1 } } },
  { $sort: { restaurants: -1 } }
])
```

Note moyenne par cuisine :

```javascript
db.restaurants.aggregate([
  {
    $group: {
      _id: "$cuisine",
      average_food: { $avg: "$ratings.food" },
      average_decor: { $avg: "$ratings.decor" },
      average_service: { $avg: "$ratings.service" },
      average_overall: { $avg: "$ratings.overall" },
      restaurants: { $sum: 1 }
    }
  },
  { $sort: { average_overall: -1 } }
])
```

## Accumulateurs fréquents

| Accumulateur | Usage |
|---|---|
| `$sum` | compter ou additionner |
| `$avg` | calculer une moyenne |
| `$min` | valeur minimale |
| `$max` | valeur maximale |
| `$first` | première valeur après tri |
| `$push` | construire un tableau |
| `$addToSet` | construire un tableau sans doublons |

## `$unwind`

`$unwind` transforme chaque élément d'un tableau en document séparé.

Compter les tags :

```javascript
db.restaurants.aggregate([
  { $unwind: "$tags" },
  {
    $group: {
      _id: "$tags",
      restaurants: { $sum: 1 }
    }
  },
  { $sort: { restaurants: -1 } }
])
```

## `$lookup`

`$lookup` permet de relier deux collections.

Ajouter les restaurants aux avis détaillés :

```javascript
db.review_details.aggregate([
  { $match: { verified_visit: true, rating: { $gte: 4.5 } } },
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
    $project: {
      _id: 0,
      reviewed_at: 1,
      rating: 1,
      sentiment: 1,
      name: "$restaurant.name",
      cuisine: "$restaurant.cuisine",
      price_tier: "$restaurant.price_tier"
    }
  },
  { $sort: { rating: -1, reviewed_at: -1 } },
  { $limit: 20 }
])
```

## Agréger les commandes

Chiffre d'affaires par restaurant :

```javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  {
    $group: {
      _id: "$restaurant_id",
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 },
      average_basket: { $avg: "$amount" }
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 10 }
])
```

Chiffre d'affaires avec le nom du restaurant :

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
  {
    $project: {
      _id: 0,
      restaurant_id: "$_id",
      name: "$restaurant.name",
      cuisine: "$restaurant.cuisine",
      overall_rating: "$restaurant.ratings.overall",
      revenue: { $round: ["$revenue", 2] },
      orders: 1
    }
  },
  { $sort: { revenue: -1 } }
])
```

## Analyse croisée

Identifier les restaurants qui combinent satisfaction élevée et chiffre d'affaires important :

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
  { $match: { "restaurant.ratings.overall": { $gte: 22 } } },
  {
    $project: {
      _id: 0,
      name: "$restaurant.name",
      cuisine: "$restaurant.cuisine",
      price_tier: "$restaurant.price_tier",
      overall_rating: "$restaurant.ratings.overall",
      revenue: { $round: ["$revenue", 2] },
      orders: 1
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 20 }
])
```

## `$merge`

`$merge` permet d'écrire le résultat d'une agrégation dans une collection.

Créer une collection `restaurant_kpis` :

```javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  {
    $group: {
      _id: "$restaurant_id",
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 },
      average_basket: { $avg: "$amount" }
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
      _id: "$_id",
      name: "$restaurant.name",
      cuisine: "$restaurant.cuisine",
      price_tier: "$restaurant.price_tier",
      overall_rating: "$restaurant.ratings.overall",
      revenue: { $round: ["$revenue", 2] },
      orders: 1,
      average_basket: { $round: ["$average_basket", 2] }
    }
  },
  {
    $merge: {
      into: "restaurant_kpis",
      whenMatched: "replace",
      whenNotMatched: "insert"
    }
  }
])
```

## Performance

Un pipeline peut utiliser un index si les premières étapes le permettent, surtout `$match` et parfois `$sort`.

Exemple :

```javascript
db.review_details.createIndex({ sentiment: 1, rating: -1 })

db.review_details.aggregate([
  { $match: { sentiment: "excellent", rating: { $gte: 4.5 } } },
  { $group: { _id: "$restaurant_id", reviews: { $sum: 1 } } },
  { $sort: { reviews: -1 } }
]).explain("executionStats")
```

## Exercices

1. Calculer le nombre de restaurants par cuisine.
2. Calculer la note moyenne `food`, `decor`, `service` et `overall` par cuisine.
3. Trouver les cuisines dont la note globale moyenne est supérieure à 22.
4. Classer les restaurants par meilleur rapport note/prix.
5. Compter les restaurants par `price_tier`.
6. Identifier les tags les plus fréquents avec `$unwind`.
7. Calculer le chiffre d'affaires par canal de vente.
8. Calculer le panier moyen par cuisine avec `$lookup`.
9. Trouver les restaurants qui cumulent excellente note globale et revenus importants.
10. Calculer la note moyenne des avis détaillés par raison de visite.
11. Comparer les avis vérifiés et non vérifiés.
12. Créer une collection matérialisée `restaurant_kpis` avec `$merge`.

## Message clé

`aggregate` transforme MongoDB en outil d'analyse. Il permet de passer de documents bruts à des indicateurs métier : satisfaction, qualité-prix, classements, revenus, paniers moyens et collections matérialisées.
