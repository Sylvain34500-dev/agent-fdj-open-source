# telegram/send.py
import requests
import os
from utils.logger import log

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")


def send_telegram_message(preds):
    """
    Envoie un message Telegram propre avec les prédictions FDJ.
    """
    if not TELEGRAM_TOKEN or not CHAT_ID:
        log("❌ TELEGRAM_TOKEN ou CHAT_ID manquant dans Render.")
        return

    message = "🎯 *PRONOS FDJ – Dernier Run*\n\n"

    if not preds:
        message += "⚠️ Aucune prédiction trouvée.\n"
    else:
        for p in preds:
            try:
                match = p.get("match", "Match inconnu")
                prediction = p.get("prediction", "N/A")
                confidence = p.get("confidence", "N/A")

                message += (
                    f"🏟️ *{match}*\n"
                    f"📊 {prediction}\n"
                    f"💡 Confiance : {confidence}%\n\n"
                )
            except Exception as e:
                message += f"⚠️ Erreur en formatant une prédiction : {e}\n\n"

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }

    try:
        res = requests.post(url, json=payload)
        if res.status_code == 200:
            log("📨 Message Telegram envoyé avec succès !")
        else:
            log(f"❌ Erreur Telegram : {res.text}")
    except Exception as e:
        log(f"❌ Exception en envoyant Telegram : {e}")
