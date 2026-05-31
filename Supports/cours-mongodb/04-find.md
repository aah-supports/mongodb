# Cours - Rechercher avec `find`

## Objectifs

À la fin de cette partie, l'apprenant doit savoir :

- écrire une requête `find` ;
- utiliser une projection ;
- filtrer avec les opérateurs principaux ;
- interroger des champs imbriqués et des tableaux ;
- trier, limiter et compter ;
- reconnaître les requêtes candidates à un index.

## Forme générale

```javascript
db.collection.find(filtre, projection)
```

Exemple :

```javascript
db.restaurants.find(
  { cuisine: "Italian" },
  { _id: 0, name: 1, price_tier: 1, ratings: 1 }
)
```

- `restaurants` est la collection ;
- le premier objet est le filtre ;
- le second objet est la projection.

## Lire sans filtre

```javascript
db.restaurants.find()
db.restaurants.find().limit(5)
db.restaurants.findOne()
```

## Projection

Afficher seulement quelques champs :

```javascript
db.restaurants.find(
  {},
  { _id: 0, name: 1, cuisine: 1, price_for_two: 1, "ratings.overall": 1 }
)
```

## Égalité

```javascript
db.restaurants.find({ cuisine: "Italian" })
db.restaurants.find({ price_tier: "$$" })
db.reviews.find({ sentiment: "excellent" })
```

## Comparaison

Principaux opérateurs :

| Opérateur | Sens |
|---|---|
| `$gt` | strictement supérieur |
| `$gte` | supérieur ou égal |
| `$lt` | strictement inférieur |
| `$lte` | inférieur ou égal |
| `$ne` | différent |

Exemples :

```javascript
db.restaurants.find({ "ratings.overall": { $gte: 23 } })

db.restaurants.find({
  price_for_two: { $lte: 45 },
  "ratings.service": { $gte: 22 }
})
```

## Appartenance avec `$in` et `$nin`

```javascript
db.restaurants.find({
  price_tier: { $in: ["$", "$$"] }
})
```

```javascript
db.restaurants.find({
  cuisine: { $nin: ["Steakhouse", "Seafood"] }
})
```

## Combiner les conditions

Quand plusieurs champs sont présents, MongoDB applique un `AND` implicite.

```javascript
db.restaurants.find({
  cuisine: "French",
  "ratings.overall": { $gte: 22 }
})
```

`$or` exprime une alternative :

```javascript
db.restaurants.find({
  $or: [
    { tags: "top_food" },
    { tags: "great_service" }
  ]
})
```

Combiner `$or` avec une contrainte commune :

```javascript
db.restaurants.find({
  price_tier: { $ne: "$$$$" },
  $or: [
    { "ratings.food": { $gte: 24 } },
    { "ratings.service": { $gte: 24 } }
  ]
})
```

## Champs imbriqués

Les notes sont stockées dans l'objet `ratings`.

```javascript
db.restaurants.find({
  "ratings.food": { $gte: 24 },
  "ratings.decor": { $gte: 20 }
})
```

Dans `reviews`, les scores sont stockés dans `scores`.

```javascript
db.reviews.find({
  "scores.overall": { $gte: 23 },
  sentiment: "positive"
})
```

## Tableaux

Le champ `tags` est un tableau.

```javascript
db.restaurants.find({ tags: "top_food" })
```

Tous les tags demandés avec `$all` :

```javascript
db.restaurants.find({
  tags: { $all: ["top_food", "great_service"] }
})
```

## Existence et type

```javascript
db.restaurants.find({
  price_for_two: { $exists: true, $type: "number" }
})
```

## Expressions régulières

Recherche insensible à la casse :

```javascript
db.restaurants.find({
  name: { $regex: "bistro", $options: "i" }
})
```

Recherche sur plusieurs mots possibles :

```javascript
db.restaurants.find({
  name: { $regex: "cafe|bistro|ristorante", $options: "i" }
})
```

## Trier, limiter, paginer

Top restaurants par note globale :

```javascript
db.restaurants.find(
  {},
  { _id: 0, name: 1, cuisine: 1, "ratings.overall": 1 }
).sort({ "ratings.overall": -1 }).limit(10)
```

Pagination simple :

```javascript
db.restaurants.find(
  {},
  { _id: 0, name: 1, cuisine: 1 }
).sort({ name: 1 }).skip(20).limit(10)
```

## Compter

```javascript
db.restaurants.countDocuments({ price_tier: "$$" })
db.restaurants.countDocuments({ "ratings.overall": { $gte: 23 } })
db.review_details.countDocuments({ verified_visit: true, rating: { $gte: 4.5 } })
```

## Distinct

```javascript
db.restaurants.distinct("cuisine")
db.restaurants.distinct("price_tier")
db.reviews.distinct("sentiment")
```

## Requêtes métier

Restaurants très bien notés mais abordables :

```javascript
db.restaurants.find(
  {
    "ratings.overall": { $gte: 22 },
    price_for_two: { $lte: 50 }
  },
  { _id: 0, name: 1, cuisine: 1, price_for_two: 1, "ratings.overall": 1 }
).sort({ "ratings.overall": -1, price_for_two: 1 })
```

Restaurants avec très bonne nourriture mais décor moyen :

```javascript
db.restaurants.find({
  "ratings.food": { $gte: 24 },
  "ratings.decor": { $lt: 20 }
})
```

Avis détaillés négatifs et vérifiés :

```javascript
db.review_details.find({
  verified_visit: true,
  sentiment: "negative"
})
```

