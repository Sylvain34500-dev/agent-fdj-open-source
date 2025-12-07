// server.js  (CommonJS)
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
const BOT_URL = process.env.BOT_URL; // ex: https://agent-fdj-open-source.onrender.com
const PORT = process.env.PORT || 10000;
const RENDER_DEPLOY_HOOK = process.env.RENDER_DEPLOY_HOOK;

if (!TELEGRAM_TOKEN) {
  console.error("❌ TELEGRAM token manquant (TELEGRAM_BOT_TOKEN or TELEGRAM_TOKEN)");
  process.exit(1);
}
if (!BOT_URL) {
  console.warn("⚠ BOT_URL non défini — le webhook ne pourra pas être configuré automatiquement.");
}

// IMPORTANT : pas de polling car webhook
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

/* -----------------------------
      🔥 CHARGER LES PRONOS
--------------------------------*/
function loadDailyBets() {
  try {
    const filePath = path.join(__dirname, "daily_bets.txt");
    if (!fs.existsSync(filePath)) return "⚠ daily_bets.txt introuvable.";
    const content = fs.readFileSync(filePath, "utf8").trim();
    return content || "⚠ Le fichier daily_bets.txt est vide.";
  } catch (err) {
    console.error("Erreur lecture daily_bets.txt:", err);
    return "❌ Erreur: impossible de lire daily_bets.txt.";
  }
}

/* -----------------------------
      🔥 TRAITER LES MESSAGES
--------------------------------*/
async function handleUpdate(update) {
  try {
    if (update.message && update.message.text) {
      const msg = update.message;
      const text = msg.text.trim();
      const chatId = msg.chat.id;

      if (text.startsWith("/bets")) {
        const bets = loadDailyBets();
        await bot.sendMessage(chatId, bets, {
          parse_mode: "Markdown",
          disable_web_page_preview: true
        });
        return;
      }

      await bot.sendMessage(chatId, "Commande inconnue. Utilisez /bets pour recevoir les pronostics.");
    }
  } catch (err) {
    console.error("handleUpdate error:", err && err.message);
  }
}

// Remplace processUpdate pour être utilisé par Express webhook
bot.processUpdate = (update) => {
  handleUpdate(update).catch((e) => console.error(e));
};

/* -----------------------------
      🔥 CONFIGURER LE WEBHOOK
--------------------------------*/
async function configureWebhook() {
  if (!BOT_URL) return;
  const webhookUrl = `${BOT_URL.replace(/\/+$/, "")}/webhook/${TELEGRAM_TOKEN}`;
  try {
    await bot.setWebHook(webhookUrl);
    console.log("✔ Webhook configuré:", webhookUrl);
  } catch (err) {
    console.error("❌ Erreur setWebHook:", err && err.message);
  }
}

/* -----------------------------
                EXPRESS
--------------------------------*/
const app = express();
app.use(bodyParser.json());

// Webhook pour Telegram
app.post(`/webhook/${TELEGRAM_TOKEN}`, (req, res) => {
  try {
    const update = req.body;
    bot.processUpdate(update); 
    res.sendStatus(200);
  } catch (err) {
    console.error("webhook error:", err);
    res.sendStatus(500);
  }
});

// endpoint appelé par GitHub Action ou cron externe
app.get("/run-cron", async (req, res) => {
  try {
    if (RENDER_DEPLOY_HOOK) {
      await axios.post(RENDER_DEPLOY_HOOK); // 🔥 redeploy automatique Render
      console.log("Deploy hook appelé.");
    }
    res.json({ ok: true, msg: "Cron endpoint hit" });
  } catch (err) {
    console.error("run-cron error:", err);
    res.status(500).json({ ok: false, err: err.message });
  }
});

// Health
app.get("/", (req, res) => res.send("Bot server running"));

/* -----------------------------
            START SERVER
--------------------------------*/
const server = app.listen(PORT, async () => {
  console.log("🚀 Server running on port", PORT);
  await configureWebhook();
});

// Export pour Render, tests, etc.
module.exports = server;
