# telegram/send.py
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
    log(f"[TELEGRAM] send_telegram_message called")
    log(f"[TELEGRAM] TOKEN={_masked(TELEGRAM_TOKEN)} CHAT_ID={CHAT_ID}")

    if not TELEGRAM_TOKEN or not CHAT_ID:
        log("❌ TELEGRAM_TOKEN ou CHAT_ID manquant dans Render.")
        return

    if not preds:
        message = "🧪 Test message: pipeline executed but no predictions available."
    else:
        message = "🎯 PRONOS FDJ\n\n"
        for p in preds:
            try:
                match = p.get("match", "Match inconnu")
                prediction = p.get("prediction", "N/A")
                confidence = p.get("confidence", "N/A")
                message += f"🏟️ {match}\n📊 {prediction}\n💡 {confidence}%\n\n"
            except:
                pass

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }

    try:
        res = requests.post(url, json=payload, timeout=15)
        log(f"[TELEGRAM] Status: {res.status_code}")
        log(f"[TELEGRAM] Response: {res.text}")

        if res.status_code != 200:
            log("❌ Telegram rejected the message. Check CHAT_ID & if bot started.")
    except Exception as e:
        log(f"❌ Exception during Telegram send: {e}")

def send_test_message():
    send_telegram_message([])
