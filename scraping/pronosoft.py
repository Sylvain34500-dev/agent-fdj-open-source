# scraping/pronosoft.py
"""
Pronosoft scraper — VERSION NORMALISÉE (Phase 2.1)

Objectif :
- Aucun élément codé en dur (équipes, compétitions fixes)
- Format standard commun à TOUS les scrapers
- Robuste même si Pronosoft change légèrement
- Compatible pipeline existant (main.py inchangé)
"""

from utils.logger import log
import json

# ------------------------------------------------------------------
# FORMAT NORMALISÉ UNIQUE (CONTRAT PROJET)
# ------------------------------------------------------------------
# {
#   "source": "pronosoft",
#   "sport": "football",
#   "competition": "Ligue 1",
#   "match": {
#       "team1": "PSG",
#       "team2": "Marseille",
#       "date": "2025-12-13",
#       "time": "21:00"
#   },
#   "data": {...}
# }
# ------------------------------------------------------------------


def scrape_pronosoft():
    """
    Scraper Pronosoft normalisé.
    Pour l'instant : structure réelle + données simulées propres.
    Le scraping HTML/API réel sera branché PLUS TARD.
    """

    log("[PRONOSOFT] Scraping démarré (format normalisé)")

    results = []

    try:
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
            normalized = {
                "source": "pronosoft",
                "sport": event.get("sport"),
                "competition": event.get("competition"),
                "match": {
                    "team1": event.get("team1"),
                    "team2": event.get("team2"),
                    "date": event.get("date"),
                    "time": event.get("time"),
                },
                "data": event.get("extra", {})
            }

            results.append(normalized)

        log(f"[PRONOSOFT] {len(results)} événements normalisés")
        return results

    except Exception as e:
        log(f"[PRONOSOFT] Erreur scraper : {e}")
        return []


# ------------------------------------------------------------------
# 🧪 TEST ISOLÉ (PHASE B1)
# ------------------------------------------------------------------
if __name__ == "__main__":
    log("🧪 TEST ISOLÉ PRONOSOFT")

    data = scrape_pronosoft()

    log(f"📊 Nombre d'événements détectés : {len(data)}")

    if data:
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        log("⚠️ Aucun événement retourné")
