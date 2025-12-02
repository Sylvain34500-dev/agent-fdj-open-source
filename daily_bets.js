const fs = require("fs");

// -------------------------------
// Fichiers d'entrée (doivent exister à la racine du repo)
const ODDS_FILE = "odds_fdj.json";        // fourni dans le repo
const PLAYERS_FILE = "players_stats.csv"; // fourni dans le repo
const INJURIES_FILE = "injuries.csv";     // fourni dans le repo
const OUTPUT_FILE = "daily_bets.txt";
// -------------------------------

// Safeguard : vérifier fichiers
function readJsonSafe(path) {
    try { return JSON.parse(fs.readFileSync(path, "utf8")); }
    catch(e){ console.warn("Cannot read JSON", path); return []; }
}
function readTextSafe(path) {
    try { return fs.readFileSync(path, "utf8"); }
    catch(e){ console.warn("Cannot read text", path); return ""; }
}

const odds = readJsonSafe(ODDS_FILE);
const playersTxt = readTextSafe(PLAYERS_FILE);
const injuriesTxt = readTextSafe(INJURIES_FILE);

// ------------------------------------------
// parse injuries CSV into a map {team: impact}
function loadInjuriesFromCSV(txt) {
    const lines = txt.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) return {};
    const header = lines[0].split(",").map(h=>h.trim().toLowerCase());
    const teamIdx = header.indexOf("team") >= 0 ? header.indexOf("team") : 0;
    const impactIdx = header.indexOf("impact") >= 0 ? header.indexOf("impact") : 2;
    const map = {};
    for(let i=1;i<lines.length;i++){
        const cols = lines[i].split(",").map(c=>c.trim());
        const team = cols[teamIdx] || "";
        const impact = parseFloat(cols[impactIdx]||0) || 0;
        if(!team) continue;
        map[team] = (map[team]||0) + impact;
    }
    return map;
}
const injuryMap = loadInjuriesFromCSV(injuriesTxt);

// ------------------------------------------
// Scoring model FDJ+ (heuristique)
function scoreMatch(m){
    let s = 0;
    const prob = Math.max(m.prob_home||0, m.prob_away||0);
    if (prob >= 0.75) s += 3;
    else if (prob >= 0.62) s += 2;
    else if (prob >= 0.55) s += 1;

    const form = m.form_rating || 0.5;
    if (form >= 0.75) s += 2;
    else if (form >= 0.60) s += 1;

    const inj = m.injury || 0;
    if (inj < 0.08) s += 2;
    else if (inj < 0.20) s += 1;

    const odds = m.best_odds || 2.0;
    if (odds <= 1.40) s += 2;
    else if (odds <= 1.60) s += 1;

    const trh = Math.abs((m.team_rating_home||50) - (m.team_rating_away||50));
    if (trh >= 12) s += 2;
    else if (trh >= 7) s += 1;

    return s;
}

function confidenceLabel(score){
    if (score >= 9) return "⭐⭐⭐⭐⭐ Très haute";
    if (score >= 7) return "⭐⭐⭐⭐ Haute";
    if (score >= 5) return "⭐⭐⭐ Moyenne";
    if (score >= 3) return "⭐⭐ Faible";
    return "⭐ Très faible";
}

// ------------------------------------------
// Build match objects from odds file format
const matches = (Array.isArray(odds) ? odds : []).map(m => ({
    home: m.home || m.team_home || m.home_team || "Home",
    away: m.away || m.team_away || m.away_team || "Away",
    best_odds: parseFloat(m.best_odds || m.odds || m.cote || 2.0),
    prob_home: parseFloat(m.prob_home || m.p_home || 0),
    prob_away: parseFloat(m.prob_away || m.p_away || 0),
    form_rating: parseFloat(m.form_rating || 0.5),
    injury: (injuryMap[m.home] || 0) + (injuryMap[m.away] || 0),
    team_rating_home: parseFloat(m.team_rating_home || m.rating_home || 50),
    team_rating_away: parseFloat(m.team_rating_away || m.rating_away || 50),
}));

// compute score
matches.forEach(m => m.score = scoreMatch(m));

// Select top 5 singles
const singles = matches.slice().sort((a,b)=>b.score - a.score).slice(0,5);

// Smart combos: pick 4 "safe" matches (score >=5, odds <=1.70), then build two combos of 2
const safePool = matches
    .filter(m => m.score >= 5 && m.best_odds <= 1.70)
    .sort((a,b) => a.best_odds - b.best_odds)
    .slice(0, 6); // take more to allow combinations

const combos = [];
if (safePool.length >= 4) {
    combos.push([safePool[0], safePool[1]]);
    combos.push([safePool[2], safePool[3]]);
} else if (safePool.length >= 2) {
    combos.push([safePool[0], safePool[1]]);
}

// Enhance combination calc: compute total odds and combined confidence
function comboInfo(arr){
    const totalOdds = arr.reduce((s,m)=>s*(m.best_odds||1),1);
    const avgScore = Math.round(arr.reduce((s,m)=>s+(m.score||0),0)/arr.length);
    return { totalOdds: totalOdds.toFixed(2), avgScore, label: confidenceLabel(avgScore) };
}

// Build report text
let report = "🔥 PRÉDICTIONS DU JOUR — Modèle FDJ+ 🔥\n\n";
report += "🎯 5 Paris Simples recommandés :\n";
singles.forEach((m,i) => {
    report += `${i+1}. ${m.home} vs ${m.away} — cote ${m.best_odds} — ${confidenceLabel(m.score)}\n`;
});
report += "\n🧩 Combinés intelligents :\n";
combos.forEach((arr,i) => {
    const info = comboInfo(arr);
    report += `${i+1}. ${arr.map(m=>m.home + " vs " + m.away + ` (${m.best_odds})`).join(" + ")}\n`;
    report += `   → Cote totale ≈ ${info.totalOdds} — Confiance : ${info.label}\n`;
});
if (combos.length === 0) report += "Aucun combiné sûr identifié aujourd'hui.\n";

report += "\nℹ️ Notes: modèle heuristique; utiliser avec prudence.\n";

// write file
try {
    fs.writeFileSync(OUTPUT_FILE, report, "utf8");
    console.log("Report written to", OUTPUT_FILE);
} catch(e){
    console.error("Failed to write report:", e);
}

// also print so Actions log has output
console.log("\n=== RAPPORT COURT ===\n");
console.log(report.split("\n").slice(0,30).join("\n"));
