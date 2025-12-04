const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

// Charger le token depuis config.json
const config = require("./config.json");
const token = config.TELEGRAM_BOT_TOKEN; 

// Initialiser le bot
const bot = new TelegramBot(token, { polling: true });

// Chemin vers le fichier daily_bets.txt
const betsFile = path.join(__dirname, "daily_bets.txt");

// Fonction pour lire le fichier des pronostics
function getDailyBets() {
  try {
    return fs.readFileSync(betsFile, "utf8");
  } catch (err) {
    console.error("Erreur lors de la lecture de daily_bets.txt :", err);
    return "⚠️ Impossible de charger les pronostics aujourd'hui.";
  }
}

// Commande unique : /today
bot.onText(/\/today/, (msg) => {
  const chatId = msg.chat.id;

  const content = getDailyBets();

  bot.sendMessage(chatId, content, {
    parse_mode: "Markdown"
  });
});

// Message d'accueil lorsque quelqu’un dit “bonjour” (optionnel)
bot.on("message", (msg) => {
  const text = msg.text.toLowerCase();

  if (text.includes("bonjour") || text.includes("salut")) {
    bot.sendMessage(msg.chat.id, 
      "👋 Salut ! Tape /today pour recevoir les pronostics du jour."
    );
  }
});
