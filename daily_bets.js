/**
 * daily_bets.js
 * Génère :
 *  - 5 paris simples les plus fiables
 *  - 2 combinés sécurisés
 * Basé sur : odds_fdj.json
 */

const fs = require("fs");

const INPUT = "odds_fdj.json";
const OUTPUT = "daily_bets.txt";

// -----------------------------
//  Scoring simple
// -----------------------------
function scoreMatch(m) {
    let score = 0;

    // Score basé sur les probabilités implicites
    if (m.p_model > 0.55) score += 2;
    if (m.odds <= 1.65) score += 1;
    if (m.p_imp_norm > 0.40) score += 1;
    if (m.p_model > 0.65) score += 1;

    return score;
}

// -----------------------------
//  Lecture JSON
// -----------------------------
function readOdds() {
    if (!fs.existsSync(INPUT)) {
        console.error("❌ odds_fdj.json introuvable !");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(INPUT, "utf8"));

    if (!Array.isArray(data)) {
        console.error("❌ Le fichier JSON doit contenir un tableau [] !");
        process.exit(1);
    }

    return data.map(r => ({
        ...r,
        odds: Number(r.odds)
    }));
}

// -----------------------------
//  Probabilités implicites + modèle
// -----------------------------
function enrichProbabilities(arr) {
    return arr.map(r => {
        r.p_imp_raw = 1 / r.odds;
        r.p_imp_norm = r.p_imp_raw; // normalisation inutile ici
        r.model_score = 1 / Math.pow(r.odds, 1.1);
        r.p_model = r.model_score;
        return r;
    });
}

// -----------------------------
//  Sélection
// -----------------------------
function selectBets(data) {
    const matches = data.map(m => ({
        ...m,
        score: scoreMatch(m)
    }));

    const simple = [...matches]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    const safe = matches
        .filter(m => m.odds <= 1.65)
        .slice(0, 4);

    return {
        simple,
        combo1: safe.slice(0, 2),
        combo2: safe.slice(2, 4)
    };
}

// -----------------------------
//  Rapport
// -----------------------------
function buildReport(bets) {
    let txt = "🎯 PARIS DU JOUR – Agent Automatisé\n\n";

    txt += "🔥 5 PARIS SIMPLES FIABLES\n";
    bets.simple.forEach(m => {
        txt += `• ${m.runner} (${m.market}) — cote ${m.odds}\n`;
    });

    txt += "\n\n🛡️ COMBINÉS SÉCURISÉS\n";
    txt += `1️⃣ ${bets.combo1.map(m => m.runner + " @" + m.odds).join(" + ")}\n`;
    txt += `2️⃣ ${bets.combo2.map(m => m.runner + " @" + m.odds).join(" + ")}\n`;

    return txt;
}

// -----------------------------
//  Main
// -----------------------------
function main() {
    const raw = readOdds();
    const enriched = enrichProbabilities(raw);
    const bets = selectBets(enriched);

    fs.writeFileSync(OUTPUT, buildReport(bets), "utf8");
    console.log("✅ daily_bets.txt généré avec succès !");
}

main();
