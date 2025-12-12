import requests
import os

TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

def handle_update(update):
    if "message" in update and "text" in update["message"]:
        text = update["message"]["text"]

        if text.lower() == "/fdj":
            send_message("⏳ Je lance les pronostics...")
            from main import main
            main()
            send_message("✅ Pronostics envoyés !")


def send_message(msg):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": CHAT_ID, "text": msg})
