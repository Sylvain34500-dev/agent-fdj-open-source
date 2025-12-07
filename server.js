import express from "express";
import bodyParser from "body-parser";
import TelegramBot from "node-telegram-bot-api";

const TOKEN = process.env.TELEGRAM_TOKEN;
const URL = process.env.RENDER_EXTERNAL_URL;  // Ex : https://agent-fdj-open-source.onrender.com
const PORT = process.env.PORT || 10000;

const app = express();
app.use(bodyParser.json());

// --- MODE WEBHOOK ---
const bot = new TelegramBot(TOKEN, { webHook: true });

// URL complète du webhook
const webhookPath = `/webhook/${TOKEN}`;
const webhookUrl = `${URL}${webhookPath}`;

bot.setWebHook(webhookUrl);

console.log("Webhook registered:", webhookUrl);

// --- ROUTE WEBHOOK ---
app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// --- COMMANDE /bets ---
bot.onText(/\/bets/, (msg) => {
    bot.sendMessage(msg.chat.id, "Voici les paris du jour !");
});

// --- LANCEMENT SERVEUR ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
