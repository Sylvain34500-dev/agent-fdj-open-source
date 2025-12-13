from utils.logger import log


def analyze(matches):
    log("🧠 Analyse des matchs")

    predictions = []

    for m in matches:
        try:
            match_name = m.get("match")
            cotes = m.get("cotes", {})

            clean_cotes = {}
            for k, v in cotes.items():
                try:
                    clean_cotes[k] = float(str(v).replace(",", "."))
                except:
                    continue

            if not clean_cotes:
                continue

            winner = min(clean_cotes, key=clean_cotes.get)
            confidence = min(int(100 / clean_cotes[winner]), 99)

            predictions.append({
                "match": match_name,
                "prediction": f"Victoire {winner}",
                "confidence": confidence
            })

        except Exception as e:
            log(f"❌ Erreur analyse match : {e}")

    log(f"✅ {len(predictions)} pronostics générés")
    return predictions
