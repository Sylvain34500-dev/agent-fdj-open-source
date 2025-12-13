import os
import requests
from utils.logger import log
from main import run

TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")


def send_message(text: str, chat_id: str = None):
    if not chat_id:
        chat_id = CHAT_ID

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": chat_id, "text": text}, timeout=10)
    except Exception as e:
        log(f"[send_message] Erreur: {e}")


def handle_update(update: dict):
    try:
        message = update.get("message", {})
        if not message:
            return "ok"

        chat_id = message["chat"]["id"]
        text = message.get("text", "").strip().lower()

        log(f"[Webhook] {text}")

        if text == "/start":
            send_message("🤖 Bot opérationnel. Envoie /run", chat_id)

        elif text in ("/run", "/fdj"):
            send_message("⏳ Lancement du pipeline FDJ...", chat_id)

            run()  # 🔥 SYNCHRONE

        return "ok"

    except Exception as e:
        log(f"[handler] Erreur: {e}")
        return "ok"

