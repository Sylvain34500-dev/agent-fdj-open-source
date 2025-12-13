import requests
import os
from utils.logger import log

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

def send_telegram_message(preds):
    log("[TELEGRAM] Envoi du message")

    if not TELEGRAM_TOKEN or not CHAT_ID:
        log("❌ TELEGRAM_TOKEN ou CHAT_ID manquant")
        return

    if not preds:
        message = "⚠️ Aucun pronostic disponible."
    else:
        message = "🎯 PRONOS FDJ\n\n"
        for p in preds:
            message += (
                f"🏟️ {p.get('match')}\n"
                f"📊 {p.get('prediction')}\n"
                f"💡 {p.get('confidence')}%\n\n"
            )

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

    payload = {
        "chat_id": CHAT_ID,
        "text": message
    }

    try:
        res = requests.post(url, json=payload, timeout=15)
        log(f"[TELEGRAM] Status {res.status_code}")
    except Exception as e:
        log(f"❌ Telegram error: {e}")
