"""
5G Energy Optimization FEATURE JOB
=======================================================

Purpose:
--------
This script processes raw cellular signal data (RSRP, RSRQ, SNR, throughput, etc.)
into cleaned, engineered features for AI/ML-based traffic forecasting and energy optimization.

Core Functions:
---------------
1. **Excel Ingestion & Cleaning**
   - Loads raw Excel files with network metrics.
   - Cleans timestamps, numeric/text fields, and removes invalid rows.
   - Writes results into `cell_raw` and `cell_clean_data` tables in PostgreSQL.

2. **Feature Engineering Pipeline**
   - Aggregates signal KPIs (RSRP, SNR, CQI, throughput, etc.).
   - Generates lag/rolling statistics (15m, 30m, 1h, 3h).
   - Adds temporal features (hour, weekday, weekend, peak-hour flags).
   - Computes network health classification (`Excellent`, `Good`, `Weak`, `Very Weak`).
   - Detects load/traffic trends and calculates estimated energy consumption (kWh).

3. **Database Output**
   - Writes final processed data to `cell_features` table.
   - Enables downstream ML training and energy policy simulation.

Technical Notes:
----------------
- Database: PostgreSQL (via SQLAlchemy)
- Feature Horizon: Configurable via `HORIZON_MINUTES` (default: 15)
- Rolling trend thresholds controlled by env vars `TREND_PCT_UP`, `TREND_PCT_DOWN`
- Safe re-runnable script — deletes overlapping timestamps before insert
- Can run once or loop continuously with `--loop` flag for periodic feature updates
"""

import os
import time
import argparse
import pandas as pd
import numpy as np
import re
from datetime import timedelta
from sqlalchemy import text
from utils.db import get_engine
from sqlalchemy import Boolean


HORIZON_MINUTES = int(os.getenv("HORIZON_MINUTES", "15"))
TREND_PCT_UP    = float(os.getenv("TREND_PCT_UP",   "0.10"))
TREND_PCT_DOWN  = float(os.getenv("TREND_PCT_DOWN", "-0.10"))
TREND_ABS_MIN   = float(os.getenv("TREND_ABS_MIN",  "1.0"))
EPS             = 1e-6

pd.set_option('future.no_silent_downcasting', True)

def grid_id(lat: pd.Series, lon: pd.Series, size_m=300) -> pd.Series:
    lat_step = 0.003 if size_m == 300 else 0.005
    lon_step = 0.003 if size_m == 300 else 0.005
    return (np.round(lat / lat_step, 3).astype(str) + "_" +
            np.round(lon / lon_step, 3).astype(str))

def fix_timestamp(val: str) -> str:
    if not isinstance(val, str):
        return val
    val = val.replace("_", " ")
    val = re.sub(r"(\d{4})\.(\d{2})\.(\d{2})", r"\1-\2-\3", val)
    val = re.sub(r"(\d{2})\.(\d{2})\.(\d{2})", r"\1:\2:\3", val)
    return val

def classify_signal_row(row):
    rsrp = pd.to_numeric(row.get("rsrp_mean", np.nan), errors="coerce")
    rsrq = pd.to_numeric(row.get("rsrq_mean", np.nan), errors="coerce")
    snr  = pd.to_numeric(row.get("snr_mean",  np.nan), errors="coerce")

    def base_from_rsrp(v):
        if pd.isna(v): return "Unknown"
        if v >= -80:   return "Excellent"
        elif v >= -95: return "Good"
        elif v >= -110:return "Weak"
        else:          return "Very Weak"

    cls = base_from_rsrp(rsrp)
    if cls == "Unknown":
        if not pd.isna(snr):
            if snr >= 10:   return "Good"
            elif snr >= 0:  return "Weak"
            else:           return "Very Weak"
        return "Unknown"

    order = ["Very Weak", "Weak", "Good", "Excellent"]
    idx = order.index(cls)

    if (not pd.isna(rsrq) and rsrq >= -10) or (not pd.isna(snr) and snr >= 10):
        if idx < len(order) - 1: idx += 1
    if (not pd.isna(rsrq) and rsrq <= -15) or (not pd.isna(snr) and snr <= 0):
        if idx > 0: idx -= 1

    return order[idx]

