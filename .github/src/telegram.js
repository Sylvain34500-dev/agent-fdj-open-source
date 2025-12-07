// src/telegram.js
import axios from "axios";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn("⚠ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant(e).");
}

export async function sendTelegramMessage(text, options = {}) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variable.");
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: options.parse_mode || "Markdown",
    disable_web_page_preview: options.disable_web_page_preview ?? true
  };
  const res = await axios.post(url, payload);
  return res.data;
}
