"""
=============================================================
5G ENERGY OPTIMIZATION PIPELINE – SIMULATOR JOB
=============================================================

Purpose:
--------
Generates realistic, synthetic telemetry data representing 5G base
station performance metrics such as RSRP, SNR, CQI, throughput, and
latency. This simulation provides a controllable data source for
testing downstream feature engineering, inference, and policy modules.

Core Responsibilities:
----------------------
1. **Data Generation**
   - Simulates multiple cell sites with realistic metric ranges.
   - Includes time-dependent patterns for signal and traffic variation.
   - Randomizes anomalies, packet losses, and noise levels.

2. **Database Integration**
   - Writes generated records into the `cell_clean_data` table.
   - Supports configurable intervals, durations, and cell counts
     via environment variables:
       - `SIM_INTERVAL_SEC`  → seconds between samples
       - `SIM_NUM_CELLS`     → number of simulated cells
       - `SIM_DURATION_MIN`  → total simulation duration

3. **Modes**
   - **Standard Mode:** continuous data generation for the configured duration.
   - **Test Mode:** limited sample generation (useful for debugging or CI tests).

Technical Notes:
----------------
- Designed for reproducibility and lightweight execution within Docker.
- Provides the initial step in the full AI-driven energy optimization pipeline.
=============================================================
"""

import os
import time
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone

from utils.db import get_engine

SIM_INTERVAL_SEC = int(os.getenv("SIM_INTERVAL_SEC", "5"))     
SIM_NUM_CELLS    = int(os.getenv("SIM_NUM_CELLS", "10"))       
SIM_DURATION_MIN = int(os.getenv("SIM_DURATION_MIN", "120"))    

def generate_sample(cell_id, ts):
    """Generates random but realistic metrics for a single cell."""
    rsrp = random.uniform(-110, -70)       
    rsrq = random.uniform(-15, -5)          
    snr  = random.uniform(0, 25)            
    cqi  = random.randint(1, 15)            
    dl   = max(0, np.random.normal(50, 20))
    ul   = max(0, np.random.normal(20, 5))  
    ping = np.random.normal(40, 10)        
    loss = random.choice([0, 0, 0, 1])     

    return {
        "ts": ts,
        "cell_id": str(cell_id),
        "latitude": 37.0 + random.random()/100,   
        "longitude": 27.0 + random.random()/100,
        "speed": random.uniform(0, 100),
        "rsrp": rsrp,
        "rsrq": rsrq,
        "snr": snr,
        "cqi": cqi,
        "dl_mbps": dl,
        "ul_mbps": ul,
        "ping_avg_ms": ping,
        "ping_min_ms": max(5, ping - 5),
        "ping_max_ms": ping + 5,
        "ping_stdev_ms": random.uniform(1, 5),
        "ping_loss_pct": loss,
        "cellhex": f"CELL{cell_id:03d}",
        "nodehex": f"NODE{cell_id:03d}",
        "lachex": f"LAC{cell_id:03d}",
        "rawcellid": f"RAW{cell_id:03d}",
        "is_anomaly": False
    }


def main(test_mode=False):
    eng = get_engine()
    start_ts = datetime.now(timezone.utc)

    total_records = (SIM_DURATION_MIN * 60) // SIM_INTERVAL_SEC * SIM_NUM_CELLS
    print(f"Simulator started: {SIM_NUM_CELLS} cells, {SIM_DURATION_MIN} min, ~{total_records} records")

    cur_ts = start_ts
    end_ts = start_ts + timedelta(minutes=SIM_DURATION_MIN)

    counter = 0 
    while cur_ts < end_ts:
        batch = []
        for cell_id in range(1, SIM_NUM_CELLS + 1):
            batch.append(generate_sample(cell_id, cur_ts))

        df = pd.DataFrame(batch)
        df.to_sql("cell_clean_data", eng, if_exists="append", index=False, method="multi", chunksize=1000)

        print(f"{cur_ts.isoformat()} -> {len(batch)} rows written")

        counter += len(batch)
        if test_mode and counter >= 3:  
            print("Test mode: 50 kayıt üretildi, duruyor.")
            break

        cur_ts += timedelta(seconds=SIM_INTERVAL_SEC)
        time.sleep(SIM_INTERVAL_SEC)

    print("Simulator finished.")

if __name__ == "__main__":
    main()
