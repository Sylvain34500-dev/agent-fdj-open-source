# main.py — TEST Phase 2.1 Pronosoft NORMALISÉ

from scraping.pronosoft import scrape_pronosoft
from bot_service.send import send_telegram_message
from utils.logger import log
import json

def run_pipeline():
    log("🧪 TEST Phase 2.1 — Pronosoft normalisé")

    events = scrape_pronosoft()

    if not events:
        send_telegram_message([{
            "match": "TEST",
            "prediction": "❌ Aucun événement retourné",
            "confidence": 0
        }])
        return

    # On prend 1 événement pour vérifier la structure
    sample = events[0]

    message = (
        "🧪 TEST Phase 2.1 — STRUCTURE\n\n"
        f"Source: {sample.get('source')}\n"
        f"Sport: {sample.get('sport')}\n"
        f"Compétition: {sample.get('competition')}\n"
        f"Match: {sample.get('match', {}).get('team1')} vs {sample.get('match', {}).get('team2')}\n"
        f"Date: {sample.get('match', {}).get('date')}\n"
        f"Heure: {sample.get('match', {}).get('time')}\n\n"
        f"Total événements: {len(events)}"
    )

    send_telegram_message([{
        "match": "TEST Pronosoft",
        "prediction": message,
        "confidence": 100
    }])

if __name__ == "__main__":
    run_pipeline()
