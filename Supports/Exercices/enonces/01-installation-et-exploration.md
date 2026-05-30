# TP 01 - Installation et Exploration

## Objectifs

- Démarrer un environnement MongoDB local avec Docker Compose.
- Importer un vrai dataset de notations clients de restaurants new-yorkais.
- Se connecter avec Mongo Express et `mongosh`.
- Identifier les collections et la structure des documents.

## Démarrage

Depuis le dossier `sandbox-mongodb` :

```bash
docker compose up -d
```

Vérifier les conteneurs :

```bash
docker compose ps
```

Ouvrir Mongo Express :

```text
http://localhost:8083
```

Vérifier le port exact avec :

```bash
docker compose ps
```

Se connecter avec `mongosh` :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin"
```

## Option Atlas

Atlas sera utilisé comme référence cloud MongoDB :

- cluster managé ;
- utilisateurs base de données ;
- autorisation réseau par adresse IP ;
- chaîne de connexion `mongodb+srv`;
- monitoring et sauvegardes selon le type de cluster.

Pour ce TP, le sandbox Docker reste l'environnement principal afin que tout le monde ait les mêmes données localement.

## Import du dataset de notations

Le dataset utilisé pour le cours est réel :

- OpenIntro `nyc`
- Notations Zagat de restaurants new-yorkais
- Endpoint CSV : `https://raw.githubusercontent.com/OpenIntroStat/openintro/main/data-raw/nyc/nyc.csv`
- Notes : `food`, `decor`, `service`, sur une échelle de 0 à 30

Importer les données :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" /scripts/import-restaurant-reviews.js
```

Le script crée :

- `nyc_restaurant_reviews_raw` : données brutes du CSV.
- `restaurants` : vue documentaire orientée restaurant.
- `reviews` : vue orientée avis/notation.

La collection `neighborhoods` est déjà créée au démarrage du conteneur. Elle reste une collection pédagogique annexe pour montrer qu'une base peut contenir plusieurs familles de documents.

## Pourquoi ces collections ?

Le cours conserve volontairement deux niveaux de données :

- une collection brute, `nyc_restaurant_reviews_raw`, proche du CSV source ;
- des collections transformées, `restaurants` et `reviews`, plus adaptées aux requêtes MongoDB.

Cette séparation permet de montrer qu'importer du JSON ne suffit pas toujours. Il faut aussi choisir un modèle documentaire cohérent avec les questions que l'application ou l'analyse doit résoudre.

Rôle des collections principales :

| Collection | Origine | Rôle dans le cours |
|---|---|---|
| `nyc_restaurant_reviews_raw` | réelle | Observer la donnée source, les types et les limites d'un CSV plat. |
| `restaurants` | transformée depuis le réel | Requêtes `find`, projections, filtres par cuisine/prix/notes/tags. |
| `reviews` | transformée depuis le réel | Notes imbriquées, sentiments, analyse qualité/prix, `$lookup`. |
| `neighborhoods` | pédagogique | Collection annexe pour discuter modèle et séparation des responsabilités. |

## Exploration

Lister les bases :

```javascript
show dbs
```

Vérifier la base courante :

```javascript
db
```

Lister les collections :

```javascript
show collections
```

Compter les documents :

```javascript
db.restaurants.countDocuments()
db.reviews.countDocuments()
db.nyc_restaurant_reviews_raw.countDocuments()
```

Observer un document :

```javascript
db.restaurants.findOne()
db.reviews.findOne()
db.nyc_restaurant_reviews_raw.findOne()
```

Comparer un document brut et un document transformé :

```javascript
db.nyc_restaurant_reviews_raw.findOne(
  {},
  { _id: 0, restaurant: 1, price: 1, food: 1, decor: 1, service: 1, east: 1 }
)

db.restaurants.findOne(
  {},
  { _id: 0, restaurant_id: 1, name: 1, cuisine: 1, price_tier: 1, ratings: 1, tags: 1 }
)
```

## Questions

- Quels champs sont communs à tous les restaurants ?
- Quels champs sont imbriqués ?
- Quelles différences observe-t-on entre la collection brute et les collections transformées ?
- Quels champs semblent utiles pour filtrer ?
- Quels champs semblent utiles pour faire des statistiques ?
