import requests
from bs4 import BeautifulSoup
from datetime import datetime
from utils.logger import log

PRONOSOFT_URL = (
    "https://www.pronosoft.com/fr/parions_sport/"
    "liste-parions-sport-plein-ecran.htm"
)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}


def scrape_pronosoft():
    """
    Scraper Pronosoft
    Retourne une liste d'événements au FORMAT NORMALISÉ
    """
    log("🔎 [Pronosoft] Démarrage du scraping")

    results = []

    try:
        response = requests.get(PRONOSOFT_URL, headers=HEADERS, timeout=20)
        response.raise_for_status()
    except Exception as e:
        log(f"❌ [Pronosoft] Erreur requête : {e}")
        return results

    soup = BeautifulSoup(response.text, "html.parser")

    # ⚠️ Sélecteurs à ajuster si Pronosoft change
    rows = soup.select("tr")  # volontairement large (robuste au début)

    now_iso = datetime.utcnow().isoformat()

    for row in rows:
        cols = row.find_all("td")
        if len(cols) < 2:
            continue

        try:
            teams_text = cols[0].get_text(strip=True)
            if " - " not in teams_text:
                continue

            team1, team2 = teams_text.split(" - ", 1)

            event = {
                "source": "pronosoft",
                "sport": "football",
                "competition": None,
                "event": {
                    "id": None,
                    "participants": [
                        {"name": team1, "role": "home"},
                        {"name": team2, "role": "away"},
                    ],
                    "datetime": None,
                    "location": None,
                },
                "markets": {},
                "meta": {
                    "scraped_at": now_iso,
                    "confidence": None,
                    "raw": {
                        "row_text": row.get_text(strip=True)
                    },
                },
            }

            results.append(event)

        except Exception as e:
            log(f"⚠️ [Pronosoft] Erreur parsing ligne : {e}")
            continue

    log(f"✅ [Pronosoft] {len(results)} événements normalisés")
    return results
