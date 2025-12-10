// send_daily_report.cjs
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('⚠️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant');
  process.exit(1);
}

// Chemin correct vers picks.json
const PICKS_PATH = path.join(__dirname, 'picks.json');

let picks;
try {
  picks = JSON.parse(fs.readFileSync(PICKS_PATH, 'utf8'));
} catch (e) {
  console.error('⚠️ Erreur lecture picks.json', e);
  process.exit(1);
}

if (!Array.isArray(picks) || picks.length === 0) {
  console.log('⚠️ Aucun pick disponible.');
  process.exit(0);
}

let text = `📊 *Pronostics du jour* 💰\n`;
text += `_Généré: ${new Date().toLocaleString('fr-FR')}_\n\n`;

picks.slice(0, 10).forEach((p, i) => {
  text += `*${i + 1}.* Match ID: ${p.matchId}\n`;
  text += `➡️ Pari: *${p.side.toUpperCase()}*\n`;
  text += `➡️ Cote: ${p.odds}\n`;
  text += `➡️ Stake: ${p.stake}€\n\n`;
});

// Telegram
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

bot.sendMessage(CHAT_ID, text, { parse_mode: "Markdown" })
  .then(() => {
    console.log('✔️ Envoyé sur Telegram');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Telegram Error:', err);
    process.exit(1);
  });
