# Sandbox MongoDB - NYC Restaurant Reviews 360

Sandbox local pour le cours MongoDB / NoSQL. Il contient MongoDB 8, Mongo Express, un dataset de notations clients de restaurants new-yorkais, des données générées pour le volume et des exercices centrés sur `find`, `aggregate`, les index et l'administration.

## Démarrage

Prérequis :

- Docker
- Docker Compose
- Compte MongoDB Atlas optionnel pour la partie cloud

Lancer l'environnement :

```bash
docker compose up -d
```

Accès :

- MongoDB : `mongodb://root:rootpass@localhost:27017`
- Mongo Express : http://localhost:8083
- Base de travail : `nyc_food`

Mongo Express sert à vérifier les collections depuis le navigateur. Pour importer ou recréer des collections, utiliser les commandes `mongoimport` documentées plus bas.

Connexion avec `mongosh` :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin"
```

Remettre le sandbox à zéro :

```bash
docker compose down -v
docker compose up -d
```

## Données

Source réelle :

- Dataset : OpenIntro `nyc`
- Sujet : notations Zagat de 168 restaurants new-yorkais
- URL source : `https://raw.githubusercontent.com/OpenIntroStat/openintro/main/data-raw/nyc/nyc.csv`
- Champs : restaurant, prix pour deux, notes food/decor/service, position est/ouest de 5th Avenue

Au premier démarrage avec un volume MongoDB vide, Docker initialise la base `nyc_food`, l'utilisateur `student`, les quatre collections de base et les trois collections générées.

Le chemin normal est donc simplement :

```bash
docker compose up -d
```

Si un poste a déjà un ancien volume ou si l'on veut repartir de zéro :

```bash
docker compose down -v
docker compose up -d
```

Import de secours, depuis les fichiers JSON versionnés dans `../data/nyc-food`.
`mongoimport --drop` supprime la collection existante puis la recrée depuis le fichier JSON. C'est le seul chemin manuel prévu pour recréer les collections de base :

```bash
docker compose up -d mongodb
docker compose cp ../data/nyc-food/. mongodb:/tmp/nyc-food/

docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection nyc_restaurant_reviews_raw --file /tmp/nyc-food/nyc_restaurant_reviews_raw.json --jsonArray --drop
docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection restaurants --file /tmp/nyc-food/restaurants.json --jsonArray --drop
docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection reviews --file /tmp/nyc-food/reviews.json --jsonArray --drop
docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection neighborhoods --file /tmp/nyc-food/neighborhoods.json --jsonArray --drop
```

Ces commandes recréent `nyc_restaurant_reviews_raw`, `restaurants`, `reviews` et `neighborhoods`. Les collections `orders`, `review_details` et `events` sont générées automatiquement au premier démarrage d'un volume vide.

Collections après import :

- `nyc_restaurant_reviews_raw` : lignes brutes du dataset OpenIntro/Zagat.
- `restaurants` : restaurants, cuisine inférée, prix, tags et notes agrégées.
- `reviews` : avis agrégés par restaurant avec scores, sentiment et contexte de notation.
- `neighborhoods` : points pédagogiques conservés pour montrer une collection annexe.

Collections générées automatiquement pour les TP :

- `orders` : commandes simulées pour travailler le volume et les performances.
- `review_details` : avis clients détaillés simulés à partir des restaurants réels.
- `events` : événements applicatifs simulés.

La frontière pédagogique est volontairement explicite : `nyc_restaurant_reviews_raw`, `restaurants` et `reviews` portent la donnée réelle ; `orders`, `review_details` et `events` servent à enrichir le cas pratique avec des volumes plus importants.

## Supports de cours

Les contenus de cours Markdown sont rangés dans `../Supports/cours-mongodb` :

0. `../Supports/cours-mongodb/00-outils-atlas-mongosh.md`
1. `../Supports/cours-mongodb/01-jeu-de-donnees.md`
2. `../Supports/cours-mongodb/02-creation-base-schema.md`
3. `../Supports/cours-mongodb/03-mongosh.md`
4. `../Supports/cours-mongodb/04-find.md`
5. `../Supports/cours-mongodb/05-aggregate.md`

## Parcours d’exercices pratiques

Les énoncés formateur/apprenant sont centralisés dans `../Supports/Exercices/enonces`.

La sandbox conserve aussi une copie locale dans `exercises` :

1. `exercises/01-installation-et-exploration.md`
2. `exercises/02-find.md`
3. `exercises/03-aggregate.md`
4. `exercises/04-index-performance.md`
5. `exercises/05-admin-backup-security.md`

## Corrigés

Les corrigés des TP sont rangés séparément dans `../Corrections`.
