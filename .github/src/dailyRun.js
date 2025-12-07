// src/dailyRun.js
require("dotenv").config(); // lit .env si présent (utile en local)
const { scrapePronosoft } = require("./scraper/pronosoft");
const { sendTelegramMessage } = require("./telegram");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in env.");
  process.exit(1);
}

function escapeHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

(async function main() {
  try {
    const matches = await scrapePronosoft();

    if (!matches || matches.length === 0) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "⚠️ Aucun match trouvé aujourd'hui sur Pronosoft.");
      return;
    }

    let msg = `<b>📊 Pronostics du jour</b>\n\n`;
    // limite par exemple aux 30 premiers
    matches.slice(0, 50).forEach(m => {
      msg += `<b>${escapeHtml(m.teams)}</b>\n`;
      if (m.time) msg += `⏰ ${escapeHtml(m.time)}\n`;
      if (m.odds) {
        const h = m.odds.home || "-";
        const n = m.odds.draw || "-";
        const a = m.odds.away || "-";
        msg += `💸 ${escapeHtml(h)} | ${escapeHtml(n)} | ${escapeHtml(a)}\n`;
      }
      if (m.comment) {
        msg += `📝 ${escapeHtml(m.comment)}\n`;
      }
      msg += `\n`;
    });

    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, msg);
    console.log("Message envoyé");
  } catch (err) {
    console.error("dailyRun error:", err && err.message || err);
    // en cas d'erreur, on envoie un message d'erreur (optionnel)
    try {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, "❌ Erreur lors du scrape / envoi : " + (err && err.message));
    } catch (e) { /* ignore */ }
    process.exit(1);
  }
})();
