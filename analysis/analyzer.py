from utils.logger import log


def analyze(clean_matches):
    log("Analyse basique...")

    # Exemple d’analyse “bidon” pour structure
    for m in clean_matches:
        m["score_analyse"] = 1  # placeholder

    return clean_matches
