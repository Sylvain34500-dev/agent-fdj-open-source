# telegram/handler.py
import os
import requests

TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

def send_message(text):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": CHAT_ID, "text": text})

def handle_update(update):
    # Vérification message
    if "message" not in update:
        return

    message = update["message"]
    text = message.get("text", "").lower()

    # Commande /fdj
    if text == "/fdj":
        send_message("⏳ Je lance les pronostics...")

        try:
            from main import main
            main()
            send_message("✅ Pronostics envoyés !")
        except Exception as e:
            send_message(f"❌ Erreur lors du traitement : {e}")
