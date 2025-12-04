const fs = require("fs");
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// =======================================
// 🔐 CONFIG
// =======================================
const TOKEN = process.env.TELEGRAM_TOKEN;
const API_URL = `https://api.telegram.org/bot${TOKEN}`;

// Fonction d’envoi de message
async function sendMessage(chatId, text) {
    try {
        await axios.post(`${API_URL}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: "Markdown"
        });
    } catch (e) {
        console.error("Erreur en envoyant un message :", e.response?.data || e);
    }
}

// =======================================
// 📩 WEBHOOK TELEGRAM
// =======================================
app.post("/webhook", async (req, res) => {
    const update = req.body;

    if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        if (text === "/bets") {
            let bets = "❌ Aucun fichier daily_bets.txt trouvé.";
            if (fs.existsSync("daily_bets.txt")) {
                bets = fs.readFileSync("daily_bets.txt", "utf8");
            }
            await sendMessage(chatId, bets);
        } else {
            await sendMessage(
                chatId,
                "Commande inconnue. Envoie `/bets` pour recevoir les pronostics."
            );
        }
    }

    res.sendStatus(200);
});

// =======================================
// 🔄 KEEP-ALIVE pour Render + UptimeRobot
// =======================================
app.get("/", (req, res) => {
    res.send("🤖 Bot Telegram FDJ en ligne !");
});

// =======================================
// 🚀 LANCEMENT DU SERVEUR
// =======================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Bot Telegram opérationnel 🚀"));
