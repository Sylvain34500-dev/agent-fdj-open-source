# predictions/normalizer.py

from collections import defaultdict
from utils.logger import log


def match_key(item: dict) -> tuple:
    match = item.get("match", {})
    return (
        item.get("sport"),
        item.get("competition"),
        match.get("date"),
        match.get("team1"),
        match.get("team2"),
    )


def empty_context():
    return {
        "injuries": {"team1": [], "team2": []},
        "suspensions": {"team1": [], "team2": []},
        "form": {"team1": None, "team2": None},
        "stats": {"team1": {}, "team2": {}},
    }


def normalize(*sources_lists):
    """
    Prend N listes de matchs (issues de scrapers différents)
    et retourne une liste normalisée et fusionnée.
    """
    merged = {}

    for source_list in sources_lists:
        if not source_list:
            continue

        for item in source_list:
            key = match_key(item)

            if key not in merged:
                merged[key] = {
                    "source": item.get("source"),
                    "sport": item.get("sport"),
                    "competition": item.get("competition"),
                    "match": item.get("match"),
                    "context": empty_context(),
                    "data": {},
                }

            # ---- fusion du context ----
            context = item.get("context", {})
            for block in ("injuries", "suspensions", "form", "stats"):
                if block in context and context[block]:
                    merged[key]["context"][block].update(context[block])

            # ---- fusion des data brutes ----
            if item.get("data"):
                merged[key]["data"].update(item["data"])

    log(f"🔗 Normalizer: {len(merged)} match(s) fusionné(s)")
    return list(merged.values())
