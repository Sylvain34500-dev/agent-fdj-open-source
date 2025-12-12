# bot_service/handler.py
import os
import requests
from utils.logger import log

TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

def send_message(text: str):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": CHAT_ID, "text": text})
    except Exception as e:
        log(f"Erreur send_message: {e}")

def handle_update(update: dict):
    """
    Traitement simple des updates Telegram envoyés au webhook.
    Gère la commande /run ou /fdj (en adaptant).
    """
    if not isinstance(update, dict):
        return

    # Vérifie message
    if "message" not in update:
        return

    message = update["message"]
    text = message.get("text", "").strip().lower()

    # Commande de déclenchement
    if text in ("/run", "/fdj", "/start"):
        send_message("🔁 Lancement du pipeline... (reçu)")
        try:
            # appelé la fonction main en tant que module (ne bloque pas le webhook car le run est long)
            # on lance main.py en sous-processus pour être sûr d'isoler
            import subprocess
            subprocess.Popen(["python3", "main.py"])
            send_message("✅ Pipeline démarré (en arrière-plan).")
        except Exception as e:
            log(f"Erreur lancement pipeline via handler: {e}")
            send_message(f"❌ Erreur lors du lancement: {e}")
