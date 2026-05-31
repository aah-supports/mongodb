# Correction TP 01 - Installation et exploration

## Vérification de l'environnement

Depuis `sandbox-mongodb` :

```bash
docker compose up -d
docker compose ps
```

Résultat attendu :

- un conteneur `sandbox-mongodb` actif ;
- un conteneur `sandbox-mongo-express` actif ;
- MongoDB exposé sur `27017` ;
- Mongo Express exposé sur `8083`.

Connexion `mongosh` :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin"
```

## Collections créées au démarrage

Résultat attendu :

- `nyc_restaurant_reviews_raw` contient les lignes brutes du CSV OpenIntro/Zagat ;
- `restaurants` contient les restaurants transformés ;
- `reviews` contient les notations agrégées transformées ;
- `neighborhoods` est une collection pédagogique annexe ;
- `orders`, `review_details` et `events` existent pour les exercices de volume.

Avec l'initialisation automatique, on attend 168 documents dans les trois collections liées au dataset réel, 5 quartiers, puis les volumes générés par défaut.

## Exploration

Lister les collections :

```javascript
show collections
```

Compter les documents :

```javascript
db.nyc_restaurant_reviews_raw.countDocuments()
db.restaurants.countDocuments()
db.reviews.countDocuments()
db.neighborhoods.countDocuments()
db.orders.countDocuments()
db.review_details.countDocuments()
db.events.countDocuments()
```

Observer les documents :

```javascript
db.nyc_restaurant_reviews_raw.findOne()
db.restaurants.findOne()
db.reviews.findOne()
```

Comparer brut et transformé :

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

## Réponses attendues aux questions

Champs communs utiles :

- nom du restaurant : `restaurant` dans le brut, `name` dans `restaurants` ;
- prix : `price` dans le brut, `price_for_two` et `price_tier` dans `restaurants` ;
- notes : `food`, `decor`, `service` dans le brut, puis `ratings.*` dans le modèle transformé ;
- identifiant applicatif : `restaurant_id` dans `restaurants` et les collections liées.

Champs imbriqués :

- `ratings` dans `restaurants` ;
- `scores` dans `reviews` ;
- `source` dans `restaurants` et `reviews`.

Différences entre brut et transformé :

- le brut conserve la structure proche du CSV ;
- `restaurants` regroupe les informations principales par établissement ;
- `reviews` isole la notation agrégée dans une collection orientée avis ;
- les notes sont regroupées dans des objets imbriqués ;
- des champs applicatifs sont ajoutés : `restaurant_id`, `price_tier`, `rating_band`, `tags`, `sentiment`.

Champs utiles pour filtrer :

- `cuisine` ;
- `price_tier` ;
- `price_for_two` ;
- `ratings.overall` ;
- `ratings.food` ;
- `tags` ;
- `location_area`.

Champs utiles pour les statistiques :

- `cuisine` ;
- `price_tier` ;
- `ratings.overall` ;
- `scores.overall` ;
- `sentiment` ;
- `reviewer_type`.
