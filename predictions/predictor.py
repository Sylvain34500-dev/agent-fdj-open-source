
# predictions/predictor.py

def make_prediction(match):
    """
    Génère une prédiction basique à partir d'un match normalisé.
    Pour l'instant : logique neutre (placeholder).
    L'IA remplacera cette logique plus tard.
    """

    team1 = match["match"]["team1"]
    team2 = match["match"]["team2"]

    # Logique minimale volontaire
    prediction = f"{team1} ou match nul"
    confidence = 50

    return {
        "match": f"{team1} vs {team2}",
        "prediction": prediction,
        "confidence": confidence
    }
