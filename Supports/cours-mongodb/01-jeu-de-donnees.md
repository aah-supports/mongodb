# Cours - Présentation du jeu de données

## Source

Le cours utilise le dataset **OpenIntro `nyc`**, basé sur des notations Zagat de restaurants new-yorkais.

Informations clés :

- source : OpenIntro ;
- sujet : restaurants de New York ;
- contenu : prix et notes clients agrégées ;
- URL CSV : `https://raw.githubusercontent.com/OpenIntroStat/openintro/main/data-raw/nyc/nyc.csv` ;
- volume réel : 168 restaurants.

Zagat est un système de notation historiquement fondé sur des avis de clients. Les notes sont agrégées par restaurant.

## Ce que décrit le dataset

Le dataset contient :

- le nom du restaurant ;
- le prix estimé pour deux personnes ;
- une note de nourriture `food` ;
- une note de décor `decor` ;
- une note de service `service` ;
- un indicateur de localisation : est ou ouest de 5th Avenue.

Les notes sont sur une échelle de 0 à 30 :

- `0 - 9` : poor to fair ;
- `10 - 15` : fair to good ;
- `16 - 19` : good to very good ;
- `20 - 25` : very good to excellent ;
- `26 - 30` : extraordinary to perfection.

## Pourquoi ce dataset est intéressant pour MongoDB

Ce jeu de données est adapté à MongoDB parce qu'il permet de travailler :

- une source tabulaire réelle ;
- des champs numériques utiles aux filtres et agrégations ;
- des objets imbriqués pour les notes ;
- des tableaux de tags ;
- des jointures entre restaurants, avis, commandes et événements ;
- des indicateurs métier : satisfaction, prix, qualité-prix, revenus simulés ;
- des volumes générés pour parler index et performance.

Il permet de montrer concrètement la différence entre une donnée CSV brute et un modèle documentaire exploitable.

## Collections utilisées dans le sandbox

Le sandbox contient sept collections : trois collections issues ou dérivées du dataset réel, une collection pédagogique annexe, et trois collections générées pour simuler du volume applicatif.

### `nyc_restaurant_reviews_raw`

Collection brute. Elle conserve les lignes du CSV source avec une structure proche du fichier original.

Usage pédagogique :

- observer le format source ;
- repérer les types à convertir ;
- comprendre pourquoi une transformation est utile ;
- montrer qu'un import direct n'est pas toujours un bon modèle applicatif.

Exemple de champs :

```text
restaurant
price
food
decor
service
east
```

### `restaurants`

Collection transformée orientée établissement.

Un document représente un restaurant avec ses informations principales :

```javascript
{
  restaurant_id: "NYC-ZAGAT-0001",
  name: "Daniella Ristorante",
  cuisine: "Italian",
  location_area: "West of 5th Avenue",
  price_for_two: 43,
  price_tier: "$$",
  ratings: {
    food: 22,
    decor: 18,
    service: 20,
    overall: 20
  },
  rating_band: "very_good_to_excellent",
  tags: ["dinner"]
}
```

Lecture des champs de prix et de notation :

| Champ | Lecture métier |
|---|---|
| `price_for_two` | Prix estimé pour deux personnes, en dollars. Ici, `43` signifie environ 43 dollars pour deux. |
| `price_tier` | Catégorie dérivée du prix : `$`, `$$`, `$$$` ou `$$$$`. Elle permet de filtrer rapidement par niveau de prix. |
| `ratings.food` | Note de la nourriture sur 30, issue du système Zagat. |
| `ratings.decor` | Note du décor sur 30. |
| `ratings.service` | Note du service sur 30. |
| `ratings.overall` | Note globale calculée à partir des notes `food`, `decor` et `service`. |
| `rating_band` | Libellé dérivé de la note globale. Par exemple, `20` correspond à `very_good_to_excellent`. |

Usage :

- faire des requêtes `find` ;
- filtrer par cuisine, prix, tags et notes ;
- travailler les projections ;
- interroger des champs imbriqués ;
- créer des index simples, composés et multikey.

### `reviews`

Collection transformée orientée avis agrégé.

Un document représente la notation agrégée d'un restaurant :

```javascript
{
  review_id: "ZAGAT-0001",
  restaurant_id: "NYC-ZAGAT-0001",
  reviewed_at: ISODate("2025-01-01"),
  reviewer_type: "local",
  scores: {
    food: 22,
    decor: 18,
    service: 20,
    overall: 20
  },
  sentiment: "positive",
  highlights: ["dinner"]
}
```

Usage pédagogique :

- manipuler des documents imbriqués ;
- comparer restaurants et avis ;
- utiliser `$lookup` ;
- produire des indicateurs de satisfaction ;
- préparer une collection de KPI.

### `neighborhoods`

Collection annexe créée au démarrage du conteneur.

