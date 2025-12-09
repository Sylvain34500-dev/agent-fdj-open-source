// send_daily_report.cjs
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID || process.env.TELEGRAM_CHATID || process.env.TELEGRAM_CHAT;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('⚠️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant dans env.');
  process.exit(1);
}

const reportFile = path.join(__dirname, 'picks.json');

if (!fs.existsSync(reportFile)) {
  console.error('⚠️ picks.json introuvable — exécute fetch_and_score.cjs d’abord.');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
} catch (e) {
  console.error('⚠️ Impossible de parser picks.json:', e && e.stack ? e.stack : e);
  process.exit(1);
}

const top = Array.isArray(report.top) ? report.top : (report.top || []);
console.log('--- DEBUG picks.json top (length):', top.length, '---');
console.log(JSON.stringify(top.slice(0,10), null, 2));
console.log('---------------------------------------------');

let text = `📊 *Pronostics du jour* 💰\n`;
text += `_Généré: ${new Date().toLocaleString('fr-FR')}_\n\n`;

if (!top.length) {
  text += "_Aucune donnée disponible._\n";
} else {
  top.slice(0, 10).forEach((m, idx) => {
    const home = m.home || 'Home';
    const away = m.away || 'Away';
    const pickSide = (m.pickSide || 'unknown').toUpperCase();
    const bestOdd = (m.bestOdd != null) ? m.bestOdd.toFixed ? m.bestOdd.toFixed(2) : m.bestOdd : 'N/A';
    text += `*${idx + 1}.* ${home} vs ${away}\n➡️ Pronostic: *${pickSide}*\n➡️ Meilleure cote: ${bestOdd}\n\n`;
  });
}

console.log('--- DEBUG message (preview) ---');
console.log(text.slice(0, 1000));
console.log('--------------------------------');

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

bot.sendMessage(CHAT_ID, text, { parse_mode: "Markdown" })
  .then((res) => {
    console.log('✔️ Message envoyé sur Telegram (message_id:', res.message_id, ')');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur Telegram:', (err && err.response) ? (err.response.body || err.response) : err );
    process.exit(1);
  });
