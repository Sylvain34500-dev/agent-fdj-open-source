// send_daily_report.js
// Envoi message Telegram avec le rapport généré (picks/pronostics)

const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("⚠️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID non défini !");
  process.exit(1);
}

const reportFile = path.join(__dirname, "generated_report.json");
let report = null;

try {
  report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
} catch (e) {
  console.error("⚠️ Impossible de lire generated_report.json :", e);
  process.exit(1);
}

let text = `📊 *Pronostics du jour* \n_${new Date().toLocaleString('fr-FR')}_\n\n`;

if (!report.candidates || report.candidates.length === 0) {
  text += "_Aucune donnée disponible._\n";
} else {
  report.candidates.slice(0, 10).forEach((m, idx) => {
    text += `*${idx + 1}.* ${m.matchId}\n`;
    text += `➡️ PICK: *${m.pick}*\n`;
    text += `➡️ Probabilité: ${Math.round(m.modelProb * 100)}%\n`;
    text += `➡️ Confiance: ${Math.round(m.confidence * 100)}%\n\n`;
  });
}

const bot = new TelegramBot(BOT_TOKEN);

bot.sendMessage(CHAT_ID, text, { parse_mode: "Markdown" })
  .then(() => console.log("✔️ Message envoyé sur Telegram"))
  .catch(err => console.error("❌ Erreur Telegram:", err));

