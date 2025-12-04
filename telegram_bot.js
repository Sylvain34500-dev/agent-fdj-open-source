// telegram_bot.js — version propre, simple et stable

import fs from "fs/promises";
import TelegramBot from "node-telegram-bot-api";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Sécurité : Vérifier que le token existe
if (!TOKEN) {
  console.error("❌ ERREUR : TELEGRAM_BOT_TOKEN est manquant !");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

const DAILY_FILE = "./daily_bets.txt";

// Fonction : lire le fichier avec gestion d’erreur
async function getDailyBets() {
  try {
    const txt = await fs.readFile(DAILY_FILE, "utf8");
    return txt.trim();
  } catch (err) {
    console.error("❌ Impossible de lire daily_bets.txt :", err);
    return null;
  }
}

// Commande unique : /bets
bot.onText(/\/bets/, async (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "📡 Récupération des paris du jour…");

  const bets = await getDailyBets();

  if (!bets) {
    return bot.sendMessage(
      chatId,
      "❌ Aucun pronostic disponible. Lance le script :\n\n`node fetch_and_score.js && node index.js`",
      { parse_mode: "Markdown" }
    );
  }

  // Envoi du message formaté
  await bot.sendMessage(chatId, bets, { parse_mode: "Markdown" });

  // Envoi du fichier en pièce jointe (optionnel mais propre)
  await bot.sendDocument(chatId, DAILY_FILE).catch(() => {});
});

// Message d’accueil
bot.on("polling_error", (err) => console.error("💥 POLLING ERROR :", err));

console.log("🤖 Bot Telegram démarré : commande disponible → /bets");
