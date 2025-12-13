# scraping/pronosoft.py

from utils.logger import log

def scrape_pronosoft():
    """
    Scraper Pronosoft – Phase 2.1 (version brute)
    Données simulées pour valider le pipeline.
    """

    log("📊 Pronosoft | Scraping démarré (mode brut)")

    events = []

    # 🔴 TEMPORAIRE : données simulées
    events.append({
        "source": "pronosoft",
        "sport": "football",
        "competition": "Ligue 1",
        "match": {
            "team1": "Équipe A",
            "team2": "Équipe B",
            "date": "2025-12-13",
            "time": "21:00"
        },
        "data": {
            "confidence": 78
        }
    })

    events.append({
        "source": "pronosoft",
        "sport": "football",
        "competition": "Premier League",
        "match": {
            "team1": "Équipe C",
            "team2": "Équipe D",
            "date": "2025-12-14",
            "time": "18:30"
        },
        "data": {
            "confidence": 64
        }
    })

    log(f"📊 Pronosoft | {len(events)} événement(s) collecté(s)")
    return events
