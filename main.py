from utils.logger import log

from scraping.pronosoft import scrape_pronosoft
from scraping.flashscore import scrape_flashscore

from analysis.analyzer import analyze
from bot_service.send import send_telegram_message


def run():
    log("🚀 DÉMARRAGE PIPELINE FDJ")

    # -----------------------------
    # 1) SCRAPING PRONOSOFT
    # -----------------------------
    try:
        log("🌐 Scraping Pronosoft...")
        pronosoft_matches = scrape_pronosoft()
    except Exception as e:
        log(f"❌ Erreur Pronosoft : {e}")
        pronosoft_matches = []

    if not pronosoft_matches:
        log("⚠️ Aucun match Pronosoft trouvé")

    # -----------------------------
    # 2) SCRAPING FLASHSCORE
    # -----------------------------
    try:
        log("🌐 Scraping Flashscore...")
        flashscore_data = scrape_flashscore()
    except Exception as e:
        log(f"❌ Erreur Flashscore : {e}")
        flashscore_data = []

    # -----------------------------
    # 3) FUSION / NORMALISATION
    # -----------------------------
    matches = []

    for m in pronosoft_matches:
        matches.append({
            "match": m.get("match"),
            "cotes": m.get("cotes", {})
        })

    log(f"📦 {len(matches)} matchs prêts pour analyse")

    # -----------------------------
    # 4) ANALYSE
    # -----------------------------
    predictions = analyze(matches)

    # -----------------------------
    # 5) TELEGRAM
    # -----------------------------
    send_telegram_message(predictions)

    log("✅ PIPELINE FDJ TERMINÉ")


# IMPORTANT : ne jamais exécuter automatiquement
if __name__ == "__main__":
    run()
