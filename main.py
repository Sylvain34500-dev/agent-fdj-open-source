# main.py

from scraping.pronosoft import scrape_pronosoft
from scraping.flashscore import scrape_flashscore
from predictions.normalizer import normalize
from bot_service.send import send_telegram_message
from utils.logger import log


def run_pipeline():
    log("🚀 Lancement du pipeline")

    pronosoft_data = scrape_pronosoft()
    flashscore_data = scrape_flashscore()

    normalized_matches = normalize(
        pronosoft_data,
        flashscore_data
    )

    if not normalized_matches:
        send_telegram_message("❌ Aucun match détecté aujourd’hui.")
        log("❌ Aucun match détecté")
        return

    messages = []

    for match in normalized_matches:
        messages.append(
            f"⚽ {match['match']['team1']} vs {match['match']['team2']}\n"
            f"📅 {match['match']['date']} {match['match']['time']}\n"
            f"🔥 Source : {match['source']}"
        )

    for msg in messages:
        send_telegram_message(msg)

    log("✅ Pipeline terminé")


if __name__ == "__main__":
    run_pipeline()
