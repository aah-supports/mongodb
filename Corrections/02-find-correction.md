# Correction - Maîtriser `find`

Ce corrigé reprend l'ordre de l'énoncé :

- exercices de base 1 à 10 ;
- exercices avancés 1 à 6 ;
- exercice supplémentaire.

## Exercices de base

## 1. Restaurants avec note globale supérieure ou égale à 23

Énoncé  / Exercices / 1 :

> Afficher les restaurants dont la note globale est supérieure ou égale à 23.

```javascript
db.restaurants.find(
  { "ratings.overall": { $gte: 23 } },
  { _id: 0, name: 1, cuisine: 1, price_tier: 1, "ratings.overall": 1 }
).sort({ "ratings.overall": -1 })
```

## 2. Restaurants dont le prix pour deux est inférieur ou égal à 40 dollars

Énoncé  / Exercices / 2 :

> Afficher les restaurants dont le prix pour deux est inférieur ou égal à 40 dollars.

```javascript
db.restaurants.find(
  { price_for_two: { $lte: 40 } },
  { _id: 0, name: 1, cuisine: 1, price_for_two: 1, price_tier: 1 }
).sort({ price_for_two: 1 })
```

## 3. Restaurants `$$` ou `$$$`, triés par note de service décroissante

Énoncé  / Exercices / 3 :

> Afficher les restaurants `$$` ou `$$$`, triés par note de service décroissante.

```javascript
db.restaurants.find(
  { price_tier: { $in: ["$$", "$$$"] } },
  { _id: 0, name: 1, cuisine: 1, price_tier: 1, "ratings.service": 1 }
).sort({ "ratings.service": -1 })
```

## 4. Afficher uniquement `name`, `cuisine`, `price_tier` et `ratings`

Énoncé  / Exercices / 4 :

> Afficher uniquement `name`, `cuisine`, `price_tier` et `ratings`, sans `_id`.

```javascript
db.restaurants.find(
  {},
  { _id: 0, name: 1, cuisine: 1, price_tier: 1, ratings: 1 }
).limit(20)
```

## 5. Restaurants avec les tags `top_food` et `great_service`

Énoncé  / Exercices / 5 :

> Trouver les restaurants qui ont à la fois les tags `top_food` et `great_service`.

```javascript
db.restaurants.find(
  { tags: { $all: ["top_food", "great_service"] } },
  { _id: 0, name: 1, cuisine: 1, tags: 1, ratings: 1 }
)
```

## 6. Restaurants dont le nom contient `cafe`, `bistro` ou `ristorante`

Énoncé  / Exercices / 6 :

> Trouver les restaurants dont le nom contient `cafe`, `bistro` ou `ristorante`.

```javascript
// Recherche les restaurants dont le nom contient "cafe", "bistro" ou "ristorante",
// sans tenir compte des majuscules/minuscules grâce à l'option "i".
// La projection n'affiche que le nom, la cuisine et la catégorie de prix.
db.restaurants.find(
  { name: { $regex: "cafe|bistro|ristorante", $options: "i" } },
  { _id: 0, name: 1, cuisine: 1, price_tier: 1 }
)
```

## 7. Avis agrégés `reviews` avec sentiment `excellent`

Énoncé  / Exercices / 7 :

> Afficher les avis agrégés `reviews` avec sentiment `excellent`.

```javascript
db.reviews.find(
  { sentiment: "excellent" },
  { _id: 0, review_id: 1, restaurant_id: 1, sentiment: 1, scores: 1 }
).sort({ "scores.overall": -1 })
```

## 8. Les 10 commandes les plus récentes d'un restaurant existant

Énoncé  / Exercices / 8 :

> Afficher les 10 commandes les plus récentes d'un restaurant existant.

Les collections de volume sont créées automatiquement au premier lancement d'un volume MongoDB vide.
Dans `mongosh` :

```javascript
// un document restaurant de la collection
// si on veut le premier  db.restaurants.findOne({}, { sort: { restaurant_id: 1 } })
const restaurantId = db.restaurants.findOne({}, { restaurant_id: 1 }).restaurant_id

db.orders.find(
  { restaurant_id: restaurantId },
  { _id: 0, order_id: 1, restaurant_id: 1, created_at: 1, amount: 1, status: 1 }
).sort({ created_at: -1 }).limit(10)
```

## 9. Avis détaillés vérifiés avec une note supérieure ou égale à 4.5

Énoncé  / Exercices / 9 :

> Afficher les avis détaillés vérifiés avec une note supérieure ou égale à 4.5.

