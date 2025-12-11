from utils.logger import log


def clean_data(data):
    log("Nettoyage des données...")

    cleaned = []
    for m in data:
        if not m["team1"] or not m["team2"]:
            continue
        cleaned.append(m)

    return cleaned
