const fs = require("fs");

// ------------------------------------------
// LOAD DATA
// ------------------------------------------
const odds = JSON.parse(fs.readFileSync("odds_fdj.json", "utf8"));
const playersStats = fs.readFileSync("players_stats.csv", "utf8");
const injuriesData = fs.readFileSync("injuries.csv", "utf8");

// ------------------------------------------
// PARSE INJURIES
// ------------------------------------------
function loadInjuries() {
    const lines = injuriesData.split("\n").slice(1);
    const injuryMap = {};

    lines.forEach(line => {
        const [team, player, impact] = line.split(",");
        if (!team) return;

        if (!injuryMap[team]) injuryMap[team] = 0;
        injuryMap[team] += parseFloat(impact || 0);
    });

    return injuryMap;
}

const injuryMap = loadInjuries();

// ------------------------------------------
// ADVANCED SCORING MODEL (FDJ Enhanced)
// ------------------------------------------
function scoreMatch(match) {
    let score = 0;

    // --- Probabilités ---
    const prob = Math.max(match.prob_home, match.prob_away);
    if (prob > 0.70) score += 3;
    else if (prob > 0.60) score += 2;
    else if (prob > 0.55) score += 1;

    // --- Forme ---
    if (match.form_rating > 0.70) score += 2;
    else if (match.form_rating > 0.60) score += 1;

    // --- Blessures ---
    const injImpact = match.injury;
    if (injImpact < 0.10) score += 2;
    else if (injImpact < 0.20) score += 1;

    // --- Cotes ---
    if (match.best_odds < 1.40) score += 2;
    else if (match.best_odds < 1.55) score += 1;

    // --- Qualité des équipes ---
    const ratingGap = Math.abs(match.team_rating_home - match.team_rating_away);
    if (ratingGap > 12) score += 2;
    else if (ratingGap > 7) score += 1;

    return score;
}

// ------------------------------------------
// CONFIDENCE LEVELS
// ------------------------------------------
function confidenceLevel(score) {
    if (score >= 8) return "⭐⭐⭐⭐⭐ (Très Haute confiance)";
    if (score >= 6) return "⭐⭐⭐⭐ (Haute confiance)";
    if (score >= 4) return "⭐⭐⭐ (Confiance moyenne)";
    if (score >= 2) return "⭐⭐ (Faible confiance)";
    return "⭐ (Très faible confiance)";
}

// ------------------------------------------
// BUILD MATCH OBJECTS
// ------------------------------------------
const matches = odds.map(m => ({
    home: m.home,
    away: m.away,
    best_odds: m.best_odds,
    prob_home: m.prob_home,
    prob_away: m.prob_away,
    form_rating: m.form_rating || 0.5,
    injury: injuryMap[m.home] || 0,
    team_rating_home: m.team_rating_home || 50,
    team_rating_away: m.team_rating_away || 50
}));

// ------------------------------------------
// CALCULATE SCORES
// ------------------------------------------
matches.forEach(m => m.score = scoreMatch(m));

// ------------------------------------------
// SELECT TOP 5 SINGLE BETS
// ------------------------------------------
const simpleBets = matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

// ------------------------------------------
// SAFE COMBINATIONS (2 x 2 matchs)
// ------------------------------------------
const safeMatches = matches
    .filter(m => m.score >= 5 && m.best_odds <= 1.65)
    .sort((a, b) => a.best_odds - b.best_odds)
    .slice(0, 4);

const combo1 = safeMatches.slice(0, 2);
const combo2 = safeMatches.slice(2, 4);

// ------------------------------------------
// BUILD REPORT
// ------------------------------------------
let report = "🔥 **Prédictions du jour — Modèle FDJ+** 🔥\n\n";

report += "🎯 *5 Paris Simples Fiables :*\n";
simpleBets.forEach(m => {
    report += `• ${m.home} vs ${m.away} — cote ${m.best_odds}  
   → ${confidenceLevel(m.score)}\n\n`;
});

report += "\n🛡️ *Combinés Sécurisés :*\n\n";
report += `1️⃣ ${combo1
    .map(m => `${m.home} vs ${m.away} (⭐ ${m.best_odds})`)
    .join(" + ")}\n`;

report += `2️⃣ ${combo2
    .map(m => `${m.home} vs ${m.away} (⭐ ${m.best_odds})`)
    .join(" + ")}\n`;

fs.writeFileSync("daily_bets.txt", report, "utf8");
console.log("✔ Rapport FDJ+ généré !");
// === Imports ===
// … ton code …

// === AJOUT : Fonction de niveau de confiance ===
function computeConfidence(stats) {
    const {
        forme, h2h, domicile, blessures,
        attaque, defense, variance
    } = stats;

    let score =
          forme * 0.25
        + h2h * 0.15
        + domicile * 0.10
        + (100 - blessures) * 0.20
        + attaque * 0.10
        + defense * 0.10
        + (100 - variance) * 0.10;

    score = Math.max(0, Math.min(100, score));

    let label =
        score < 50 ? "🔴 Risqué" :
        score < 70 ? "🟠 Méfiance" :
        score < 85 ? "🟡 Solide" :
        score < 95 ? "🟢 Fort" :
        "🟣 Ultra Confiance";

    return { score, label };
}

