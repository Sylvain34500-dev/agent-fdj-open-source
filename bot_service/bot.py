import requests
from config.settings import TELEGRAM_TOKEN, CHAT_ID, RENDER_EXTERNAL_URL
from utils.logger import log

def send_message(text: str):
    if not TELEGRAM_TOKEN or not CHAT_ID:
        log("❌ TELEGRAM_TOKEN ou CHAT_ID manquant")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

    payload = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "Markdown"
    }

    try:
        r = requests.post(url, json=payload, timeout=15)
        log(f"[Telegram] status={r.status_code}")
        if r.status_code != 200:
            log(r.text)
    except Exception as e:
        log(f"Telegram send error: {e}")


def send_test_message(text: str):
    log("Sending test Telegram message...")
    send_message(text)


def handle_run_command():
    """
    Appelle l’endpoint Flask /run
    """
    try:
        log("User triggered /run command")

        endpoint = f"{RENDER_EXTERNAL_URL}/run"
        r = requests.get(endpoint, timeout=30)

        if r.status_code == 200:
            send_message("🚀 Pipeline lancé avec succès")
        else:
            send_message(f"⚠️ Erreur Run {r.status_code}")

    except Exception as e:
        log(f"Run command error: {e}")
        send_message(f"❌ Impossible de lancer le pipeline : {e}")
