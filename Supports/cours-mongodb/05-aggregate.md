# Cours - Analyser avec `aggregate`

## Objectifs

À la fin de cette partie, l'apprenant doit savoir :

- construire un pipeline d'agrégation ;
- filtrer, projeter, grouper et trier ;
- manipuler des tableaux avec `$unwind` ;
- relier deux collections avec `$lookup` ;
- créer une collection de résultats avec `$merge` ;
- construire des indicateurs métier sur les restaurants et avis clients.

## Principe

`aggregate` exécute une suite d'étapes appelées pipeline.

```javascript
db.collection.aggregate([
  { stage1 },
  { stage2 },
  { stage3 }
])
```

Chaque étape reçoit des documents, les transforme, puis transmet le résultat à l'étape suivante.

L'ordre des étapes est donc important : MongoDB exécute le pipeline de haut en bas.

Il n'existe pas un ordre universel obligatoire, mais l'ordre choisi peut changer le résultat.

Exemple :

```javascript
db.restaurants.aggregate([
  { $limit: 10 },
  { $sort: { "ratings.overall": -1 } }
])
```

Ce pipeline prend 10 documents, puis trie seulement ces 10 documents.

Alors que :

```javascript
db.restaurants.aggregate([
  { $sort: { "ratings.overall": -1 } },
  { $limit: 10 }
])
```

Ce pipeline trie tous les restaurants, puis garde les 10 mieux notés.

En pratique, on place souvent `$match` tôt dans le pipeline pour réduire le volume de documents à traiter. On ajoute ensuite les étapes selon le besoin : `$project`, `$set`, `$group`, `$sort`, `$limit`, `$lookup`, etc.

## `$match`

`$match` filtre les documents. Il est souvent placé au début pour réduire le volume traité.

```javascript
db.restaurants.aggregate([
  { $match: { "ratings.overall": { $gte: 22 } } }
])
```

## `$project`

`$project` choisit les champs et peut créer des champs calculés.

```javascript
db.restaurants.aggregate([
  {
    $project: {
      _id: 0,
      name: 1,
      cuisine: 1,
      price_for_two: 1,
      overall_rating: "$ratings.overall",
      average_detail_rating: {
        $round: [
          { $avg: ["$ratings.food", "$ratings.decor", "$ratings.service"] },
          1
        ]
      }
    }
  }
])
```

Ici :

- `overall_rating` renomme le champ imbriqué `ratings.overall` ;
- `average_detail_rating` calcule une moyenne à partir de trois champs ;
- `_id: 0` retire l'identifiant MongoDB de la sortie.

## `$set`

`$set` ajoute ou modifie un champ en conservant les autres.

```javascript
db.restaurants.aggregate([
  {
    $set: {
      value_score: {
        $round: [
          { $divide: ["$ratings.overall", "$price_for_two"] },
          3
        ]
      }
    }
  },
  { $sort: { value_score: -1 } },
  { $limit: 10 }
])
```

## `$group`

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
  {
    $group: {
      _id: "$cuisine",
      average_food: { $avg: "$ratings.food" },
      average_decor: { $avg: "$ratings.decor" },
      average_service: { $avg: "$ratings.service" },
      average_overall: { $avg: "$ratings.overall" },
      restaurants: { $sum: 1 }
    }
  },
  { $sort: { average_overall: -1 } }
])
```

## Accumulateurs fréquents

| Accumulateur | Usage |
|---|---|
| `$sum` | compter ou additionner |
| `$avg` | calculer une moyenne |
| `$min` | valeur minimale |
| `$max` | valeur maximale |
| `$first` | première valeur après tri |
| `$push` | construire un tableau |
| `$addToSet` | construire un tableau sans doublons |

## `$unwind`

`$unwind` transforme chaque élément d'un tableau en document séparé.

Compter les tags :

```javascript
db.restaurants.aggregate([
  { $unwind: "$tags" },
  {
    $group: {
      _id: "$tags",
      restaurants: { $sum: 1 }
    }
  },
  { $sort: { restaurants: -1 } }
])
```

## `$lookup`

`$lookup` permet de relier deux collections dans un pipeline `aggregate`.

Il sert à répondre à une question du type :

> J'ai des documents dans une collection, et je veux récupérer des informations liées dans une autre collection.

Dans le sandbox, plusieurs collections partagent le champ `restaurant_id` :

```text
review_details.restaurant_id  ->  restaurants.restaurant_id
orders.restaurant_id          ->  restaurants.restaurant_id
reviews.restaurant_id         ->  restaurants.restaurant_id
```

Avant d'écrire un `$lookup`, il faut identifier :

| Élément | Question | Exemple |
|---|---|---|
| Collection de départ | D'où part le pipeline ? | `review_details` |
| Collection cible | Où chercher l'information liée ? | `restaurants` |
| Champ local | Quel champ existe dans la collection de départ ? | `restaurant_id` |
| Champ étranger | Quel champ correspondant existe dans la collection cible ? | `restaurant_id` |
| Nom du résultat | Dans quel champ stocker les documents trouvés ? | `restaurant` |

Le paramètre `as` mérite une attention particulière : il ne désigne pas une collection existante. Il choisit le nom du nouveau champ ajouté dans chaque document produit par le pipeline.

Avec :

```javascript
as: "restaurant"
```

chaque document en sortie reçoit un champ `restaurant`.

On pourrait techniquement écrire :

```javascript
as: "restaurant_info"
```

Dans ce cas, le champ ajouté s'appellerait `restaurant_info`, et il faudrait ensuite lire les données avec `"$restaurant_info.name"` au lieu de `"$restaurant.name"`.

On peut vérifier les deux côtés séparément :

```javascript
db.review_details.findOne(
  {},
  { _id: 0, restaurant_id: 1, rating: 1, sentiment: 1 }
)