## Quand penser index ?

Un index est une structure de données maintenue par MongoDB pour retrouver plus vite les documents.

Sans index, MongoDB peut devoir parcourir toute la collection : c'est un `COLLSCAN`.
Avec un index adapté, MongoDB parcourt une structure triée avant de lire les documents utiles : c'est un `IXSCAN`.

Une requête fréquente mérite probablement un index si elle filtre ou trie sur :

- `restaurant_id` ;
- `cuisine` ;
- `price_tier` ;
- `ratings.overall` ;
- `tags` ;
- `sentiment` ;
- `reviewed_at`.

Exemples d'index simples :

```javascript
db.restaurants.createIndex({ "ratings.overall": -1 })
db.restaurants.createIndex({ cuisine: 1, price_tier: 1 })
db.restaurants.createIndex({ tags: 1 })
db.review_details.createIndex({ restaurant_id: 1, reviewed_at: -1 })
```

Un index accélère certaines lectures, mais il a un coût :

- il occupe de l'espace disque ;
- il doit être mis à jour à chaque insertion, modification ou suppression ;
- il ne sert que si sa structure correspond aux filtres et tris utilisés.

## Vérifier un index avec `explain()`

On ne valide pas un index seulement parce qu'il existe. On vérifie le plan d'exécution.

```javascript
db.restaurants.find({
  cuisine: "French",
  price_tier: "$$"
}).explain("executionStats")
```

Points à observer :

| Champ | Sens |
|---|---|
| `COLLSCAN` | MongoDB parcourt la collection. À surveiller sur gros volume. |
| `IXSCAN` | MongoDB utilise un index. |
| `totalDocsExamined` | Nombre de documents lus. |
| `totalKeysExamined` | Nombre d'entrées d'index parcourues. |
| `executionTimeMillis` | Temps mesuré pour la requête. |

Objectif pratique : pour une requête sélective, on veut souvent examiner beaucoup moins de documents que la taille totale de la collection.

## Index composés

Un index composé contient plusieurs champs. L'ordre des champs est important.

```javascript
db.restaurants.createIndex({
  cuisine: 1,
  price_tier: 1,
  "ratings.overall": -1
})
```

Cet index est adapté à une requête qui filtre par `cuisine`, filtre par `price_tier`, puis trie ou compare la note globale.

Règle pratique :

1. Placer d'abord les champs d'égalité fréquents.
2. Ajouter ensuite les champs de plage ou de tri.
3. Éviter de créer des index composés pour des requêtes rares.

Exemple sur les commandes :

```javascript
db.orders.createIndex({
  restaurant_id: 1,
  status: 1,
  created_at: -1
})
```

Cet index aide une requête du type :

```javascript
db.orders.find({
  restaurant_id: "NYC-ZAGAT-0001",
  status: "paid"
}).sort({ created_at: -1 })
```

## Index multikey sur les tableaux

Quand un index porte sur un champ tableau, MongoDB crée automatiquement un index multikey.

Dans le dataset, `restaurants.tags` est un tableau :

```javascript
db.restaurants.createIndex({ tags: 1 })
```

Il peut accélérer :

```javascript
db.restaurants.find({ tags: "top_food" })
db.restaurants.find({ tags: { $all: ["top_food", "great_service"] } })
```

Un index multikey est utile, mais il faut éviter d'en créer beaucoup sans besoin clair, surtout sur de gros tableaux.

## Index géospatial `2dsphere`

Le sandbox contient une collection `neighborhoods` avec un champ GeoJSON `center`.

Exemple de document :

```javascript
{
  name: "Midtown",
  borough: "Manhattan",
  center: {
    type: "Point",
    coordinates: [-73.9855, 40.7580]
  }
}
```

Un index géospatial est créé sur ce champ :

```javascript
db.neighborhoods.createIndex({ center: "2dsphere" })
```

Il permet des requêtes spatiales, par exemple chercher les quartiers proches d'un point :

```javascript
db.neighborhoods.find({
  center: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.9855, 40.7580] },
      $maxDistance: 5000
    }
  }
})
```

Point important : en GeoJSON, les coordonnées sont dans l'ordre longitude puis latitude.

Dans ce sandbox, l'index géospatial concerne `neighborhoods.center`. Les restaurants du dataset OpenIntro/Zagat n'ont pas de coordonnées précises, donc les exercices principaux restent centrés sur les index classiques : champs simples, champs imbriqués, tableaux et index composés.

## Exercices

1. Afficher les restaurants dont la note globale est supérieure ou égale à 23.
2. Afficher les restaurants dont le prix pour deux est inférieur ou égal à 40 dollars.
3. Afficher les restaurants `$$` ou `$$$`, triés par note de service décroissante.
4. Afficher uniquement `name`, `cuisine`, `price_tier` et `ratings`.
5. Trouver les restaurants qui ont le tag `top_food`.
6. Trouver les restaurants qui ont à la fois `top_food` et `great_service`.
7. Trouver les restaurants dont le nom contient `cafe`, `bistro` ou `ristorante`.
8. Trouver les avis agrégés avec sentiment `excellent`.
9. Trouver les avis détaillés vérifiés avec une note supérieure ou égale à 4.5.
10. Proposer trois index adaptés aux requêtes précédentes.

## Message clé

`find` permet de poser des questions précises à une collection. La difficulté n'est pas seulement syntaxique : il faut savoir où se trouvent les champs, quels opérateurs utiliser et quels filtres justifient un index.
