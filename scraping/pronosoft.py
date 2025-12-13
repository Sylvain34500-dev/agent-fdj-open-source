# scraping/pronosoft.py

from utils.logger import log

def scrape_pronosoft():
    """
    Scraper Pronosoft – Version initiale simple (pré-normalisation)
    """

    log("📊 Pronosoft | Scraping démarré (mode simple)")

    events = []

    # 🔴 Données simulées temporaires
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
            "confidence": 78
        }
    })

    log(f"📊 Pronosoft | {len(events)} événement(s) collecté(s)")
    return events