```javascript
db.review_details.find(
  { verified_visit: true, rating: { $gte: 4.5 } },
  { _id: 0, review_detail_id: 1, restaurant_id: 1, rating: 1, sentiment: 1, visit_reason: 1 }
).sort({ rating: -1 }).limit(20)
```

## 10. Requêtes qui devraient avoir un index

Énoncé  / Exercices / 10 :

> Identifier les requêtes qui devraient probablement avoir un index.

Index pertinents :

Attention : on ne crée pas tous ces index automatiquement en production. Chaque index occupe de l'espace disque et ralentit un peu les écritures, car MongoDB doit le maintenir à chaque insertion, modification ou suppression. Ici, la liste sert à identifier les index candidats à tester avec `explain()` selon les requêtes réellement fréquentes. Le cours détaille ensuite comment lire `explain()` pour vérifier si MongoDB parcourt toute la collection (`COLLSCAN`) ou utilise un index (`IXSCAN`).

```javascript
// Accélère les filtres et tris sur la note globale, par exemple les meilleurs restaurants.
db.restaurants.createIndex({ "ratings.overall": -1 })

// Accélère les recherches fréquentes par type de cuisine puis niveau de prix.
db.restaurants.createIndex({ cuisine: 1, price_tier: 1 })

// Index multikey : utile pour chercher les restaurants qui possèdent un ou plusieurs tags.
db.restaurants.createIndex({ tags: 1 })

// Accélère les avis filtrés par sentiment, puis triés ou filtrés par score global.
db.reviews.createIndex({ sentiment: 1, "scores.overall": -1 })

// Accélère l'historique des commandes d'un restaurant, souvent trié par date récente.
db.orders.createIndex({ restaurant_id: 1, created_at: -1 })

// Accélère les recherches de commandes par statut, puis les classements ou filtres par montant.
db.orders.createIndex({ status: 1, amount: -1 })

// Accélère les avis détaillés vérifiés, souvent filtrés ou triés par note.
db.review_details.createIndex({ verified_visit: 1, rating: -1 })
```

Même logique résumée :

- `ratings.overall` accélère les seuils et classements par note ;
- `cuisine + price_tier` accélère les filtres métier fréquents ;
- `tags` crée un index multikey utile aux recherches dans le tableau ;
- `sentiment + scores.overall` accélère l'analyse des avis agrégés ;
- `restaurant_id + created_at` accélère l'historique de commandes ;
- `status + amount` accélère les commandes payées au-dessus d'un seuil ;
- `verified_visit + rating` accélère les avis détaillés exploitables.

## Exercices avancés

### 1. Restaurants `Italian` ou `French`, prix entre 35 et 70, bonne note globale

Énoncé / Exercices avancés / 1 :

> Afficher les restaurants `Italian` ou `French` dont le prix pour deux est compris entre 35 et 70 dollars, avec une note globale supérieure ou égale à 21, triés par `ratings.overall` décroissant puis par prix croissant.

```javascript
db.restaurants.find(
  {
    cuisine: { $in: ["Italian", "French"] },
    price_for_two: { $gte: 35, $lte: 70 },
    "ratings.overall": { $gte: 21 }
  },
  { _id: 0, name: 1, cuisine: 1, price_for_two: 1, "ratings.overall": 1 }
).sort({ "ratings.overall": -1, price_for_two: 1 })
```

### 2. Restaurants avec `top_food` mais sans `great_service`

Énoncé / Exercices avancés / 2 :

> Trouver les restaurants qui ont le tag `top_food`, mais pas le tag `great_service`, et ne retourner que `name`, `cuisine`, `tags`, `ratings.food` et `ratings.service`.

```javascript
db.restaurants.find(
  {
    $and: [
      { tags: "top_food" },
      { tags: { $ne: "great_service" } }
    ]
  },
  { _id: 0, name: 1, cuisine: 1, tags: 1, "ratings.food": 1, "ratings.service": 1 }
)
```

### 3. Note `food` au moins 4 points au-dessus de `decor`

Énoncé / Exercices avancés / 3 :

> Afficher les restaurants dont la note `food` est au moins supérieure de 4 points à la note `decor`. Utiliser une requête `find` avec une expression adaptée.

```javascript
db.restaurants.find(
  {
    $expr: {
      $gte: [
        { $subtract: ["$ratings.food", "$ratings.decor"] },
        4
      ]
    }
  },
  { _id: 0, name: 1, cuisine: 1, "ratings.food": 1, "ratings.decor": 1 }
)
```

### 4. Commandes payées ou remboursées sur une période de 30 jours

Énoncé / Exercices avancés / 4 :

> Afficher les commandes `paid` ou `refunded` d'un restaurant existant, créées sur une période de 30 jours, en ne retournant que `order_id`, `created_at`, `status`, `amount` et `customer.loyalty_tier`.

