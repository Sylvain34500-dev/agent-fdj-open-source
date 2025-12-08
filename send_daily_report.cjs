import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

async function sendReport() {
  if (!fs.existsSync("results.json")) {
    console.log("No results.json found! Run fetch first.");
    return;
  }

  const data = JSON.parse(fs.readFileSync("results.json", "utf8"));

  let message = "📊 *Rapport FDJ du jour:*\n\n";
  data.slice(0, 10).forEach(d => {
    message += `• Numéro ${d.number}: ${d.frequency} tirages\n`;
  });

  const bot = new TelegramBot(token, { polling: false });

  await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  console.log("Message sent to Telegram!");
}

sendReport();

