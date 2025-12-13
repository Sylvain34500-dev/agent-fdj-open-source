# main.py

from utils.logger import log
from scraping.flashscore import scrape_flashscore
from scraping.pronosoft import scrape_pronosoft
from analysis.analyzer import analyze
from bot_service.send import send_telegram_message


def main():
    log("🚀 PIPELINE FDJ — DÉMARRAGE")

    try:
        # 1️⃣ SCRAPING
        log("📥 Étape 1 — Scraping Flashscore")
        flashscore_events = scrape_flashscore()
        log(f"📊 Flashscore : {len(flashscore_events)} événements")

        log("📥 Étape 2 — Scraping Pronosoft")
        pronos = scrape_pronosoft()
        log(f"🎯 Pronosoft : {len(pronos)} pronostics")

        if not pronos:
            log("⚠️ Aucun pronostic Pronosoft → arrêt pipeline")
            send_telegram_message([])
            return

        # 2️⃣ NORMALISATION MINIMALE
        matches = []
        for p in pronos:
            matches.append({
                "match": p.get("match"),
                "cotes": {
                    p.get("prediction", "favori"): max(1.2, 100 / max(p.get("confidence", 50), 1))
                }
            })

        # 3️⃣ ANALYSE
        log("🧠 Étape 3 — Analyse")
        predictions = analyze(matches)

        # 4️⃣ TELEGRAM
        log("📤 Étape 4 — Envoi Telegram")
        send_telegram_message(predictions)

        log("✅ PIPELINE FDJ — TERMINÉ")

    except Exception as e:
        log(f"❌ PIPELINE CRASH : {e}")
        send_telegram_message([])


if __name__ == "__main__":
    main()

