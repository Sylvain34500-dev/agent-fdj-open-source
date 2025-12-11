import requests
from bs4 import BeautifulSoup
from utils.logger import log
from config.settings import PRONOSOFT_URL


def scrape_pronosoft():
    log("Scraping Pronosoft...")

    response = requests.get(PRONOSOFT_URL)
    if response.status_code != 200:
        log(f"Erreur HTTP {response.status_code}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")

    # Extraction simple (à améliorer ensuite)
    matches = []
    rows = soup.select("tr")

    for row in rows:
        cols = row.find_all("td")
        if len(cols) >= 3:
            match = {
                "team1": cols[0].text.strip(),
                "team2": cols[1].text.strip(),
                "cotes": cols[2].text.strip(),
            }
            matches.append(match)

    log(f"{len(matches)} matchs trouvés.")
    return matches
