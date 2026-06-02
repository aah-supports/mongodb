# Correction - Installation et exploration

Ce corrigé suit l'ordre de l'énoncé :

1. démarrage de l'environnement ;
2. option Atlas ;
3. collections créées au démarrage ;
4. exploration ;
5. réponses aux questions.

## 1. Démarrage de l'environnement

Énoncé - TP 01 / Démarrage :

> Depuis le dossier `sandbox-mongodb`, lancer `docker compose up -d`, vérifier les conteneurs avec `docker compose ps`, ouvrir Mongo Express, vérifier le port exact et se connecter avec `mongosh`.

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

## 2. Option Atlas

Énoncé - TP 01 / Option Atlas :

> Atlas sera utilisé comme référence cloud MongoDB. Pour ce TP, le sandbox Docker reste l'environnement principal afin que tout le monde ait les mêmes données localement.

Atlas est la référence cloud MongoDB, mais ce TP se fait principalement avec le sandbox Docker pour garantir que tout le monde travaille sur les mêmes données.

Points à retenir :

- un cluster Atlas est managé ;
- les accès dépendent d'utilisateurs base de données ;
- les connexions réseau doivent être autorisées par adresse IP ;
- la chaîne de connexion utilise souvent le format `mongodb+srv`.

## 3. Collections créées au démarrage

Énoncé - TP 01 / Collections créées au démarrage :

> Identifier les collections créées automatiquement au premier lancement avec un volume MongoDB vide : `nyc_restaurant_reviews_raw`, `restaurants`, `reviews`, `neighborhoods`, `orders`, `review_details` et `events`.

Résultat attendu :

- `nyc_restaurant_reviews_raw` contient les lignes brutes du CSV OpenIntro/Zagat ;
- `restaurants` contient les restaurants transformés ;
- `reviews` contient les notations agrégées transformées ;
- `neighborhoods` est une collection pédagogique annexe ;
- `orders`, `review_details` et `events` existent pour les exercices de volume.

Avec l'initialisation automatique, on attend 168 documents dans les trois collections liées au dataset réel, 5 quartiers, puis les volumes générés par défaut.

## 4. Exploration

Énoncé - TP 01 / Exploration :

> Lister les bases, vérifier la base courante, lister les collections, compter les documents, observer un document et comparer un document brut avec un document transformé.

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

## 5. Réponses attendues aux questions

### Quels champs sont communs à tous les restaurants ?

Énoncé - TP 01 / Question 1 :

> Quels champs sont communs à tous les restaurants ?

- nom du restaurant : `restaurant` dans le brut, `name` dans `restaurants` ;
- prix : `price` dans le brut, `price_for_two` et `price_tier` dans `restaurants` ;
- notes : `food`, `decor`, `service` dans le brut, puis `ratings.*` dans le modèle transformé ;
- identifiant applicatif : `restaurant_id` dans `restaurants` et les collections liées.

### Quels champs sont imbriqués ?

Énoncé - TP 01 / Question 2 :

> Quels champs sont imbriqués ?

- `ratings` dans `restaurants` ;
- `scores` dans `reviews` ;
- `source` dans `restaurants` et `reviews`.

### Quelles différences entre brut et transformé ?

Énoncé - TP 01 / Question 3 :

> Quelles différences observe-t-on entre la collection brute et les collections transformées ?

- le brut conserve la structure proche du CSV ;
- `restaurants` regroupe les informations principales par établissement ;
- `reviews` isole la notation agrégée dans une collection orientée avis ;
- les notes sont regroupées dans des objets imbriqués ;
- des champs applicatifs sont ajoutés : `restaurant_id`, `price_tier`, `rating_band`, `tags`, `sentiment`.

### Quels champs semblent utiles pour filtrer ?

Énoncé - TP 01 / Question 4 :

> Quels champs semblent utiles pour filtrer ?

- `cuisine` ;
- `price_tier` ;
- `price_for_two` ;
- `ratings.overall` ;
- `ratings.food` ;
- `tags` ;
- `location_area`.

### Quels champs semblent utiles pour faire des statistiques ?

Énoncé - TP 01 / Question 5 :

> Quels champs semblent utiles pour faire des statistiques ?

- `cuisine` ;
- `price_tier` ;
- `ratings.overall` ;
- `scores.overall` ;
- `sentiment` ;
- `reviewer_type`.
