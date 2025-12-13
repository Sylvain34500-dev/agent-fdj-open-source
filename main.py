from utils.logger import log
from scraping.pronosoft import scrape_pronosoft
from analysis.analyzer import analyze
from bot_service.send import send_telegram_message


def run():
    log("🚀 Pipeline FDJ démarré")

    matches = scrape_pronosoft()
    if not matches:
        log("❌ Aucun match trouvé")
        send_telegram_message([])
        return

    predictions = analyze(matches)

    send_telegram_message(predictions)

    log("✅ Pipeline FDJ terminé")
