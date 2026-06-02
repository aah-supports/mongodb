# Sandbox API - Express Node et MongoDB 8

Sandbox minimale pour travailler la frontière entre une API HTTP et MongoDB.

Elle contient :

- MongoDB 8 ;
- une base `nyc_food` ;
- une collection `restaurants` ;
- une API Express Node ;
- un schéma Zod dans `api/src/schemas.js` pour valider les paramètres HTTP ;
- un seul endpoint : `GET /api/restaurants`.

## Démarrage

Depuis ce dossier :

```bash
docker compose build api
docker compose up -d
docker compose ps
```

API :

```text
http://localhost:3001/api/restaurants
```

MongoDB :

```text
mongodb://root:rootpass@localhost:27018
```

## Tester l'endpoint

```bash
curl "http://localhost:3001/api/restaurants"
curl "http://localhost:3001/api/restaurants?limit=5"
curl "http://localhost:3001/api/restaurants?limit=5&minOverall=22"
curl "http://localhost:3001/api/restaurants?cuisine=Italian&limit=3"
```

## Mise à jour propre

Arrêter sans supprimer les données :

```bash
docker compose down
```

Récupérer les changements et relancer :

```bash
git pull
docker compose build api
docker compose up -d
docker compose ps
```

Ne pas utiliser `docker compose down -v` sauf si l'on veut supprimer le volume MongoDB et réinitialiser les données.
