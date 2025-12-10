require("dotenv").config();
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!TELEGRAM_TOKEN || !CHAT_ID) {
  console.log("❌ Variables Telegram manquantes.");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// ========= LECTURE ==========
const filePath = path.join(__dirname, "daily_bets.txt");
let raw = "";

if (fs.existsSync(filePath)) {
  raw = fs.readFileSync(filePath, "utf8").trim();
} else {
  raw = "⚠ daily_bets.txt introuvable";
}

// ========= PARSE ==========
function parseBets(raw) {
  const lines = raw.split('\n');
  
  const bets = [];
  let current = {};

  for (const line of lines) {
    const clean = line.trim();

    // Match numéro (ex: "1. Home vs Away")
    if (/^\d+\./.test(clean)) {
      if (current.match) {
        bets.push({ ...current });
      }
      current = { match: clean.substring(clean.indexOf('.')+1).trim() };
    }

    if (clean.startsWith("Pronostic:")) {
      current.pronostic = clean.replace("Pronostic:", "").trim();
    }

    if (clean.startsWith("Meilleure cote:")) {
      current.best = clean.replace("Meilleure cote:", "").trim();
    }
  }

  if (current.match) bets.push(current);

  return bets;
}

const bets = parseBets(raw);

// ========= FORMAT ==========
function formatBets(bets) {
  if (!bets.length) {
    return "⚠ Aucun pronostic détecté aujourd'hui.";
  }

  return `📊 *Pronostics du jour*\n\n` + 
    bets.map((b,i) =>
      `*${i+1}.* ${b.match}\n➡️ Pronostic: *${b.pronostic}*\n💰 Cote: ${b.best}`
    ).join("\n\n");
}

const message = formatBets(bets);

// ========= ENVOI TELEGRAM ==========
bot.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" })
  .then(() => {
    console.log("📨 Telegram envoyé !");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ ERREUR ENVOI:", err.message);
    process.exit(1);
  });
