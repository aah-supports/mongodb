# Cours - Travailler avec mongosh

## Objectifs

À la fin de cette partie, l'apprenant doit savoir :

- se connecter à MongoDB avec `mongosh` ;
- naviguer entre les bases et collections ;
- lire des documents ;
- écrire des premières requêtes ;
- exécuter un pipeline d'agrégation simple.

## Rôle de mongosh

`mongosh` est le shell officiel de MongoDB. Il sert à exécuter les commandes MongoDB en ligne de commande.

Dans ce cours, `mongosh` est l'outil principal pour :

- pratiquer `find` ;
- pratiquer `aggregate` ;
- créer des index ;
- gérer les utilisateurs ;
- comprendre le chemin d'initialisation et l'import de secours ;
- comprendre précisément ce que fait MongoDB.

## Connexion au sandbox

Depuis le dossier `sandbox-mongodb` :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin"
```

La chaîne contient :

- `root` : utilisateur MongoDB ;
- `rootpass` : mot de passe ;
- `localhost:27017` : adresse du serveur MongoDB ;
- `nyc_food` : base cible ;
- `authSource=admin` : base utilisée pour l'authentification.

## Commandes de navigation

Afficher les bases :

```javascript
show dbs
```

Afficher la base courante :

```javascript
db
```

Changer de base :

```javascript
use nyc_food
```

Afficher les collections :

```javascript
show collections
```

## Fonctions et types utiles

MongoDB fournit quelques fonctions et types très pratiques directement dans `mongosh`.

### `ISODate()`

`ISODate()` sert à créer une vraie date MongoDB.

Exemple :

```javascript
db.orders.find({
  created_at: {
    $gte: ISODate("2026-06-01T00:00:00Z")
  }
})
```

Ici, on cherche les commandes créées à partir du 1er juin 2026.

### `ObjectId()`

`ObjectId()` sert à retrouver un document par son identifiant MongoDB.

Exemple :

```javascript
db.orders.findOne({
  _id: ObjectId("665f1c2a9b8f3a0012ab34cd")
})
```

Ici, on cible un document précis avec son `_id`.

### `db.getSiblingDB()`

`db.getSiblingDB()` permet de changer de base sans changer de connexion.

Exemple :

```javascript
const eventDb = db.getSiblingDB("event_booking")
eventDb.users.findOne()
```

Ici, on travaille dans la base `event_booking` tout en restant connecté au même serveur.

### `toArray()` et `forEach()`

Un curseur MongoDB peut être transformé en tableau avec `toArray()`, puis parcouru avec `forEach()`.

Exemple :

```javascript
const paidOrders = db.orders.find({ status: "paid" }).limit(3).toArray()

paidOrders.forEach(order => {
  print(order.order_id)
})
```

Ici, on récupère trois commandes payées, puis on affiche leur `order_id`.

### `distinct()`

`distinct()` sert à lister les valeurs différentes d'un champ.

Exemple :

```javascript
db.restaurants.distinct("cuisine")
```

Ici, on obtient toutes les cuisines présentes dans la collection.

## Lire des documents

Compter les restaurants :

```javascript
db.restaurants.countDocuments()
```

Afficher un restaurant :

```javascript
db.restaurants.findOne()
```

Afficher cinq restaurants :

```javascript
db.restaurants.find().limit(5)
```

Afficher seulement certains champs :

```javascript
db.restaurants.find(
  {},
  { _id: 0, name: 1, cuisine: 1, price_tier: 1, ratings: 1 }
).limit(5)
```

## Requête `find`

Filtrer par cuisine :

```javascript
db.restaurants.find({ cuisine: "Italian" })
```

Filtrer par note :

```javascript
db.restaurants.find({ "ratings.overall": { $gte: 22 } })
```

Filtrer et trier :

```javascript
db.restaurants.find(
  { "ratings.overall": { $gte: 22 } },
  { _id: 0, name: 1, cuisine: 1, price_for_two: 1, "ratings.overall": 1 }
).sort({ "ratings.overall": -1 }).limit(10)
```

## Requête sur champ imbriqué

```javascript
db.restaurants.find({ "ratings.food": { $gte: 24 } })
```

## Agrégation simple

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
  { $match: { "ratings.overall": { $ne: null } } },
  {
    $group: {
      _id: "$cuisine",
      average_rating: { $avg: "$ratings.overall" },
      restaurants: { $sum: 1 }
    }
  },
  { $sort: { average_rating: -1 } },
  { $limit: 10 }
])
```

## Création des collections

Dans le parcours normal, les collections sont créées au premier lancement des conteneurs avec un volume MongoDB vide.

```bash
docker compose up -d
```

Si un poste a déjà un ancien volume, repartir de zéro :

```bash
docker compose down -v
docker compose up -d
```

Si les collections de base doivent être recréées manuellement, utiliser les commandes `mongoimport --drop` du cours jeu de données.
Les apprenants n'ont pas à lancer de script d'import ou de génération dans le parcours standard.

## Message clé

`mongosh` est l'outil de référence du cours. Il force à écrire les commandes MongoDB clairement et permet de reproduire les manipulations dans un script, une documentation ou une évaluation.
