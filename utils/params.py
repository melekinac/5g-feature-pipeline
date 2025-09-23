import json
import os

PARAM_FILE = "models/best_params.json"

def load_best_params(defaults):
    if os.path.exists(PARAM_FILE):
        with open(PARAM_FILE, "r") as f:
            best = json.load(f)
        print("Using tuned params:", best)
        return {**defaults, **best}
    return defaults