Elle ne vient pas du dataset OpenIntro/Zagat. Elle sert de collection pédagogique simple pour montrer qu'une base MongoDB peut contenir plusieurs familles de documents qui ne portent pas toutes le même cycle de vie.

Usage pédagogique :

- explorer une collection courte ;
- comparer une collection annexe avec les collections métier principales ;
- discuter séparation des responsabilités entre collections.

## Création des collections

Le cours garde volontairement deux chemins seulement.

### Chemin normal : démarrage des conteneurs

Au premier démarrage avec un volume MongoDB vide, Docker initialise automatiquement :

- la base `nyc_food` ;
- l'utilisateur `student` ;
- les collections de base `nyc_restaurant_reviews_raw`, `restaurants`, `reviews`, `neighborhoods` ;
- les collections générées `orders`, `review_details`, `events`.

Commande :

```bash
cd sandbox-mongodb
docker compose up -d
```

Si un poste contient déjà un ancien volume, repartir de zéro :

```bash
docker compose down -v
docker compose up -d
```

### Chemin de secours : import JSON manuel

Le dépôt contient un fichier JSON par collection de base dans `data/nyc-food/`.
`mongoimport --drop` supprime la collection existante puis la recrée depuis le fichier JSON.

```bash
cd sandbox-mongodb
docker compose up -d mongodb
docker compose cp ../data/nyc-food/. mongodb:/tmp/nyc-food/

docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection nyc_restaurant_reviews_raw --file /tmp/nyc-food/nyc_restaurant_reviews_raw.json --jsonArray --drop
docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection restaurants --file /tmp/nyc-food/restaurants.json --jsonArray --drop
docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection reviews --file /tmp/nyc-food/reviews.json --jsonArray --drop
docker compose exec -T mongodb mongoimport --username root --password rootpass --authenticationDatabase admin --db nyc_food --collection neighborhoods --file /tmp/nyc-food/neighborhoods.json --jsonArray --drop
```

Ces commandes ne concernent que les collections de base. Les collections de volume sont créées par l'initialisation automatique d'un volume vide.

## Données générées

Les collections suivantes ne viennent pas du dataset réel :

- `orders` ;
- `review_details` ;
- `events`.

Elles sont générées automatiquement au premier lancement d'un volume vide pour simuler un contexte applicatif massif.

Elles servent à travailler :

- les requêtes sur gros volume ;
- les agrégations métier ;
- les index composés ;
- les index multikey ;
- `explain("executionStats")`.

### `orders`

Collection générée de commandes.

Chaque document représente une commande simulée rattachée à un restaurant par `restaurant_id`.

Exemple de champs :

```text
order_id
restaurant_id
created_at
channel
status
amount
items_count
customer.loyalty_tier
customer.zipcode
```

Usage pédagogique :

- filtrer par date, statut, canal ou montant ;
- calculer du chiffre d'affaires ;
- relier commandes et restaurants avec `$lookup` ;
- mesurer l'effet des index composés sur un gros volume.

### `review_details`

Collection générée d'avis clients détaillés.

Elle complète `reviews`, qui contient une notation agrégée issue du dataset réel. Ici, chaque document simule un avis plus applicatif, avec une note, un sentiment, un contexte de visite et un canal.

Exemple de champs :

```text
review_detail_id
restaurant_id
reviewed_at
rating
sentiment
visit_reason
channel
verified_visit
helpful_votes
text
```

Usage pédagogique :

- filtrer les avis vérifiés ;
- comparer les sentiments ;
- agréger par restaurant, canal ou raison de visite ;
- montrer des requêtes analytiques sur une collection volumineuse.

### `events`

Collection générée d'événements applicatifs.

Chaque document représente une action simulée dans une application : recherche, vue restaurant, démarrage de commande, paiement, ouverture d'avis ou ajout en favori.

Exemple de champs :

```text
event_id
restaurant_id
event_type
occurred_at
session_id
device
latency_ms
```

Usage pédagogique :

- analyser l'activité applicative ;
- regrouper les événements par type, appareil ou période ;
- travailler les index sur les séries temporelles simples ;
- illustrer le lien entre données métier et données d'usage.

## Questions métier possibles

Le dataset permet de répondre à des questions concrètes :

- Quelles cuisines ont les meilleures notes globales ?
- Quels restaurants offrent le meilleur rapport note/prix ?
- Les restaurants chers sont-ils mieux notés ?
- Quels restaurants ont une excellente note de service ?
- Quels tags reviennent le plus souvent ?
- Quels restaurants combinent satisfaction élevée et revenus importants ?
- Les avis détaillés vérifiés sont-ils plus positifs ?
- Quels index accélèrent réellement les requêtes fréquentes ?

## Message clé

Le dataset réel est volontairement conservé en brut, puis transformé en collections MongoDB plus adaptées. Cette étape est centrale : MongoDB ne consiste pas seulement à importer du CSV ou du JSON, mais à choisir une structure documentaire cohérente avec les requêtes attendues.
