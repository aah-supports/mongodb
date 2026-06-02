# Cours - Créer une base de données et comprendre le schéma

## Objectifs

À la fin de cette partie, l'apprenant doit savoir :

- créer une base MongoDB ;
- créer une collection ;
- insérer un premier document ;
- comprendre la notion de schéma flexible ;
- distinguer schéma implicite, schéma applicatif et validation MongoDB.

## Base, collection, document

MongoDB organise les données en trois niveaux principaux.

| Niveau | Équivalent approximatif en SQL | Exemple |
|---|---|---|
| Base de données | Base de données | `nyc_food` |
| Collection | Table | `restaurants` |
| Document | Ligne enrichie | un restaurant au format JSON/BSON |

Une base contient des collections. Une collection contient des documents. Un document contient des champs, qui peuvent être simples, imbriqués ou sous forme de tableaux.

## Créer une base de données

Dans MongoDB, une base est créée au moment où une première donnée y est écrite.

Se connecter à `mongosh` :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/admin"
```

Créer ou sélectionner une base :

```javascript
use demo_schema
```

À ce stade, la base n'existe pas encore physiquement. Elle apparaîtra après la première insertion.

Vérifier :

```javascript
show dbs
```

La base `demo_schema` n'apparaît pas encore si elle est vide.

## Créer une collection implicitement

Insérer un document :

```javascript
db.restaurants.insertOne({
  name: "Demo Bistro",
  cuisine: "French",
  price_for_two: 48,
  ratings: {
    food: 22,
    decor: 19,
    service: 21,
    overall: 20.7
  }
})
```

Vérifier les collections :

```javascript
show collections
```

Afficher le document :

```javascript
db.restaurants.findOne()
```

La base et la collection ont été créées automatiquement lors de l'insertion.

## Créer une collection explicitement

Il est aussi possible de créer une collection avant d'insérer des documents :

```javascript
db.createCollection("reviews")
```

Vérifier :

```javascript
show collections
```

Cette approche est utile quand on veut définir des options dès la création, par exemple une validation de schéma.

## La notion de schéma en MongoDB

Dans une base relationnelle classique, le schéma est strict : chaque ligne d'une table suit la même structure.

Dans MongoDB, le schéma est flexible :

- deux documents d'une même collection peuvent avoir des champs différents ;
- un champ peut être absent d'un document ;
- un champ peut contenir une valeur simple, un objet ou un tableau ;
- la structure peut évoluer avec le besoin métier.

Exemple :

```javascript
db.restaurants.insertMany([
  {
    name: "Demo Bagel",
    cuisine: "Bagels",
    price_tier: "$"
  },
  {
    name: "Demo Sushi",
    cuisine: "Japanese",
    ratings: {
      food: 24,
      decor: 21,
      service: 23,
      overall: 22.7
    },
    tags: ["top_food", "great_service"]
  }
])
```

Ces deux documents sont dans la même collection, mais ils n'ont pas exactement la même structure.

## Schéma flexible ne veut pas dire absence de modèle

MongoDB permet d'avoir un schéma flexible, mais une application sérieuse a toujours un modèle de données.

Il faut définir :

- les collections principales ;
- les champs attendus ;
- les types de données ;
- les champs obligatoires ;
- les champs indexés ;
- les relations entre collections ;
- les documents imbriqués ;
- les tableaux utiles aux requêtes.

Dans le projet fil rouge, le modèle principal est :

| Collection | Rôle |
|---|---|
| `nyc_restaurant_reviews_raw` | Données brutes du dataset OpenIntro/Zagat. |
| `restaurants` | Vue documentaire orientée restaurant. |
| `reviews` | Avis et notes agrégées. |
| `neighborhoods` | Collection pédagogique annexe créée à l'initialisation. |
| `orders` | Commandes générées pour simuler le volume. |
| `review_details` | Avis détaillés générés pour simuler le volume. |
| `events` | Événements applicatifs générés. |

## Trois niveaux de schéma

### Schéma implicite

C'est la structure réellement présente dans les documents.

Exemple :

```javascript
db.restaurants.findOne()
```

On observe les champs existants et les types utilisés.

### Schéma applicatif

C'est le modèle attendu par l'application ou le projet.

Exemple :

```text
Un restaurant doit avoir :
- restaurant_id
- name
- cuisine
- price_for_two
- ratings.food
- ratings.decor
- ratings.service
- ratings.overall
```

Ce schéma peut être documenté dans le code, dans un support de cours ou dans un diagramme.

### Validation MongoDB

MongoDB peut aussi appliquer une validation avec JSON Schema.

Exemple simple :

```javascript
db.createCollection("validated_restaurants", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "cuisine", "ratings"],
      properties: {
        name: { bsonType: "string" },
        cuisine: { bsonType: "string" },
        price_for_two: { bsonType: ["int", "long", "double", "null"] },
        ratings: {
          bsonType: "object",
          required: ["overall"],
          properties: {
            overall: { bsonType: ["int", "long", "double"] }
          }
        }
      }
    }
  }
})
```

Insertion valide :

```javascript
db.validated_restaurants.insertOne({
  name: "Demo Vegan",
  cuisine: "Vegetarian",
  price_for_two: 38,
  ratings: { overall: 21.5 }
})
```

Insertion invalide :

```javascript
db.validated_restaurants.insertOne({
  name: "Missing Rating",
  cuisine: "Vegetarian"
})
```

La deuxième insertion échoue parce que le champ `ratings` est obligatoire.

## Validation MongoDB : est-ce comme SQL ?

La validation MongoDB permet bien d'imposer une structure et des types. On peut exiger qu'un champ soit présent, qu'il soit une chaîne, un nombre, un objet, un tableau, etc.

Donc oui : plus la validation est stricte, plus on se rapproche d'un contrat de données comparable à SQL.

Mais MongoDB ne devient pas une base relationnelle pour autant :

- la validation est optionnelle et configurable collection par collection ;
- elle peut être partielle : on valide certains champs sans figer tout le document ;
- les documents peuvent contenir naturellement des objets imbriqués et des tableaux ;
- les relations ne sont pas modélisées par défaut avec des clés étrangères comme en SQL ;
- le modèle est souvent pensé à partir des requêtes de l'application, pas seulement à partir d'une normalisation en tables.

À retenir : MongoDB n'est pas "sans schéma". Il permet de choisir le niveau de contrainte : très flexible au début, plus strict quand le modèle devient stable.

## Documents imbriqués

MongoDB permet de stocker des objets dans un document.

Exemple :

```javascript
db.restaurants.insertOne({
  name: "Demo Tacos",
  cuisine: "Mexican",
  ratings: {
    food: 20,
    decor: 16,
    service: 18,
    overall: 18
  }
})
```

Requête sur un champ imbriqué :

```javascript
db.restaurants.find({ "ratings.food": { $gte: 20 } })
```

## Tableaux

Un document peut contenir un tableau de valeurs ou d'objets.

Exemple :

```javascript
db.restaurants.insertOne({
  name: "Demo Review Tags",
  cuisine: "Italian",
  tags: ["top_food", "great_service", "dinner"]
})
```

Requête sur un tableau :

```javascript
db.restaurants.find({ tags: "top_food" })
```


## Quand imbriquer et quand référencer ?

### Imbriquer

On imbrique quand les données sont consultées ensemble et ne grossissent pas sans limite.

Exemple :

```javascript
address: {
  street: "Main Street",
  zipcode: "10001"
}
```

L'adresse appartient au restaurant et elle est souvent lue avec lui.

### Référencer

On référence quand les données sont nombreuses, évolutives ou consultées séparément.

Exemple :

```javascript
{
  restaurant_id: "NYC-ZAGAT-0001",
  reviewed_at: ISODate("2025-05-01"),
  rating: 4.7,
  sentiment: "positive"
}
```

Les avis détaillés sont séparés des restaurants parce qu'un restaurant peut recevoir de nombreux avis.

## Exercices rapides

1. Créer une base `demo_schema`.
2. Créer une collection `restaurants`.
3. Insérer deux restaurants avec des structures différentes.
4. Ajouter un document avec un objet `ratings`.
5. Ajouter un document avec un tableau `tags`.
6. Écrire une requête sur `ratings.food`.
7. Créer une collection avec validation JSON Schema.
8. Tester une insertion valide et une insertion invalide.

## Exercice guidé : modéliser une petite application

Une application gère des utilisateurs, des événements et des réservations.

Utiliser `_id` en `ObjectId` pour `users` et `events`, puis référencer ces documents dans `reservations` avec `user_id` et `event_id`.

Créer la base et les collections de départ :

```javascript
use event_booking

db.createCollection("users")
db.createCollection("events")
db.createCollection("reservations")
```

Travail attendu :

- décider quels champs sont communs à tous les documents ;
- décider quoi imbriquer dans `reservations` ;
- décider quoi référencer avec `user_id` et `event_id` ;
- justifier le choix en quelques phrases.

Pour la suite, reprendre les exercices du chapitre `aggregate` ou de la liste d'exercices du cours.
