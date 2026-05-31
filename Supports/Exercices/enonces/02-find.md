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

Dans le parcours normal, les collections `orders`, `review_details` et `events` sont créées automatiquement au premier lancement d'un volume MongoDB vide.
Vérifier leur présence avec `show collections` et `countDocuments()`.

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

## Exercices avancés

1. Afficher les restaurants `Italian` ou `French` dont le prix pour deux est compris entre 35 et 70 dollars, avec une note globale supérieure ou égale à 21, triés par `ratings.overall` décroissant puis par prix croissant.
2. Trouver les restaurants qui ont le tag `top_food`, mais pas le tag `great_service`, et ne retourner que `name`, `cuisine`, `tags`, `ratings.food` et `ratings.service`.
3. Afficher les restaurants dont la note `food` est au moins supérieure de 4 points à la note `decor`. Utiliser une requête `find` avec une expression adaptée.
4. Afficher les commandes `paid` ou `refunded` d'un restaurant existant, créées sur une période de 30 jours, en ne retournant que `order_id`, `created_at`, `status`, `amount` et `customer.loyalty_tier`.
5. Trouver les avis détaillés vérifiés dont le texte contient `service` ou `food`, avec une note supérieure ou égale à 4, triés par `helpful_votes` décroissant.
6. **Difficile.** Trouver les restaurants qui sont dans le top prix (`price_tier` égal à `$$$` ou `$$$$`) mais dont au moins une des notes `food`, `decor` ou `service` est inférieure à 20. La projection doit permettre de comprendre immédiatement quelle note pose problème.
7. **Difficile.** Sur `orders`, récupérer une page stable de 20 commandes payées après une date donnée, triées par `created_at` décroissant puis `order_id` croissant. Expliquer quels champs devraient apparaître dans un index composé pour cette requête.
8. **Programmatique.** Écrire un petit bloc JavaScript dans `mongosh` qui récupère 5 restaurants bien notés, puis pour chacun affiche son nom, son `restaurant_id` et les 3 commandes les plus récentes associées.
