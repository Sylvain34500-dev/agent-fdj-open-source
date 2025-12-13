# main.py — Render compatible (serveur + pipeline)

import threading
import time

from flask import Flask, jsonify

from scraping.pronosoft import scrape_pronosoft
from scraping.flashscore import scrape_flashscore
from predictions.normalizer import normalize
from bot_service.send import send_telegram_message
from utils.logger import log


app = Flask(__name__)


# =========================
# PIPELINE
# =========================

def run_pipeline():
    log("🚀 Lancement du pipeline")

    pronosoft_data = scrape_pronosoft()
    flashscore_data = scrape_flashscore()

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
# ROUTES HTTP
# =========================

@app.route("/", methods=["GET", "HEAD"])
def healthcheck():
    return "", 200


@app.route("/run", methods=["GET", "HEAD"])
def run_endpoint():
    threading.Thread(target=run_pipeline).start()
    return jsonify({"status": "pipeline launched"}), 200


# =========================
# START
# =========================

if __name__ == "__main__":
    log("🌍 Serveur Flask prêt")
    app.run(host="0.0.0.0", port=10000)
