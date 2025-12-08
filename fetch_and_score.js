// Fix fetch missing File object (patch Undici)
globalThis.File = class File {};

// Import fetch from undici
import { fetch } from "undici";

// Telegram
import TelegramBot from "node-telegram-bot-api";
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// -------------------
//  Fetch FDJ API
// -------------------
const url = "https://www.fdj.fr/api/game-services...";  // <-- mets ton URL ici

async function getScore() {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur api fdj");
  const data = await res.json();

  // Exemple d'extraction du score (adapter selon ta réponse réelle)
  const score = data?.score ?? "Pas disponible";

  return score;
}

// --------------------
// Send Telegram message
// --------------------
async function run() {
  try {
    const score = await getScore();

    const msg = `📊 Rapport FDJ du jour :
Score du jour: ${score}
Envoyé automatiquement 🚀`;

    await bot.sendMessage(TELEGRAM_CHAT_ID, msg);
    console.log("Message Telegram envoyé.");
  } catch (err) {
    console.error("Erreur:", err);
    await bot.sendMessage(TELEGRAM_CHAT_ID, "❌ Erreur FDJ\n" + err.message);
  }
}

run();
