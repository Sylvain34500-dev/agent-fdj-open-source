const fs = require("fs");

// ------------------------------
// LOAD DATA
// ------------------------------
const odds = JSON.parse(fs.readFileSync("odds_fdj.json", "utf8"));
const playersStats = fs.readFileSync("players_stats.csv", "utf8");
const injuriesData = fs.readFileSync("injuries.csv", "utf8");

// ------------------------------
// PARSER INJURIES
// ------------------------------
function loadInjuries() {
    let lines = injuriesData.split("\n").slice(1);
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

// ------------------------------
// SCORE CALCULATION
// ------------------------------
function scoreMatch(match) {
    let score = 0;

    // Probabilités FDJ
    if (match.prob_home > 0.60 || match.prob_away > 0.60) score += 2;

    // Forme
    if (match.form_rating > 0.60) score += 1;

    // Blessures
    const teamInjury = injuryMap[match.home] || 0;
    if (teamInjury < 0.15) score += 1;

    // Cote
    if (match.best_odds <= 1.55) score += 1;

    return score;
}

// ------------------------------
// MATCH OBJECTS
// ------------------------------
let matches = odds.map(m => ({
    home: m.home,
    away: m.away,
    best_odds: m.best_odds,
    prob_home: m.prob_home,
    prob_away: m.prob_away,
    form_rating: m.form_rating,
    injury: injuryMap[m.home] || 0,
    score: 0
}));

// ------------------------------
// TOP 5 SINGLE BETS
// ------------------------------
matches.forEach(m => m.score = scoreMatch(m));

const simpleBets = matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

// ------------------------------
// SAFE COMBINATIONS
// ------------------------------
const safeMatches = matches
    .filter(m => m.score >= 3 && m.best_odds <= 1.65)
    .sort((a, b) => a.best_odds - b.best_odds)
    .slice(0, 4);

const combo1 = safeMatches.slice(0, 2);
const combo2 = safeMatches.slice(2, 4);

// ------------------------------
// BUILD REPORT
// ------------------------------
let report = "🔥 **Prédictions du jour — Modèle FDJ** 🔥\n\n";

report += "🎯 *5 Paris Simples Fiables :*\n";
simpleBets.forEach(m => {
    report += `• ${m.home} vs ${m.away} — cote ${m.best_odds}\n`;
});
report += "\n";

report += "🛡️ *Combinés Sécurisés :*\n\n";
report += `1️⃣ ${combo1.map(m => m.home + " vs " + m.away).join(" + ")}\n`;
report += `2️⃣ ${combo2.map(m => m.home + " vs " + m.away).join(" + ")}\n`;

fs.writeFileSync("daily_bets.txt", report, "utf8");

console.log("✔ Rapport FDJ généré !");
