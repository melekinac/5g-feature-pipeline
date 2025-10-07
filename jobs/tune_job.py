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
    print(f"Tüm sonuçlar {MODEL_DIR}/optuna_rf_results.csv dosyasına yazıldı.")
