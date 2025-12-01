const fs = require("fs");

// ------------------------------------------
// LOAD DATA
// ------------------------------------------
const odds = JSON.parse(fs.readFileSync("odds_fdj.json", "utf8"));
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
// ADVANCED CONFIDENCE SYSTEM (NEW v2.0)
// ------------------------------------------
function computeConfidence(match) {
    const stats = {
        forme: match.form_rating * 100,
        h2h: match.h2h_rating || 60,
        domicile: match.is_home_advantage ? 80 : 50,
        blessures: (injuryMap[match.home] || 0) * 10,
        attaque: match.attack_rating || 60,
        defense: match.defense_rating || 60,
        variance: match.variance || 20
    };

    let score =
          stats.forme * 0.25
        + stats.h2h * 0.15
        + stats.domicile * 0.10
        + (100 - stats.blessures) * 0.20
        + stats.attaque * 0.10
        + stats.defense * 0.10
        + (100 - stats.variance) * 0.10;

    score = Math.max(0, Math.min(100, score));

    let label =
        score < 50 ? "⭐ Très faible" :
        score < 65 ? "⭐⭐ Faible" :
        score < 80 ? "⭐⭐⭐ Moyen" :
        score < 90 ? "⭐⭐⭐⭐ Confiant" :
        "⭐⭐⭐⭐⭐ Très haute confiance";

    return { score, label };
}

// ------------------------------------------
// FDJ+ MATCH SCORING MODEL (AMÉLIORÉ)
// ------------------------------------------
function scoreMatch(match) {
    let score = 0;

    // Probabilités
    const prob = Math.max(match.prob_home, match.prob_away);
    if (prob > 0.70) score += 3;
    else if (prob > 0.60) score += 2;
    else if (prob > 0.55) score += 1;

    // Forme
    if (match.form_rating > 0.70) score += 2;
    else if (match.form_rating > 0.60) score += 1;

    // Blessures
    const injImpact = match.injury;
    if (injImpact < 0.10) score += 2;
    else

