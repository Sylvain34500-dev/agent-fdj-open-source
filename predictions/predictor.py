from utils.logger import log


def make_predictions(analysed_data):
    log("Génération des prédictions...")

    for m in analysed_data:
        m["prediction"] = "1"  # Placeholder : victoire équipe 1

    return analysed_data
