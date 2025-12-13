# bot_service/bot.py
import requests
from config.settings import TELEGRAM_TOKEN, CHAT_ID
from utils.logger import log

# -----------------------------------------
# Envoi d'un message Telegram
# -----------------------------------------
def send_message(text: str, chat_id: str = None):
    if not chat_id:
        chat_id = CHAT_ID

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text
    }

    try:
        r = requests.post(url, json=payload, timeout=15)
        if r.status_code != 200:
            log(f"[TELEGRAM] Error {r.status_code}: {r.text}")
        return r.json()
    except Exception as e:
        log(f"[TELEGRAM] Send error: {e}")


# -----------------------------------------
# Message de test
# -----------------------------------------
def send_test_message():
    log("[TELEGRAM] Test message")
    send_message("🤖 Bot opérationnel et connecté.")
