# Sandbox MongoDB - NYC Restaurant Reviews 360

Sandbox local pour le cours MongoDB / NoSQL. Il contient MongoDB, Mongo Express, un import d'un vrai dataset de notations clients de restaurants new-yorkais, des scripts de génération de volume et des exercices centrés sur `find`, `aggregate`, les index et l'administration.

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

Au démarrage, Docker initialise seulement la base, l'utilisateur `student` et la collection `neighborhoods`.

Importer les données :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" /scripts/import-restaurant-reviews.js
```

Le script importe les lignes du CSV source, puis crée un modèle documentaire exploitable. Pour limiter le nombre de lignes :

```bash
docker compose exec -e NYC_IMPORT_MAX_ROWS=100 mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" /scripts/import-restaurant-reviews.js
```

Collections après import :

- `nyc_restaurant_reviews_raw` : lignes brutes du dataset OpenIntro/Zagat.
- `restaurants` : restaurants, cuisine inférée, prix, tags et notes agrégées.
- `reviews` : avis agrégés par restaurant avec scores, sentiment et contexte de notation.
- `neighborhoods` : points pédagogiques conservés pour montrer une collection annexe.

Collections générées pour les TP, non officielles :

- `orders` : commandes simulées pour travailler le volume et les performances.
- `review_details` : avis clients détaillés simulés à partir des restaurants réels.
- `events` : événements applicatifs simulés.

La frontière pédagogique est volontairement explicite : `nyc_restaurant_reviews_raw`, `restaurants` et `reviews` portent la donnée réelle ; `orders`, `review_details` et `events` servent à enrichir le cas pratique avec des volumes plus importants.

## Générer plus de volume

Le script `scripts/generate-volume.js` ajoute des commandes, avis détaillés et événements applicatifs. Par défaut, il crée 100 000 commandes, 50 000 avis détaillés et 300 000 événements. Il doit être lancé après l'import, car il s'appuie sur les restaurants importés.

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" /scripts/generate-volume.js
```

Pour un volume plus léger :

```bash
docker compose exec -e NYC_GENERATE_ORDERS=10000 -e NYC_GENERATE_REVIEW_DETAILS=5000 -e NYC_GENERATE_EVENTS=20000 mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" /scripts/generate-volume.js
```

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

Les corrigés des TP sont rangés séparément dans `../Supports/Exercices/corrections`.
