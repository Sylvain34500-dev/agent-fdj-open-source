from scraping.pronosoft.pronosoft import scrape_pronosoft
from cleaning.cleaner import clean_data
from analysis.analyzer import analyze
from predictions.predictor import make_predictions
from export.exporter import export_results
from telegram.send import send_telegram_message
from utils.logger import log
import threading
import time
import os

def main():
    log("🔍 Démarrage d’un run FDJ...")

    try:
        # 1) Scraping
        raw_data = scrape_pronosoft()
        log("📥 Scraping terminé.")

        # 2) Nettoyage
        clean = clean_data(raw_data)
        log("🧹 Nettoyage terminé.")

        # 3) Analyse
        analysed = analyze(clean)
        log("📊 Analyse terminée.")

        # 4) Prédictions
        preds = make_predictions(analysed)
        log("🤖 Prédictions générées.")

        # 5) Export
        export_results(preds)
        log("📤 Export terminé.")

        # 6) Telegram
        send_telegram_message(preds)
        log("📨 Message Telegram envoyé.")

        log("✅ Run FDJ terminé.")

    except Exception as e:
        log(f"❌ ERREUR DANS LE RUN : {e}")


def loop_forever():
    while True:
        main()
        log("⏳ Pause 5 minutes...")
        time.sleep(300)


if __name__ == "__main__":
    # Lancer la boucle continue
    threading.Thread(target=loop_forever).start()

    # Lancer le serveur Render
    from server import run_web
    run_web()
