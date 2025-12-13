# scraping/flashscore.py

from utils.logger import log


def scrape_flashscore():
    """
    Flashscore scraper — VERSION NORMALISÉE (Phase 2.2)

    - Même format que Pronosoft
    - Données simulées propres
    - Aucun matching / logique métier ici
    """

    log("[FLASHSCORE] Scraping démarré (format normalisé)")

    results = []

    try:
        # Données simulées temporaires
        fake_events = [
            {
                "sport": "football",
                "competition": "Ligue 1",
                "team1": "PSG",
                "team2": "Marseille",
                "date": "2025-12-13",
                "time": "21:00",
                "extra": {
                    "status": "scheduled"
                }
            }
        ]

        for event in fake_events:
            results.append({
                "source": "flashscore",
                "sport": event["sport"],
                "competition": event["competition"],
                "match": {
                    "team1": event["team1"],
                    "team2": event["team2"],
                    "date": event["date"],
                    "time": event["time"]
                },
                "data": event.get("extra", {})
            })

        log(f"[FLASHSCORE] {len(results)} événements normalisés")
        return results

    except Exception as e:
        log(f"[FLASHSCORE] Erreur scraper : {e}")
        return []
