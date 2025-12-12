# bot_service/handler.py
import os
import requests
import subprocess
from utils.logger import log

TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")


def send_message(text: str, chat_id: str = None):
    """
    Envoie un message Telegram.
    Si aucun chat_id n'est donné, utilise le CHAT_ID des variables d'environnement.
    """
    if not chat_id:
        chat_id = CHAT_ID

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    try:
        requests.post(url, json={"chat_id": chat_id, "text": text})
    except Exception as e:
        log(f"[send_message] Erreur: {e}")


def handle_update(update: dict):
    """
    Reçoit l'update Telegram envoyé au webhook.
    Gère /start, /run, /fdj.
    """
    try:
        if not isinstance(update, dict):
            log("[handle_update] Update invalide")
            return "ok"

        message = update.get("message", {})
        if not message:
            return "ok"

        chat = message.get("chat", {})
        chat_id = chat.get("id", CHAT_ID)
        text = message.get("text", "").strip().lower()

        log(f"[Webhook] Message reçu : {text} depuis chat_id {chat_id}")

        # ----- COMMANDES -----
        if text in ("/start", "start"):
            send_message("🤖 Bot opérationnel ! Envoie /run pour lancer les pronostics.", chat_id)

        elif text in ("/run", "/fdj"):
            send_message("🔄 Lancement du pipeline…", chat_id)

            try:
                # Exécute main.py en tâche de fond
                subprocess.Popen(["python3", "main.py"])
                send_message("✅ Pipeline lancé en arrière-plan.", chat_id)
            except Exception as e:
                log(f"[Webhook] Erreur lancement main.py : {e}")
                send_message(f"❌ Erreur lors du lancement : {e}", chat_id)

        return "ok"

    except Exception as e:
        log(f"[handle_update] Exception: {e}")
        return "ok"
