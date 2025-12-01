import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const configPath = path.resolve("config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const webhookUrl = config.discordWebhookDaily;

async function postToDiscord(message) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });
  } catch (err) {
    console.error("Erreur en envoyant le message Discord:", err);
  }
}

function formatBet(bet) {
  return `🎯 **${bet.match}**
🏆 Pari : ${bet.bet}
📊 Cote : ${bet.odds}
📅 Date : ${bet.date}`;
}

async function run() {
  try {
    const betsPath = path.resolve("daily_bets.txt");

    if (!fs.existsSync(betsPath)) {
      await postToDiscord("❌ Aucun fichier daily_bets.txt trouvé.");
      return;
    }

    const raw = fs.readFileSync(betsPath, "utf8").trim();
    if (!raw) {
      await postToDiscord("⚠️ Le fichier daily_bets.txt est vide.");
      return;
    }

    const bets = raw
      .split("\n")
      .map((line) => {
        const parts = line.split(" | ");
        return {
          match: parts[0]?.replace("Match: ", "").trim(),
          bet: parts[1]?.replace("Bet: ", "").trim(),
          odds: parts[2]?.replace("Odds: ", "").trim(),
          date: parts[3]?.replace("Date: ", "").trim(),
        };
      });

    let message = "📢 **Pronostics du jour**\n\n";
    for (const bet of bets) {
      message += formatBet(bet) + "\n\n";
    }

    await postToDiscord(message);

  } catch (err) {
    console.error("Erreur lors de l'exécution du script:", err);
    await postToDiscord("❌ Une erreur est survenue lors du traitement des paris.");
  }
}

run();
