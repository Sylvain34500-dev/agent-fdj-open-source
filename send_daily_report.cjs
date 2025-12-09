const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const PICKS_FILE = path.join(__dirname, "picks.json");
const OUT_FILE = path.join(__dirname, "daily_bets.txt");

function formatDailyBets(picksData) {
  if (!picksData || !Array.isArray(picksData.top) || !picksData.top.length) {
    return "⚠ Aucun pick disponible aujourd'hui.";
  }

  const top = picksData.top.slice(0, 10);
  let txt = "🎯 PARIS DU JOUR\n\n";

  top.forEach((p, i) => {
    const team = (p.pickSide === "home" ? p.home : p.pickSide === "away" ? p.away : (p.home + " vs " + p.away));
    const odd = p.bestOdd ? p.bestOdd.toFixed(2) : "?";
    txt += `${i+1}. ${team} — cote ${odd}\n`;
    if (p.comment) txt += `   💬 ${p.comment}\n`;
  });

  txt += `\n🕒 ${new Date().toLocaleString("fr-FR")}`;
  return txt;
}

async function run() {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error("❌ TOKEN ou CHAT_ID manquant");
    return;
  }

  console.log("📁 Lecture fichier picks:", PICKS_FILE);

  if (!fs.existsSync(PICKS_FILE)) {
    console.error("❌ ERREUR: picks.json introuvable");
    return;
  }

  const picksData = JSON.parse(fs.readFileSync(PICKS_FILE, "utf8"));
  const text = formatDailyBets(picksData);

  fs.writeFileSync(OUT_FILE, text, "utf8");
  console.log("📄 daily_bets.txt généré");

  const bot = new TelegramBot(TELEGRAM_TOKEN);
  await bot.sendMessage(CHAT_ID, text);

  console.log("📤 Message Telegram envoyé !");
}

run();
