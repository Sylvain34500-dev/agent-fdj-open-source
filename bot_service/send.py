# telegram/send.py (debug safe version)
import requests
import os
from utils.logger import log

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

def _masked(token: str) -> str:
    if not token:
        return "<NONE>"
    if len(token) > 8:
        return token[:6] + "..." + token[-3:]
    return token

def send_telegram_message(preds):
    """
    Envoi principal. Ajoute logs de debug pour voir env + réponse.
    """
    log(f"🔎 send_telegram_message called. TELEGRAM_TOKEN={_masked(TELEGRAM_TOKEN)} CHAT_ID={CHAT_ID}")

    if not TELEGRAM_TOKEN or not CHAT_ID:
        log("❌ TELEGRAM_TOKEN ou CHAT_ID manquant dans Render. Vérifie Settings > Environment.")
        return

    # si preds vide -> envoi message test pour debug
    if not preds:
        message = "🧪 Test message from Agent FDJ — pipeline ran but no predictions to send."
    else:
        # construction message normal
        message = "🎯 PRONOS FDJ\n\n"
        try:
            for p in preds:
                match = p.get("match", "Match inconnu")
                prediction = p.get("prediction", "N/A")
                confidence = p.get("confidence", "N/A")
                message += f"🏟️ {match}\n📊 {prediction}\n💡 {confidence}%\n\n"
        except Exception as e:
            message += f"⚠️ Erreur format prédictions: {e}\n"

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }

    try:
        res = requests.post(url, json=payload, timeout=15)
        log(f"📡 Telegram HTTP status: {res.status_code}")
        try:
            log(f"📡 Telegram response: {res.text[:800]}")
        except Exception:
            log("📡 Telegram response: <could not read body>")
        if res.status_code != 200:
            log("❌ Telegram did not accept the message.")
    except Exception as e:
        log(f"❌ Exception sending Telegram: {e}")

def send_test_message():
    send_telegram_message([])