db.restaurants.findOne(
  {},
  { _id: 0, restaurant_id: 1, name: 1, cuisine: 1 }
)
```

### Étape 1 : faire un `$lookup` minimal

On commence sans `$unwind`, sans `$project` complexe et sans tri. L'objectif est seulement de voir la forme produite par `$lookup`.

```javascript
db.review_details.aggregate([
  { $limit: 3 },
  {
    $lookup: {
      from: "restaurants",
      localField: "restaurant_id",
      foreignField: "restaurant_id",
      as: "restaurant"
    }
  }
])
```

Résultat important : `$lookup` ajoute un champ `restaurant`, et ce champ est un tableau.

Même si on attend un seul restaurant, MongoDB retourne un tableau parce qu'une jointure peut techniquement trouver zéro, un ou plusieurs documents.

Le nom `restaurant` vient donc directement de `as: "restaurant"`.

### Étape 2 : filtrer avant la jointure

On ajoute ensuite un `$match` avant `$lookup`.

```javascript
db.review_details.aggregate([
  { $match: { verified_visit: true, rating: { $gte: 4.5 } } },
  { $limit: 3 },
  {
    $lookup: {
      from: "restaurants",
      localField: "restaurant_id",
      foreignField: "restaurant_id",
      as: "restaurant"
    }
  }
])
```

Filtrer avant `$lookup` évite de joindre toute la collection si on n'a besoin que d'une partie des documents.

### Étape 3 : transformer le tableau avec `$unwind`

Comme `restaurant` est un tableau, on utilise souvent `$unwind` juste après le `$lookup` quand on attend un seul document relié.

Avant `$unwind` :

```javascript
{
  restaurant_id: "NYC-ZAGAT-0001",
  rating: 4.8,
  restaurant: [
    { restaurant_id: "NYC-ZAGAT-0001", name: "Daniella Ristorante", cuisine: "Italian" }
  ]
}
```

Après `$unwind: "$restaurant"` :

```javascript
{
  restaurant_id: "NYC-ZAGAT-0001",
  rating: 4.8,
  restaurant: {
    restaurant_id: "NYC-ZAGAT-0001",
    name: "Daniella Ristorante",
    cuisine: "Italian"
  }
}
```

Pipeline :

```javascript
db.review_details.aggregate([
  { $match: { verified_visit: true, rating: { $gte: 4.5 } } },
  {
    $lookup: {
      from: "restaurants",
      localField: "restaurant_id",
      foreignField: "restaurant_id",
      as: "restaurant"
    }
  },
  { $unwind: "$restaurant" },
  { $limit: 3 }
])
```

### Étape 4 : projeter le résultat utile

Une fois la relation comprise, on garde seulement les champs utiles.

```javascript
db.review_details.aggregate([
  { $match: { verified_visit: true, rating: { $gte: 4.5 } } },
  {
    $lookup: {
      from: "restaurants",
      localField: "restaurant_id",
      foreignField: "restaurant_id",
      as: "restaurant"
    }
  },
  { $unwind: "$restaurant" },
  {
    $project: {
      _id: 0,
      reviewed_at: 1,
      rating: 1,
      sentiment: 1,
      name: "$restaurant.name",
      cuisine: "$restaurant.cuisine",
      price_tier: "$restaurant.price_tier"
    }
  },
  { $sort: { rating: -1, reviewed_at: -1 } },
  { $limit: 20 }
])
```

À retenir :

- `$lookup` s'utilise dans `aggregate`, pas dans `find` ;
- `from` indique la collection cible ;
- `localField` est le champ de la collection de départ ;
- `foreignField` est le champ correspondant dans la collection cible ;
- `as` est le nom du champ ajouté ;
- le résultat de `$lookup` est un tableau ;
- `$unwind` transforme ce tableau en objet quand on attend une seule correspondance.

## Agréger les commandes

Chiffre d'affaires par restaurant :

```javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  {
    $group: {
      _id: "$restaurant_id",
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 },
      average_basket: { $avg: "$amount" }
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 10 }
])
```

Chiffre d'affaires avec le nom du restaurant :

```javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  {
    $group: {
      _id: "$restaurant_id",
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "restaurants",
      localField: "_id",
      foreignField: "restaurant_id",
      as: "restaurant"
    }
  },
  { $unwind: "$restaurant" },
  {
    $project: {
      _id: 0,
      restaurant_id: "$_id",
      name: "$restaurant.name",
      cuisine: "$restaurant.cuisine",
      overall_rating: "$restaurant.ratings.overall",
      revenue: { $round: ["$revenue", 2] },
      orders: 1
    }
  },
  { $sort: { revenue: -1 } }
])
```

## Analyse croisée

Identifier les restaurants qui combinent satisfaction élevée et chiffre d'affaires important :

```javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  {
    $group: {
      _id: "$restaurant_id",
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "restaurants",
      localField: "_id",
      foreignField: "restaurant_id",
      as: "restaurant"
    }
  },
  { $unwind: "$restaurant" },
  { $match: { "restaurant.ratings.overall": { $gte: 22 } } },
  {
    $project: {
      _id: 0,
      name: "$restaurant.name",
      cuisine: "$restaurant.cuisine",
      price_tier: "$restaurant.price_tier",
      overall_rating: "$restaurant.ratings.overall",
      revenue: { $round: ["$revenue", 2] },
      orders: 1
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 20 }
])
```

## `$merge`

`$merge` permet d'écrire le résultat d'une agrégation dans une collection.

Créer une collection `restaurant_kpis` :

```javascript
db.orders.aggregate([
  { $match: { status: "paid" } },
  {
    $group: {
      _id: "$restaurant_id",
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 },
      average_basket: { $avg: "$amount" }
    }
  },
  {
    $lookup: {
      from: "restaurants",
      localField: "_id",
      foreignField: "restaurant_id",
      as: "restaurant"
    }
  },
  { $unwind: "$restaurant" },
  {
    $project: {
      _id: "$_id",
      name: "$restaurant.name",
      cuisine: "$restaurant.cuisine",
      price_tier: "$restaurant.price_tier",
      overall_rating: "$restaurant.ratings.overall",
      revenue: { $round: ["$revenue", 2] },
      orders: 1,
      average_basket: { $round: ["$average_basket", 2] }
    }
  },
  {
    $merge: {
      into: "restaurant_kpis",
      whenMatched: "replace",
      whenNotMatched: "insert"
    }
  }
])
```

## Performance

Un pipeline peut utiliser un index si les premières étapes le permettent, surtout `$match` et parfois `$sort`.

Exemple :

```javascript
db.review_details.createIndex({ sentiment: 1, rating: -1 })

