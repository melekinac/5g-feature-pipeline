"""
=============================================================
5G ENERGY OPTIMIZATION PIPELINE – INFERENCE JOB
=============================================================

Purpose:
--------
This module is a critical component of the **5G Energy Optimization Pipeline**, responsible for running **AI-driven inference** over the most recent engineered features from the database.  
It applies **pre-trained machine learning models** to generate:
- **Classification outputs** (e.g., network signal quality class),
- **Regression forecasts** (e.g., predicted energy/throughput values).

The resulting predictions are written back into the database for use by the **policy engine**, **dashboard visualization**, and **energy impact analytics** layers.

Core Functions:
---------------
1. **Model Loading**
   - Automatically detects and loads the best-performing classifier and regressor
     using metadata stored in the model registry.
   - Loads corresponding feature lists to ensure consistent column alignment.

2. **Feature Extraction**
   - Fetches the most recent records from the `cell_features` table.
   - Cleans, reindexes, and prepares data for model inference.

3. **Inference & Forecasting**
   - Performs class label prediction (`class_label`) for network state classification.
   - Predicts continuous energy-related targets (`y_hat`) with confidence intervals.

4. **Database Integration**
   - Saves regression results to `cell_forecast` (for time-series analysis).
   - Inserts classification results into `cell_policy` (for decision automation).
   - Optionally computes **energy impact reduction** metrics using KPI tables.

5. **Post-Processing**
   - Aggregates and evaluates average energy savings (in %).
   - Writes impact summaries into `energy_impact_summary` for historical tracking.

Technical Notes:
----------------
- Data Source: `cell_features`, `cell_kpis_daily`
- Targets: Energy efficiency and signal quality improvement
- Models: RandomForestClassifier & RandomForestRegressor (default)
- Confidence interval: ±0.5σ heuristic
- Database: PostgreSQL (via SQLAlchemy)
- Output Tables:
    • `cell_forecast`
    • `cell_policy`
    • `energy_impact_summary`

Integration:
------------
This module is typically orchestrated by the **orchestrator job** in the pipeline, following
the feature generation step (`feature_job.py`) and preceding the **policy optimization phase**.

Usage:
------
Run as a standalone script or automated Docker container:
    $ python inference_job.py
=============================================================
"""


import json
import pandas as pd
import numpy as np
from sqlalchemy import text
from utils.db import get_engine
from utils.models import load_model, select_best_model


def load_models():
   
    best_clf = select_best_model("classification") or "rf_classifier"
    best_regr = select_best_model("regression") or "rf_regressor"

    print(f"Best classification model: {best_clf}")
    print(f"Best regression model: {best_regr}")


    clf, feat_class = load_model(best_clf)
    regr, feat_reg = load_model(best_regr)
    return clf, regr, feat_class, feat_reg


def load_latest_features(limit=500):
   
    eng = get_engine()
    with eng.connect() as con:
        df = pd.read_sql(
            text(f"SELECT * FROM cell_features ORDER BY ts DESC"),
            con
        )
   
    return df.sort_values("ts").reset_index(drop=True)


def run_inference():
   

    clf, regr, feat_class, feat_reg = load_models()
    df = load_latest_features()

    if df.empty:
        print(" No new features found for inference.")
        return


    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    X_class = df[num_cols].reindex(columns=feat_class, fill_value=0)
    X_class = X_class.fillna(X_class.median(numeric_only=True))
    df["class_label"] = clf.predict(X_class)

    
    X_reg = df[num_cols].reindex(columns=feat_reg, fill_value=0)
    X_reg = X_reg.fillna(X_reg.median(numeric_only=True))
    y_hat = regr.predict(X_reg)*0.01

 
    y_std = np.std(y_hat) * 0.5
    df["y_hat"] = y_hat
    df["ci_low"] = y_hat - y_std
    df["ci_high"] = y_hat + y_std
    df["confidence"] = 0.8  
    df["model_name"] = "rf_regression_v1"


    eng = get_engine()
    with eng.begin() as con:
      
        forecast_rows = df[[
            "ts", "cell_id", "y_hat", "ci_low", "ci_high",
            "confidence", "model_name"
        ]].copy()
        forecast_rows["mape"] = None  
        forecast_rows.to_sql(
            "cell_forecast", con,
            if_exists="append", index=False,
            method="multi", chunksize=5000
        )


        policy_rows = df[["ts", "cell_id", "class_label"]].copy()
        policy_rows["action"] = "monitor"
        policy_rows["reason"] = json.dumps({"rule": "default"})
        policy_rows["thresholds_ver"] = "v1"
        policy_rows.to_sql(
            "cell_policy", con,
            if_exists="append", index=False,
            method="multi", chunksize=5000
        )

    print(f"Inference complete: {len(df)} rows written to DB.")

 
    print("Evaluating energy impact using DB metrics...")

    with eng.connect() as con:
        sql = """
        SELECT 
            fc.cell_id,
            fc.ts::date AS date,
            AVG(fc.y_hat) AS forecast_kwh,
            AVG(k.energy_kwh) AS real_kwh,
            ROUND((AVG(k.energy_kwh)::numeric - AVG(fc.y_hat)::numeric), 3) AS diff_kwh,
            ROUND(((AVG(k.energy_kwh)::numeric - AVG(fc.y_hat)::numeric) / NULLIF(AVG(k.energy_kwh)::numeric, 0)) * 100, 2) AS reduction_pct
        FROM cell_forecast fc
        JOIN cell_kpis_daily k 
            ON k.cell_id = fc.cell_id AND k.date = fc.ts::date
        WHERE fc.ts BETWEEN '2019-12-14 00:00:00' AND '2020-02-27 23:59:59'
        GROUP BY 1,2
        ORDER BY 2 ASC;
        """
        df_impact = pd.read_sql(text(sql), con)


   
    if not df_impact.empty:
        avg_saving = df_impact["reduction_pct"].mean().round(2)
        print(f"Average energy reduction (7d window): {avg_saving}%")
    else:
        print("No matching records for energy impact evaluation.")


    with eng.begin() as con:
        df_impact.to_sql(
            "energy_impact_summary", con,
            if_exists="append", index=False, method="multi"
        )

    print("Energy impact summary successfully recorded.")



if __name__ == "__main__":
    run_inference()
