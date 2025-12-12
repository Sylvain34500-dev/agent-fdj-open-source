# main.py – Pipeline FDJ propre et stable

from utils.logger import log
from scraping.pronosoft import scrape_pronosoft
from predictions.predictor import make_prediction
from telegram.send import send_telegram_message


def main():
    log("🚀 DÉMARRAGE DU PIPELINE FDJ")

    # 1) SCRAPING
    matches = scrape_pronosoft()

    if not matches:
        log("⚠️ Aucun match trouvé, fin du pipeline.")
        return

    log(f"📌 {len(matches)} matchs récupérés.")

    # 2) CLEAN + PREDICTIONS
    predictions = []

    for m in matches:
        try:
            pred = make_prediction(m)  # simple pour l'instant
            predictions.append({
                "match": f"{m.get('team1')} vs {m.get('team2')}",
                "prediction": pred.get("result", "N/A"),
                "confidence": pred.get("confidence", 0),
            })
        except Exception as e:
            log(f"❌ Erreur prédiction match : {e}")

    log(f"📊 {len(predictions)} prédictions générées.")

    # 3) ENVOI TELEGRAM
    try:
        send_telegram_message(predictions)
    except Exception as e:
        log(f"❌ Erreur envoi Telegram : {e}")

    log("✅ PIPELINE TERMINÉ.")


if __name__ == "__main__":
    main()

