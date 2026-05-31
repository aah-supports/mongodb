# Progression Pédagogique - MongoDB NoSQL

## Intention

La formation suit une logique de problème concret : une équipe doit exploiter un vrai dataset de notations clients de restaurants new-yorkais, l'adapter à un modèle documentaire, l'enrichir avec des commandes, avis détaillés et événements générés pour simuler le volume, puis rendre la base exploitable en conditions proches production.

Le fil directeur est volontairement pratique :

```text
Installer les outils -> Créer une base -> Comprendre le schéma -> Importer le dataset -> Explorer -> Rechercher -> Agréger -> Massifier -> Optimiser -> Administrer -> Restituer
```

## Jour 1 - Installer, Comprendre, Rechercher

Objectif : rendre les apprenants autonomes sur l'environnement et les requêtes `find`.

Progression :

1. Installation et rôle des outils : Docker Compose, Atlas, `mongosh`.
2. Démarrage du sandbox local avec Docker Compose.
3. Connexion avec `mongosh`.
4. Vérification des collections créées automatiquement au démarrage.
5. Présentation du jeu de données : source, champs, limites, notes agrégées.
6. Création d'une base, d'une collection et d'un premier document.
7. Notion de schéma : flexible, implicite, applicatif, validation.
8. Lecture du modèle document JSON/BSON.
9. Comparaison entre collection brute et collections transformées.
10. Cours guidé sur `mongosh`.
11. Cours `find` : filtres, projections, tri, limites, champs imbriqués.
12. Requêtes `find` simples et avancées sur le dataset.
13. Première réflexion de modélisation : document imbriqué ou référence.

TP principaux :

- Démarrer le sandbox.
- Se connecter avec `mongosh`.
- Vérifier les données de notation initialisées dans le sandbox.
- Créer une base et une collection de démonstration.
- Comprendre la notion de schéma flexible.
- Décrire le jeu de données et ses collections.
- Explorer les collections.
- Écrire des requêtes `find` métier.
- Identifier les champs utiles pour les futurs index.

Compétence visée : interroger une base MongoDB et comprendre la structure documentaire.

## Jour 2 - Agréger, Analyser, Optimiser

Objectif : faire de `aggregate` le cœur de l'analyse de données.

Progression :

1. Limites de `find` pour répondre à des questions analytiques.
2. Cours `aggregate` : logique de pipeline.
3. Construction progressive d'un pipeline.
4. Stages essentiels : `$match`, `$project`, `$group`, `$sort`, `$limit`.
5. Stages de structuration : `$unwind`, `$lookup`, `$merge`.
6. Analyse des restaurants, avis clients, commandes et événements.
7. Génération de volume.
8. Mesure avec `explain()`.
9. Indexation et comparaison avant/après.

TP principaux :

- Construire des indicateurs de satisfaction client.
- Calculer revenus, paniers moyens et volumes de commandes.
- Relier commandes et restaurants avec `$lookup`.
- Créer une collection matérialisée de KPI.
- Optimiser les requêtes lentes.

Compétence visée : produire une analyse robuste avec `aggregate` et justifier des index.

## Jour 3 - Administrer et synthétiser

Objectif : passer d'une base de TP à une base exploitable et défendable.

Progression :

1. Droits et utilisateurs.
2. Sauvegarde et restauration.
3. Découverte Atlas : cluster cloud, IP allowlist, utilisateurs, chaîne de connexion.
4. Principes de réplication et disponibilité.
5. Monitoring simple et réflexes d'administration.
6. Mini-projet final.

TP principaux :

- Créer un compte lecture seule.
- Créer un compte applicatif limite.
- Sauvegarder et restaurer la base.
- Se connecter à un cluster Atlas ou analyser une démonstration Atlas.
- Finaliser un mini-projet : modèle, requêtes, agrégations, index, sécurité.

Compétence visée : administrer une base MongoDB et restituer des choix techniques.

## Évaluation

- 60% mini-projet pratique.
- 40% QCM ou court examen théorique.

Livrable du mini-projet :

- Modèle documentaire justifié.
- 5 requêtes `find` utiles.
- 4 pipelines `aggregate`.
- 3 index avec preuve `explain()`.
- Une sauvegarde/restauration.
- Une gestion minimale des droits.

