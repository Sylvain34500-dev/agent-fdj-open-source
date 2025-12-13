from utils.logger import log

def analyze(matches):
    """
    Analyse très simple :
    - prend la cote la plus basse
    - la considère comme le favori
    """

    log("🧠 Analyse des matchs en cours...")

    predictions = []

    for m in matches:
        try:
            match_name = m.get("match")
            cotes = m.get("cotes", {})

            # Nettoyage des cotes
            clean_cotes = {}
            for k, v in cotes.items():
                try:
                    clean_cotes[k] = float(v.replace(",", "."))
                except:
                    pass

            if not clean_cotes:
                continue

            # Choix du favori = cote la plus basse
            prediction = min(clean_cotes, key=clean_cotes.get)
            confidence = int(100 / clean_cotes[prediction])

            predictions.append({
                "match": match_name,
                "prediction": f"Victoire {prediction}",
                "confidence": confidence
            })

        except Exception as e:
            log(f"❌ Erreur analyse match : {e}")

    log(f"✅ {len(predictions)} pronostics générés")
    return predictions
