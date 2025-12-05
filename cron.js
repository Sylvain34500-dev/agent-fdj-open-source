// cron.js
import axios from "axios";

const BOT_URL = process.env.BOT_URL;

async function triggerBot() {
  try {
    const response = await axios.get(`${BOT_URL}/run-cron`);
    console.log("Cron executed:", response.data);
  } catch (error) {
    console.error("Cron error:", error.message);
  }
}

triggerBot();
