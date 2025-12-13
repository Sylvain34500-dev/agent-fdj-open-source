# main.py — pipeline avec normalizer

from scraping.pronosoft import scrape_pronosoft
from scraping.flashscore import scrape_flashscore
from predictions.normalizer import normalize
from bot_service.send import send_telegram_message
from utils.logger import log


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


if __name__ == "__main__":
    run_pipeline()
