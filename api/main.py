"""
5G Energy Optimization API
====================================

Main FastAPI application for the 5G Energy Optimization project.
Provides RESTful endpoints for data access, monitoring, simulation, and model evaluation.
Powered by PostgreSQL, SQLAlchemy, and Pandas.

Overview:
---------
- User Authentication via /auth router
- Data Retrieval (KPIs, Forecasts, Policies, Alerts)
- Model Metrics & Drift Analysis
- Energy Efficiency Simulation
- CORS-enabled API for React dashboard integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
import os, pandas as pd, subprocess, json
from . import auth
from .database import engine  

# -------------------------------------------------
# FastAPI App Initialization
# -------------------------------------------------
app = FastAPI(title="5G Energy Optimization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)


# -------------------------------------------------
# Forecast & Cell Features
# -------------------------------------------------
@app.get("/api/forecast")
def get_forecast():
    """Return all forecasted energy/time-series results."""
    return pd.read_sql("SELECT * FROM cell_forecast_ts ORDER BY ts DESC", engine).to_dict("records")


@app.get("/api/cell_features")
def get_cell_features():
    """Return recent cell-level features for monitoring."""
    query = """
        SELECT id, ts, cell_id, energy_kwh, baseline_energy, rsrp_mean, snr_mean
        FROM cell_features
        ORDER BY ts DESC
    """
    df = pd.read_sql(query, engine)
    return df.to_dict("records")


# -------------------------------------------------
# Policies
# -------------------------------------------------
@app.get("/api/policies")
def get_policies(page: int = 1, page_size: int = 500):
    """List policy decisions with pagination."""
    try:
        offset = (page - 1) * page_size
        query = f"""
            SELECT id, ts, cell_id, model_name, class_label, action, reason, thresholds_ver, decided_at
            FROM cell_policy
            ORDER BY ts DESC
            LIMIT {page_size} OFFSET {offset};
        """
        df = pd.read_sql(query, engine)
        return df.to_dict("records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


START_DATE = "2019-12-14"
END_DATE = "2020-02-27"


@app.get("/api/policy_summary")
def get_policy_summary():
    """Return aggregated policy action counts between START_DATE and END_DATE."""
    query = f"""
        SELECT action, COUNT(*) AS count
        FROM cell_policy
        WHERE ts BETWEEN '{START_DATE}' AND '{END_DATE}'
        GROUP BY action;
    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/policy_history")
def get_policy_history():
    """Return the latest policy actions for monitoring."""
    query = """
        SELECT DISTINCT ON (cell_id)
            cell_id, class_label, action, reason, decided_at
        FROM cell_policy
        ORDER BY cell_id, decided_at DESC
        LIMIT 100;
    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/policy_actions/latest")
def get_latest_policy_actions():
    """Return most recent 100 policy actions."""
    query = """
        SELECT DISTINCT ON (cell_id)
            cell_id, class_label, action, reason, decided_at
        FROM cell_policy
        ORDER BY cell_id, decided_at DESC
        LIMIT 100;
    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/policy_timeline/{cell_id}")
def get_policy_timeline(cell_id: str):
    """Return action timeline for a specific cell."""
    query = f"""
        SELECT ts, action
        FROM cell_policy
        WHERE cell_id = '{cell_id}'
        ORDER BY ts ASC;
    """
    return pd.read_sql(query, engine).to_dict("records")


# -------------------------------------------------
# KPI & Metrics
# -------------------------------------------------
@app.get("/api/kpis")
def get_kpis():
    """Return daily aggregated KPIs."""
    query = f"""
        SELECT date,
               AVG(dl_mbps_mean) AS avg_dl,
               AVG(ul_mbps_mean) AS avg_ul,
               AVG(rsrp_mean) AS avg_rsrp,
               AVG(snr_mean) AS avg_snr,
               AVG(latency_p90) AS avg_latency,
               SUM(energy_kwh) AS total_energy
        FROM cell_kpis_daily
        WHERE date BETWEEN '{START_DATE}' AND '{END_DATE}'
        GROUP BY date
        ORDER BY date ASC;
    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/kpis/{cell_id}")
def get_kpis_by_cell(cell_id: str):
    """Return KPI history (DL, UL, RSRP, SNR, Energy) for a specific cell."""
    query = f"""
        SELECT date, dl_mbps_mean, ul_mbps_mean, rsrp_mean, snr_mean, energy_kwh
        FROM cell_kpis_daily
        WHERE cell_id = '{cell_id}'
        ORDER BY date ASC;
    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/model_metrics")
