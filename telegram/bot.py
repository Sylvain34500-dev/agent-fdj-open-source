import requests
from config.settings import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
from utils.logger import log

def send_message(text: str):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = {"chat_id": TELEGRAM_CHAT_ID, "text": text}

    try:
        r = requests.post(url, data=data)
        if r.status_code != 200:
            log(f"Telegram error: {r.text}")
        return r.json()
    except Exception as e:
        log(f"Telegram send error: {e}")


def send_test_message(text: str):
    log("Sending test Telegram message...")
    send_message(text)
