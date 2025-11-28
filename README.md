# Agent FDJ Open Source

Ce projet a pour objectif de fournir un agent automatisé capable de récupérer, analyser et publier les cotes de la FDJ en open source.  
Il permet d’extraire les données officielles mises à disposition publiquement, puis de les mettre en forme dans un fichier JSON exploitable par des applications tierces.

## Fonctionnalités

- Récupération des cotes en temps réel
- Génération d’un fichier `odds_fdj.json`
- Exécution automatique via GitHub Actions
- Mise à jour régulière des données

## Structure du projet

agent-fdj-open-source/
│
├── index.js           # Script principal qui récupère et analyse les cotes
├── odds_fdj.json      # Exemple de données de cotes (à remplacer par vos sources réelles)
├── picks.json         # Fichier JSON généré automatiquement par GitHub Actions
├── package.json       # Dépendances du projet
│
└── .github/
    └── workflows/
        └── main.yml   # Workflow GitHub Actions exécuté automatiquement