db.review_details.aggregate([
  { $match: { sentiment: "excellent", rating: { $gte: 4.5 } } },
  { $group: { _id: "$restaurant_id", reviews: { $sum: 1 } } },
  { $sort: { reviews: -1 } }
]).explain("executionStats")
```

## Exercices

1. Calculer le nombre de restaurants par cuisine.
2. Calculer la note moyenne `food`, `decor`, `service` et `overall` par cuisine.
3. Trouver les cuisines dont la note globale moyenne est supérieure à 22.
4. Classer les restaurants par meilleur rapport note/prix.
5. Compter les restaurants par `price_tier`.
6. Identifier les tags les plus fréquents avec `$unwind`.
7. Calculer le chiffre d'affaires par canal de vente.
8. Calculer le panier moyen par cuisine avec `$lookup`.
9. Trouver les restaurants qui cumulent excellente note globale et revenus importants.
10. Calculer la note moyenne des avis détaillés par raison de visite.
11. Comparer les avis vérifiés et non vérifiés.
12. Créer une collection matérialisée `restaurant_kpis` avec `$merge`.
13. Calculer le chiffre d'affaires total, le nombre de commandes et le panier moyen par statut de commande.
14. Identifier les 10 restaurants qui ont le plus grand nombre de commandes payées.
15. Calculer, par cuisine, la part de restaurants dont `ratings.overall` est supérieure ou égale à 22.
16. Produire un classement des tags avec, pour chaque tag, le nombre de restaurants et la note globale moyenne.
17. Comparer le panier moyen des commandes selon le niveau de fidélité client (`customer.loyalty_tier`).
18. Trouver les restaurants dont les revenus sont élevés mais dont la note de service est inférieure à 20.
19. Construire un pipeline qui regroupe les avis détaillés par mois et par sentiment.
20. **Difficile.** Créer une collection matérialisée `cuisine_kpis` contenant, par cuisine, le nombre de restaurants, la note moyenne, le revenu total et le panier moyen.

## Message clé

`aggregate` transforme MongoDB en outil d'analyse. Il permet de passer de documents bruts à des indicateurs métier : satisfaction, qualité-prix, classements, revenus, paniers moyens et collections matérialisées.
