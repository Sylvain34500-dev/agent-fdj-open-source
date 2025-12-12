# predictions/predictor.py

def make_prediction(match):
    """
    Basique : tant que l’IA n’est pas branchée, renvoie un résultat placeholder.
    """
    team1 = match.get("team1", "Équipe A")
    team2 = match.get("team2", "Équipe B")

    # petit algo bidon temporaire pour avoir un contenu logique
    result = f"{team1} ne perd pas"
    confidence = 60

    return {
        "result": result,
        "confidence": confidence
    }
