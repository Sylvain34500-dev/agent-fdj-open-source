import json
from utils.logger import log


def export_results(predictions):
    log("Export JSON...")

    with open("predictions.json", "w", encoding="utf-8") as f:
        json.dump(predictions, f, indent=2, ensure_ascii=False)

    log("predictions.json généré.")
