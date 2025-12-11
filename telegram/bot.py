import requests
from utils.logger import log
from config.settings import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID


def send_telegram_message(preds):
    log("Envoi Telegram...")

    if TELEGRAM_BOT_TOKEN == "A_REMPLACER":
        log("⚠️ Token Telegram non configuré. Message non envoyé.")
        return

    text = "🟢 PRONOSTICS DU JOUR\n\n"
    for m in preds[:5]:  # On limite pour éviter spam
        text += f"{m['team1']} vs {m['team2']} → {m['prediction']}\n"

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": text}

    requests.post(url, json=payload)

    log("Message Telegram envoyé.")
