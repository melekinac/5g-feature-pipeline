"""
=============================================================
5G ENERGY OPTIMIZATION – PARAMETER LOADER
-------------------------------------------------------------
Description:
    Utility module responsible for loading the best 
    hyperparameter configurations (tuned via Optuna or other 
    tuning frameworks) for model training.

Responsibilities:
    • load_best_params(defaults)
        → Loads tuned parameters from `models/best_params.json`
          if available, otherwise returns provided defaults.

Usage:
    - Used inside train_job.py to merge tuned hyperparameters
      into the model training pipeline.
    - Ensures consistent and reproducible model optimization.
=============================================================
"""

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
