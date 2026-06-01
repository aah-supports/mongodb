# Cours - Rechercher avec `find`

## Objectifs

À la fin de cette partie, vous serez capable de :

- écrire une requête `find` ;
- comprendre que `find()` retourne un curseur ;
- utiliser une projection ;
- filtrer avec les opérateurs principaux ;
- interroger des champs imbriqués et des tableaux ;
- trier, limiter et compter ;
- repérer les requêtes fréquentes ou coûteuses qui filtrent, trient ou paginent sur des champs précis, puis utiliser `explain()` pour vérifier si MongoDB parcourt toute la collection ou utilise un index adapté.

## Forme générale

```javascript
db.collection.find(filtre, projection)
```

Exemple :

```javascript
db.restaurants.find(
  { cuisine: "Italian" },
  { _id: 0, name: 1, price_tier: 1, ratings: 1 }
)
```

- `restaurants` est la collection ;
- le premier objet est le filtre ;
- le second objet est la projection.

## Lire sans filtre

```javascript
db.restaurants.find()
db.restaurants.find().limit(5)
db.restaurants.findOne()
```

## Comprendre le curseur MongoDB

Une particularité importante de MongoDB : `find()` ne retourne pas directement un tableau de documents. Il retourne un **curseur**.

Un curseur est un objet qui permet de parcourir progressivement les résultats d'une requête.

```javascript
const cursor = db.restaurants.find({ cuisine: "Italian" })
```

À ce moment-là, il faut retenir l'idée suivante : MongoDB prépare une requête, mais les résultats sont consommés progressivement.

Cette logique ressemble à l'idée de `yield` en JavaScript.

## Rappel : produire des valeurs avec `yield`

L'intérêt de `yield` apparaît quand produire une valeur coûte du temps ou de la mémoire.

Sans générateur, on calcule tout immédiatement :

```javascript
function carres(max) {
  const resultats = [];

  for (let i = 1; i <= max; i++) {
    resultats.push(i * i);
  }

  return resultats;
}

const valeurs = carres(1_000_000);

console.log(valeurs[0]);
```

Problème :

- les 1 000 000 valeurs sont calculées immédiatement ;
- elles sont toutes stockées en mémoire ;
- si on utilise seulement les 10 premières, le reste a été calculé pour rien.

Avec un générateur :

```javascript
function* carres(max) {
  for (let i = 1; i <= max; i++) {
    yield i * i;
  }
}

const valeurs = carres(1_000_000);

console.log(valeurs.next().value); // 1
console.log(valeurs.next().value); // 4
console.log(valeurs.next().value); // 9
```

Ici :

1. aucun tableau complet n'est créé ;
2. seul le carré demandé est calculé ;
3. la fonction est mise en pause après chaque `yield`.

On peut imaginer que le moteur exécute :

```text
yield 1;
<PAUSE>

yield 4;
<PAUSE>

yield 9;
<PAUSE>
```

La fonction reprend exactement là où elle s'était arrêtée.

## Lien avec un curseur MongoDB

Un curseur MongoDB suit la même idée générale : les résultats sont parcourus à la demande.

```javascript
const cursor = db.restaurants.find(
  { cuisine: "Italian" },
  { _id: 0, name: 1, cuisine: 1 }
)
```

Le curseur ne doit pas être compris comme "un gros tableau déjà prêt", mais comme un pointeur permettant d'avancer dans les résultats.

Dans `mongosh`, quand on tape directement :

```javascript
db.restaurants.find({ cuisine: "Italian" })
```

le shell affiche automatiquement une première partie des résultats pour faciliter la lecture. Mais conceptuellement, `find()` produit bien un curseur.

## Consommer un curseur avec `toArray()`

`toArray()` force la consommation complète du curseur et place tous les documents dans un tableau JavaScript.

```javascript
const restaurants = db.restaurants
  .find(
    { cuisine: "Italian" },
    { _id: 0, name: 1, cuisine: 1, price_tier: 1 }
  )
  .toArray()

console.log(restaurants.length)
console.log(restaurants[0])
```

