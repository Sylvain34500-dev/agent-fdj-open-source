import requests
from bs4 import BeautifulSoup
from utils.logger import log

PRONOSOFT_URL = "https://www.pronosoft.com/fr/parions_sport/liste-parions-sport-plein-ecran.htm"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

def scrape_pronosoft():
    log("🔍 Démarrage scraping Pronosoft")

    try:
        response = requests.get(PRONOSOFT_URL, headers=HEADERS, timeout=20)
        response.raise_for_status()
    except Exception as e:
        log(f"❌ Erreur HTTP Pronosoft : {e}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")

    matches = []

    rows = soup.select("tr")
    log(f"📄 {len(rows)} lignes détectées sur la page")

    for row in rows:
        cols = row.find_all("td")
        if len(cols) < 4:
            continue

        try:
            match = cols[0].get_text(strip=True)
            cote_1 = cols[1].get_text(strip=True)
            cote_n = cols[2].get_text(strip=True)
            cote_2 = cols[3].get_text(strip=True)

            matches.append({
                "match": match,
                "cotes": {
                    "1": cote_1,
                    "N": cote_n,
                    "2": cote_2
                }
            })
        except Exception:
            continue

    log(f"✅ {len(matches)} matchs extraits depuis Pronosoft")
    return matches

