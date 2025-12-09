// index.cjs
const fs = require("fs");
const path = require("path");
const express = require("express");

const PICKS_FILE = path.join(__dirname, "picks.json");
const OUT = path.join(__dirname, "daily_bets.txt");

function formatDailyBets(picksData) {
  if (!picksData || !Array.isArray(picksData.top) || !picksData.top.length) {
    return "⚠ Aucun pick disponible aujourd'hui.";
  }

  const top5 = picksData.top.slice(0, 10);

  let txt = "🎯 PARIS DU JOUR – Agent Automatisé\n\n";
  txt += "🔥 TOP SÉLECTIONS (meilleures cotes détectées)\n\n";

  top5.forEach((p, i) => {
    const team = (p.pickSide === "home"
      ? p.home
      : (p.pickSide === "away"
        ? p.away
        : (p.home + " vs " + p.away)));
    const odd = p.bestOdd ? p.bestOdd.toFixed(2) : "?";
    txt += `${i + 1}. ${team} — cote ${odd}\n`;
    if (p.comment) txt += `   💬 ${p.comment}\n`;
  });

  txt += "\n🛡️ COMBINÉS SÉCURISÉS (si applicable)\n";
  txt += "1) ...\n2) ...\n\n";
  txt += "— Source: pronosoft (scrap)\n";
  txt += `Generated: ${new Date().toLocaleString("fr-FR")}\n`;

  return txt;
}

function runDailyBuild() {
  if (!fs.existsSync(PICKS_FILE)) {
    console.error("PICKS file missing:", PICKS_FILE);
    return "❌ picks.json introuvable";
  }
  const data = JSON.parse(fs.readFileSync(PICKS_FILE, "utf8"));
  const txt = formatDailyBets(data);
  fs.writeFileSync(OUT, txt, "utf8");
  console.log("✔ daily_bets.txt written");
  return "✔ Rapport généré (daily_bets.txt)";
}


// ----------------------------------------------------------------
// 🚀 EXPRESS SERVER (NE CASSE RIEN DU MODE SCRIPT)
// ----------------------------------------------------------------

if (require.main === module) {
  // MODE SCRIPT = génération de fichier (local)
  runDailyBuild();
} else {
  // MODE SERVEUR = Render lance ici
  const app = express();

  // Page d'accueil
  app.get("/", (req, res) => {
    res.send("👋 Agent FDJ est en ligne. Route /manual-send dispo.");
  });

  // 👉 Envoi manuel
  app.get("/manual-send", (req, res) => {
    const msg = runDailyBuild();
    res.send("📤 Envoi manuel demandé<br>" + msg);
  });

  // Render exige un PORT dynamique
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => {
    console.log("🌐 Server running on port", PORT);
  });
}

