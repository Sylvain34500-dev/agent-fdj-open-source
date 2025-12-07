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
const RENDER_DEPLOY_HOOK = process.env.RENDER_DEPLOY_HOOK; // (optionnel) pour déclencher redeploy depuis GitHub Action

if (!TELEGRAM_TOKEN) {
  console.error("❌ TELEGRAM token manquant (TELEGRAM_BOT_TOKEN or TELEGRAM_TOKEN)");
  process.exit(1);
}
if (!BOT_URL) {
  console.warn("⚠ BOT_URL non défini — le webhook ne pourra pas être configuré automatiquement.");
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// expose function pour traiter les updates (utilisé par le webhook)
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

async function handleUpdate(update) {
  try {
    // si c'est un message texte
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

      // message par défaut
      await bot.sendMessage(chatId, "Commande inconnue. Utilisez /bets pour recevoir les pronostics.");
    }
  } catch (err) {
    console.error("handleUpdate error:", err && err.message);
  }
}

// Bind la méthode processUpdate pour utiliser avec express webhook route
bot.processUpdate = (update) => {
  // on délègue au handler async (ne pas attendre)
  handleUpdate(update).catch((e) => console.error(e));
};

// configure webhook si on a BOT_URL
async function configureWebhook() {
  if (!BOT_URL) return;
  const webhookUrl = `${BOT_URL.replace(/\/+$/,"")}/webhook/${TELEGRAM_TOKEN}`;
  try {
    await bot.setWebHook(webhookUrl);
    console.log("✔ webhook configuré:", webhookUrl);
  } catch (err) {
    console.error("Erreur setWebHook:", err && err.message);
  }
}

// Express app
const app = express();
app.use(bodyParser.json());

// webhook endpoint pour Telegram
app.post(`/webhook/${TELEGRAM_TOKEN}`, (req, res) => {
  // Telegram POST -> on donne la payload à node-telegram-bot-api
  try {
    const update = req.body;
    // processUpdate doit exister (on l'a défini plus haut)
    if (typeof bot.processUpdate === "function") {
      bot.processUpdate(update);
    } else {
      console.warn("processUpdate non disponible");
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("webhook handling error:", err);
    res.sendStatus(500);
  }
});

// endpoint pour réveiller / forcer regen daily_bets (utilisé par GitHub Action ou cron externe)
app.get("/run-cron", async (req, res) => {
  try {
    // Option A: si fetch_and_score.js ou index.js est sur le serveur, on pourrait require() et exécuter.
    // Ici on répond OK et laisse GitHub Action exécuter un fetch_and_score qui commit/push, ou on déclenche un redeploy si hook donné.
    if (RENDER_DEPLOY_HOOK) {
      // Déclenche un redeploy (Render deploy hook)
      await axios.post(RENDER_DEPLOY_HOOK);
      console.log("Deploy hook appelé.");
    }
    res.json({ ok: true, msg: "Cron endpoint hit" });
  } catch (err) {
    console.error("run-cron error:", err && err.message);
    res.status(500).json({ ok: false, err: err.message });
  }
});

// health
app.get("/", (req, res) => res.send("Bot server running"));

// start
app.listen(PORT, async () => {
  console.log("Server running on port", PORT);
  await configureWebhook();
});

