// index.js — assemble les paris et génère daily_bets.txt
import fs from "fs/promises";
import fetch from "node-fetch";

const PICKS_FILE = "./picks.json";
const OUTPUT_FILE = "./daily_bets.txt";

// Formateur pour le daily_bets.txt
function formatDailyBets({ top, positive }) {
  let txt = "";
  txt += `🎯 PARIS DU JOUR – Agent Automatisé\n\n`;

  // TOP 5 MATCHS
  txt += `🔥 5 PARIS SIMPLES FIABLES\n`;
  top.slice(0, 5).forEach((p, i) => {
    const team = p.pickSide === "home" ? p.home : p.away;
    const odd = p.odds ? p.odds.toFixed(2) : "?";
    txt += `• ${team} (1N2) — cote ${odd}\n`;
  });

  txt += `\n\n🛡️ COMBINÉS SÉCURISÉS\n`;

  // 2 combinés automatiques
  if (positive.length >= 2) {
    txt += `1️⃣ ${positive[0].home} vs ${positive[0].away}\n`;
  }
  if (positive.length >= 4) {
    txt += `2️⃣ ${positive[1].home} vs ${positive[1].away}\n`;
  }

  return txt.trim();
}

async function main() {
  console.log("📥 Chargement des picks…");

  const raw = await fs.readFile(PICKS_FILE, "utf8");
  const picks = JSON.parse(raw);

  console.log("📦 Picks chargés. Génération du daily_bets.txt…");

  const formatted = formatDailyBets({
    top: picks.top,
    positive: picks.positive,
  });

  await fs.writeFile(OUTPUT_FILE, formatted);

  console.log("✔ daily_bets.txt généré avec succès !");
}

main().catch((err) => {
  console.error("❌ ERROR:", err);
});
