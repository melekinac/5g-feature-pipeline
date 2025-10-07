import os
import joblib

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

def save_model(model, feature_list, model_name):
    """Modeli ve feature listesini kaydet."""
    joblib.dump(model, f"{MODEL_DIR}/{model_name}.pkl")
    joblib.dump(feature_list, f"{MODEL_DIR}/feature_list_{model_name}.pkl")
    print(f"Model saved: {model_name}")

def load_model(model_name):
    """Model ve feature listesini yükle."""
    model = joblib.load(f"{MODEL_DIR}/{model_name}.pkl")
    features = joblib.load(f"{MODEL_DIR}/feature_list_{model_name}.pkl")
    return model, features

from sqlalchemy import text
from utils.db import get_engine

def select_best_model(task="regression"):
    """
    model_metrics tablosundan en iyi modeli seçer.
    task = "classification" veya "regression"
    """
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
