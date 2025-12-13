# main.py — pipeline normal

from scraping.pronosoft import scrape_pronosoft
from bot_service.send import send_telegram_message
from utils.logger import log

def run_pipeline():
    log("🚀 Lancement du pipeline")

    data = scrape_pronosoft()

    predictions = []

    if data:
        predictions.append({
            "match": "Pronosoft",
            "prediction": f"{len(data)} événements collectés",
            "confidence": 100
        })

    send_telegram_message(predictions)

if __name__ == "__main__":
    run_pipeline()
