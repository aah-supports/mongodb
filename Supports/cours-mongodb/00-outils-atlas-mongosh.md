# Cours - Outils : Docker, Atlas et mongosh

## Objectifs

À la fin de cette partie, l'apprenant doit savoir :

- identifier le rôle de Docker Compose, MongoDB Atlas et `mongosh` ;
- démarrer un environnement MongoDB local ;
- se connecter à MongoDB avec `mongosh` ;
- comprendre la différence entre un MongoDB local et un cluster Atlas.

## Starter : commandes utiles

Depuis la racine du dépôt :

```bash
cd sandbox-mongodb
docker compose up -d
docker compose ps
```

- `docker compose up -d` lance MongoDB et Mongo Express en arrière-plan.
- Au premier lancement avec un volume MongoDB vide, les collections du cours sont créées automatiquement.
- `docker compose ps` vérifie que les conteneurs sont actifs.
- Le sandbox utilise MongoDB 8, la version stable longue durée retenue pour le cours.

Connexion à `mongosh` :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin"
```

Cette commande ouvre le shell directement sur la base `nyc_food`.

Connexion à Mongo Express :

```text
http://localhost:8083
```

Mongo Express sert à vérifier rapidement les collections et quelques documents depuis le navigateur.
Pour les imports du cours, on utilise `mongoimport` en ligne de commande : c'est plus fiable, répétable et documentable qu'une action faite dans une interface web.

## Les outils du cours

| Outil | Rôle |
|---|---|
| Docker Compose | Lance un environnement MongoDB local identique pour tous les apprenants. |
| MongoDB 8 | Serveur de base de données NoSQL orienté documents, version stable longue durée utilisée dans le sandbox. |
| mongosh | Shell officiel MongoDB utilisé pour écrire les commandes du cours. |
| MongoDB Atlas | Service cloud officiel MongoDB, utilisé pour présenter les usages managés. |
| Mongo Express | Interface web légère fournie dans le sandbox pour vérifier rapidement les données. |
| `mongoimport` | Outil reproductible pour importer des fichiers JSON, CSV ou TSV. |

## Mongo Express et imports

Mongo Express est utile pour :

- vérifier que les collections existent ;
- lire quelques documents ;
- contrôler rapidement des compteurs ;
- faire de petites manipulations ponctuelles.

Pour charger ou recréer des collections dans le cours, on privilégie `mongoimport`.

```bash
docker compose exec -T mongodb mongoimport \
  --username root --password rootpass --authenticationDatabase admin \
  --db nyc_food --collection restaurants \
  --file /tmp/nyc-food/restaurants.json --jsonArray --drop
```

`mongoimport` est l'outil général à retenir pour importer des données structurées dans MongoDB. Il sait charger du JSON, du CSV et du TSV.

## Pourquoi utiliser Docker Compose ?

Docker Compose permet de fournir le même environnement à tous :

- même version de MongoDB ;
- mêmes ports ;
- mêmes identifiants ;
- mêmes scripts d'initialisation ;
- même dataset.

Dans ce cours, Docker Compose est utilisé pour éviter les écarts d'installation entre les machines.

## Démarrer MongoDB

Depuis le dossier `sandbox-mongodb` :

```bash
docker compose up -d
```

Vérifier que les conteneurs sont lancés :

```bash
docker compose ps
```

MongoDB est disponible sur :

```text
mongodb://root:rootpass@localhost:27017
```

La base de travail s'appelle :

```text
nyc_food
```

## Se connecter avec mongosh

Connexion à la base de cours :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin"
```

Une fois connecté, vérifier la base courante :

```javascript
db
```

Lister les bases :

```javascript
show dbs
```

Lister les collections :

```javascript
show collections
```

Quitter `mongosh` :

```javascript
exit
```

## MongoDB Atlas

Atlas est la version cloud managée de MongoDB. Il permet de créer un cluster MongoDB sans installer de serveur local.

Dans un contexte professionnel, Atlas apporte notamment :

- création de clusters ;
- gestion des utilisateurs ;
- autorisation réseau par adresse IP ;
- chaînes de connexion `mongodb+srv` ;
- sauvegardes selon le type de cluster ;
- monitoring ;
- réplication et haute disponibilité selon l'offre choisie.

## Créer un compte Atlas

Étapes générales :

1. Aller sur `https://www.mongodb.com/atlas`.
2. Créer un compte.
3. Créer un projet.
4. Créer un cluster gratuit ou Flex selon les options disponibles.
5. Créer un utilisateur de base de données.
6. Autoriser son adresse IP dans `Network Access`.
7. Récupérer la chaîne de connexion depuis `Connect`.

Exemple de chaîne de connexion Atlas :

```text
mongodb+srv://<user>:<password>@<cluster-url>/nyc_food
```

## Local ou Atlas ?

| Besoin | Environnement recommandé |
|---|---|
| TP en classe | Docker local |
| Reproductibilité | Docker local |
| Découverte du cloud MongoDB | Atlas |
| Monitoring managé | Atlas |
| Sauvegarde/restauration sans risque | Docker local |
| Démonstration production | Atlas |

## Message clé

Le cours utilise principalement Docker et `mongosh` pour pratiquer. Atlas sert à comprendre comment MongoDB est utilisé dans un environnement cloud managé.
