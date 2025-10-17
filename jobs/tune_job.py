"""
=============================================================
5G ENERGY OPTIMIZATION PIPELINE – MODEL TUNING (Optuna)
=============================================================

Purpose:
--------
Performs hyperparameter optimization for the regression model
(RandomForestRegressor) used in the 5G Energy Optimization pipeline.
The tuning process aims to minimize prediction error (MAPE) and
store the best-performing configuration for future training runs.

Core Responsibilities:
----------------------
1. **Objective Function**
   - Uses `get_data_for_regression()` from `utils.training` to
     fetch standardized training and test datasets.
   - Defines Optuna search space for Random Forest hyperparameters
     (e.g., n_estimators, max_depth, min_samples_split, etc.).

2. **Optimization Process**
   - Runs multiple trials to minimize the Mean Absolute Percentage Error (MAPE).
   - Selects the best hyperparameter set and saves it to:
     → `models/best_params.json`.

3. **Result Tracking**
   - Exports all trial results to a CSV file:
     → `models/optuna_rf_results.csv`.
   - Enables reproducibility and auditability of the tuning process.

Technical Notes:
----------------
- Framework: Optuna (direction = "minimize")
- Model: sklearn.ensemble.RandomForestRegressor
- Metric: mean_absolute_percentage_error (MAPE)
- Output: JSON + CSV artifacts stored in `models/` directory.
=============================================================
"""

import optuna
import json
import numpy as np
import pandas as pd
from utils.training import get_data_for_regression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_percentage_error

MODEL_DIR = "models"

def objective(trial):
    X_train, X_test, y_train, y_test = get_data_for_regression()

    n_estimators = trial.suggest_int("n_estimators", 100, 600, step=50)
    max_depth = trial.suggest_int("max_depth", 5, 30)
    min_samples_split = trial.suggest_int("min_samples_split", 2, 10)
    min_samples_leaf = trial.suggest_int("min_samples_leaf", 1, 5)
    max_features = trial.suggest_categorical("max_features", ["sqrt", "log2", None])

    regr = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        max_features=max_features,
        random_state=42,
        n_jobs=-1,
    )
    regr.fit(X_train, y_train)
    y_pred = regr.predict(X_test)

    mape = mean_absolute_percentage_error(y_test, y_pred)
    return mape  

if __name__ == "__main__":
  
    study = optuna.create_study(direction="minimize")  
    study.optimize(objective, n_trials=30)  

    print("Best params:", study.best_params)
    print("Best value (MAPE):", study.best_value)

    
    with open(f"{MODEL_DIR}/best_params.json", "w") as f:
        json.dump(study.best_params, f, indent=4)

   
    df = study.trials_dataframe()
    df.to_csv(f"{MODEL_DIR}/optuna_rf_results.csv", index=False)
    print(f"All results were written to the file {MODEL_DIR}/optuna_rf_results.csv.")
