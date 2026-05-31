# Cours - Introduction à MongoDB

## Objectifs

À la fin de cette partie, l'apprenant doit savoir :

- expliquer ce qu'est MongoDB ;
- différencier une base relationnelle et une base orientée documents ;
- identifier les concepts de base : base, collection, document, champ et `_id` ;
- reconnaître les cas d'usage où MongoDB est pertinent ;
- comprendre les limites et les situations où une base relationnelle reste préférable.

## MongoDB en une phrase

MongoDB est une base de données NoSQL orientée documents.

Au lieu de stocker les données dans des tables composées de lignes et de colonnes, MongoDB stocke des documents au format BSON, très proche du JSON manipulé dans les applications web et les APIs.

Exemple de document :

```json
{
  "_id": "resto_001",
  "name": "Central Pizza",
  "borough": "Manhattan",
  "cuisine": "Italian",
  "address": {
    "street": "5th Avenue",
    "zipcode": "10001"
  },
  "grades": [
    { "date": "2024-01-12", "score": 8, "grade": "A" },
    { "date": "2024-05-20", "score": 12, "grade": "B" }
  ]
}
```

Cette structure permet de regrouper dans un même document les informations souvent consultées ensemble : ici, l'identité du restaurant, son adresse et son historique de notes.

## Vocabulaire essentiel

| Relationnel | MongoDB | Rôle |
|---|---|---|
| Base de données | Base de données | Conteneur logique des données |
| Table | Collection | Ensemble de documents |
| Ligne | Document | Objet stocké en BSON |
| Colonne | Champ | Propriété d'un document |
| Clé primaire | `_id` | Identifiant unique du document |
| Jointure | Document imbriqué ou `$lookup` | Association entre données |

Une collection MongoDB n'impose pas automatiquement que tous les documents aient exactement les mêmes champs. Cette flexibilité est utile, mais elle ne dispense pas de modéliser correctement les données.

## Pourquoi utiliser MongoDB ?

MongoDB devient intéressant lorsque les données sont naturellement représentables sous forme de documents.

Ses principaux atouts sont :

- un schéma flexible, adapté aux données qui évoluent ;
- une représentation lisible, proche des objets JSON ;
- la possibilité de stocker des objets imbriqués et des tableaux ;
- moins de jointures pour les lectures orientées application ;
- une bonne intégration avec les stacks web, mobiles et API ;
- des mécanismes de scalabilité horizontale.

MongoDB ne remplace pas systématiquement SQL. C'est un autre modèle, utile lorsque la forme des données et les accès de l'application s'y prêtent.

## Cas d'usage : catalogue produit

Un catalogue produit contient souvent des articles avec des caractéristiques différentes. Un ordinateur, un livre et une paire de chaussures n'ont pas les mêmes attributs.

Dans une base relationnelle, ce type de modèle peut conduire à beaucoup de colonnes vides ou à de nombreuses tables spécialisées. Avec MongoDB, chaque document peut conserver uniquement les champs pertinents.

Dans une même collection `products`, on peut donc stocker deux documents structurellement différents :

```json
{
  "name": "Laptop Pro 14",
  "category": "computer",
  "price": 1299,
  "specs": {
    "ram": "16 GB",
    "storage": "512 GB SSD",
    "screen": "14 inches"
  }
}
```

```json
{
  "name": "MongoDB Basics",
  "category": "book",
  "price": 32,
  "author": "N. Martin",
  "isbn": "978-2-0000-0000-1",
  "formats": ["paperback", "ebook"],
  "pages": 240
}
```

Le premier document contient un objet `specs` propre aux ordinateurs. Le second contient des champs liés à un livre : `author`, `isbn`, `formats` et `pages`. Les deux documents restent dans la même collection, car ils appartiennent au même domaine fonctionnel : le catalogue produit.

Cas typiques :

- e-commerce ;
- marketplace ;
- gestion de références techniques ;
- catalogue avec filtres dynamiques.

