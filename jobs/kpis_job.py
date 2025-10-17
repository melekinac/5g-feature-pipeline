"""
=============================================================
5G ENERGY OPTIMIZATION PIPELINE – KPI COMPUTATION JOB
=============================================================

Purpose:
--------
This module computes **daily Key Performance Indicators (KPIs)** from
raw and processed 5G cell feature data. It aggregates performance metrics
such as throughput, signal quality, and latency into a compact daily summary.

Core Functions:
---------------
1. **Data Extraction**
   - Fetches recent or date-bounded records from the `cell_features` table.
   - Uses environment variables (`KPI_START_DATE`, `KPI_END_DATE`) when provided.

2. **KPI Aggregation**
   - Groups data by `cell_id` and date.
   - Calculates averages for:
       • Downlink (DL) and Uplink (UL) Mbps  
       • RSRP and SNR (signal quality)  
       • Latency 90th percentile (ping response)
   - Derives daily **energy consumption estimates**  
     using a conversion factor (1 Mbps ≈ 0.01 kWh).

3. **Database Integration**
   - Writes summarized KPI metrics to the `cell_kpis_daily` table
     with optimized data types and batch insertion for scalability.

4. **Automation**
   - Supports both manual and scheduled execution.
   - Intended to be run periodically by the orchestrator container.

Technical Notes:
----------------
- Input Table: `cell_features`
- Output Table: `cell_kpis_daily`
- Energy Estimation Formula: `energy_kwh = dl_mbps_mean * 0.01`
- Language: Python 3.11
- Libraries: pandas, numpy, SQLAlchemy
- Database: PostgreSQL
=============================================================
"""


import pandas as pd
import numpy as np
import os
from sqlalchemy import text
from utils.db import get_engine
from sqlalchemy.types import Date, Float, String

def compute_kpis():
    eng = get_engine()

    start_date = os.getenv("KPI_START_DATE")
    end_date = os.getenv("KPI_END_DATE")

    if start_date and end_date:
        query = f"""
            SELECT ts, cell_id,
                   dl_mbps_mean, ul_mbps_mean,
                   rsrp_mean, snr_mean,
                   ping_avg_mean
            FROM cell_features
            WHERE ts BETWEEN '{start_date}' AND '{end_date}'
        """
    else:
        query = """
            SELECT ts, cell_id,
                   dl_mbps_mean, ul_mbps_mean,
                   rsrp_mean, snr_mean,
                   ping_avg_mean
            FROM cell_features
            WHERE ts >= NOW() - interval '7 days'
        """

    with eng.connect() as con:
        df = pd.read_sql(query, con)

    if df.empty:
        print(" KPI: cell_features are empty, no calculations.")
        return

  
    df["date"] = pd.to_datetime(df["ts"]).dt.date
    kpis = (
        df.groupby(["cell_id", "date"])
        .agg(
            dl_mbps_mean=("dl_mbps_mean", "mean"),
            ul_mbps_mean=("ul_mbps_mean", "mean"),
            rsrp_mean=("rsrp_mean", "mean"),
            snr_mean=("snr_mean", "mean"),
            latency_p90=("ping_avg_mean", lambda x: np.nanpercentile(x.dropna(), 90)),
        )
        .reset_index()
    )


    kpis["energy_kwh"] = (kpis["dl_mbps_mean"].fillna(0) * 0.01).round(2)

  
    with eng.begin() as con:
        kpis.to_sql(
            "cell_kpis_daily",
            con,
            if_exists="append",
            index=False,
            method="multi",
            chunksize=5000,
            dtype={
                "cell_id": String(),
                "date": Date(),
                "dl_mbps_mean": Float(),
                "ul_mbps_mean": Float(),
                "rsrp_mean": Float(),
                "snr_mean": Float(),
                "latency_p90": Float(),
                "energy_kwh": Float(),
            },
        )

    print(f" KPI calculated and recorded: {len(kpis)} line")

if __name__ == "__main__":
    compute_kpis()
