// server.cjs
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");

// ENV ==================================================================
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
const BOT_URL = process.env.RENDER_EXTERNAL_URL || process.env.BOT_URL;
const CHAT_ID = process.env.CHAT_ID;
const PORT = process.env.PORT || 10000;
const RENDER_DEPLOY_HOOK = process.env.RENDER_DEPLOY_HOOK;

// CHECK =================================================================
if (!TELEGRAM_TOKEN) {
  console.error("❌ TELEGRAM token manquant");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { webHook: false, polling: false });

// HANDLE TELEGRAM MESSAGES ===============================================
async function handleUpdate(update) {
  try {
    if (!update) return;
    const msg = update.message || update;
    if (!msg || !msg.text) return;

    const text = msg.text.trim();
    const chatId = msg.chat?.id || msg.from?.id;

    if (!chatId) return;

    if (text.startsWith("/bets")) {
      const filePath = path.join(__dirname, "daily_bets.txt");
      let content = "⚠ daily_bets.txt introuvable.";
      try {
        content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : content;
      } catch (e) {
        console.error("read daily_bets:", e.message);
      }
      await bot.sendMessage(chatId, content, { parse_mode: "Markdown" });
      return;
    }

    await bot.sendMessage(chatId, "Commande inconnue. Utilisez /bets.");
  } catch (err) {
    console.error("handleUpdate error:", err.message);
  }
}

bot.processUpdate = (update) => handleUpdate(update);

// SET WEBHOOK =============================================================
async function configureWebhook() {
  if (!BOT_URL) {
    console.warn("⚠ BOT_URL absent — webhook non configuré.");
    return;
  }
  try {
    const webhookUrl = `${BOT_URL.replace(/\/+$/, "")}/webhook/${TELEGRAM_TOKEN}`;
    await bot.setWebHook(webhookUrl);
    console.log("✔ Webhook configuré:", webhookUrl);
  } catch (err) {
    console.error("Erreur setWebHook:", err.message);
  }
}

const app = express();
app.use(bodyParser.json());

// WEBHOOK ROUTE ============================================================
app.post(`/webhook/${TELEGRAM_TOKEN}`, (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch {
    res.sendStatus(500);
  }
});

// MANUAL SEND ==============================================================
// Permet d'envoyer immédiatement le rapport Telegram
app.get("/manual-send", async (req, res) => {
  exec("node send_daily_report.cjs", (error) => {
    if (error) {
      console.error("⚠️ ERREUR MANUAL_SEND:", error);
      return res.status(500).send("Erreur lors de l'envoi manuel.");
    }
    console.log("📤 Rapport envoyé manuellement !");
    res.send("📤 Rapport envoyé manuellement !");
  });
});

// CRON (GH Action) ==========================================================
app.get("/run-cron", async (req, res) => {
  try {
    if (RENDER_DEPLOY_HOOK) {
      await axios.post(RENDER_DEPLOY_HOOK).catch(() => {});
      console.log("Deploy hook appelé.");
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, err: e.message });
  }
});

// ROOT PAGE ================================================================
app.get("/", (req, res) => res.send("Bot Telegram OK - Render is running!"));

// START ====================================================================
const server = app.listen(PORT, async () => {
  console.log("Server running on port", PORT);
  await configureWebhook();
});

module.exports = server;

