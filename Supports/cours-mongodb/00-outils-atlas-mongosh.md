# Cours - Outils : Docker, Mongo Express et mongosh

## Objectifs

À la fin de cette partie, l'apprenant doit savoir :

- démarrer le sandbox MongoDB ;
- se connecter avec `mongosh` ;
- ouvrir Mongo Express ;
- comprendre le rôle des images, conteneurs et volumes ;
- savoir quoi faire si les collections ne sont pas initialisées.

## Starter : lancer le sandbox

Depuis la racine du dépôt :

```bash
cd sandbox-mongodb
docker compose up -d
docker compose ps
```

- `docker compose up -d` lance MongoDB et Mongo Express en arrière-plan.
- Au premier lancement avec un volume MongoDB vide, les collections du cours sont créées automatiquement.
- `docker compose ps` vérifie que les conteneurs sont actifs.
- Le sandbox utilise MongoDB 8, via l'image `mongo:8.0`.

## Accéder aux outils

Connexion à `mongosh` :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin"
```

Cette commande ouvre le shell directement sur la base `nyc_food`.

Connexion à Mongo Express :

```text
http://localhost:8083
```

Mongo Express sert à vérifier rapidement les collections et quelques documents depuis le navigateur.

## Images, volumes et build

Le projet utilise directement des images Docker prêtes à l'emploi :

- `mongo:8.0` ;
- `mongo-express:1.0.2`.

Il n'y a pas de `Dockerfile` ni de section `build:` dans `docker-compose.yml`.

Ces commandes ne sont donc pas utiles dans ce projet :

```bash
docker compose build
docker compose up -d --build
```

Docker Desktop conserve quand même les images téléchargées. C'est normal : elles seront réutilisées au prochain démarrage.

Le volume MongoDB contient les données :

```bash
docker compose down -v
docker compose up -d
```

`down -v` supprime les conteneurs et le volume. Au redémarrage, MongoDB recrée une base propre et recharge les collections.

## Diagnostic : vérifier les données

Dans `mongosh` :

```javascript
show collections
db.nyc_restaurant_reviews_raw.countDocuments()
db.restaurants.countDocuments()
db.reviews.countDocuments()
db.neighborhoods.countDocuments()
db.orders.countDocuments()
db.review_details.countDocuments()
db.events.countDocuments()
```

Volumes attendus :

| Collection | Volume |
|---|---:|
| `nyc_restaurant_reviews_raw` | 168 |
| `restaurants` | 168 |
| `reviews` | 168 |
| `neighborhoods` | 5 |
| `orders` | 100 000 |
| `review_details` | 50 000 |
| `events` | 300 000 |

## Mongo Express et imports

Mongo Express est utile pour :

- vérifier que les collections existent ;
- lire quelques documents ;
- contrôler rapidement des compteurs ;
- faire de petites manipulations ponctuelles.

Pour charger ou recréer des collections dans le cours, on privilégie `mongoimport`.

`mongoimport` est l'outil général à retenir pour importer des données structurées dans MongoDB. Il sait charger du JSON, du CSV et du TSV.

## Secours : recréer les collections de base

À utiliser seulement si l'initialisation automatique n'a pas créé les collections attendues ou si l'on veut restaurer les collections de base depuis les JSON versionnés.

```bash
docker compose cp ../data/nyc-food/. mongodb:/tmp/nyc-food/

docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection nyc_restaurant_reviews_raw --file /tmp/nyc-food/nyc_restaurant_reviews_raw.json --jsonArray --drop
docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection restaurants --file /tmp/nyc-food/restaurants.json --jsonArray --drop
docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection reviews --file /tmp/nyc-food/reviews.json --jsonArray --drop
docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection neighborhoods --file /tmp/nyc-food/neighborhoods.json --jsonArray --drop
```

Ces commandes recréent uniquement :

- `nyc_restaurant_reviews_raw` ;
- `restaurants` ;
- `reviews` ;
- `neighborhoods`.

Pour tout réinitialiser, préférer :

```bash
docker compose down -v
docker compose up -d
```

## Local ou Atlas ?

| Besoin | Environnement recommandé |
|---|---|
| TP en classe | Docker local |
| Reproductibilité | Docker local |
| Découverte du cloud MongoDB | Atlas |
| Monitoring managé | Atlas |
| Sauvegarde/restauration sans risque | Docker local |
| Démonstration production | Atlas |

## Message clé

Le cours utilise principalement Docker et `mongosh` pour pratiquer. Mongo Express sert à vérifier visuellement. Les imports reproductibles passent par `mongoimport`, pas par l'interface web.
