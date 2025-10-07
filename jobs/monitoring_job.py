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
            SELECT AVG(rsrp_mean) AS rsrp_mean,
                   AVG(snr_mean) AS snr_mean,
                   AVG(dl_mbps_mean) AS dl_mbps_mean
            FROM cell_features
            WHERE ts > now() - interval '10 hour'
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
    print(" Drift tespit edildi → train_job tetikleniyor...")
    try:
        # Burada train_job.py'yi çağırıyoruz
        # subprocess.run(["python", "jobs/train_job.py"], check=True)
        subprocess.run(["docker", "compose", "run", "--rm", "train_job"], check=True)

        print(" Yeni model eğitimi tamamlandı.")
    except Exception as e:
        print(" Retrain hatası:", e)


def main():
    while True:
        try:
            drift, alert = check_drift()
            print(" Drift Kontrol Sonuçları:", drift)

            if alert:
                print(" Drift tespit edildi!")
                run_retrain()
            else:
                print(" Drift yok, sistem stabil.")

        except Exception as e:
            print(" Monitoring hata:", e)

        time.sleep(LOOP_SEC)


if __name__ == "__main__":
    main()
