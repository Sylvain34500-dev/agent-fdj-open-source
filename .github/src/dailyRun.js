// src/dailyRun.js
import "dotenv/config";
import { scrapePronosoft } from "./scraper/pronosoft.js";
import { sendTelegramMessage } from "./telegram.js";

// utile si tu veux filtrer par date/heure : on suppose matches du jour
function formatMatchesMessage(matches) {
  let msg = "📊 *Pronostics du jour*\n\n";
  if (!matches || matches.length === 0) {
    msg += "_Aucun match trouvé aujourd'hui._";
    return msg;
  }

  matches.forEach((m) => {
    msg += `*${m.competition || "Match"}*\n`;
    if (m.time) msg += `⏰ ${m.time}\n`;
    if (m.teams) msg += `🆚 ${m.teams}\n`;
    if (m.odds && (m.odds.home || m.odds.draw || m.odds.away)) {
      msg += `💸 ${m.odds.home || "-"} | ${m.odds.draw || "-"} | ${m.odds.away || "-"}\n`;
    }
    if (m.comment) {
      // tronque si trop long
      const c = (m.comment.length > 800) ? m.comment.slice(0, 800) + "…" : m.comment;
      msg += `📝 ${c}\n`;
    }
    msg += `\n`;
  });

  return msg;
}

async function main() {
  try {
    const matches = await scrapePronosoft();
    // tu peux filtrer ici pour ne garder que certains sports si besoin
    const message = formatMatchesMessage(matches);
    await sendTelegramMessage(message, { parse_mode: "Markdown" });
    console.log("Message envoyé. Matches:", matches.length);
  } catch (err) {
    console.error("dailyRun error:", err && err.message);
    // en cas d'erreur on peut envoyer un message d'alerte (optionnel)
  }
}

if (require.main === module) {
  main();
}

export default main;
