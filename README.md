# MongoDB Introduction

Support de cours et sandbox Docker pour pratiquer MongoDB avec une base `nyc_food`.

## Démarrer le sandbox

Depuis la racine du dépôt :

```bash
cd sandbox-mongodb
docker compose up -d
docker compose ps
```

Au premier lancement avec un volume MongoDB vide, les collections du cours sont créées automatiquement.

## Accès

Mongo Express :

```text
http://localhost:8083
```

`mongosh` :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin"
```

Vérification rapide dans `mongosh` :

```javascript
show collections
db.restaurants.countDocuments()
db.orders.countDocuments()
db.events.countDocuments()
```

## Réinitialiser complètement la base

```bash
cd sandbox-mongodb
docker compose down -v
docker compose up -d
docker compose ps
```

`down -v` supprime les conteneurs et le volume MongoDB. Au redémarrage, MongoDB recrée une base propre et recharge les collections.

## Images, build et nettoyage Docker

Ce projet ne construit pas d'image Docker locale.

Le fichier `docker-compose.yml` utilise directement des images prêtes à l'emploi :

- `mongo:8.0`
- `mongo-express:1.0.2`

Il n'y a pas de `Dockerfile` ni de section `build:`. Donc les commandes suivantes ne sont pas nécessaires :

```bash
docker compose build
docker compose up -d --build
```

Docker Desktop conserve quand même les images téléchargées. C'est normal : elles sont réutilisées au prochain démarrage.

Nettoyer les images est optionnel et généralement inutile pour le cours. Cela force Docker à retélécharger les images ensuite.

## Import de secours

Le chemin normal est l'initialisation automatique au lancement des conteneurs. Si les collections de base doivent être recréées manuellement, utiliser les commandes `mongoimport --drop` documentées dans `sandbox-mongodb/README.md`.
