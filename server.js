const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const TOKEN = process.env.TELEGRAM_TOKEN;
const API_URL = `https://api.telegram.org/bot${TOKEN}`;

// --- ROOT TEST ---
app.get("/", (req, res) => {
  res.send("Bot Telegram OK - Render is running!");
});

// --- WEBHOOK ---
app.post(`/webhook/${TOKEN}`, async (req, res) => {
  try {
    const message = req.body.message;

    // Réponse immédiate pour Telegram
    res.status(200).send("OK");

    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text === "/bets") {
      const responseMsg = `
🔥 *5 PARIS SIMPLES FIABLES*
• Équipe B (1N2) — cote 1.85
• Équipe A (1N2) — cote 4.2
• Nul (1N2) — cote 3.1

🧱 *COMBINÉS SÉCURISÉS*
1️⃣
2️⃣
`;
      await axios.post(`${API_URL}/sendMessage`, {
        chat_id: chatId,
        text: responseMsg,
        parse_mode: "Markdown"
      });
    } else {
      await axios.post(`${API_URL}/sendMessage`, {
        chat_id: chatId,
        text: "Commande inconnue. Utilisez /bets."
      });
    }

  } catch (error) {
    console.error("Webhook error:", error);
  }
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

