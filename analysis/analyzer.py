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

            prediction = min(clean_cotes, key=clean_cotes.get)
            cote = clean_cotes[prediction]

            confidence = min(99, int(100 / cote)) if cote > 1 else 90

            predictions.append({
                "match": match_name,
                "prediction": f"Victoire {prediction}",
                "confidence": confidence
            })

        except Exception as e:
            log(f"❌ Erreur analyse : {e}")

    log(f"✅ {len(predictions)} pronostics générés")
    return predictions
