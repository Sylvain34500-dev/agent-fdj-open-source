import express from "express";
import bodyParser from "body-parser";
import TelegramBot from "node-telegram-bot-api";

const TOKEN = process.env.TELEGRAM_TOKEN;
const URL = process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 10000;

const app = express();
app.use(bodyParser.json());

// --- MODE WEBHOOK ---
const bot = new TelegramBot(TOKEN, { webHook: true });
bot.setWebHook(`${URL}/webhook/${TOKEN}`);

console.log("Webhook registered:", `${URL}/webhook/${TOKEN}`);

// --- ROUTE WEBHOOK ---
app.post(`/webhook/${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// --- COMMANDES ---
bot.on("message", (msg) => {
    const text = msg.text?.trim();
    if (!text) return;

    // Commande /bets
    if (text.startsWith("/bets")) {
        bot.sendMessage(msg.chat.id, "Voici les paris du jour !");
    }
});

// --- LANCEMENT SERVEUR ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