def load_excel(path: str) -> pd.DataFrame:
    return pd.read_excel(path, engine="openpyxl")

def clean_and_prepare_excel(df: pd.DataFrame) -> pd.DataFrame:
    if "Timestamp" in df.columns:
        df["Timestamp"] = df["Timestamp"].astype(str).map(fix_timestamp)
        df["Timestamp"] = pd.to_datetime(df["Timestamp"], errors="coerce", utc=True)

    df = df.replace(["#REF!", "NULL", "-", ""], np.nan).infer_objects(copy=False)

    num_cols = ["RSRP","RSRQ","SNR","RSSI","CQI","DL_bitrate","UL_bitrate",
                "PINGAVG","PINGMIN","PINGMAX","PINGSTDEV","PINGLOSS",
                "Speed","NRxRSRP","NRxRSRQ"]
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    text_cols = ["Operatorname","CellID","NetworkMode","State",
                 "CELLHEX","NODEHEX","LACHEX","RAWCELLID"]
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    return df.dropna(subset=["Timestamp","CellID"])


def write_cell_raw(df: pd.DataFrame):
    raw_cols = {
        "Timestamp":"raw_timestamp","Latitude":"raw_latitude","Longitude":"raw_longitude",
        "Speed":"raw_speed","Operatorname":"raw_operator","CellID":"raw_cellid",
        "NetworkMode":"raw_netmode","RSRP":"raw_rsrp","RSRQ":"raw_rsrq","SNR":"raw_snr",
        "RSSI":"raw_rssi","CQI":"raw_cqi","DL_bitrate":"raw_dl_bitrate","UL_bitrate":"raw_ul_bitrate",
        "State":"raw_state","PINGAVG":"raw_pingavg","PINGMIN":"raw_pingmin",
        "PINGMAX":"raw_pingmax","PINGSTDEV":"raw_pingstdev","PINGLOSS":"raw_pingloss",
        "CELLHEX":"raw_cellhex","NODEHEX":"raw_nodehex","LACHEX":"raw_lachex","RAWCELLID":"raw_rawcellid",
        "NRxRSRP":"raw_nrxrsrp","NRxRSRQ":"raw_nrxrsrq"
    }
    sub = df[[c for c in raw_cols if c in df.columns]] \
            .rename(columns={k: raw_cols[k] for k in raw_cols if k in df.columns})
    if not sub.empty:
        sub.to_sql("cell_raw", get_engine(), if_exists="append", index=False, method="multi", chunksize=5000)

def write_cell_clean(df: pd.DataFrame):
    cols_map = {
        "Timestamp":"ts","CellID":"cell_id","Latitude":"latitude","Longitude":"longitude",
        "Speed":"speed","Operatorname":"operator","NetworkMode":"net_mode","State":"state",
        "RSRP":"rsrp","RSRQ":"rsrq","SNR":"snr","RSSI":"rssi","CQI":"cqi",
        "DL_bitrate":"dl_mbps","UL_bitrate":"ul_mbps",
        "PINGAVG":"ping_avg_ms","PINGMIN":"ping_min_ms","PINGMAX":"ping_max_ms",
        "PINGSTDEV":"ping_stdev_ms","PINGLOSS":"ping_loss_pct",
        "CELLHEX":"cellhex","NODEHEX":"nodehex","LACHEX":"lachex","RAWCELLID":"rawcellid",
        "NRxRSRP":"nrx_rsrp","NRxRSRQ":"nrx_rsrq"
    }
    sub = df[[c for c in cols_map if c in df.columns]] \
            .rename(columns={k: cols_map[k] for k in cols_map if k in df.columns})
    for c in ["latitude","longitude","speed","rsrp","rsrq","snr","rssi","cqi",
              "ping_avg_ms","ping_min_ms","ping_max_ms","ping_stdev_ms","ping_loss_pct",
              "dl_mbps","ul_mbps","nrx_rsrp","nrx_rsrq"]:
        if c in sub.columns:
            sub[c] = pd.to_numeric(sub[c], errors="coerce")

    conds = (
        sub.get("rsrp", pd.Series(dtype=float)).between(-140,-40) &
        sub.get("rsrq", pd.Series(dtype=float)).between(-30,0) &
        sub.get("snr",  pd.Series(dtype=float)).between(-20,30) &
        sub.get("speed",pd.Series(dtype=float)).between(0,200)
    )
    sub["is_anomaly"] = (~conds).fillna(False).astype(bool)

    for c in ["rsrp","rsrq","snr","rssi","cqi","ping_avg_ms","ping_min_ms",
              "ping_max_ms","ping_stdev_ms","ping_loss_pct","dl_mbps","ul_mbps",
              "speed","nrx_rsrp","nrx_rsrq"]:
        if c in sub.columns:
            sub[c] = sub[c].fillna(sub[c].mean())

    sub.to_sql("cell_clean_data", get_engine(),
               if_exists="append", index=False, method="multi", chunksize=5000,
               dtype={"is_anomaly": Boolean})