C'est pratique pour manipuler un petit résultat dans un script.

Mais sur une grosse collection, il faut être prudent :

- tous les documents retournés sont chargés en mémoire côté client ;
- si la requête retourne beaucoup de résultats, `toArray()` peut devenir coûteux ;
- on perd l'intérêt du parcours progressif.

Pour limiter le risque :

```javascript
const topRestaurants = db.restaurants
  .find({}, { _id: 0, name: 1, "ratings.overall": 1 })
  .sort({ "ratings.overall": -1 })
  .limit(10)
  .toArray()
```

Ici, `limit(10)` réduit volontairement le nombre de documents placés dans le tableau.

## Consommer un curseur avec `forEach()`

`forEach()` parcourt le curseur document par document.

```javascript
db.restaurants
  .find(
    { cuisine: "Italian" },
    { _id: 0, name: 1, cuisine: 1, price_tier: 1 }
  )
  .forEach((restaurant) => {
    print(`${restaurant.name} - ${restaurant.price_tier}`)
  })
```

Cette approche est utile quand on veut traiter chaque document sans construire soi-même un tableau complet.

Exemple avec un arrêt logique dans le traitement :

```javascript
db.restaurants
  .find({}, { _id: 0, name: 1, "ratings.overall": 1 })
  .sort({ "ratings.overall": -1 })
  .limit(5)
  .forEach((restaurant) => {
    printjson(restaurant)
  })
```

## Particularités importantes de `find`

À retenir :

- `find()` retourne un curseur ;
- `findOne()` retourne directement un document ou `null` ;
- `sort()`, `limit()` et `skip()` modifient le curseur avant sa consommation ;
- `toArray()` transforme tous les résultats restants du curseur en tableau ;
- `forEach()` parcourt les résultats un par un ;
- un curseur consommé ne se réutilise pas comme un tableau normal ;
- pour les gros volumes, il vaut mieux filtrer, projeter, trier et limiter avant de consommer le curseur.

Exemple de requête bien cadrée :

```javascript
db.restaurants
  .find(
    { "ratings.overall": { $gte: 22 } },
    { _id: 0, name: 1, cuisine: 1, "ratings.overall": 1 }
  )
  .sort({ "ratings.overall": -1 })
  .limit(20)
```

La requête :

1. filtre les documents ;
2. réduit les champs retournés ;
3. trie les résultats ;
4. limite le nombre de documents à parcourir.

C'est la bonne logique à adopter avant d'utiliser `toArray()` ou `forEach()`.

## Projection

Afficher seulement quelques champs :

```javascript
db.restaurants.find(
  {},
  { _id: 0, name: 1, cuisine: 1, price_for_two: 1, "ratings.overall": 1 }
)
```

## Égalité

```javascript
db.restaurants.find({ cuisine: "Italian" })
db.restaurants.find({ price_tier: "$$" })
db.reviews.find({ sentiment: "excellent" })
```

## Comparaison

Principaux opérateurs :

| Opérateur | Sens |
|---|---|
| `$gt` | strictement supérieur |
| `$gte` | supérieur ou égal |
| `$lt` | strictement inférieur |
| `$lte` | inférieur ou égal |
| `$ne` | différent |

Exemples :

```javascript
db.restaurants.find({ "ratings.overall": { $gte: 23 } })

db.restaurants.find({
  price_for_two: { $lte: 45 },
  "ratings.service": { $gte: 22 }
})
```

## Appartenance avec `$in` et `$nin`

```javascript
db.restaurants.find({
  price_tier: { $in: ["$", "$$"] }
})
```

```javascript
db.restaurants.find({
  cuisine: { $nin: ["Steakhouse", "Seafood"] }
})
```

## Combiner les conditions

Quand plusieurs champs sont présents, MongoDB applique un `AND` implicite.

```javascript
db.restaurants.find({
  cuisine: "French",
  "ratings.overall": { $gte: 22 }
})
```

`$or` exprime une alternative :

```javascript
db.restaurants.find({
  $or: [
    { tags: "top_food" },
    { tags: "great_service" }
  ]
})
```

