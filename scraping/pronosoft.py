# scraping/pronosoft.py
"""
Pronosoft scraper — VERSION NORMALISÉE (Phase 2.1)

Objectif :
- Format standard commun à TOUS les scrapers
- Aucun élément codé en dur critique
- Compatible pipeline existant
"""

from utils.logger import log


def scrape_pronosoft():
    log("[PRONOSOFT] Scraping démarré (format normalisé)")

    results = []

    try:
        # Données simulées temporaires
        fake_events = [
            {
                "sport": "football",
                "competition": "Ligue 1",
                "team1": "Équipe A",
                "team2": "Équipe B",
                "date": "2025-12-13",
                "time": "21:00",
                "extra": {"confidence": 78}
            },
            {
                "sport": "football",
                "competition": "Premier League",
                "team1": "Équipe C",
                "team2": "Équipe D",
                "date": "2025-12-14",
                "time": "18:30",
                "extra": {"confidence": 64}
            }
        ]

        for event in fake_events:
            results.append({
                "source": "pronosoft",
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

        log(f"[PRONOSOFT] {len(results)} événements normalisés")
        return results

    except Exception as e:
        log(f"[PRONOSOFT] Erreur scraper : {e}")
        return []
