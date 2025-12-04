const fs = require("fs");
const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// =======================================
// CONFIG
// =======================================
const TOKEN = process.env.TELEGRAM_TOKEN;
const API_URL = `https://api.telegram.org/bot${TOKEN}`;

// Fonction pour envoyer un message
async function sendMessage(chatId, text) {
    await axios.post(`${API_URL}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown"
    });
}

// Réception des messages Telegram (webhook)
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
            await sendMessage(chatId, "Envoie /bets pour obtenir les pronostics !");
        }
    }

    res.sendStatus(200);
});

// Petit endpoint pour keep-alive Render
app.get("/", (req, res) => res.send("Bot is running"));

// Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("🚀 Telegram bot actif sur Render !");
});