Combiner `$or` avec une contrainte commune :

```javascript
db.restaurants.find({
  price_tier: { $ne: "$$$$" },
  $or: [
    { "ratings.food": { $gte: 24 } },
    { "ratings.service": { $gte: 24 } }
  ]
})
```

## Champs imbriqués

Les notes sont stockées dans l'objet `ratings`.

```javascript
db.restaurants.find({
  "ratings.food": { $gte: 24 },
  "ratings.decor": { $gte: 20 }
})
```

Dans `reviews`, les scores sont stockés dans `scores`.

```javascript
db.reviews.find({
  "scores.overall": { $gte: 23 },
  sentiment: "positive"
})
```

## Expressions avec `$expr`

Dans une requête `find`, `$expr` permet d'utiliser une expression de calcul ou de comparaison entre champs du même document.

Exemple : chercher les restaurants dont la note `food` dépasse la note `decor` d'au moins 4 points.

```javascript
db.restaurants.find({
  $expr: {
    $gte: [
      { $subtract: ["$ratings.food", "$ratings.decor"] },
      4
    ]
  }
})
```

Question rapide : comment chercher les restaurants où l'écart entre `food` et `decor` est d'au moins 4 points, peu importe le sens de l'écart ?

Indice : on peut combiner `$subtract` avec `$abs` pour travailler en valeur absolue.

<details>
<summary>Voir une solution possible</summary>

```javascript
db.restaurants.find({
  $expr: {
    $gte: [
      { $abs: { $subtract: ["$ratings.food", "$ratings.decor"] } },
      4
    ]
  }
})
```

</details>

À retenir : `$expr` sert quand une condition ne compare pas seulement un champ à une valeur fixe, mais dépend d'un calcul ou d'une comparaison entre champs.

## Tableaux

Le champ `tags` est un tableau.

```javascript
db.restaurants.find({ tags: "top_food" })
```

Tous les tags demandés avec `$all` :

```javascript
db.restaurants.find({
  tags: { $all: ["top_food", "great_service"] }
})
```

À retenir : `$all` est un `AND` appliqué aux éléments d'un même tableau. Ici, `tags` doit contenir `top_food` ET `great_service`. Ce n'est pas un `$and` général : `$and` combine des conditions de requête, éventuellement sur plusieurs champs, alors que `$all` exprime précisément "toutes ces valeurs dans ce tableau".

On peut réécrire l'idée avec `$and` sur le même champ :

```javascript
db.restaurants.find({
  $and: [
    { tags: "top_food" },
    { tags: "great_service" }
  ]
})
```

Mais `$all` est plus clair ici, car il exprime directement l'intention : vérifier que le tableau `tags` contient toutes les valeurs demandées.

Autre exemple avec `$and` : les conditions portent ici sur des champs différents.

```javascript
db.restaurants.find({
  $and: [
    { cuisine: "French" },
    { price_tier: "$$" },
    { "ratings.overall": { $gte: 22 } }
  ]
})
```

## Existence et type

`$exists` vérifie qu'un champ est présent. `$type` vérifie son type BSON. C'est utile sur une base documentaire, car tous les documents n'ont pas forcément exactement la même structure.

Exemple : repérer les restaurants pour lesquels `price_for_two` existe bien et peut être utilisé comme nombre.

```javascript
db.restaurants.find({
  price_for_two: { $exists: true, $type: "number" }
})
```

On peut ensuite filtrer ou trier ce champ sans mélanger des documents où le prix serait absent ou stocké dans un mauvais type.

## Expressions régulières

Une expression régulière permet de rechercher un motif dans une chaîne de caractères. Dans nos exercices, on l'utilise surtout pour chercher un mot dans le nom d'un restaurant ou dans le texte d'un avis.

`$regex` contient le motif recherché. `$options: "i"` rend la recherche insensible à la casse : `Bistro`, `bistro` et `BISTRO` peuvent alors correspondre.

```javascript
db.restaurants.find({
  name: { $regex: "bistro", $options: "i" }
})
```

