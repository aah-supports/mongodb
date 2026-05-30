# Correction TP 05 - Administration, backup et sécurité

## 1. Créer un utilisateur applicatif

Depuis une connexion root :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin"
```

Créer l'utilisateur :

```javascript
use nyc_food

db.createUser({
  user: "app_user",
  pwd: "apppass",
  roles: [{ role: "readWrite", db: "nyc_food" }]
})
```

Tester la connexion :

```bash
docker compose exec mongodb mongosh "mongodb://app_user:apppass@localhost:27017/nyc_food"
```

Test lecture :

```javascript
db.restaurants.findOne()
```

Test écriture :

```javascript
db.admin_test.insertOne({ created_at: new Date(), source: "app_user" })
```

## 2. Créer un utilisateur lecture seule

Depuis root :

```javascript
use nyc_food

db.createUser({
  user: "readonly",
  pwd: "readonlypass",
  roles: [{ role: "read", db: "nyc_food" }]
})
```

Tester :

```bash
docker compose exec mongodb mongosh "mongodb://readonly:readonlypass@localhost:27017/nyc_food"
```

Lecture attendue :

```javascript
db.restaurants.findOne()
```

Écriture attendue en erreur :

```javascript
db.restaurants.insertOne({ test: true })
```

## 3. Sauvegarder la base

```bash
docker compose exec mongodb mongodump \
  --uri="mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" \
  --out=/tmp/backup
```

Vérifier le contenu de la sauvegarde :

```bash
docker compose exec mongodb ls -la /tmp/backup/nyc_food
```

## 4. Supprimer une collection non critique

Créer puis supprimer une collection de test :

```javascript
db.restaurant_kpis.insertOne({ test: true, created_at: new Date() })
db.restaurant_kpis.drop()
```

Vérifier :

```javascript
show collections
```

## 5. Restaurer la base

```bash
docker compose exec mongodb mongorestore \
  --uri="mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" \
  --drop /tmp/backup/nyc_food
```

Vérifier :

```javascript
db.restaurants.countDocuments()
db.inspections.countDocuments()
```

## 6. Pourquoi ne pas utiliser root dans une application ?

Un compte root ne doit pas être utilisé par une application parce qu'il donne trop de droits :

- lecture de toutes les bases ;
- écriture partout ;
- suppression de collections ou bases ;
- gestion des utilisateurs ;
- risque élevé en cas de fuite de mot de passe.

Bonne pratique :

- un compte applicatif par application ;
- droits limités à la base nécessaire ;
- rôle `readWrite` seulement si l'application doit écrire ;
- rôle `read` pour les usages analytiques ou consultation ;
- rotation régulière des secrets.

