// index.js — lance le scraper + expose une route /run-scraper
import fs from "fs/promises";
import fetch from "node-fetch";
import express from "express";

const PICKS_FILE = "./picks.json";
const OUTPUT_FILE = "./daily_bets.txt";

const app = express();

// -----------------------------
//  FORMATEUR DU daily_bets.txt
// -----------------------------
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

  if (positive.length >= 2) {
    txt += `1️⃣ ${positive[0].home} vs ${positive[0].away}\n`;
  }
  if (positive.length >= 4) {
    txt += `2️⃣ ${positive[1].home} vs ${positive[1].away}\n`;
  }

  return txt.trim();
}

// -----------------------------
//  FONCTION PRINCIPALE DU SCRAPER
// -----------------------------
async function generateDailyBets() {
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

// -----------------------------
//  ROUTE HTTP POUR CRON EXTERNE
// -----------------------------
app.get("/run-scraper", async (req, res) => {
  try {
    await generateDailyBets();
    res.send("✔ Scraper exécuté et daily_bets.txt mis à jour !");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Erreur lors de l'exécution du scraper.");
  }
});

// -----------------------------
//  SERVER EXPRESS (OBLIGATOIRE POUR RENDER)
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Serveur en ligne sur le port " + PORT);
});

