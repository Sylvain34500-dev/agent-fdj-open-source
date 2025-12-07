import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

// Ton token Telegram
const token = process.env.TELEGRAM_TOKEN;

// Mode webhook (obligatoire pour Render)
const bot = new TelegramBot(token, { webHook: true });

// URL publique Render
const url = process.env.BOT_URL;

// Chemin du webhook
const webhookPath = `/webhook/${token}`;

// Déclare le webhook
bot.setWebHook(`${url}${webhookPath}`);

// Commande /start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Bot opérationnel 🚀");
});

// Commande test
bot.onText(/test/, (msg) => {
    bot.sendMessage(msg.chat.id, "Le test fonctionne ✔️");
});

// Export pour server.js
export default bot;
