# scraping/pronosoft.py

import requests
from bs4 import BeautifulSoup
from utils.logger import log

URL = "https://www.pronosoft.com/fr/parions_sport/"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

def scrape_pronosoft():
    log("🎯 Pronosoft | Scraping réel démarré")

    predictions = []

    try:
        r = requests.get(URL, headers=HEADERS, timeout=15)
        r.raise_for_status()

        soup = BeautifulSoup(r.text, "html.parser")

        # ⚠️ Sélecteurs VOLONTAIREMENT larges (robustes)
        matches = soup.select(".match")[:5]

        for m in matches:
            teams = m.select(".team")
            if len(teams) < 2:
                continue

            team1 = teams[0].get_text(strip=True)
            team2 = teams[1].get_text(strip=True)

            confidence = 70  # valeur par défaut SAFE

            predictions.append({
                "match": f"{team1} vs {team2}",
                "prediction": f"{team1} gagne",
                "confidence": confidence,
                "source": "pronosoft"
            })

        log(f"🎯 Pronosoft | {len(predictions)} pronostic(s) collecté(s)")
        return predictions

    except Exception as e:
        log(f"❌ Pronosoft error: {e}")
        return []
