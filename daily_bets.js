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
//  Utilitaires de scoring
// -----------------------------

function scoreMatch(m) {
    let score = 0;

    // Forte probabilité (modèle + marché normalisé)
    if (m.p_model > 0.55) score += 2;

    // Cote raisonnable => plus safe
    if (m.odds <= 1.65) score += 1;

    // Faible marge (bookmaker) => marché propre
    if (m.p_imp_norm && m.p_imp_norm > 0.40) score += 1;

    // Bonus si match très déséquilibré
    if (m.p_model > 0.65) score += 1;

    return score;
}

// -----------------------------
//  Lecture & préparation données
// -----------------------------

function readOdds() {
    if (!fs.existsSync(INPUT)) {
        console.error("❌ odds_fdj.json introuvable !");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(INPUT, "utf8"));

    // 🔍 Contrôle qualité du JSON
    data.forEach((row, index) => {
        if (!row.event_id || !row.market || !row.runner || !row.odds) {
            console.error("❌ Ligne invalide dans odds_fdj.json :", row);
            console.error("➡️ Erreur à la ligne index :", index);
            process.exit(1);
        }
    });

    return data.map(r => ({
        ...r,
        odds: Number(r.odds)
    }));
}

function enrichProbabilities(arr) {
    const grouped = {};

    arr.forEach((r, i) => {
        const key = `${r.event_id}::${r.market}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(i);
    });

    const res = arr.map(r => ({ ...r }));

    Object.keys(grouped).forEach(key => {
        const idxs = grouped[key];

        // Probabilités implicites
        let sumImp = 0;
        idxs.forEach(i => {
            res[i].p_imp_raw = 1 / res[i].odds;
            sumImp += res[i].p_imp_raw;
        });
        idxs.forEach(i => {
            res[i].p_imp_norm = res[i].p_imp_raw / sumImp;
        });

        // Modèle interne naïf
        let sumScore = 0;
        idxs.forEach(i => {
            res[i].model_score = 1 / Math.pow(res[i].odds, 1.1);
            sumScore += res[i].model_score;
        });
        idxs.forEach(i => {
            res[i].p_model = res[i].model_score / sumScore;
        });
    });

    return res;
}

// -----------------------------
//  Sélection des paris
// -----------------------------

function selectBets(data) {
    const matches = data.map(m => ({
        ...m,
        score: scoreMatch(m)
    }));

    // 5 Paris simples
    const simple = matches
        .filter(m => m.score >= 2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    // 2 combinés (2 matchs chacun)
    const safe = matches
        .filter(m => m.score >= 3 && m.odds <= 1.65)
        .sort((a, b) => a.odds - b.odds)
        .slice(0, 4);

    return {
        simple,
        combo1: safe.slice(0, 2),
        combo2: safe.slice(2, 4)
    };
}

// -----------------------------
//  Formatage de la sortie texte
// -----------------------------

function buildReport(bets) {
    let txt = "🎯 PARIS DU JOUR – Agent Automatisé\n\n";

    // Paris simples
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

    const report = buildReport(bets);
    fs.writeFileSync(OUTPUT, report, "utf8");

    console.log("✅ daily_bets.txt généré avec succès !");
}

main();
