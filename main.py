# main.py — pipeline avec normalizer + auto-run Render

import threading
import time
import requests

from scraping.pronosoft import scrape_pronosoft
from scraping.flashscore import scrape_flashscore
from predictions.normalizer import normalize
from bot_service.send import send_telegram_message
from utils.logger import log


# =========================
# PIPELINE PRINCIPAL
# =========================

def run_pipeline():
    log("🚀 Lancement du pipeline")

    # --- scrapers ---
    pronosoft_data = scrape_pronosoft()
    flashscore_data = scrape_flashscore()

    # --- normalisation ---
    normalized_matches = normalize(
        pronosoft_data,
        flashscore_data
    )

    predictions = []

    if not normalized_matches:
        send_telegram_message([])
        return

    for match in normalized_matches:
        predictions.append({
            "match": f"{match['match']['team1']} vs {match['match']['team2']}",
            "prediction": "Match détecté",
            "confidence": 100
        })

    send_telegram_message(predictions)


# =========================
# AUTO-RUN (GRATUIT / RENDER)
# =========================

AUTO_RUN_INTERVAL_HOURS = 6  # ⏱️ toutes les 6 heures

def auto_run_pipeline():
    # Laisse le temps à Render de démarrer
    time.sleep(60)

    while True:
        try:
            log("⏳ Auto-run : déclenchement du pipeline")
            response = requests.get(
                "https://agent-fdj-open-source.onrender.com/run",
                timeout=15
            )
            log(f"✅ Auto-run status : {response.status_code}")
        except Exception as e:
            log(f"❌ Auto-run error : {e}")

        time.sleep(AUTO_RUN_INTERVAL_HOURS * 60 * 60)


def start_auto_runner():
    thread = threading.Thread(
        target=auto_run_pipeline,
        daemon=True
    )
    thread.start()
    log("🚀 Auto-run thread lancé")


# =========================
# ENTRYPOINT
# =========================

if __name__ == "__main__":
    start_auto_runner()
    run_pipeline()
