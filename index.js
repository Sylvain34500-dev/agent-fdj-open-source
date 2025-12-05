// index.js — assemble les paris et génère daily_bets.txt
const fs = require("fs");
const fetch = require("node-fetch");

const PICKS_FILE = "./picks.json";
const OUTPUT_FILE = "./daily_bets.txt";

function formatDailyBets({ top, positive }) {
  let txt = "";
  txt += `🎯 PARIS DU JOUR – Agent Automatisé\n\n`;

  txt += `🔥 5 PARIS SIMPLES FIABLES\n`;
  top.slice(0, 5).forEach((p) => {
    const team = p.pickSide === "home" ? p.home : p.away;
    const odd = p.odds ? Number(p.odds).toFixed(2) : "?";
    txt += `• ${team} — cote ${odd}\n`;
  });

  txt += `\n\n🛡️ COMBINÉS SÉCURISÉS\n`;

  if (positive[0])
    txt += `1️⃣ ${positive[0].home} vs ${positive[0].away}\n`;

  if (positive[1])
    txt += `2️⃣ ${positive[1].home} vs ${positive[1].away}\n`;

  return txt.trim();
}

async function main() {
  console.log("📥 Chargement des picks…");

  const raw = fs.readFileSync(PICKS_FILE, "utf8");
  const picks = JSON.parse(raw);

  console.log("📦 Picks chargés. Génération du daily_bets.txt…");

  const formatted = formatDailyBets({
    top: picks.top,
    positive: picks.positive,
  });

  fs.writeFileSync(OUTPUT_FILE, formatted);

  console.log("✔ daily_bets.txt généré !");
}

main().catch((err) => {
  console.error("❌ ERROR:", err);
});

