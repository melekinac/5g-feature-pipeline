"""
5G Energy Optimization FORECAST JOB
===============================================================

Purpose:
--------
This script automatically generates short-term (1-week) throughput forecasts
for each 5G base station cell using multiple time series models.  
It forms a core part of the AI-driven energy optimization pipeline.

Core Functions:
---------------
1. **Model-Based Forecasting**
   - Applies **Prophet**, **ARIMA**, and **SARIMA** models to predict
     downlink throughput (`dl_mbps_mean`) for each cell.
   - Generates confidence intervals and handles missing or low-variance data.

2. **Parallel Processing**
   - Utilizes Python’s `multiprocessing` for batch-based parallel forecasting.
   - Adjustable process count and batch size for efficient CPU utilization.

3. **Database Integration**
   - Fetches cell data from the `cell_features` table.
   - Saves all forecast results (including model type and horizon) into
     `cell_forecast_ts` table.
   - Skips already processed cells to prevent duplicate entries.

4. **Performance Optimization**
   - Limits computation threads (`OMP_NUM_THREADS`, `MKL_NUM_THREADS`, etc.).
   - Ignores unnecessary warnings to streamline batch execution.

Technical Notes:
----------------
- Models: Prophet, ARIMA, SARIMAX (statsmodels)
- Forecast Interval: 15 minutes (configurable)
- Horizon: 1 week (672 steps)
- Safe re-run: Skips cells already forecasted
- Batch control via `batch_size` and CPU scaling via `process_count`
"""


import os
import time
import warnings
import pandas as pd
import numpy as np
import multiprocessing as mp
from sqlalchemy import text
from utils.db import get_engine
from prophet import Prophet
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tools.sm_exceptions import ConvergenceWarning

# === Performans sınırlamaları ===
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["PROPHET_MAX_WORKERS"] = "1"

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=ConvergenceWarning)



def save_forecast_to_db(out: pd.DataFrame, model_name: str, cell_id, horizon: str = "1 week"):
    if out is None or out.empty:
        print(f" No rows to save for {model_name} / cell {cell_id}")
        return
    out = out.copy()


    if "y_hat" in out.columns:
        out["y_hat"] = np.where(out["y_hat"].isna(),
                                out.get("dl_mbps_mean", 0),  
                                out["y_hat"])

    out["cell_id"] = str(cell_id)
    out["model_name"] = model_name
    out["horizon"] = horizon
    out["is_invalid"] = out["y_hat"] < 0
    out = out.fillna(0)

    eng = get_engine()
    try:
        with eng.begin() as con:
            out.to_sql("cell_forecast_ts", con, if_exists="append", index=False, method="multi", chunksize=500)
        print(f"{model_name} saved for cell {cell_id} ({len(out)} rows)")
    except Exception as e:
        print(f" DB save failed for {model_name}/{cell_id}: {e}")
    finally:
        eng.dispose()



def _prep_series(df: pd.DataFrame) -> pd.Series:
    df = df.copy()
    df["ts"] = pd.to_datetime(df["ts"]).dt.tz_localize(None)
    df = df.groupby("ts", as_index=False)["dl_mbps_mean"].mean()
    return df.set_index("ts").asfreq("15min")["dl_mbps_mean"].astype(float).ffill()


