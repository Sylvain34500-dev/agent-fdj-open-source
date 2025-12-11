from scraping.pronosoft.pronosoft import scrape_pronosoft
from cleaning.cleaner import clean_data
from analysis.analyzer import analyze
from predictions.predictor import make_predictions
from export.exporter import export_results
from telegram.send import send_telegram_message
from utils.logger import log

# ---- Serveur web pour Render ----
from flask import Flask
import threading
import time
import os

app = Flask(__name__)

@app.get("/")
def home():
    return "Agent FDJ actif (Render OK)"

def run_web_server():
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

# ---- Process principal du bot ----
def run_agent():
    while True:
        try:
            main()
        except Exception as e:
            log(f"❌ Erreur dans l’agent : {e}")

        # Attendre avant prochaine boucle
        log("⏳ Pause de 5 minutes avant prochain run...")
        time.sleep(300)  # 5 min

def main():
    log("🔍 Démarrage de l’agent FDJ...")

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

    log("✅ Agent FDJ terminé.")


if __name__ == "__main__":
    # Lancer le serveur web dans un thread pour satisfaire Render
    threading.Thread(target=run_web_server).start()

    # Lancer l’agent FDJ en boucle
    run_agent()