## Cas d'usage : application web ou mobile

Les applications modernes manipulent souvent des données JSON : profils utilisateurs, préférences, historiques, notifications ou contenus personnalisés.

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "preferences": {
    "language": "fr",
    "theme": "dark",
    "notifications": true
  },
  "recentSearches": ["pizza", "sushi", "brunch"]
}
```

MongoDB est adapté lorsque l'application lit et écrit fréquemment des objets complets plutôt que des lignes dispersées dans de nombreuses tables.

## Cas d'usage : gestion de contenus

Pour un blog, un CMS ou une plateforme éditoriale, les contenus peuvent avoir des structures variables : articles, commentaires, tags, blocs, auteurs, métadonnées.

```json
{
  "title": "Découvrir MongoDB",
  "author": "A. Martin",
  "tags": ["database", "nosql", "mongodb"],
  "comments": [
    {
      "user": "user1",
      "message": "Très clair",
      "date": "2024-03-10"
    }
  ]
}
```

Le modèle document permet de regrouper les informations consultées ensemble, par exemple un article et ses métadonnées.

## Cas d'usage : données géographiques

MongoDB propose des index géospatiaux. Ils permettent de rechercher des documents proches d'un point donné.

```json
{
  "name": "Central Pizza",
  "location": {
    "type": "Point",
    "coordinates": [-73.9857, 40.7484]
  }
}
```

Exemples :

- restaurants proches d'un utilisateur ;
- points de livraison ;
- agences ou magasins autour d'une adresse ;
- suivi de véhicules ou d'interventions.

## Cas d'usage : logs et événements

Les logs applicatifs et les événements utilisateurs sont souvent volumineux, semi-structurés et ajoutés en continu.

```json
{
  "event": "login",
  "userId": "u123",
  "timestamp": "2024-06-01T10:15:00Z",
  "metadata": {
    "ip": "192.168.1.10",
    "device": "mobile"
  }
}
```

MongoDB permet de stocker ces événements avec des métadonnées variables, puis de les analyser avec des requêtes et des pipelines d'agrégation.

## Quand MongoDB est un bon choix ?

MongoDB est pertinent lorsque :

- les données ressemblent naturellement à des documents JSON ;
- le schéma évolue régulièrement ;
- les lectures récupèrent souvent un objet complet ;
- les données contiennent des objets imbriqués ou des tableaux ;
- le volume peut devenir important ;
- l'application doit absorber beaucoup d'écritures ;
- l'équipe veut itérer rapidement sur le modèle de données.

## Quand faut-il être prudent ?

Une base relationnelle peut être préférable lorsque :

- les données sont très normalisées ;
- les relations entre entités sont nombreuses et complexes ;
- les transactions multi-tables sont centrales ;
- le schéma est stable et fortement contraint ;
- les jointures complexes sont fréquentes ;
- les contraintes d'intégrité relationnelle sont le coeur du besoin.

Le choix d'une base ne dépend donc pas d'un effet de mode. Il dépend du modèle de données, des requêtes à exécuter et des contraintes de l'application.

## Objectif du cours

Dans ce cours, nous utilisons MongoDB avec une base `nyc_food` autour de restaurants new-yorkais.

Ce fil rouge permet d'aborder progressivement :

- la mise en place d'un environnement MongoDB ;
- la structure des documents ;
- l'exploration avec `mongosh` ;
- les requêtes avec `find` ;
- les filtres, projections et tris ;
- les agrégations avec `aggregate` ;
- les index et la performance ;
- les notions d'administration, sauvegarde et sécurité.

## Message clé

MongoDB est puissant lorsqu'on modélise les données autour des usages réels de l'application.

Le bon réflexe n'est pas de copier un schéma relationnel dans MongoDB, mais de se demander : quelles données sont lues ensemble, écrites ensemble et consultées le plus souvent ?