def _forecast_prophet(df: pd.DataFrame, steps: int):
    pdf = df.rename(columns={"ts": "ds", "dl_mbps_mean": "y"}).copy()
    pdf["ds"] = pd.to_datetime(pdf["ds"]).dt.tz_localize(None)
    if pdf["y"].nunique() < 2:
        return pd.DataFrame(columns=["ts", "y_hat", "yhat_lower", "yhat_upper"])

    m = Prophet(daily_seasonality=False, weekly_seasonality=False, yearly_seasonality=False)
    m.add_seasonality("daily", 1, 3)
    m.add_seasonality("weekly", 7, 3)
    m.fit(pdf)
    fc = m.predict(m.make_future_dataframe(periods=steps, freq="15min"))
    return fc[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(steps).rename(
        columns={"ds": "ts", "yhat": "y_hat"}
    )


def _forecast_arima(series: pd.Series, steps: int):
    if series.nunique() < 2:
        return pd.DataFrame(columns=["ts", "y_hat", "yhat_lower", "yhat_upper"])
    model = ARIMA(series, order=(1, 1, 1)).fit()
    fc = model.get_forecast(steps)
    conf = fc.conf_int()
    return pd.DataFrame({
        "ts": pd.date_range(series.index[-1] + pd.Timedelta(minutes=15), periods=steps, freq="15min"),
        "y_hat": fc.predicted_mean.values,
        "yhat_lower": conf.iloc[:, 0].values,
        "yhat_upper": conf.iloc[:, 1].values,
    })


def _forecast_sarima(series: pd.Series, steps: int):
    if series.nunique() < 2:
        return pd.DataFrame(columns=["ts", "y_hat", "yhat_lower", "yhat_upper"])
    model = SARIMAX(series, order=(1, 1, 0), seasonal_order=(1, 1, 0, 96),
                    enforce_stationarity=False, enforce_invertibility=False).fit(disp=False)
    fc = model.get_forecast(steps)
    conf = fc.conf_int()
    return pd.DataFrame({
        "ts": pd.date_range(series.index[-1] + pd.Timedelta(minutes=15), periods=steps, freq="15min"),
        "y_hat": fc.predicted_mean.values,
        "yhat_lower": conf.iloc[:, 0].values,
        "yhat_upper": conf.iloc[:, 1].values,
    })



def run_forecast_for_cell(cell_id):
    steps = 4 * 24 * 7
    print(f"\n Starting forecasts for cell {cell_id}...")

    try:
        eng = get_engine()
        with eng.connect() as con:
            df = pd.read_sql(text("SELECT ts, dl_mbps_mean FROM cell_features WHERE cell_id = :cid ORDER BY ts"),
                             con, params={"cid": str(cell_id)})
        eng.dispose()

        if df.empty or df["dl_mbps_mean"].nunique() < 2:
            print(f" Low variation for {cell_id}, saving constant forecast instead.")
        
            mean_val = df["dl_mbps_mean"].mean() if not df.empty else 0
            dummy = pd.DataFrame({
                "ts": pd.date_range(pd.Timestamp.now(), periods=96, freq="15min"),
                "y_hat": [mean_val] * 96,
                "yhat_lower": [mean_val * 0.9] * 96,
                "yhat_upper": [mean_val * 1.1] * 96,
                "dl_mbps_mean": [mean_val] * 96
            })
            save_forecast_to_db(dummy, "constant", cell_id)
            return f"{cell_id}:constant_forecast"

        series = _prep_series(df)
        for model_name, func in [
            ("prophet", lambda: _forecast_prophet(df, steps)),
            ("arima", lambda: _forecast_arima(series, steps)),
            ("sarima", lambda: _forecast_sarima(series, steps)),
        ]:
            try:
                out = func()
                if out is not None and not out.empty:
                    save_forecast_to_db(out, model_name, cell_id)
            except Exception as e:
                print(f" {model_name.upper()} failed for {cell_id}: {e}")

        print(f" Done for cell {cell_id}")
        return f"{cell_id}:done"
    except Exception as e:
        print(f" General failure for {cell_id}: {e}")
        return f"{cell_id}:error"



if __name__ == "__main__":
    mp.freeze_support()
    try:
        mp.set_start_method("spawn", force=True)
    except RuntimeError:
        pass

    eng = get_engine()
    try:
        with eng.connect() as con:
            cells = pd.read_sql(text("""
                SELECT DISTINCT cf.cell_id
                FROM cell_features cf
                WHERE cf.cell_id NOT IN (
                    SELECT DISTINCT cell_id FROM cell_forecast_ts
                )
                ORDER BY cf.cell_id
            """), con)
    finally:
        eng.dispose()

    all_cells = cells["cell_id"].tolist()
    print(f"Found {len(all_cells)} unprocessed cells total.")

    if not all_cells:
        print("All cells already processed. Exiting.")
        raise SystemExit(0)

    process_count = min(4, max(1, mp.cpu_count() // 2))
    batch_size = 15

  
    for i in range(0, len(all_cells), batch_size):
        batch = all_cells[i:i + batch_size]
        print(f"\n Processing batch {i//batch_size + 1} → cells {batch}")

        with mp.Pool(processes=process_count) as pool:
            for res in pool.imap_unordered(run_forecast_for_cell, batch):
                print(res)

        print(f" Batch {i//batch_size + 1} completed. Cooling down 10s...\n")
        time.sleep(10) 

    print("All forecasts completed safely.")