def get_model_metrics():
    """Retrieve model performance metrics (RMSE, MAPE, SMAPE)."""
    query = """
        SELECT model_name, rmse, mape, smape, trained_at
        FROM model_metrics
        ORDER BY trained_at DESC
    """
    with engine.connect() as con:
        result = pd.read_sql(query, con).to_dict("records")
    return result


# -------------------------------------------------
# Drift & Forecasts
# -------------------------------------------------
@app.get("/api/drift")
def get_drift():
    """Show daily averages of KPIs to analyze potential data drift."""
    query = """
        SELECT DATE(ts) AS date,
               AVG(dl_mbps_mean) AS avg_dl,
               AVG(ul_mbps_mean) AS avg_ul,
               AVG(rsrp_mean) AS avg_rsrp,
               AVG(snr_mean) AS avg_snr
        FROM cell_features
        GROUP BY DATE(ts)
        ORDER BY DATE(ts) DESC;
    """
    with engine.connect() as con:
        result = pd.read_sql(query, con).to_dict("records")
    return result


@app.get("/api/forecast_all")
def get_forecast_all():
    """Merge forecast results from both forecast tables."""
    query1 = "SELECT ts, cell_id, y_hat, model_name FROM cell_forecast ORDER BY ts DESC"
    query2 = "SELECT ts, cell_id, y_hat, model_name FROM cell_forecast_ts ORDER BY ts DESC"
    with engine.connect() as con:
        df1 = pd.read_sql(query1, con)
        df2 = pd.read_sql(query2, con)
    df = pd.concat([df1, df2], ignore_index=True).sort_values("ts", ascending=True)
    return df.to_dict("records")


@app.get("/api/forecast/{cell_id}")
def get_forecast(cell_id: str):
    """Return time-series forecast for a specific cell."""
    query = text("""
        SELECT DISTINCT ON (ts)
               ts, y_hat, yhat_lower AS ci_low, yhat_upper AS ci_high, model_name
        FROM cell_forecast_ts
        WHERE cell_id = :cid AND y_hat IS NOT NULL
        ORDER BY ts ASC
    """)
    with engine.connect() as con:
        df = pd.read_sql(query, con, params={"cid": str(cell_id)})
    if df.empty:
        return {"message": f"No forecast data found for cell {cell_id}", "data": []}
    df["ts"] = pd.to_datetime(df["ts"]).dt.tz_localize(None)
    return df.sort_values("ts").to_dict(orient="records")


# -------------------------------------------------
# Simulation
# -------------------------------------------------
@app.get("/api/simulate/{cell_id}")
def simulate_policy(cell_id: str):
    """Simulate energy savings and throughput loss for a given cell."""
    q_energy = f"SELECT AVG(energy_kwh) AS avg_energy FROM cell_kpis_daily WHERE cell_id = '{cell_id}'"
    q_throughput = f"SELECT AVG(dl_mbps_mean) AS avg_throughput FROM cell_features WHERE cell_id = '{cell_id}'"
    energy_res = pd.read_sql(q_energy, engine).to_dict("records")[0]
    throughput_res = pd.read_sql(q_throughput, engine).to_dict("records")[0]

    base_energy = energy_res["avg_energy"] or 100
    base_throughput = throughput_res["avg_throughput"] or 1000
    saved_energy = base_energy * 0.2
    lost_throughput = base_throughput * 0.03

    return {
        "cell_id": cell_id,
        "energy_saving_pct": round((saved_energy / base_energy) * 100, 2),
        "throughput_loss_pct": round((lost_throughput / base_throughput) * 100, 2),
        "baseline": {"energy": base_energy, "throughput": base_throughput},
        "simulated": {"energy": base_energy - saved_energy, "throughput": base_throughput - lost_throughput},
    }


