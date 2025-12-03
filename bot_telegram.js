const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

// Récup ton token depuis les secrets GitHub
const token = process.env.TELEGRAM_TOKEN;

// Création du bot
const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Bot Telegram démarré...");

// Quand quelqu’un envoie un message au bot
bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    // Lire ton fichier déjà généré
    let bets = "Le fichier daily_bets.txt est introuvable.";
    if (fs.existsSync("daily_bets.txt")) {
        bets = fs.readFileSync("daily_bets.txt", "utf8");
    }

    bot.sendMessage(chatId, bets);
});
