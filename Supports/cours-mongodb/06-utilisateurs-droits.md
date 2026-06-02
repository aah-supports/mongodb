# Cours - Utilisateurs, rôles et droits

## Objectifs

À la fin de cette partie, l'apprenant doit savoir :

- distinguer utilisateur MongoDB et utilisateur applicatif ;
- comprendre la différence entre authentification et autorisation ;
- créer un utilisateur avec un rôle limité ;
- choisir un compte adapté pour une application ;
- tester concrètement qu'un droit manque.

## Pourquoi gérer les droits ?

Une base MongoDB ne devrait pas être utilisée par toutes les applications avec un compte administrateur.

Dans le sandbox, il existe deux types de comptes :

- `root` : compte administrateur du serveur MongoDB ;
- `student` : compte applicatif limité à la base `nyc_food`.

Le compte `root` sert à administrer le serveur. Il peut créer des utilisateurs, modifier les droits, importer des données et intervenir sur plusieurs bases.

Le compte `student` sert à travailler dans la base du cours. Il a uniquement le rôle `readWrite` sur `nyc_food`.

## Authentification et autorisation

L'authentification répond à la question :

> Qui es-tu ?

Exemple :

```text
student / studentpass
```

L'autorisation répond à la question :

> As-tu le droit d'exécuter cette action ?

Exemple :

- lire `restaurants` ;
- insérer dans `reviews` ;
- créer un index ;
- créer un nouvel utilisateur.

Un utilisateur peut être correctement authentifié, mais ne pas avoir le droit d'exécuter une commande.

## Base cible et base d'authentification

Dans une URI MongoDB, il faut distinguer :

- la base cible ;
- la base qui contient l'utilisateur.

Exemple :

```text
mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin
```

Ici :

- `root` est l'utilisateur ;
- `rootpass` est le mot de passe ;
- `nyc_food` est la base cible ;
- `authSource=admin` indique que l'utilisateur `root` est défini dans la base `admin`.

Sans `authSource=admin`, MongoDB peut chercher l'utilisateur dans la mauvaise base.

## Les utilisateurs du sandbox

Le compte administrateur est créé par Docker Compose :

```yaml
environment:
  MONGO_INITDB_ROOT_USERNAME: root
  MONGO_INITDB_ROOT_PASSWORD: rootpass
```

Le compte applicatif est créé dans le script d'initialisation :

```javascript
db = db.getSiblingDB("nyc_food");

db.createUser({
  user: "student",
  pwd: "studentpass",
  roles: [{ role: "readWrite", db: "nyc_food" }]
});
```

Ce compte peut lire et écrire dans `nyc_food`, mais il n'est pas administrateur du serveur.

## Rôles intégrés utiles

MongoDB fournit des rôles prêts à l'emploi.

Les plus utiles au début :

- `read` : lire les données d'une base ;
- `readWrite` : lire et écrire les données d'une base ;
- `dbAdmin` : administrer une base, par exemple les index ou statistiques ;
- `userAdmin` : gérer les utilisateurs d'une base ;
- `root` : tout pouvoir sur l'instance.

Le principe important :

> Une application doit recevoir le plus petit niveau de droit suffisant.

Si une API ne fait que lire des restaurants, un rôle `read` suffit.

Si une API crée des commandes, un rôle `readWrite` sur la base concernée est plus adapté.

## Créer un utilisateur lecture seule

Se connecter avec le compte administrateur :

```bash
docker compose exec mongodb mongosh "mongodb://root:rootpass@localhost:27017/nyc_food?authSource=admin"
```

Créer un utilisateur en lecture seule sur `nyc_food` :

```javascript
db.createUser({
  user: "alan",
  pwd: "pass",
  roles: [{ role: "read", db: "nyc_food" }]
});
```

Se reconnecter avec ce compte depuis le poste hôte :

```bash
docker compose exec mongodb mongosh "mongodb://alan:pass@localhost:27017/nyc_food"
```

Ou, si l'on est déjà dans le prompt du conteneur MongoDB :

```bash
mongosh -u alan -p pass \
  --authenticationDatabase nyc_food \
  nyc_food
```

Lire fonctionne :

```javascript
db.restaurants.findOne()
```

Écrire doit échouer :

```javascript
db.restaurants.insertOne({
  restaurant_id: "TEST-READONLY",
  name: "Read Only Test"
})
```

L'erreur attendue indique que l'utilisateur n'a pas le privilège nécessaire pour insérer.

## Créer un utilisateur lecture-écriture

Un rôle `readWrite` permet de lire et modifier les données d'une base.

Exemple : créer un utilisateur applicatif capable de lire les restaurants et d'écrire dans les collections de la base `nyc_food`.

```javascript
db.createUser({
  user: "api_writer",
  pwd: "apiwriterpass",
  roles: [{ role: "readWrite", db: "nyc_food" }]
});
```

Connexion avec ce compte :

