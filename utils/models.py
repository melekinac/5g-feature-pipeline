"""
=============================================================
5G ENERGY OPTIMIZATION – MODEL UTILITY MODULE
-------------------------------------------------------------
Description:
    Provides standardized helper functions for managing 
    machine learning models and metadata within the 5G 
    Energy Optimization pipeline.

Responsibilities:
    • save_model(model, feature_list, model_name)
        → Persists trained models and their feature lists.
    • load_model(model_name)
        → Loads a previously saved model with its features.
    • select_best_model(task)
        → Retrieves the best-performing model from the 
          PostgreSQL model_metrics table (based on MAPE 
          or latest training time).

Used by:
    • train_job.py          → Saves trained models
    • inference_job.py      → Loads models for prediction
    • policy_job.py         → Selects active model variants
=============================================================
"""

import os
import joblib

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

def save_model(model, feature_list, model_name):
    
    joblib.dump(model, f"{MODEL_DIR}/{model_name}.pkl")
    joblib.dump(feature_list, f"{MODEL_DIR}/feature_list_{model_name}.pkl")
    print(f"Model saved: {model_name}")

def load_model(model_name):
    
    model = joblib.load(f"{MODEL_DIR}/{model_name}.pkl")
    features = joblib.load(f"{MODEL_DIR}/feature_list_{model_name}.pkl")
    return model, features

from sqlalchemy import text
from utils.db import get_engine

def select_best_model(task="regression"):
    eng = get_engine()
    with eng.connect() as con:
        if task == "regression":
            row = con.execute(text("""
                SELECT model_name
                FROM model_metrics
                WHERE model_name LIKE '%regressor'
                ORDER BY mape ASC, trained_at DESC
                LIMIT 1
            """)).fetchone()
        else:  
            row = con.execute(text("""
                SELECT model_name
                FROM model_metrics
                WHERE model_name LIKE '%classifier'
                ORDER BY trained_at DESC
                LIMIT 1
            """)).fetchone()
    return row[0] if row else None