```javascript
const restaurantId = db.restaurants.findOne({}, { restaurant_id: 1 }).restaurant_id
const start = ISODate("2025-01-01T00:00:00Z")
const end = ISODate("2025-01-31T23:59:59Z")

db.orders.find(
  {
    restaurant_id: restaurantId,
    status: { $in: ["paid", "refunded"] },
    created_at: { $gte: start, $lte: end }
  },
  { _id: 0, order_id: 1, created_at: 1, status: 1, amount: 1, "customer.loyalty_tier": 1 }
).sort({ created_at: -1 })
```

### 5. Avis détaillés vérifiés contenant `service` ou `food`

Énoncé / Exercices avancés / 5 :

> Trouver les avis détaillés vérifiés dont le texte contient `service` ou `food`, avec une note supérieure ou égale à 4, triés par `helpful_votes` décroissant.

```javascript
db.review_details.find(
  {
    verified_visit: true,
    rating: { $gte: 4 },
    text: { $regex: "service|food", $options: "i" }
  },
  { _id: 0, review_detail_id: 1, restaurant_id: 1, rating: 1, helpful_votes: 1, text: 1 }
).sort({ helpful_votes: -1 })
```

### 6. Difficile - Restaurants chers avec une note faible

Énoncé / Exercices avancés / 6 :

> Difficile. Trouver les restaurants qui sont dans le top prix (`price_tier` égal à `$$$` ou `$$$$`) mais dont au moins une des notes `food`, `decor` ou `service` est inférieure à 20. La projection doit permettre de comprendre immédiatement quelle note pose problème.

```javascript
db.restaurants.find(
  {
    price_tier: { $in: ["$$$", "$$$$"] },
    $or: [
      { "ratings.food": { $lt: 20 } },
      { "ratings.decor": { $lt: 20 } },
      { "ratings.service": { $lt: 20 } }
    ]
  },
  { _id: 0, name: 1, cuisine: 1, price_tier: 1, ratings: 1 }
).sort({ price_for_two: -1 })
```

## Exercice supplémentaire

Énoncé / Exercice supplémentaire :

> Afficher les restaurants qui vérifient l'une des situations suivantes : soit ils sont de cuisine italienne ou française et ont le tag `top_food`, soit ils sont de cuisine japonaise ou méditerranéenne et ont le tag `great_service`. Dans tous les cas, leur note globale est supérieure ou égale à 21 et leur prix pour deux personnes est inférieur ou égal à 60.

```javascript
db.restaurants.find(
  {
    $or: [
      {
        cuisine: { $in: ["Italian", "French"] },
        tags: "top_food"
      },
      {
        cuisine: { $in: ["Japanese", "Mediterranean"] },
        tags: "great_service"
      }
    ],
    "ratings.overall": { $gte: 21 },
    price_for_two: { $lte: 60 }
  },
  {
    _id: 0,
    name: 1,
    cuisine: 1,
    tags: 1,
    price_for_two: 1,
    "ratings.overall": 1
  }
).sort({ "ratings.overall": -1, price_for_two: 1 })
```

Même logique en posant :

- `A` : cuisine italienne ou française ;
- `B` : tag `top_food` ;
- `C` : cuisine japonaise ou méditerranéenne ;
- `D` : tag `great_service`.

La requête directe correspond à :

```text
(A ∧ B) ∨ (C ∧ D)
```

Par la loi de De Morgan, on peut aussi raisonner avec la forme équivalente :

```text
¬((¬A ∨ ¬B) ∧ (¬C ∨ ¬D))
```

En MongoDB, cela peut s'écrire avec `$nor`. Cette forme est utile pour comprendre la logique, mais elle est moins lisible que la forme directe avec `$or`.

```javascript
db.restaurants.find(
  {
    $nor: [
      {
        $and: [
          {
            $or: [
              { cuisine: { $nin: ["Italian", "French"] } },
              { tags: { $ne: "top_food" } }
            ]
          },
          {
            $or: [
              { cuisine: { $nin: ["Japanese", "Mediterranean"] } },
              { tags: { $ne: "great_service" } }
            ]
          }
        ]
      }
    ],
    "ratings.overall": { $gte: 21 },
    price_for_two: { $lte: 60 }
  },
  {
    _id: 0,
    name: 1,
    cuisine: 1,
    tags: 1,
    price_for_two: 1,
    "ratings.overall": 1
  }
).sort({ "ratings.overall": -1, price_for_two: 1 })
```

À retenir : dans une correction ou dans du code applicatif, la forme directe est généralement préférable. La forme avec De Morgan sert surtout à vérifier que l'on comprend bien la logique booléenne.
