import express from "express";
import bodyParser from "body-parser";
import { handleUpdate } from "./telegram_bot.js"; // ton script Bot

const app = express();
app.use(bodyParser.json());

// Route pour Telegram
app.post(`/webhook/${process.env.TELEGRAM_TOKEN}`, (req, res) => {
  handleUpdate(req.body);
  res.sendStatus(200);
});

// Health check (Render)
app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
