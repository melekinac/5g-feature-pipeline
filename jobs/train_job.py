"""
=============================================================
5G ENERGY OPTIMIZATION PIPELINE – TRAINING JOB
=============================================================

Purpose:
--------
Handles end-to-end training of machine learning models used for
the 5G Energy Optimization pipeline. It performs both classification
and regression training tasks using engineered cell-level features.

Core Responsibilities:
----------------------
1. **Classification Model Training**
   - Predicts categorical targets such as signal quality classes
     (e.g., Very Weak, Weak, Good, Excellent).
   - Stores trained model artifacts and performance metrics.

2. **Regression Model Training**
   - Predicts continuous values such as throughput or energy consumption.
   - Evaluates models using RMSE, MAPE, and R² metrics.

3. **Parameter Management**
   - Loads best hyperparameters from `models/best_params.json`
     (if available) to ensure consistent retraining performance.
   - Falls back to default parameters if tuning results are absent.

4. **Integration**
   - Trained models are serialized for later use in `inference_job.py`.
   - Designed to run automatically during drift-triggered retraining
     or manual model refresh.

Technical Notes:
----------------
- Relies on helper functions from `utils/training.py`.
- Intended to be executed within the Docker-based ML pipeline.
=============================================================
"""

from utils.training import train_classification, train_regression
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
def main():
    print("Training pipeline started...")


    try:
        train_classification()
    except Exception as e:
        print(f"Classification training failed: {e}")


    try:
        train_regression()
    except Exception as e:
        print(f"Regression training failed: {e}")

    print("Training pipeline finished.")

if __name__ == "__main__":
    main()

