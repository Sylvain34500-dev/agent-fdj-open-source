// send_daily_report.js (ESM FIX)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import TelegramBot from "node-telegram-bot-api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
    console.error("⚠️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID non défini !");
    process.exit(1);
}

const reportFile = path.join(__dirname, "picks.json"); // <-- on envoie PICKS
let report = null;

try {
    report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
} catch (e) {
    console.error("⚠️ Impossible de lire picks.json :", e);
    process.exit(1);
}

let text = `📊 *Pronostics du jour* 💰\n`;
text += `_Généré: ${new Date().toLocaleString('fr-FR')}_\n\n`;

if (!report.top || report.top.length === 0) {
    text += "_Aucune donnée disponible._\n";
} else {
    report.top.slice(0, 10).forEach((m, idx) => {
        text += `*${idx + 1}.* ${m.home} vs ${m.away}\n`;
        text += `➡️ Pronostic: *${m.pickSide}*\n`;
        text += `➡️ Meilleure cote: ${m.bestOdd}\n\n`;
    });
}

const bot = new TelegramBot(BOT_TOKEN);

bot.sendMessage(CHAT_ID, text, { parse_mode: "Markdown" })
    .then(() => console.log("✔️ Message envoyé sur Telegram"))
    .catch(err => console.error("❌ Erreur Telegram:", err));


