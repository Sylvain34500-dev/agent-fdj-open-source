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
//  Scoring simple (basé uniquement sur les cotes FDJ)
// -----------------------------
function scoreMatch(m) {
    let score = 0;

    // Plus la cote est faible, plus le pari est jugé fiable
    if (m.odds <= 1.40) score += 3;
    else if (m.odds <= 1.65) score += 2;
    else if (m.odds <= 2.00) score += 1;

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
//  Sélection
// -----------------------------
function selectBets(data) {
    const matches = data.map(m => ({
        ...m,
        score: scoreMatch(m)
    }));

    const simple = matches
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
    const bets = selectBets(raw);

    fs.writeFileSync(OUTPUT, buildReport(bets), "utf8");
    console.log("✅ daily_bets.txt généré avec succès !");
}

main();
