"""
=============================================================
5G ENERGY OPTIMIZATION PIPELINE – MONITORING JOB
=============================================================

Purpose:
--------
Continuously monitors **data drift** in real-time network metrics  
(e.g., RSRP, SNR, and DL throughput) to ensure ML model stability  
and trigger automated retraining when system behavior changes  
beyond acceptable thresholds.

Core Functions:
---------------
1. **Drift Detection**
   - Compares the last 10 hours of KPI averages (`rsrp_mean`, `snr_mean`, `dl_mbps_mean`)
     against predefined baseline values.
   - Calculates absolute deviations and flags drift if any exceed `DRIFT_THRESHOLD`.

2. **Automatic Retraining**
   - If drift is detected, executes the `train_job` Docker service.
   - Ensures the latest model reflects updated network dynamics.

3. **Configurable Loop**
   - Supports both one-time execution and continuous looping (via `MONITORING_LOOP_SEC`).
   - Parameters can be set using environment variables.

Technical Notes:
----------------
- Input Table: `cell_features`
- Trigger Threshold: `DRIFT_THRESHOLD` (default = 5.0)
- Retrain Command: `docker compose run --rm train_job`
- Database: PostgreSQL
- Language: Python 3.11
- Dependencies: pandas, numpy, sqlalchemy, subprocess
=============================================================
"""

import os
import time
import pandas as pd
import numpy as np
import subprocess
from sqlalchemy import text
from utils.db import get_engine


LOOP_SEC = int(os.getenv("MONITORING_LOOP_SEC", "60"))
DRIFT_THRESHOLD = float(os.getenv("DRIFT_THRESHOLD", "5.0"))



def check_drift():
    eng = get_engine()
    with eng.connect() as con:
        df = pd.read_sql(text("""
            SELECT 
                AVG(rsrp_mean) AS rsrp_mean,
                AVG(snr_mean) AS snr_mean,
                AVG(dl_mbps_mean) AS dl_mbps_mean
            FROM cell_features
            WHERE ts >= '2019-12-01'
              AND ts > now() - interval '10 hour';
        """), con)

    baseline = {"rsrp_mean": -90, "snr_mean": 10, "dl_mbps_mean": 50}
    drift = {}
    alert = False

    for col in baseline:
        if col in df and not df[col].isna().all():
            val = float(df[col].iloc[0])
            diff = abs(val - baseline[col])
            drift[col] = diff
            if diff > DRIFT_THRESHOLD:
                alert = True

    return drift, alert


def run_retrain():
    print("Drift detected → triggering train_job...")
    try:
        subprocess.run(["docker", "compose", "run", "--rm", "train_job"], check=True)
        print("New model training completed.")
    except Exception as e:
        print("Retrain error: ", e)


def main():
    try:
        drift, alert = check_drift()
        print("Drift Control Results:", drift)

        if alert:
            print("Drift detected!")
            run_retrain()
        else:
            print("There is no drift, the system is stable.")

    except Exception as e:
        print("Monitoring error:", e)


if __name__ == "__main__":
    main()
