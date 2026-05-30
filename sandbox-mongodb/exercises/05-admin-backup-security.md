# TP 05 - Administration, backup et sécurité

## Objectifs

- Créer des utilisateurs avec des droits limités.
- Sauvegarder et restaurer une base.
- Comprendre les premiers réflexes d'administration.

## Utilisateurs

Depuis `mongosh` connecté en root :

```javascript
use nyc_food
db.createUser({
  user: "readonly",
  pwd: "readonlypass",
  roles: [{ role: "read", db: "nyc_food" }]
})
```

Tester la connexion :

```bash
docker compose exec mongodb mongosh "mongodb://readonly:readonlypass@localhost:27017/nyc_food"
```

Vérifier qu'une lecture fonctionne :

```javascript
db.restaurants.findOne()
```

Vérifier qu'une écriture échoue :

```javascript
db.restaurants.insertOne({ test: true })
```

## Sauvegarde

```bash
docker compose exec mongodb mongodump \
  --uri="mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" \
  --out=/tmp/backup
```

## Restauration

Supprimer une collection de test :

```javascript
db.restaurant_kpis.drop()
```

Restaurer :

```bash
docker compose exec mongodb mongorestore \
  --uri="mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin" \
  --drop /tmp/backup/nyc_food
```

## Exercices

1. Créer un utilisateur applicatif qui peut lire et écrire dans `nyc_food`.
2. Créer un utilisateur lecture seule.
3. Sauvegarder la base.
4. Supprimer une collection non critique.
5. Restaurer la base.
6. Expliquer pourquoi un compte root ne doit pas être utilisé par une application.

