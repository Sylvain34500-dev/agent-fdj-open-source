// send_daily_report.cjs
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHATID || process.env.TELEGRAM_CHAT;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('❌ TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not provided in env.');
  process.exit(1);
}

const reportPath = path.join(__dirname, 'picks.json');

if (!fs.existsSync(reportPath)) {
  console.error('❌ picks.json not found. Run fetch_and_score.cjs first.');
  process.exit(1);
}

let report = null;
try {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (err) {
  console.error('❌ Cannot parse picks.json:', err.message || err);
  process.exit(1);
}

const top = report.top || [];
let message = `📊 *Pronostics du jour*\n_${new Date().toLocaleString('fr-FR')}_\n\n`;

if (!top.length) {
  message += '_Aucun pick disponible._\n';
} else {
  top.slice(0, 8).forEach((m, i) => {
    const home = m.home || 'Home';
    const away = m.away || 'Away';
    const pick = (m.pickSide || m.pick || 'unknown').toUpperCase();
    const bestOdd = m.bestOdd != null ? m.bestOdd : 'N/A';
    message += `*${i+1}.* ${home} vs ${away}\n➡️ PICK: *${pick}* — Cote: ${bestOdd}\n\n`;
  });
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' })
  .then(() => {
    console.log('✔️ Report sent to Telegram');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Telegram send error:', err && err.message ? err.message : err);
    process.exit(1);
  });
