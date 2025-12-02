const fs = require("fs");

// =======================================================
//  FICHIERS D’ENTRÉE
// =======================================================
const ODDS_FILE = "odds_fdj.json";
const PLAYERS_FILE = "players_stats.csv";
const INJURIES_FILE = "injuries.csv";
const OUTPUT_FILE = "daily_bets.txt";

// -------------------------------------------------------
//  Fonctions de lecture sécurisées
// -------------------------------------------------------
function readJsonSafe(path) {
    try {
        if (!fs.existsSync(path)) {
            console.warn("❌ Fichier introuvable :", path);
            return [];
        }
        return JSON.parse(fs.readFileSync(path, "utf8"));
    } catch (e) {
        console.warn("❌ Impossible de lire JSON :", path, e.message);
        return [];
    }
}

function readTextSafe(path) {
    try {
        if (!fs.existsSync(path)) {
            console.warn("❌ Fichier introuvable :", path);
            return "";
        }
        return fs.readFileSync(path, "utf8");
    } catch (e) {
        console.warn("❌ Impossible de lire fichier texte :", path, e.message);
        return "";
    }
}

// Lecture des fichiers
const odds = readJsonSafe(ODDS_FILE);
const injuriesTxt = readTextSafe(INJURIES_FILE);

// -------------------------------------------------------
//  Parsage du CSV des blessures
// -------------------------------------------------------
function loadInjuriesFromCSV(txt) {
    if (!txt.trim()) return {};

    const lines = txt.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return {};

    const header = lines[0].split(",").map(h => h.trim().toLowerCase());
    const teamIdx = header.indexOf("team");
    const impactIdx = header.indexOf("impact");

    const map = {};

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        const team = cols[teamIdx] || "";
        const impact = parseFloat(cols[impactIdx] || "0");

        if (team) {
            map[team] = (map[team] || 0) + (impact || 0);
        }
    }
    return map;
}

const injuryMap = loadInjuriesFromCSV(injuriesTxt);

// -------------------------------------------------------
//  Scoring FDJ+ (version stable)
// -------------------------------------------------------
function scoreMatch(m) {
    let s = 0;

    // probabilité
    const prob = Math.max(m.prob_home || 0, m.prob_away || 0);
    if (prob >= 0.75) s += 3;
    else if (prob >= 0.62) s += 2;
    else if (prob >= 0.55) s += 1;

    // forme
    const form = m.form_rating || 0.5;
    if (form >= 0.75) s += 2;
    else if (form >= 0.60) s += 1;

    // blessures
    const inj = m.injury || 0;
    if (inj < 0.08) s += 2;
    else if (inj < 0.20) s += 1;

    // cote
    const odds = m.best_odds || 2.0;
    if (odds <= 1.40) s += 2;
    else if (odds <= 1.60) s += 1;

    // différence de niveau
    const diff = Math.abs((m.team_rating_home || 50) - (m.team_rating_away || 50));
    if (diff >= 12) s += 2;
    else if (diff >= 7) s += 1;

    return s;
}

function confidenceLabel(score) {
    if (score >= 9) return "⭐⭐⭐⭐⭐ Très haute";
    if (score >= 7) return "⭐⭐⭐⭐ Haute";
    if (score >= 5) return "⭐⭐⭐ Moyenne";
    if (score >= 3) return "⭐⭐ Faible";
    return "⭐ Très faible";
}

// -------------------------------------------------------
//  Normalisation données FDJ
// -------------------------------------------------------
const matches = (Array.isArray(odds) ? odds : []).map(m => ({
    home: m.home || m.team_home || m.home_team || "Home",
    away: m.away || m.team_away || m.away_team || "Away",
    best_odds: parseFloat(m.best_odds || m.odds || m.cote || 2.0),
    prob_home: parseFloat(m.prob_home || 0),
    prob_away: parseFloat(m.prob_away || 0),
    form_rating: parseFloat(m.form_rating || 0.5),
    injury: (injuryMap[m.home] || 0) + (injuryMap[m.away] || 0),
    team_rating_home: parseFloat(m.team_rating_home || 50),
    team_rating_away: parseFloat(m.team_rating_away || 50)
}));

// Ajout du score
matches.forEach(m => m.score = scoreMatch(m));

// -------------------------------------------------------
//  Sélection des TOP 5
// -------------------------------------------------------
const singles = matches
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

// -------------------------------------------------------
//  Combos sécurisés
// -------------------------------------------------------
const safePool = matches
    .filter(m => m.score >= 5 && m.best_odds <= 1.70)
    .sort((a, b) => a.best_odds - b.best_odds)
    .slice(0, 6);

const combos = [];

if (safePool.length >= 4) {
    combos.push([safePool[0], safePool[1]]);
    combos.push([safePool[2], safePool[3]]);
} else if (safePool.length >= 2) {
    combos.push([safePool[0], safePool[1]]);
}

// Infos d’un combo
function comboInfo(arr) {
    const totalOdds = arr.reduce((sum, m) => sum * m.best_odds, 1);
    const avgScore = Math.round(arr.reduce((s, m) => s + m.score, 0) / arr.length);
    return {
        totalOdds: totalOdds.toFixed(2),
        avgScore,
        label: confidenceLabel(avgScore)
    };
}

// -------------------------------------------------------
//  CONSTRUCTION DU RAPPORT
// -------------------------------------------------------
let report = "🔥 PRÉDICTIONS DU JOUR — Modèle FDJ+ 🔥\n\n";

report += "🎯 5 Paris Simples recommandés :\n";
singles.forEach((m, i) => {
    report += `${i + 1}. ${m.home} vs ${m.away} — cote ${m.best_odds} — ${confidenceLabel(m.score)}\n`;
});

report += "\n🧩 Combinés intelligents :\n";
if (combos.length === 0) {
    report += "Aucun combiné sûr identifié aujourd'hui.\n";
} else {
    combos.forEach((arr, i) => {
        const info = comboInfo(arr);
        report += `${i + 1}. ${arr.map(m => `${m.home} vs ${m.away} (${m.best_odds})`).join(" + ")}\n`;
        report += `   → Cote totale ≈ ${info.totalOdds} — Confiance : ${info.label}\n`;
    });
}

report += "\nℹ️ Notes : modèle heuristique ; utiliser avec prudence.\n";

// -------------------------------------------------------
//  Écriture dans le fichier TXT
// -------------------------------------------------------
try {
    fs.writeFileSync(OUTPUT_FILE, report, "utf8");
    console.log("✅ Rapport généré :", OUTPUT_FILE);
} catch (e) {
    console.error("❌ Impossible d’écrire daily_bets.txt :", e.message);
}

// Log abrégé dans les Actions
console.log("\n=== APERÇU ===\n");
console.log(report.split("\n").slice(0, 25).join("\n"));