# -------------------------------------------------
# Monitoring & Alerts
# -------------------------------------------------
@app.get("/api/cells")
def get_cells():
    """Return latest cell coordinates and KPIs."""
    query = """
        SELECT DISTINCT ON (cell_id)
            cell_id, latitude, longitude, rsrp_mean, ts, dl_mbps_mean, ul_mbps_mean, snr_mean
        FROM cell_features
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY cell_id, ts DESC;
    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/alerts")
def get_alerts():
    """Categorize cells into severity levels."""
    query = """
        SELECT cell_id,
               MAX(ts) AS last_seen,
               AVG(rsrp_mean) AS rsrp_mean,
               AVG(snr_mean) AS snr_mean,
               AVG(ping_avg_mean) AS ping_avg_mean,
               CASE 
                   WHEN AVG(rsrp_mean) < -110 OR AVG(snr_mean) < 3 OR AVG(ping_avg_mean) > 150 THEN 'Critical'
                   WHEN AVG(rsrp_mean) < -100 OR AVG(snr_mean) < 5 OR AVG(ping_avg_mean) > 100 THEN 'Medium'
                   ELSE 'Low'
               END AS severity
        FROM cell_features
        WHERE (rsrp_mean < -100 OR snr_mean < 5 OR ping_avg_mean > 100 OR trend_class = 2)
        GROUP BY cell_id
        ORDER BY last_seen DESC;
    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/cell_status")
def get_cell_status():
    """Return current ACTIVE / SLEEP status of all cells."""
    query = "SELECT * FROM cell_status ORDER BY updated_at DESC"
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/cell_history/{cell_id}")
def get_cell_history(cell_id: str):
    """Return historical KPI metrics (RSRP, SNR, Throughput) for a cell."""
    query = f"""
        SELECT ts, rsrp_mean, rsrq_mean, snr_mean, dl_mbps_mean, ul_mbps_mean
        FROM cell_features
        WHERE cell_id = '{cell_id}'
        ORDER BY ts DESC;
    """
    return pd.read_sql(query, engine).to_dict("records")


# -------------------------------------------------
# Energy Summary
# -------------------------------------------------
@app.get("/api/cell_energy_summary")
def get_cell_energy_summary():
    """Return annualized energy savings, CO₂ and TL reduction, and tree equivalent."""
    try:
        query = """
            WITH params AS (
              SELECT 5.00::numeric AS price_tl_per_kwh,
                     0.00042::numeric AS co2_ton_per_kwh,
                     23::numeric AS tree_factor
            ),
            agg AS (
              SELECT COUNT(*) AS total_cells,
                     SUM(COALESCE(energy_kwh, 0)) AS total_energy_kwh,
                     SUM(COALESCE(baseline_energy, 0)) AS total_baseline_kwh
              FROM cell_features
            ),
            calc AS (
              SELECT total_cells,
                     (total_energy_kwh * (365.0 / 75.0)) AS total_energy_kwh_year,
                     (total_baseline_kwh * (365.0 / 75.0)) AS total_baseline_kwh_year
              FROM agg
            )
            SELECT total_cells,
                   ROUND(GREATEST(total_baseline_kwh_year - total_energy_kwh_year, 0)::numeric, 2) AS saved_kwh,
                   ROUND((100 * GREATEST(total_baseline_kwh_year - total_energy_kwh_year, 0)
                         / NULLIF(total_baseline_kwh_year, 0))::numeric, 2) AS saved_pct,
                   ROUND((GREATEST(total_baseline_kwh_year - total_energy_kwh_year, 0)
                         * (SELECT co2_ton_per_kwh FROM params))::numeric, 3) AS co2_ton_saved,
                   ROUND((GREATEST(total_baseline_kwh_year - total_energy_kwh_year, 0)
                         * (SELECT price_tl_per_kwh FROM params))::numeric, 2) AS saved_tl,
                   ROUND((GREATEST(total_baseline_kwh_year - total_energy_kwh_year, 0)
                         * (SELECT co2_ton_per_kwh FROM params)
                         * (SELECT tree_factor FROM params))::numeric, 0) AS tree_equivalent
            FROM calc;
        """
        df = pd.read_sql(query, engine)
        return df.to_dict("records")[0] if not df.empty else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
