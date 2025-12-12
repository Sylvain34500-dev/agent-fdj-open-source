# telegram/send.py
import requests
import os
from utils.logger import log

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

def send_telegram_message(preds):
    """
    Envoie un message formaté contenant les prédictions FDJ.
    """
    if not TELEGRAM_TOKEN or not CHAT_ID:
        log("❌ TELEGRAM_TOKEN ou CHAT_ID manquant dans les variables Render.")
        return

    # Format du message
    message = "🎯 *PRONOS FDJ – Dernier Run*\n\n"

    try:
        for p in preds:
            message += f"🏟️ *{p.get('match', 'Match inconnu')}*\n"
            message += f"📊 {p.get('prediction', 'N/A')}\n"
            message += f"💡 Confiance : {p.get('confidence', 'N/A')}%\n\n"
    except Exception:
        message += "⚠️ Impossible de formater les prédictions.\n"

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }

    res = requests.post(url, json=payload)

    if res.status_code == 200:
        log("📨 Message Telegram envoyé avec succès !")
    else:
        log(f"❌ Erreur Telegram : {res.text}")
