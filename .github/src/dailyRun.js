import { scrapePronosoft } from "./scraper/pronosoft.js";
import { sendTelegramMessage } from "./telegram.js";

async function main() {
  const matches = await scrapePronosoft();

  let msg = "📊 *Pronostics du jour*\n\n";

  for (const m of matches) {
    msg += `⏰ ${m.time}\n`;
    msg += `🆚 ${m.teams}\n`;
    msg += `💸 ${m.odds.home} / ${m.odds.draw} / ${m.odds.away}\n`;
    if (m.comment) msg += `📝 ${m.comment}\n\n`;
  }

  await sendTelegramMessage(msg);
}

main();
