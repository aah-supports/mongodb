# TP 02 - Maîtriser `find`

## Objectifs

- Filtrer, projeter, trier et paginer.
- Utiliser les opérateurs principaux de requête.
- Manipuler des documents imbriqués et des tableaux.
- Lire une requête comme une question métier.

## Requêtes de base

Restaurants italiens :

```javascript
db.restaurants.find({ cuisine: "Italian" })
```

Projection sur quelques champs :

```javascript
db.restaurants.find(
  { cuisine: "Italian" },
  { _id: 0, name: 1, price_tier: 1, ratings: 1 }
)
```

Restaurants avec excellente note globale :

```javascript
db.restaurants.find(
  { "ratings.overall": { $gte: 24 } },
  { _id: 0, name: 1, cuisine: 1, price_for_two: 1, "ratings.overall": 1 }
)
```

Tri et limite :

```javascript
db.restaurants.find(
  {},
  { _id: 0, name: 1, price_for_two: 1, "ratings.food": 1 }
).sort({ "ratings.food": -1 }).limit(5)
```

## Opérateurs à pratiquer

### Comparaison

`$gte`, `$lte`, `$gt`, `$lt`, `$ne` servent à comparer des valeurs numériques ou textuelles.

```javascript
db.restaurants.find({
  price_for_two: { $lte: 45 },
  "ratings.service": { $gte: 22 }
})
```

### Appartenance

`$in` filtre sur une liste de valeurs possibles.

```javascript
db.restaurants.find({
  price_tier: { $in: ["$", "$$"] }
})
```

### Conditions combinées

`$and` est implicite quand plusieurs champs sont présents. `$or` permet d'exprimer des alternatives.

```javascript
db.restaurants.find({
  $or: [
    { tags: "top_food" },
    { tags: "great_service" }
  ],
  price_tier: { $ne: "$$$$" }
})
```

### Recherche dans un tableau

Un champ tableau peut être interrogé directement.

```javascript
db.restaurants.find({ tags: "fine_dining" })
```

Pour imposer plusieurs tags :

```javascript
db.restaurants.find({
  tags: { $all: ["top_food", "great_service"] }
})
```

### Recherche dans un champ imbriqué

Les notes sont dans l'objet `ratings`.

```javascript
db.restaurants.find({
  "ratings.food": { $gte: 24 },
  "ratings.decor": { $gte: 20 }
})
```

### Expression régulière

```javascript
db.restaurants.find({
  name: { $regex: "ristorante", $options: "i" }
})
```

### Existence et type

`$exists` vérifie la présence d'un champ. `$type` vérifie son type BSON.

```javascript
db.restaurants.find({
  price_for_two: { $exists: true, $type: "number" }
})
```

## Données générées pour le volume

Les commandes, avis détaillés et événements ne viennent pas du dataset réel. Ils sont générés pour simuler un usage applicatif massif.

Avant les exercices sur `orders` et `review_details`, lancer :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" /scripts/generate-volume.js
```

## Exercices

1. Afficher les restaurants dont la note globale est supérieure ou égale à 23.
2. Afficher les restaurants dont le prix pour deux est inférieur ou égal à 40 dollars.
3. Afficher les restaurants `$$` ou `$$$`, triés par note de service décroissante.
4. Afficher uniquement `name`, `cuisine`, `price_tier` et `ratings`, sans `_id`.
5. Trouver les restaurants qui ont à la fois les tags `top_food` et `great_service`.
6. Trouver les restaurants dont le nom contient `cafe`, `bistro` ou `ristorante`.
7. Afficher les avis agrégés `reviews` avec sentiment `excellent`.
8. Afficher les 10 commandes les plus récentes d'un restaurant existant.
9. Afficher les avis détaillés vérifiés avec une note supérieure ou égale à 4.5.
10. Identifier les requêtes qui devraient probablement avoir un index.

Exemple pour l'exercice 8 :

```javascript
const restaurantId = db.restaurants.findOne({}, { restaurant_id: 1 }).restaurant_id

db.orders.find(
  { restaurant_id: restaurantId },
  { _id: 0, order_id: 1, restaurant_id: 1, created_at: 1, amount: 1, status: 1 }
).sort({ created_at: -1 }).limit(10)
```