Le symbole `|` signifie "ou" dans le motif. L'exemple suivant cherche un nom contenant `cafe`, `bistro` ou `ristorante`.

```javascript
db.restaurants.find({
  name: { $regex: "cafe|bistro|ristorante", $options: "i" }
})
```

Exemple un peu plus technique : `^` signifie "début du texte". Cette requête cherche les restaurants dont le nom commence par `cafe`, sans tenir compte de la casse.

```javascript
db.restaurants.find({
  name: { $regex: "^cafe", $options: "i" }
})
```

Pour aller plus loin : documentation officielle MongoDB sur [`$regex`](https://www.mongodb.com/docs/manual/reference/operator/query/regex/).

À ce niveau, l'objectif n'est pas d'apprendre toute la syntaxe des expressions régulières, mais de savoir reconnaître et écrire une recherche textuelle simple.

## Trier, limiter, paginer

Top restaurants par note globale :

```javascript
db.restaurants.find(
  {},
  { _id: 0, name: 1, cuisine: 1, "ratings.overall": 1 }
).sort({ "ratings.overall": -1 }).limit(10)
```

Pagination simple :

```javascript
db.restaurants.find(
  {},
  { _id: 0, name: 1, cuisine: 1 }
).sort({ name: 1 }).skip(20).limit(10)
```

## Compter

```javascript
db.restaurants.countDocuments({ price_tier: "$$" })
db.restaurants.countDocuments({ "ratings.overall": { $gte: 23 } })
db.review_details.countDocuments({ verified_visit: true, rating: { $gte: 4.5 } })
```

## Distinct

```javascript
db.restaurants.distinct("cuisine")
db.restaurants.distinct("price_tier")
db.reviews.distinct("sentiment")
```

## Construire une requête métier

Jusqu'ici, les exemples isolent un opérateur ou une technique. Dans une vraie demande métier, on combine généralement :

1. un filtre principal ;
2. une projection pour ne retourner que les champs utiles ;
3. un tri ou une limite pour rendre le résultat exploitable.

L'objectif des exemples suivants est de traduire une question formulée en français en requête `find`.

Restaurants très bien notés mais abordables :

```javascript
db.restaurants.find(
  {
    "ratings.overall": { $gte: 22 },
    price_for_two: { $lte: 50 }
  },
  { _id: 0, name: 1, cuisine: 1, price_for_two: 1, "ratings.overall": 1 }
).sort({ "ratings.overall": -1, price_for_two: 1 })
```

Restaurants avec très bonne nourriture mais décor moyen :

```javascript
db.restaurants.find({
  "ratings.food": { $gte: 24 },
  "ratings.decor": { $lt: 20 }
})
```

Avis détaillés négatifs et vérifiés :

```javascript
db.review_details.find({
  verified_visit: true,
  sentiment: "negative"
})
```

Ces requêtes préparent aussi la réflexion sur les index : les champs utilisés souvent dans les filtres ou les tris sont les premiers candidats à observer avec `explain()`.

## Quand penser index ?

Quand une collection contient peu de documents, MongoDB peut parcourir toute la collection sans que cela se voie vraiment. Mais plus le volume augmente, plus certaines requêtes deviennent coûteuses : filtre par cuisine, tri par note, historique de commandes, recherche par tag, etc.

Un index sert à éviter de relire tous les documents quand MongoDB peut s'appuyer sur un champ déjà organisé pour la recherche.

On peut le comparer à l'index d'un livre : pour trouver un sujet, on ne relit pas toutes les pages, on consulte une structure qui pointe vers les pages utiles.

En MongoDB, un index est une structure de données maintenue par la base sur un ou plusieurs champs.

Important : un index ne réordonne pas physiquement les documents dans la collection. Il crée une structure séparée, triée par champ indexé, qui pointe vers les documents.

Exemple mental :

```text
Collection restaurants :
[doc A] [doc B] [doc C]

Index sur ratings.overall :
18.5 -> doc C
20.7 -> doc A
24.0 -> doc B
```

Sans index, MongoDB peut devoir parcourir toute la collection : c'est un `COLLSCAN`.
Avec un index adapté, MongoDB parcourt une structure triée avant de lire les documents utiles : c'est un `IXSCAN`.

- `COLLSCAN` signifie collection scan : MongoDB lit les documents de la collection un par un.
- `IXSCAN` signifie index scan : MongoDB parcourt un index pour trouver plus vite les documents utiles.

Une requête fréquente mérite probablement un index si elle filtre ou trie sur :

- `restaurant_id` ;
- `cuisine` ;
- `price_tier` ;
- `ratings.overall` ;
- `tags` ;
- `sentiment` ;
- `reviewed_at`.

Exemples d'index simples :

```javascript
db.restaurants.createIndex({ "ratings.overall": -1 })
db.restaurants.createIndex({ cuisine: 1, price_tier: 1 })
db.restaurants.createIndex({ tags: 1 })
db.review_details.createIndex({ restaurant_id: 1, reviewed_at: -1 })
```

Par défaut, un index n'impose pas l'unicité. Il sert seulement à accélérer certaines recherches ou certains tris.

Exemple :

```javascript
db.restaurants.createIndex({ cuisine: 1 })
```

Cet index aide les requêtes sur `cuisine`, mais plusieurs restaurants peuvent évidemment avoir `cuisine: "Italian"`.

Pour interdire les doublons sur un champ, il faut créer un index unique :

```javascript
db.restaurants.createIndex(
  { restaurant_id: 1 },
  { unique: true }
)
```

Avec cet index, MongoDB refuse deux documents qui auraient le même `restaurant_id`. Si une insertion crée un doublon, MongoDB renvoie une erreur de type `E11000 duplicate key error`.

À retenir :

- `_id` est unique automatiquement ;
- un index sans `{ unique: true }` accélère les requêtes, mais autorise les doublons ;
- un index avec `{ unique: true }` accélère les requêtes et impose l'unicité ;
- `getIndexes()` permet de voir les index existants et de repérer ceux qui sont uniques.

Un index accélère certaines lectures, mais il a un coût :

- il occupe de l'espace disque ;
- il doit être mis à jour à chaque insertion, modification ou suppression ;
- il ne sert que si sa structure correspond aux filtres et tris utilisés.

## Vérifier un index avec `explain()`

On ne valide pas un index seulement parce qu'il existe. On vérifie le plan d'exécution avec `explain("executionStats")`.

Exemple : on veut savoir comment MongoDB exécute une recherche sur la cuisine et le niveau de prix.

```javascript
db.restaurants.find({
  cuisine: "French",
  price_tier: "$$"
}).explain("executionStats")
```

Si le résultat contient `COLLSCAN`, MongoDB parcourt la collection. On peut alors tester un index adapté aux champs filtrés :

```javascript
db.restaurants.createIndex({ cuisine: 1, price_tier: 1 })

db.restaurants.find({
  cuisine: "French",
  price_tier: "$$"
}).explain("executionStats")
```

Après création de l'index, on cherche plutôt `IXSCAN` dans le plan. `explain()` retourne beaucoup d'informations : dans ce cours, on se concentre seulement sur quelques indicateurs pratiques.

Questions à se poser :

1. Est-ce que MongoDB lit la collection (`COLLSCAN`) ou un index (`IXSCAN`) ?
2. Combien de documents sont examinés avec `totalDocsExamined` ?
3. Combien de documents sont réellement retournés avec `nReturned` ?
4. Est-ce que `executionTimeMillis` baisse après la création d'un index pertinent ?

| Champ | Sens |
|---|---|
| `COLLSCAN` | MongoDB parcourt la collection. À surveiller sur gros volume. |
| `IXSCAN` | MongoDB utilise un index. |
| `totalDocsExamined` | Nombre de documents lus. |
| `nReturned` | Nombre de documents retournés par la requête. |
| `totalKeysExamined` | Nombre d'entrées d'index parcourues. |
| `executionTimeMillis` | Temps mesuré pour la requête. |

Objectif pratique : pour une requête sélective, on veut souvent que `totalDocsExamined` soit proche de `nReturned`, ou au moins très inférieur à la taille totale de la collection.

## Index composés

Un index composé contient plusieurs champs. L'ordre des champs est important.

```javascript
db.restaurants.createIndex({
  cuisine: 1,
  price_tier: 1,
  "ratings.overall": -1
})
```

Cet index est adapté à une requête qui filtre par `cuisine`, filtre par `price_tier`, puis trie ou compare la note globale.

Un index composé est trié dans l'ordre des champs déclarés.

Exemple avec quelques documents :

| Restaurant | `cuisine` | `price_tier` |
|---|---|---|
| A | French | `$$$` |
| B | Italian | `$$` |
| C | French | `$` |
| D | Japanese | `$$` |
| E | French | `$$` |

Index `{ cuisine: 1, price_tier: 1 }` :

| Ordre dans l'index | `cuisine` | `price_tier` | Restaurant |
|---|---|---|---|
| 1 | French | `$` | C |
| 2 | French | `$$` | E |
| 3 | French | `$$$` | A |
| 4 | Italian | `$$` | B |
| 5 | Japanese | `$$` | D |

Index `{ price_tier: 1, cuisine: 1 }` :

| Ordre dans l'index | `price_tier` | `cuisine` | Restaurant |
|---|---|---|---|
| 1 | `$` | French | C |
| 2 | `$$` | French | E |
| 3 | `$$` | Italian | B |
| 4 | `$$` | Japanese | D |
| 5 | `$$$` | French | A |

À retenir : les deux index utilisent les mêmes champs, mais ils ne rangent pas les entrées de la même manière. MongoDB peut donc les exploiter différemment selon les filtres et les tris.

Règle pratique :

1. Placer d'abord les champs d'égalité fréquents.
2. Ajouter ensuite les champs de plage ou de tri.
3. Éviter de créer des index composés pour des requêtes rares.

Exemple sur les commandes :

```javascript
db.orders.createIndex({
  restaurant_id: 1,
  status: 1,
  created_at: -1
})
```

Cet index aide une requête du type :

```javascript
db.orders.find({
  restaurant_id: "NYC-ZAGAT-0001",
  status: "paid"
}).sort({ created_at: -1 })
```

## Index multikey sur les tableaux

Quand un index porte sur un champ tableau, MongoDB crée automatiquement un index multikey.

Dans le dataset, `restaurants.tags` est un tableau :

```javascript
db.restaurants.createIndex({ tags: 1 })
```

Il peut accélérer :

```javascript
db.restaurants.find({ tags: "top_food" })
db.restaurants.find({ tags: { $all: ["top_food", "great_service"] } })
```

Un index multikey est utile, mais il faut éviter d'en créer beaucoup sans besoin clair, surtout sur de gros tableaux.

## Index géospatial `2dsphere`

Le sandbox contient une collection `neighborhoods` avec un champ GeoJSON `center`.

Exemple de document :

```javascript
{
  name: "Midtown",
  borough: "Manhattan",
  center: {
    type: "Point",
    coordinates: [-73.9855, 40.7580]
  }
}
```

Un index géospatial est créé sur ce champ :

```javascript
db.neighborhoods.createIndex({ center: "2dsphere" })
```

Il permet des requêtes spatiales, par exemple chercher les quartiers proches d'un point :

```javascript
db.neighborhoods.find({
  center: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.9855, 40.7580] },
      $maxDistance: 5000
    }
  }
})
```

Point important : en GeoJSON, les coordonnées sont dans l'ordre longitude puis latitude.

Dans ce sandbox, l'index géospatial concerne `neighborhoods.center`. Les restaurants du dataset OpenIntro/Zagat n'ont pas de coordonnées précises, donc les exercices principaux restent centrés sur les index classiques : champs simples, champs imbriqués, tableaux et index composés.

## Message clé

`find` permet de poser des questions précises à une collection. La difficulté n'est pas seulement syntaxique : il faut savoir où se trouvent les champs, quels opérateurs utiliser et quels filtres justifient un index.
