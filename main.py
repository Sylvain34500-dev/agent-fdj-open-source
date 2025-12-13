# main.py — TEST Phase 2.1 Pronosoft normalisé

from scraping.pronosoft import scrape_pronosoft
from utils.logger import log

def run_pipeline():
    log("🧪 TEST Phase 2.1 — Pronosoft normalisé")

    data = scrape_pronosoft()

    if not data:
        log("❌ Aucun événement retourné par Pronosoft")
        return

    log(f"✅ Nombre d'événements normalisés : {len(data)}")

    # Affiche un exemple pour validation structure
    first = data[0]

    log("📌 Exemple d'événement :")
    log(first)

if __name__ == "__main__":
    run_pipeline()
