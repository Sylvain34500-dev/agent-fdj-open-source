# scraping/pronosoft.py

from utils.logger import log

def scrape_pronosoft():
    """
    Scraper Pronosoft – VERSION INITIALE (Phase 2.0)
    Données simulées pour validation du pipeline.
    """
    log("📊 Pronosoft | Scraping démarré (version initiale)")

    events = []

    # 🔴 DONNÉES SIMULÉES
    events.append({
        "source": "pronosoft",
        "sport": "football",
        "competition": "Ligue 1",
        "match": {
            "team1": "PSG",
            "team2": "Marseille",
            "date": "2025-12-13",
            "time": "21:00"
        },
        "data": {
            "confidence": 100
        }
    })

    log(f"📊 Pronosoft | {len(events)} événement(s) collecté(s)")
    return events
