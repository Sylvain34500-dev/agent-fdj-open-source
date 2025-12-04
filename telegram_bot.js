//
//  🔥 telegram_bot.js — VERSION OPTIMISÉE (OPTION C)
//  Le bot récupère toujours daily_bets.txt en direct depuis GitHub
//

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ===============================
// 🔐 CONFIG
// ===============================
const TOKEN = process.env.TELEGRAM_TOKEN;
const API_URL = `https://api.telegram.org/bot${TOKEN}`;

// URL RAW du fichier GitHub (toujours à jour)
const RAW_BETS_URL =
  "https://raw.githubusercontent.com/Sylvain34500-dev/agent-fdj-open-source/main/daily_bets.txt";

// ===============================
// 📤 Envoi de message Telegram
// ===============================
async function sendMessage(chatId, text) {
  try {
    await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("Erreur en envoyant le message :", err.response?.data || err);
  }
}

// ===============================
// 📩 WEBHOOK TELEGRAM
// ===============================
app.post("/webhook", async (req, res) => {
  const update = req.body;

  if (!update.message) return res.sendStatus(200);

  const chatId = update.message.chat.id;
  const text = update.message.text?.trim();

  if (text === "/bets") {
    try {
      // Télécharger depuis GitHub
      const response = await axios.get(RAW_BETS_URL, {
        headers: { "Cache-Control": "no-cache" },
      });

      const bets = response.data || "❌ Le fichier daily_bets.txt est vide.";

      await sendMessage(chatId, bets);

    } catch (err) {
      console.error("Erreur lors de la récupération GitHub :", err.message);

      await sendMessage(
        chatId,
        "❌ Impossible de charger daily_bets.txt depuis GitHub.\nVérifie qu’il existe bien."
      );
    }

  } else {
    await sendMessage(
      chatId,
      "Commande inconnue.\nUtilise la commande `/bets` pour recevoir les pronostics."
    );
  }

  res.sendStatus(200);
});

// ===============================
// 🟢 Keep-alive Render
// ===============================
app.get("/", (req, res) => {
  res.send("🤖 Bot Telegram FDJ en ligne et synchronisé avec GitHub !");
});

// ===============================
// 🚀 Lancement serveur Render
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Bot Telegram opérationnel sur le port ${PORT} 🚀`)
);
