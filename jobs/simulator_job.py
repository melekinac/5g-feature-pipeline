import os
import time
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
# from sqlalchemy import text
from utils.db import get_engine

SIM_INTERVAL_SEC = int(os.getenv("SIM_INTERVAL_SEC", "5"))     
SIM_NUM_CELLS    = int(os.getenv("SIM_NUM_CELLS", "10"))       
SIM_DURATION_MIN = int(os.getenv("SIM_DURATION_MIN", "120"))    

def generate_sample(cell_id, ts):
    """Tek hücre için rastgele ama gerçekçi metrikler üretir."""
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

# def main():
#     eng = get_engine()
#     start_ts = datetime.now(timezone.utc)

#     total_records = (SIM_DURATION_MIN * 60) // SIM_INTERVAL_SEC * SIM_NUM_CELLS
#     print(f"Simulator started: {SIM_NUM_CELLS} cells, {SIM_DURATION_MIN} min, ~{total_records} records")
    
#     cur_ts = start_ts
#     end_ts = start_ts + timedelta(minutes=SIM_DURATION_MIN)
#     counter = 0
#     while cur_ts < end_ts:
#         batch = []
#         for cell_id in range(1, SIM_NUM_CELLS + 1):
#             batch.append(generate_sample(cell_id, cur_ts))

#         df = pd.DataFrame(batch)
#         df.to_sql("cell_clean_data", eng, if_exists="append", index=False, method="multi", chunksize=1000)
#     #     df.to_sql("cell_clean_data_sim", eng, if_exists="append", index=False, method="multi", chunksize=1000)

#         print(f"{cur_ts.isoformat()} -> {len(batch)} rows written")
#         cur_ts += timedelta(seconds=SIM_INTERVAL_SEC)
#         time.sleep(SIM_INTERVAL_SEC)

#     print("Simulator finished.")
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
