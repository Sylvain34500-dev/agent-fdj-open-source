from utils.logger import log
from scraping.pronosoft import scrape_pronosoft
from analysis.analyzer import analyze
from telegram.send import send_telegram_message


def run_pipeline():
    log("🚀 PIPELINE FDJ DÉMARRÉ")

    matches = scrape_pronosoft()
    log(f"📥 Matchs récupérés : {len(matches)}")

    if not matches:
        log("⚠️ Aucun match récupéré, arrêt du pipeline")
        send_telegram_message([])
        return

    predictions = analyze(matches)

    if not predictions:
        log("⚠️ Aucune prédiction générée")
        send_telegram_message([])
        return

    send_telegram_message(predictions)
    log("✅ Pipeline terminé avec succès")


if __name__ == "__main__":
    run_pipeline()
