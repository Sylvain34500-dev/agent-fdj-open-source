const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

// ------------------------------
//  CONFIGURATION
// ------------------------------
const token = process.env.TELEGRAM_BOT_TOKEN;  // IMPORTANT : token dans Render

const bot = new TelegramBot(token, { polling: true });

// ------------------------------
//  CHARGEMENT DU FICHIER daily_bets.txt
// ------------------------------
function loadDailyBets() {
    try {
        const filePath = path.join(__dirname, "daily_bets.txt");

        if (!fs.existsSync(filePath)) {
            return "⚠ Le fichier daily_bets.txt est introuvable.";
        }

        const content = fs.readFileSync(filePath, "utf8").trim();
        return content.length > 0 ? content : "⚠ Le fichier daily_bets.txt est vide.";
    } catch (error) {
        console.error("Erreur lors de la lecture de daily_bets.txt :", error);
        return "❌ Erreur : impossible de lire daily_bets.txt.";
    }
}

// ------------------------------
//  COMMANDE PRINCIPALE : /bets
// ------------------------------
bot.onText(/\/bets/, (msg) => {
    const chatId = msg.chat.id;

    const bets = loadDailyBets();

    bot.sendMessage(chatId, bets, {
        parse_mode: "Markdown",
        disable_web_page_preview: true
    });
});

// ------------------------------
//  MESSAGE PAR DÉFAUT
// ------------------------------
bot.on("message", (msg) => {
    if (!msg.text.startsWith("/bets")) {
        bot.sendMessage(msg.chat.id, "Commande inconnue. Utilisez /bets pour recevoir les pronostics.");
    }
});

console.log("🚀 Bot Telegram lancé avec une seule commande : /bets");
