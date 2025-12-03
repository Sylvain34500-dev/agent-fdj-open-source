const fs = require("fs");
const axios = require("axios");

// ==================================================
//  CONFIG — Remplace par TON token privé
// ==================================================
const TOKEN = process.env.TELEGRAM_TOKEN; // On va l'ajouter dans GitHub Secrets
const API = `https://api.telegram.org/bot${TOKEN}`;

// ==================================================
//  Fonction pour envoyer un message
// ==================================================
async function sendMessage(chatId, text) {
    await axios.post(`${API}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown"
    });
}

// ==================================================
//  Serveur simple pour recevoir les messages Telegram
// ==================================================
const http = require("http");
const PORT = process.env.PORT || 3000;

http.createServer(async (req, res) => {
    if (req.method === "POST") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            const update = JSON.parse(body);

            if (update.message) {
                const chatId = update.message.chat.id;
                const text = update.message.text;

                if (text === "/bets") {
                    let bets = fs.existsSync("daily_bets.txt")
                        ? fs.readFileSync("daily_bets.txt", "utf8")
                        : "❌ Aucun fichier daily_bets.txt trouvé.";

                    await sendMessage(chatId, bets);
                } else {
                    await sendMessage(chatId, "Envoie /bets pour recevoir les pronostics !");
                }
            }

            res.end("OK");
        });
    } else {
        res.end("Running");
    }
}).listen(PORT, () => console.log("Bot Telegram actif !"));
