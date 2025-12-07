// src/telegram.js
const axios = require("axios");

async function sendTelegramMessage(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    }, { timeout: 15000 });
    return res.data;
  } catch (err) {
    console.error("Telegram send error:", err && err.response && err.response.data || err.message);
    throw err;
  }
}

module.exports = { sendTelegramMessage };
