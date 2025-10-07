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
