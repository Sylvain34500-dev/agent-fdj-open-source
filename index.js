// index.js
const fs = require("fs");
const path = require("path");

const PICKS_FILE = path.join(__dirname, "picks.json");
const OUT = path.join(__dirname, "daily_bets.txt");

function formatDailyBets(picksData) {
  if (!picksData || !Array.isArray(picksData.top) || !picksData.top.length) {
    return "⚠ Aucun pick disponible aujourd'hui.";
  }

  const top5 = picksData.top.slice(0, 10); // prendre 10 puis filtrer plus tard si besoin

  let txt = "🎯 PARIS DU JOUR – Agent Automatisé\n\n";
  txt += "🔥 TOP SÉLECTIONS (meilleures cotes détectées)\n\n";

  top5.forEach((p, i) => {
    const team = (p.pickSide === "home" ? p.home : (p.pickSide === "away" ? p.away : (p.home + " vs " + p.away)));
    const odd = p.bestOdd ? p.bestOdd.toFixed(2) : "?";
    txt += `${i+1}. ${team} — cote ${odd}\n`;
    if (p.comment) txt += `   💬 ${p.comment}\n`;
  });

  txt += "\n🛡️ COMBINÉS SÉCURISÉS (si applicable)\n";
  txt += "1) ...\n2) ...\n\n";
  txt += "— Source: pronosoft (scrap)\n";
  txt += `Generated: ${new Date().toLocaleString("fr-FR")}\n`;

  return txt;
}

function run() {
  if (!fs.existsSync(PICKS_FILE)) {
    console.error("PICKS file missing:", PICKS_FILE);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(PICKS_FILE, "utf8"));
  const txt = formatDailyBets(data);
  fs.writeFileSync(OUT, txt, "utf8");
  console.log("✔ daily_bets.txt written");
}

if (require.main === module) run();

