# scraping/flashscore.py

from utils.logger import log

def scrape_flashscore():
    """
    Scraper Flashscore – Phase 2.2
    Version brute, sans matching, sans dépendances externes.
    """
    log("⚽ Flashscore | Scraping démarré (mode brut)")

    events = []

    # 🔴 TEMPORAIRE : données simulées pour valider le pipeline
    # (on branchera le vrai scraping juste après)
    events.append({
        "source": "flashscore",
        "sport": "football",
        "competition": "Ligue 1",
        "match": {
            "team1": "PSG",
            "team2": "Marseille",
            "date": "2025-12-13",
            "time": "21:00"
        },
        "data": {
            "status": "scheduled"
        }
    })

    log(f"⚽ Flashscore | {len(events)} événement(s) collecté(s)")
    return events
