// server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");   // <-- ajouté

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
const BOT_URL = process.env.RENDER_EXTERNAL_URL || process.env.BOT_URL; // Use Render variable or BOT_URL
const PORT = process.env.PORT || 10000;
const RENDER_DEPLOY_HOOK = process.env.RENDER_DEPLOY_HOOK;

if (!TELEGRAM_TOKEN) {
  console.error("❌ TELEGRAM token manquant (TELEGRAM_BOT_TOKEN or TELEGRAM_TOKEN)");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { webHook: false, polling: false });

// expose handler for updates
async function handleUpdate(update) {
  try {
    if (!update) return;
    const msg = update.message || update;
    if (!msg || !msg.text) return;

    const text = msg.text.trim();
    const chatId = msg.chat?.id || (msg.from && msg.from.id);

    if (!chatId) return;

    if (text.startsWith("/bets")) {
      const filePath = path.join(__dirname, "daily_bets.txt");
      let content = "⚠ daily_bets.txt introuvable.";
      try {
        content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : content;
      } catch (e) {
        console.error("read daily_bets:", e.message);
      }
      await bot.sendMessage(chatId, content, { parse_mode: "Markdown", disable_web_page_preview: true });
      return;
    }

    // default reply
    await bot.sendMessage(chatId, "Commande inconnue. Utilisez /bets pour recevoir les pronostics.");
  } catch (err) {
    console.error("handleUpdate error:", err && err.message);
  }
}

// attach processUpdate so webhook route can use it
bot.processUpdate = (update) => handleUpdate(update);

// configure webhook on start if BOT_URL present
async function configureWebhook() {
  if (!BOT_URL) {
    console.warn("⚠ BOT_URL non défini — webhook non configuré automatiquement.");
    return;
  }
  try {
    const webhookUrl = `${BOT_URL.replace(/\/+$/,"")}/webhook/${TELEGRAM_TOKEN}`;
    await bot.setWebHook(webhookUrl);
    console.log("✔ Webhook configuré:", webhookUrl);
  } catch (err) {
    console.error("Erreur setWebHook:", err && err.message);
  }
}

const app = express();
app.use(bodyParser.json());

// webhook endpoint (POST from Telegram)
app.post(`/webhook/${TELEGRAM_TOKEN}`, (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("webhook handling error:", err && err.message);
    res.sendStatus(500);
  }
});

// ==================== ENVOI MANUEL DU RAPPORT ====================
// Permet d'envoyer immédiatement le rapport Telegram
app.get("/manual-send", async (req, res) => {
  exec("node send_daily_report.cjs", (error, stdout, stderr) => {
    if (error) {
      console.error("⚠️ ERREUR MANUAL_SEND:", error);
      return res.status(500).send("Erreur lors de l'envoi manuel.");
    }
    console.log("📤 Rapport envoyé manuellement !");
    res.send("📤 Rapport envoyé manuellement !");
  });
});

// run-cron endpoint (optionnel) : appelé par GH Action -> peut trigger redeploy
app.get("/run-cron", async (req, res) => {
  try {
    // run generation locally if files available
    // if RENDER_DEPLOY_HOOK present, call it to force render deploy (optional)
    if (RENDER_DEPLOY_HOOK) {
      await axios.post(RENDER_DEPLOY_HOOK).catch(() => {});
      console.log("Deploy hook called.");
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("run-cron:", e && e.message);
    res.status(500).json({ ok: false, err: e.message });
  }
});

// affichage simple
app.get("/", (req, res) => res.send("Bot Telegram OK - Render is running!"));

const server = app.listen(PORT, async () => {
  console.log("Server running on port", PORT);
  await configureWebhook();
});

module.exports = server;
