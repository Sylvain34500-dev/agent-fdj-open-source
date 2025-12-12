import requests
from config.settings import TELEGRAM_TOKEN, CHAT_ID, RENDER_EXTERNAL_URL
from utils.logger import log

# -----------------------------------------
# Envoi d'un message simple
# -----------------------------------------
def send_message(text: str):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    data = {"chat_id": CHAT_ID, "text": text}

    try:
        r = requests.post(url, data=data)
        if r.status_code != 200:
            log(f"Telegram error: {r.text}")
        return r.json()
    except Exception as e:
        log(f"Telegram send error: {e}")


# -----------------------------------------
# Message de test
# -----------------------------------------
def send_test_message(text: str):
    log("Sending test Telegram message...")
    send_message(text)


# -----------------------------------------
# Commande /run → lance un run complet
# -----------------------------------------
def handle_run_command():
    """
    Appel l’endpoint Flask /run — Réexécute le pipeline complet.
    """
    try:
        log("User triggered /run command")

        endpoint = f"{RENDER_EXTERNAL_URL}/run"
        r = requests.get(endpoint, timeout=20)

        if r.status_code == 200:
            send_message("🚀 *Run lancé avec succès !*\n\nRésultat :\n" + r.text)
        else:
            send_message(f"⚠️ Erreur Run : {r.status_code}\n{r.text}")

    except Exception as e:
        send_message(f"❌ Impossible d’appeler /run : {e}")
        log(f"Run command error: {e}")
