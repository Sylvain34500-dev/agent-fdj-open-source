# main.py — Phase 2.3 (Pronosoft + Flashscore, sans matching)

from scraping.pronosoft import scrape_pronosoft
from scraping.flashscore import scrape_flashscore
from bot_service.send import send_telegram_message
from utils.logger import log

def run_pipeline():
    log("🚀 Lancement du pipeline (Pronosoft + Flashscore)")

    predictions = []

    # --- PRONOSOFT ---
    pronosoft_data = scrape_pronosoft()
    if pronosoft_data:
        predictions.append({
            "match": "Pronosoft",
            "prediction": f"{len(pronosoft_data)} événements collectés",
            "confidence": 100
        })

    # --- FLASHSCORE ---
    flashscore_data = scrape_flashscore()
    if flashscore_data:
        predictions.append({
            "match": "Flashscore",
            "prediction": f"{len(flashscore_data)} événements collectés",
            "confidence": 100
        })

    if not predictions:
        log("⚠️ Aucun événement collecté")
    
    send_telegram_message(predictions)

if __name__ == "__main__":
    run_pipeline()