def build_features_from_db(chunk_minutes: int = 1440):
    import traceback
    eng = get_engine()
    with eng.connect() as con:
        row = con.execute(text("SELECT MIN(ts), MAX(ts), COUNT(*) FROM cell_clean_data")).fetchone()
        min_ts, max_ts, total_cnt = row
    if not min_ts or not max_ts or total_cnt == 0:
        print("[SRC] cell_clean_data is empty. I'm exiting."); return

    cur_start = pd.to_datetime(min_ts, utc=True)
    hard_end  = pd.to_datetime(max_ts, utc=True)
    chunk_td  = pd.Timedelta(minutes=chunk_minutes)
    processed = 0

    while cur_start <= hard_end:
        cur_end = min(cur_start + chunk_td, hard_end)
        with eng.connect() as con:
            df = pd.read_sql(text("""
                SELECT DISTINCT ON (cell_id, ts) *
                FROM cell_clean_data
                WHERE ts >= :a AND ts <= :b
                ORDER BY cell_id, ts
            """), con, params={"a": cur_start, "b": cur_end})
        cur_start = cur_end + pd.Timedelta(microseconds=1)
        if df.empty: continue

        df["ts"] = pd.to_datetime(df["ts"], utc=True)
        agg = df.copy()

       
        agg["rsrp_mean"] = agg["rsrp"]
        agg["rsrq_mean"] = agg["rsrq"]
        agg["snr_mean"]  = agg["snr"]
        agg["cqi_mean"]  = agg["cqi"]
        agg["ping_avg_mean"]  = agg["ping_avg_ms"]
        agg["ping_loss_mean"] = agg["ping_loss_pct"]
        agg["dl_mbps_mean"]   = agg["dl_mbps"]
        agg["ul_mbps_mean"]   = agg["ul_mbps"]
        agg["speed_mean"]     = agg["speed"]
        agg["nrx_rsrp_mean"]  = agg.get("nrx_rsrp", pd.Series(index=agg.index, dtype=float))
        agg["nrx_rsrq_mean"]  = agg.get("nrx_rsrq", pd.Series(index=agg.index, dtype=float))
        agg["rssi_mean"]      = agg["rssi"]

        agg["ping_jitter_ms"]   = agg["ping_max_ms"] - agg["ping_min_ms"]
        agg["latency_ms"]       = agg["ping_avg_ms"]
        agg["ping_loss_binary"] = np.where(agg["ping_loss_pct"] > 0, 1, 0)

        ts = pd.to_datetime(agg["ts"], utc=True)
        agg["hour_of_day"]  = ts.dt.hour
        agg["day_of_week"]  = ts.dt.dayofweek
        agg["is_weekend"]   = agg["day_of_week"].isin([5,6])
        agg["is_night"]     = agg["hour_of_day"].isin([0,1,2,3,4,5,23])
        agg["is_peak_hour"] = agg["hour_of_day"].isin([8,9,10,18,19,20,21])
        agg["day_type"]     = np.where(agg["day_of_week"] < 5, 0, 1)

        agg["grid_id"]      = grid_id(agg["latitude"], agg["longitude"])
        agg["grid_lat_bin"] = agg["latitude"].round(3)
        agg["grid_lon_bin"] = agg["longitude"].round(3)


        def _apply_lag_roll(g: pd.DataFrame) -> pd.DataFrame:
            g = g.copy()
            g["ts"] = pd.to_datetime(g["ts"], errors="coerce", utc=True)
            g = g.sort_values("ts").set_index("ts")

            g["rsrp_lag1"] = g["rsrp"].shift(1)
            g["rsrp_lag3"] = g["rsrp"].shift(3)
            g["rsrq_lag1"] = g["rsrq"].shift(1)
            g["rsrq_lag3"] = g["rsrq"].shift(3)
            g["snr_lag1"]  = g["snr"].shift(1)
            g["snr_lag3"]  = g["snr"].shift(3)
            g["ping_lag1"] = g["ping_avg_ms"].shift(1)
            g["dl_lag1"]   = g["dl_mbps"].shift(1)

            
            g["rsrp_roll15m"] = g["rsrp"].rolling("15min").mean()
            g["rsrq_roll15m"] = g["rsrq"].rolling("15min").mean()
            g["snr_roll15m"]  = g["snr"].rolling("15min").mean()
            g["ping_roll15m"] = g["ping_avg_ms"].rolling("15min").mean()
            g["dl_roll15m"]   = g["dl_mbps"].rolling("15min").mean()

            return g.reset_index()


        def add_extra_rolling(g: pd.DataFrame) -> pd.DataFrame:
            g = g.copy()
            g["ts"] = pd.to_datetime(g["ts"], errors="coerce", utc=True)
            g = g.sort_values("ts").set_index("ts")

      
            windows = {"30m": "30min", "1h": "1h", "3h": "3h"}
            cols = ["dl_mbps", "rsrp", "snr"]

            for col in cols:
                if col not in g.columns:
                    continue
                for label, w in windows.items():
                    g[f"{col}_{label}_mean"] = g[col].rolling(w, min_periods=1).mean()
                    g[f"{col}_{label}_std"]  = g[col].rolling(w, min_periods=1).std()
                    if col == "dl_mbps":  
                        g[f"{col}_{label}_min"] = g[col].rolling(w, min_periods=1).min()
                        g[f"{col}_{label}_max"] = g[col].rolling(w, min_periods=1).max()

            return g.reset_index()

        agg = agg.groupby("cell_id", group_keys=False).apply(_apply_lag_roll).reset_index(drop=True)

        agg = agg.groupby("cell_id", group_keys=False).apply(add_extra_rolling).reset_index(drop=True)

        agg["signal_class"] = agg.apply(classify_signal_row, axis=1)
        agg["load_proxy"]   = True


        future = agg[["cell_id","ts","dl_mbps_mean"]].copy()
        future["ts"] -= pd.Timedelta(minutes=HORIZON_MINUTES)
        future = future.rename(columns={"dl_mbps_mean":"dl_mbps_mean_fwd_1h"})
        agg = pd.merge_asof(
            agg.sort_values("ts"),
            future.sort_values("ts"),
            on="ts",
            by="cell_id",
            direction="backward",
            tolerance=pd.Timedelta(minutes=240)  

        )

        agg["horizon_minutes"] = HORIZON_MINUTES
        cur = pd.to_numeric(agg["dl_mbps_mean"], errors="coerce")
        fut = pd.to_numeric(agg["dl_mbps_mean_fwd_1h"], errors="coerce")
        agg["trend_delta_mbps"] = fut - cur
        agg["trend_pct"] = (fut - cur) / cur.clip(lower=EPS)
        agg["trend_label"] = np.where(agg["trend_pct"]>=TREND_PCT_UP,"Up",
                              np.where(agg["trend_pct"]<=TREND_PCT_DOWN,"Down","Flat"))
        agg["trend_class"] = agg["trend_label"].map({"Down":0,"Flat":1,"Up":2}).fillna(-1)
        agg["energy_kwh"] = 0.05 + 0.002 * agg["dl_mbps_mean"]
        agg["baseline_energy"] = agg["energy_kwh"] * 1.15
        agg["dl_mbps_mean_fwd_1h"] = agg["dl_mbps_mean_fwd_1h"].fillna(method="ffill")
        agg["dl_mbps_mean_fwd_1h"] = agg["dl_mbps_mean_fwd_1h"].fillna(agg["dl_mbps_mean"])

        feature_cols = [
            "ts","cell_id","latitude","longitude","operator","net_mode","state","speed",
            "speed_mean","nrx_rsrp_mean","nrx_rsrq_mean","rssi_mean",
            "grid_id","grid_lat_bin","grid_lon_bin","hour_of_day","day_of_week",
            "is_weekend","is_night","is_peak_hour","day_type",
            "rsrp_mean","rsrq_mean","snr_mean","cqi_mean","ping_avg_mean","ping_loss_mean",
            "dl_mbps_mean","ul_mbps_mean","rsrp_lag1","rsrp_lag3","rsrq_lag1","rsrq_lag3",
            "snr_lag1","snr_lag3","ping_lag1","dl_lag1","rsrp_roll15m","rsrq_roll15m",
            "snr_roll15m","ping_roll15m","dl_roll15m","ping_jitter_ms","ping_loss_binary",
            "cellhex","nodehex","lachex","horizon_minutes","trend_label","latency_ms",
            "signal_class","dl_mbps_mean_fwd_1h","load_proxy","trend_delta_mbps",
            "trend_pct","trend_class","snr_30m_mean","snr_30m_std","snr_1h_mean","snr_1h_std","snr_3h_mean","snr_3h_std",
            "dl_mbps_30m_mean","dl_mbps_30m_std","dl_mbps_30m_min","dl_mbps_30m_max",
            "dl_mbps_1h_mean","dl_mbps_1h_std","dl_mbps_1h_min","dl_mbps_1h_max",
            "dl_mbps_3h_mean","dl_mbps_3h_std","dl_mbps_3h_min","dl_mbps_3h_max",
            "rsrp_30m_mean","rsrp_30m_std","rsrp_1h_mean","rsrp_1h_std","rsrp_3h_mean","rsrp_3h_std","energy_kwh", "baseline_energy",


        ]
        for col in feature_cols:
            if col not in agg.columns: agg[col] = np.nan
        agg = agg[feature_cols]

   
        with eng.begin() as con:
            con.execute(text("DELETE FROM cell_features WHERE ts BETWEEN :a AND :b"),
                        {"a":cur_start,"b":cur_end})
            agg.to_sql("cell_features", con, if_exists="append", index=False,
                       method="multi", chunksize=5000,
                       dtype={"is_weekend":Boolean,"is_night":Boolean,
                              "is_peak_hour":Boolean,"load_proxy":Boolean})
        processed += len(agg)
        print(f" CHUNK ok: +{len(agg)} rows (acc: {processed})")

    print(f" DONE. Total features written: {processed}")


def main(loop: bool):
    path = os.getenv("EXCEL_PATH")
    if path and os.path.exists(path):
        try:
            raw_df = load_excel(path)
            write_cell_raw(raw_df)
            df = clean_and_prepare_excel(raw_df)
            write_cell_clean(df)
            print(f" Loaded {len(df)} cleaned rows into DB.")
        except Exception as e:
            print(f" Excel load skipped: {e}")

    while True:
        try:
            build_features_from_db()
        except Exception as e:
            print(f" Feature build failed: {e}")
        if not loop: break
        time.sleep(60)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--loop", action="store_true")
    args = ap.parse_args()
    main(loop=args.loop)
