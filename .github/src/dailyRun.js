import "dotenv/config";
import { scrapePronosoft } from "./scraper/pronosoft.js";
import TelegramBot from "node-telegram-bot-api";

async function runDaily() {
  try {
    console.log("Scraping Pronosoft…");

    const matches = await scrapePronosoft();

    if (!matches || matches.length === 0) {
      throw new Error("Aucun match trouvé.");
    }

    let message = "🔥 *Ticket FDJ du jour* 🔥\n\n";

    for (const m of matches) {
      message += `🕒 *${m.time}*\n`;
      message += `⚽ ${m.teams}\n`;
      message += `📊 Cotes : ${m.odds.home} / ${m.odds.draw} / ${m.odds.away}\n`;

      if (m.comment) {
        message += `📝 *Analyse*: ${m.comment}\n`;
      }

      message += "\n";
    }

    // Telegram
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
      parse_mode: "Markdown",
    });

    console.log("Message envoyé à Telegram !");
  } catch (err) {
    console.error("Erreur dailyRun:", err);
  }
}

runDaily();

