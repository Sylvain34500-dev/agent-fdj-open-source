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

// ==== LECTURE DU FICHIER DE PICKS ====
const picksFile = path.join(__dirname, "daily_bets.txt");
let content = "";

if (fs.existsSync(picksFile)) {
  content = fs.readFileSync(picksFile, "utf8");
} else {
  content = "⚠ Fichier daily_bets.txt introuvable !";
}

// ==== ENVOI ====
bot.sendMessage(CHAT_ID, content, { parse_mode: "Markdown" })
  .then(() => {
    console.log("📨 Telegram envoyé !");
    process.exit(0);
  })
  .catch(err => {
    console.error("ERREUR ENVOI:", err.message);
    process.exit(1);
  });