```bash
docker compose exec mongodb mongosh "mongodb://api_writer:apiwriterpass@localhost:27017/nyc_food"
```

Lire fonctionne :

```javascript
db.restaurants.findOne()
```

Écrire fonctionne aussi :

```javascript
db.reviews.insertOne({
  restaurant_id: "NYC-ZAGAT-0001",
  source: "manual-test",
  comment: "Test avec un utilisateur readWrite"
})
```

En revanche, ce compte ne devient pas administrateur. Il ne devrait pas pouvoir créer d'autres utilisateurs :

```javascript
db.createUser({
  user: "should_fail",
  pwd: "test",
  roles: [{ role: "read", db: "nyc_food" }]
})
```

Ici, l'échec est normal : écrire des documents et administrer les utilisateurs sont deux responsabilités différentes.

## Administrer les droits plus finement

Les rôles intégrés (`read`, `readWrite`, `dbAdmin`, etc.) sont pratiques, mais parfois trop larges.

Par exemple, `readWrite` donne le droit d'écrire dans toutes les collections de la base. Si une API doit seulement :

- lire `restaurants` ;
- lire `reviews` ;
- écrire uniquement dans `reviews` ;
- ne jamais écrire dans `restaurants` ;

alors un rôle personnalisé est plus précis.

Exemple de rôle personnalisé :

```javascript
db.createRole({
  role: "reviews_writer",
  privileges: [
    {
      resource: { db: "nyc_food", collection: "restaurants" },
      actions: ["find"]
    },
    {
      resource: { db: "nyc_food", collection: "reviews" },
      actions: ["find", "insert", "update"]
    }
  ],
  roles: []
});
```

Puis on assigne ce rôle à un utilisateur :

```javascript
db.createUser({
  user: "api_reviews",
  pwd: "apireviewspass",
  roles: [{ role: "reviews_writer", db: "nyc_food" }]
});
```

Ce compte peut lire `restaurants`, lire et modifier `reviews`, mais il n'a pas le droit d'écrire dans `restaurants`.

On peut aussi modifier un utilisateur existant :

```javascript
db.grantRolesToUser("alan", [
  { role: "readWrite", db: "nyc_food" }
])
```

Ou retirer un rôle :

```javascript
db.revokeRolesFromUser("alan", [
  { role: "readWrite", db: "nyc_food" }
])
```

Ce niveau de finesse est utile quand plusieurs applications partagent la même base mais n'ont pas les mêmes responsabilités.

## Lien avec l'application Express

L'API Express du sandbox se connecte avec l'utilisateur `student` :

```yaml
MONGODB_URI: mongodb://student:studentpass@mongodb:27017/nyc_food
```

Ce choix est volontaire :

- l'application n'utilise pas `root` ;
- les droits sont limités à la base `nyc_food` ;
- le code applicatif ne porte pas un compte administrateur.

Dans une application réelle, on créerait souvent un compte par application ou par service.

Exemples :

- `api_readonly` avec `read` si l'API ne lit que les données ;
- `api_orders` avec `readWrite` sur la base métier ;
- `api_reviews` avec un rôle personnalisé qui écrit seulement dans `reviews` ;
- `admin_backup` avec des droits spécifiques pour les sauvegardes.

## Tester les droits

Lister les utilisateurs de la base courante :

```javascript
db.getUsers()
```

Afficher l'utilisateur connecté :

```javascript
db.runCommand({ connectionStatus: 1 })
```

Vérifier les droits d'un utilisateur ne se fait pas seulement en lisant sa fiche. Le plus parlant est de tester une action autorisée, puis une action interdite.

Exemple avec `alan` :

```javascript
db.restaurants.findOne()
db.restaurants.insertOne({ name: "Forbidden write" })
```

La première commande doit réussir. La seconde doit échouer.

## Bonnes pratiques

À retenir :

- ne pas utiliser `root` dans une application ;
- créer un utilisateur dédié à chaque application ;
- donner uniquement les droits nécessaires ;
- séparer les comptes de lecture, d'écriture et d'administration ;
- éviter de stocker les mots de passe directement dans le code ;
- utiliser des variables d'environnement pour les URI de connexion ;
- changer les mots de passe par défaut hors sandbox.

Dans ce cours, les mots de passe sont simples parce que l'objectif est pédagogique et local. En production, ce serait insuffisant.

## Résumé

Un utilisateur MongoDB sert à s'authentifier. Ses rôles définissent ensuite ce qu'il peut faire.

Dans le sandbox :

- `root` administre MongoDB ;
- `student` est le compte applicatif de démonstration ;
- l'utilisateur `alan` permet de tester concrètement la différence entre lire et écrire ;
- un utilisateur `api_writer` illustre le rôle `readWrite` ;
- un rôle personnalisé permet de limiter les droits à certaines collections et actions.

La règle pratique est simple : une application ne doit pas se connecter avec un compte plus puissant que nécessaire.
