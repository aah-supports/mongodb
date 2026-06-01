# TP 03 - Maîtriser `aggregate`

## Objectifs

- Construire un pipeline d'agrégation progressivement.
- Répondre à des questions métier.
- Relier restaurants, avis clients, commandes et événements.
- Utiliser les opérateurs d'agrégation les plus fréquents.

Les collections `restaurants` et `reviews` viennent du dataset réel OpenIntro/Zagat. Les collections `orders`, `review_details` et `events` sont générées automatiquement au premier lancement d'un volume MongoDB vide pour travailler les volumes et les performances.

## Pipeline minimal

Nombre de restaurants par cuisine :

```javascript
db.restaurants.aggregate([
  { $group: { _id: "$cuisine", restaurants: { $sum: 1 } } },
  { $sort: { restaurants: -1 } }
])
```

Note globale moyenne par cuisine :

```javascript
db.restaurants.aggregate([
  {
    $group: {
      _id: "$cuisine",
      average_rating: { $avg: "$ratings.overall" },
      restaurants: { $sum: 1 }
    }
  },
  { $sort: { average_rating: -1 } }
])
```

## Opérateurs à retenir

- `$match` filtre les documents en entrée du pipeline.
- `$project` choisit, renomme ou calcule des champs.
- `$set` ajoute ou modifie des champs sans supprimer les autres.
- `$group` regroupe les documents et calcule des agrégats.
- `$sort`, `$limit` et `$skip` ordonnent et paginent.
- `$unwind` éclate un tableau en plusieurs documents.
- `$lookup` relie deux collections.
- `$merge` écrit le résultat dans une collection matérialisée.

## Pipeline avec transformation

Créer un score note/prix :

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
  {
    $project: {
      _id: 0,
      name: 1,
      cuisine: 1,
      price_for_two: 1,
      "ratings.overall": 1,
      value_score: 1
    }
  },
  { $sort: { value_score: -1 } },
  { $limit: 10 }
])
```

## Tableaux avec `$unwind`

Compter les tags les plus fréquents :

```javascript
db.restaurants.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", restaurants: { $sum: 1 } } },
  { $sort: { restaurants: -1 } }
])
```

## Jointure avec `$lookup`

Ajouter le nom du restaurant aux avis détaillés :

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
      visit_reason: 1,
      restaurant_id: 1,
      name: "$restaurant.name",
      cuisine: "$restaurant.cuisine",
      price_tier: "$restaurant.price_tier"
    }
  },
  { $sort: { rating: -1, reviewed_at: -1 } },
  { $limit: 20 }
])
```

## Chiffre d'affaires par restaurant

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

## Analyse croisée satisfaction et revenus

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
      price_tier: "$restaurant.price_tier",
      revenue: 1,
      orders: 1
    }
  },
  { $sort: { overall_rating: -1, revenue: -1 } },
  { $limit: 20 }
])
```

## Créer une collection matérialisée

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

## Exercices

1. Calculer le nombre de restaurants par cuisine.
2. Calculer la note moyenne `food`, `decor`, `service` et `overall` par cuisine.
3. Trouver les cuisines dont la note globale moyenne est supérieure à 22.
4. Classer les restaurants par score note/prix, calculé avec `ratings.overall / price_for_two`.
5. Compter les restaurants par `price_tier`.
6. Identifier les tags les plus fréquents avec `$unwind`.
7. Calculer le chiffre d'affaires par canal de vente.
8. Calculer le panier moyen par cuisine avec `$lookup`.
9. Trouver les restaurants qui cumulent excellente note globale et revenus importants.
10. Calculer, pour chaque raison de visite (`visit_reason`), la note moyenne `rating` et le nombre d'avis détaillés.
11. Comparer les avis vérifiés et non vérifiés (`verified_visit`) en calculant, pour chaque groupe, le nombre d'avis, la note moyenne `rating` et la moyenne des votes utiles `helpful_votes`.
12. Créer une collection matérialisée `restaurant_kpis` avec `$merge`.
