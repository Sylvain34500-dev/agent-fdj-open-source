# bot_service/handler.py
import os
from utils.logger import log
from analysis.analyzer import analyze
from scraping.pronosoft import scrape_pronosoft
from bot_service.send import send_telegram_message

def handle_update(update: dict):
    try:
        if not isinstance(update, dict):
            return "ok"

        message = update.get("message", {})
        if not message:
            return "ok"

        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "").strip().lower()

        log(f"[Telegram] {text} from {chat_id}")

        if text in ("/start", "start"):
            send_telegram_message([{
                "match": "Bot prêt",
                "prediction": "Envoie /run",
                "confidence": 100
            }])

        elif text in ("/run", "/fdj"):
            log("[BOT] Lancement pipeline")

            matches = scrape_pronosoft()
            preds = analyze(matches)

            send_telegram_message(preds)

        return "ok"

    except Exception as e:
        log(f"[handle_update] Erreur: {e}")
        return "ok"
