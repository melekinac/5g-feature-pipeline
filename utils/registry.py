"""
=============================================================
5G ENERGY OPTIMIZATION – MODEL REGISTRY UTILITY
-------------------------------------------------------------
Description:
    Handles the registration and version control of machine 
    learning models in the system. When a new model is trained 
    or updated, this module ensures it’s recorded in the 
    `model_registry` table, marking it as active while deactivating 
    previous versions of the same model type.

Responsibilities:
    • register_model(model_name, model_type, version, metrics, is_active)
        → Deactivates previous models of the same type.
        → Inserts the new model’s metadata and performance metrics 
          into `model_registry`.

Parameters:
    - model_name (str): Name of the model (e.g., "rf_regressor_v2")
    - model_type (str): Task type ("classification" or "regression")
    - version (str): Version identifier (e.g., "v2.0")
    - metrics (dict): Dictionary of model evaluation results
    - is_active (bool): Whether this model is active for inference

Usage:
    Used after training or tuning a model to register it in the 
    central registry, ensuring model reproducibility and auditability.
=============================================================
"""

from utils.db import get_engine
from sqlalchemy import text
import json

def register_model(model_name, model_type, version, metrics, is_active=True):
    eng = get_engine()
    with eng.begin() as con:
        if is_active:
            con.execute(text("""
                UPDATE model_registry
                SET is_active = false
                WHERE model_type = :t
            """), {"t": model_type})

        con.execute(text("""
            INSERT INTO model_registry (model_name, model_type, version, metrics, is_active)
            VALUES (:n, :t, :v, :m, :a)
        """), {
            "n": model_name,
            "t": model_type,
            "v": version,
            "m": json.dumps(metrics),
            "a": is_active
        })
