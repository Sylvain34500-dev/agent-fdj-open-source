import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix pour __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error("❌ FATAL: TELEGRAM_BOT_TOKEN manquant !");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// ------------------------------
//  Chargement du fichier daily_bets.txt
// ------------------------------
function loadDailyBets() {
    try {
        const filePath = path.join(__dirname, "daily_bets.txt");

        if (!fs.existsSync(filePath)) {
            return "⚠ daily_bets.txt introuvable.";
        }

        const content = fs.readFileSync(filePath, "utf8").trim();
        return content || "⚠ Le fichier daily_bets.txt est vide.";
    } catch (error) {
        console.error("Erreur lecture daily_bets.txt:", error);
        return "❌ Erreur: impossible de lire daily_bets.txt.";
    }
}

// ------------------------------
//  Commande /bets
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
//  Message par défaut
// ------------------------------
bot.on("message", (msg) => {
    if (!msg.text.startsWith("/bets")) {
        bot.sendMessage(msg.chat.id, "Commande inconnue. Utilisez /bets.");
    }
});

console.log("🚀 Bot Telegram en ligne !");

