# Correction TP 04 - Index et performance

## Préparation

Les collections de volume sont créées automatiquement au premier lancement d'un volume MongoDB vide.

Choisir un restaurant existant :

```javascript
const restaurantId = db.restaurants.findOne({}, { restaurant_id: 1 }).restaurant_id
```

## 1. Relever les performances sans index pertinent

Exemple de requête :

```javascript
db.orders.find({
  restaurant_id: restaurantId,
  status: "paid"
}).sort({ created_at: -1 }).explain("executionStats")
```

Points à relever :

- `executionStats.executionTimeMillis` ;
- `executionStats.totalDocsExamined` ;
- `executionStats.totalKeysExamined` ;
- présence éventuelle d'un `COLLSCAN`.

## 2. Proposer un index composé

```javascript
db.orders.createIndex({ restaurant_id: 1, status: 1, created_at: -1 })
```

## 3. Justifier l'ordre des champs

Ordre proposé :

1. `restaurant_id` : filtre d'égalité principal ;
2. `status` : filtre d'égalité secondaire ;
3. `created_at` : champ utilisé pour trier les résultats récents.

Cet ordre permet à MongoDB de filtrer puis de fournir les résultats déjà ordonnés.

## 4. Comparer avant/après

Relancer :

```javascript
db.orders.find({
  restaurant_id: restaurantId,
  status: "paid"
}).sort({ created_at: -1 }).explain("executionStats")
```

Après index, on attend généralement :

- moins de documents examinés ;
- utilisation d'un stage `IXSCAN` ;
- temps d'exécution plus faible ;
- tri plus efficace.

## 5. Optimiser une agrégation qui commence par `$match`

Pipeline :

```javascript
db.orders.aggregate([
  { $match: { status: "paid", created_at: { $gte: ISODate("2025-06-01") } } },
  {
    $group: {
      _id: "$restaurant_id",
      revenue: { $sum: "$amount" },
      orders: { $sum: 1 }
    }
  },
  { $sort: { revenue: -1 } },
  { $limit: 10 }
]).explain("executionStats")
```

Index utile :

```javascript
db.orders.createIndex({ status: 1, created_at: -1, restaurant_id: 1 })
```

Justification :

- `$match` filtre d'abord sur `status` ;
- puis sur une plage de dates ;
- `restaurant_id` est utilisé ensuite dans le regroupement.

## 6. Identifier un index inutile ou redondant

Lister les index :

```javascript
db.orders.getIndexes()
```

Exemple de redondance possible :

```javascript
{ restaurant_id: 1 }
```

peut être redondant si l'index suivant existe déjà :

```javascript
{ restaurant_id: 1, created_at: -1 }
```

Mais il faut vérifier les requêtes réelles avant de supprimer un index.

## Bonus : index géospatial

Créer l'index :

```javascript
db.neighborhoods.createIndex({ center: "2dsphere" })
```

Tester :

```javascript
db.neighborhoods.find({
  center: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.9855, 40.7580] },
      $maxDistance: 5000
    }
  }
}).explain("executionStats")
```

Le champ `center` contient un point GeoJSON. Les coordonnées sont dans l'ordre longitude puis latitude. Les restaurants du dataset n'ont pas de champ géographique précis, donc l'exemple géospatial se fait sur `neighborhoods`.
