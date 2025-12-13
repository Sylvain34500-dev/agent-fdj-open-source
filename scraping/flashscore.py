# scraping/flashscore.py

from utils.logger import log


def scrape_flashscore():
    """
    Flashscore scraper — VERSION NORMALISÉE
    Données simulées propres
    """

    log("[FLASHSCORE] Scraping démarré")

    results = []

    try:
        fake_events = [
            {
                "sport": "football",
                "competition": "Ligue 1",
                "team1": "PSG",
                "team2": "Marseille",
                "date": "2025-12-13",
                "time": "21:00",
                "confidence": 100
            }
        ]

        for event in fake_events:
            results.append({
                "match": f"{event['team1']} vs {event['team2']}",
                "prediction": f"{event['team1']} gagne",
                "confidence": event["confidence"],
                "source": "flashscore"
            })

        log(f"[FLASHSCORE] {len(results)} événement(s) collecté(s)")
        return results

    except Exception as e:
        log(f"[FLASHSCORE] Erreur scraper : {e}")
        return []

