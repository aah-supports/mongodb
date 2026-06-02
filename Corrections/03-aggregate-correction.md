# Correction TP 03 - Maîtriser `aggregate`

Ce corrigé suit les 20 exercices de l'énoncé dans le même ordre. Chaque section correspond à un exercice.

## 1. Nombre de restaurants par cuisine

Énoncé  / Exercices / 1 :

> Calculer le nombre de restaurants par cuisine.

```javascript
db.restaurants.aggregate([
  { $match: { cuisine: { $exists: true, $ne: null } } },
  { $group: { _id: "$cuisine", nb_restaurants: { $sum: 1 } } },
  { $sort: { nb_restaurants: -1, _id: 1 } }
])

db.restaurants.insertOne({
    restaurant_id : "aaa",
    name : "AAA"
})
```

## 2. Notes moyennes par cuisine

Énoncé  / Exercices / 2 :

> Calculer la note moyenne `food`, `decor`, `service` et `overall` par cuisine.

```javascript
db.restaurants.aggregate([
  { $match: { cuisine: { $exists: true, $ne: null } } },
  {
    $group: {
      _id: "$cuisine",
      average_food: { $avg: "$ratings.food" }
    }
  },
  {
    $project: {
      average_food: { $round: ["$average_food", 2] },
    }
  },
  { $sort: { average_food: -1 } }
])
```

## 3. Cuisines dont la note globale moyenne est supérieure à 22

Énoncé  / Exercices / 3 :

> Trouver les cuisines dont la note globale moyenne est supérieure à 18.

```javascript
db.restaurants.aggregate([
  { $match: { cuisine: { $exists: true, $ne: null } } },
  {
    $group: {
      _id: "$cuisine",
      average_overall: { $avg: "$ratings.overall" }
    }
  },
  { $match: { average_overall: { $gt: 18 } } },
  {
    $project: {
      restaurants: 1,
      average_overall: { $round: ["$average_overall", 2] }
    }
  },
  { $sort: { average_overall: -1 } }
])
```

Le second `$match` arrive après le `$group`, car il filtre un indicateur calculé.

## 4. Classement par score note/prix

Énoncé  / Exercices / 4 :

> Classer les restaurants par score note/prix, calculé avec `ratings.overall / price_for_two`.

```javascript
db.restaurants.aggregate([
  { $match: { price_for_two: { $gt: 0 }, "ratings.overall": { $exists: true } } },
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
      price_tier: 1,
      value_score: 1
    }
  },
  { $sort: { value_score: -1 } },
  { $limit: 20 }
])
```

## 5. Nombre de restaurants par `price_tier`

Énoncé  / Exercices / 5 :

> Compter les restaurants par `price_tier`.

```javascript
db.restaurants.aggregate([
  { $group: { _id: "$price_tier", nb_restaurants: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])
```

## 6. Tags les plus fréquents

Énoncé  / Exercices / 6 :

> Identifier les tags les plus fréquents avec `$unwind`.

```javascript
db.restaurants.aggregate([
  { $unwind: "$tags" },
  { $group: { _id: "$tags", nb_tags: { $sum: 1 } } },
  { $sort: { nb_tags: -1, _id: 1 } }
])
```

`$unwind` produit un document par tag avant le regroupement.

## 7. Chiffre d'affaires par canal de vente

Énoncé  / Exercices / 7 :

> Calculer le chiffre d'affaires par canal de vente. Quel canal génère le plus de chiffre d’affaires ?

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
  {
    $project: {
      revenue: { $round: ["$revenue", 2] },
      orders: 1,
      average_basket: { $round: ["$average_basket", 2] }
    }
  },
  { $sort: { revenue: -1 } }
])
```

## 8. Panier moyen par cuisine avec `$lookup`

Énoncé  / Exercices / 8 :

> Calculer le panier moyen par cuisine avec `$lookup`.

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
      _id: "$restaurant.cuisine",
      orders: { $sum: 1 },
      revenue: { $sum: "$amount" },
      average_basket: { $avg: "$amount" }
    }
  },
  {
    $project: {
      orders: 1,
      revenue: { $round: ["$revenue", 2] },
      average_basket: { $round: ["$average_basket", 2] }
    }
  },
  { $sort: { average_basket: -1 } }
])
```

## 13. Pipeline avec deux `$group`

Énoncé  / Exercices / 13 :

> Construire un pipeline avec deux `$group` : compter d'abord les restaurants par couple `price_tier` + `cuisine`.

```javascript
db.restaurants.aggregate([
  {
    $group: {
      _id: {
        price_tier: "$price_tier",
        cuisine: "$cuisine"
      },
      nb_restaurant: { $sum: 1 }
    }
  }
])
```

### Exemple création d'un champ avec un switch 

```js
db.reviews.aggregate([
  {
    $set: {
      sentiment_score: {
        $switch: {
          branches: [
            {
              case: { $eq: ["$sentiment", "excellent"] },
              then: 2
            },
            {
              case: { $eq: ["$sentiment", "positive"] },
              then: 1
            },
             {
              case: { $eq: ["$sentiment", "mixed"] },
              then: 0
            },
            {
              case: { $eq: ["$sentiment", "negative"] },
              then: -1
            }
          ],
          default: null
        }
      }
    }
  }
])
```