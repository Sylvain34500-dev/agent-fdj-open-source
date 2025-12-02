# 🎯 Agent FDJ – Open Source Betting Agent

Cet agent a pour objectif de récupérer, analyser et publier automatiquement les cotes de la FDJ en open source.  
Il extrait les données, calcule les probabilités, l’EV (Expected Value), le Kelly et sélectionne automatiquement les meilleurs paris détectés.

Toutes les données sont rendues publiques afin d’être réutilisables par des outils tiers, bots Discord, applications web, dashboards statistiques, etc.

---

## 🚀 Fonctionnalités

- 🔄 **Récupération automatique des cotes FDJ**
- 📊 **Analyse des probabilités :**
  - Probabilités implicites (implied odds)
  - Probabilités modèle (1/odds^alpha)
  - Expected Value (EV)
  - Fraction de Kelly
- 🎯 **Sélection automatique des meilleurs paris (value bets)**
- 📝 **Génération automatique de :**
  - `odds_fdj.json` (cotes brutes)
  - `picks.json` (picks triés + EV + Kelly)
- 🤖 **Exécution automatique via GitHub Actions**
- 📆 **Mise à jour régulière des données**
- 🪙 **Fichier `daily_bets.txt` pour publier les paris du jour**

---

## 📂 Structure du projet

```text
agent-fdj-open-source/
├── index.js               # Analyse des cotes + calcul EV + Kelly + génération picks.json
├── fetch_and_score.js     # Récupération API + scoring des matches
├── daily_bets.js          # Formattage automatique des paris du jour
├── daily_bets.yml         # Workflow GitHub pour publier daily_bets.txt
├── odds_fdj.json          # Exemple de fichier de cotes
├── picks.json             # Fichier généré automatiquement
├── daily_bets.txt         # Picks mis en forme (généré automatiquement)
├── config.json            # Configuration : min EV, Kelly, paramètres modèle…
│
├── .github/
│   └── workflows/
│       ├── main.yml       # Exécution automatique (récupération + analyse des cotes)
│       └── daily_bets.yml # Publication quotidienne des paris
│
├── package.json           # Dépendances Node.js
└── README.md              # Documentation du projet
