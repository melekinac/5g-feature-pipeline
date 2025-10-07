from fastapi import FastAPI , Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
import os
import pandas as pd
import subprocess
import json
DB_USER = os.getenv("POSTGRES_USER", "postgres5g")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres5g")
DB_HOST = os.getenv("POSTGRES_HOST", "postgres")  
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "user_activity_db")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/forecast")
def get_forecast():
    return pd.read_sql("SELECT * FROM cell_forecast_ts ORDER BY ts DESC LIMIT 500", engine).to_dict("records")


@app.get("/api/cell_features")
def get_forecast():
    return pd.read_sql("SELECT * FROM cell_features ORDER BY ts DESC LIMIT 5", engine).to_dict("records")

# @app.get("/api/cell_stats")
# def get_cell_stats():
#     return pd.read_sql("SELECT * FROM cell_features ORDER BY ts DESC LIMIT 5", engine).to_dict("records")

@app.get("/api/policies")
def get_policies():
    return pd.read_sql("SELECT * FROM cell_policy ORDER BY ts DESC LIMIT 500", engine).to_dict("records")

@app.post("/api/simulate")
def run_simulation():
    try:
        result = subprocess.run(
            ["python", "jobs/simulation_pipeline.py"],
            check=True,
            capture_output=True,
            text=True
        )
        return {"message": f" Simülasyon tamamlandı!\n{result.stdout}"}
    except subprocess.CalledProcessError as e:
        return {
            "message": f" Hata oluştu: {e}\nSTDOUT:\n{e.stdout}\nSTDERR:\n{e.stderr}"
        }

START_DATE = "2019-12-14"
END_DATE = "2020-02-27"

@app.get("/api/kpis")
def get_kpis():
    query = f"""
        SELECT 
            date,
            AVG(dl_mbps_mean) AS avg_dl,
            AVG(ul_mbps_mean) AS avg_ul,
            AVG(rsrp_mean) AS avg_rsrp,
            AVG(snr_mean) AS avg_snr,
            AVG(latency_p90) AS avg_latency,
            SUM(energy_kwh) AS total_energy
        FROM cell_kpis_daily
        WHERE date BETWEEN '2019-12-14' AND '2020-02-27'
        GROUP BY date
        ORDER BY date ASC;
    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/policy_summary")
def get_policy_summary():
    query = f"""
        SELECT action, COUNT(*) AS count
        FROM cell_policy
        WHERE ts BETWEEN '{START_DATE}' AND '{END_DATE}'
        GROUP BY action;
    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/energy_summary")
def get_energy_summary():
    query = f"""
        SELECT SUM(energy_kwh) AS total_energy
        FROM cell_kpis_daily
        WHERE date BETWEEN '{START_DATE}' AND '{END_DATE}';
    """
    result = pd.read_sql(query, engine).to_dict("records")
    return result[0] if result else {"total_energy": 0}


@app.get("/api/model_metrics")
def get_model_metrics():
    query = """
        SELECT model_name, rmse, mape, smape, trained_at
        FROM model_metrics
        ORDER BY trained_at DESC
        LIMIT 50
    """
    with engine.connect() as con:
        result = pd.read_sql(query, con).to_dict("records")
    return result

@app.get("/api/drift")
def get_drift():
    query = """
      SELECT DATE(ts) AS date, 
               AVG(dl_mbps_mean) AS avg_dl,
               AVG(ul_mbps_mean) AS avg_ul,
               AVG(rsrp_mean) AS avg_rsrp,
               AVG(snr_mean) AS avg_snr
        FROM cell_features
        GROUP BY DATE(ts)
        ORDER BY DATE(ts) DESC
        LIMIT 30
    """
    with engine.connect() as con:
        result = pd.read_sql(query, con).to_dict("records")
    return result


@app.get("/api/forecast_all")
def get_forecast_all():
    query1 = """
        SELECT ts, cell_id, y_hat, model_name
        FROM cell_forecast
        ORDER BY ts DESC
        LIMIT 200
    """
    query2 = """
        SELECT ts, cell_id, y_hat, model_name
        FROM cell_forecast_ts
        ORDER BY ts DESC
        LIMIT 200
    """
    with engine.connect() as con:
        df1 = pd.read_sql(query1, con)
        df2 = pd.read_sql(query2, con)

    df = pd.concat([df1, df2], ignore_index=True).sort_values("ts", ascending=True)
    return df.to_dict("records")


@app.get("/api/cells")
def get_cells():
    query = """
        SELECT DISTINCT ON (cell_id) 
       cell_id, 
       latitude, 
       longitude, 
       rsrp_mean, 
       ts, 
       dl_mbps_mean, 
       ul_mbps_mean, 
       snr_mean
FROM cell_features
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL
ORDER BY cell_id, ts DESC;

    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/multi_gauge")
def get_multi_gauge():
    query = """
        SELECT DATE(ts) AS date,
               AVG(dl_mbps_mean) AS avg_dl,
               AVG(ul_mbps_mean) AS avg_ul,
               AVG(snr_mean) AS avg_snr
        FROM cell_features
        GROUP BY DATE(ts)
        ORDER BY DATE(ts) DESC
        LIMIT 7
    """
    result = pd.read_sql(query, engine).to_dict("records")


    data = []
    for r in result:
        data.append({
            "metric": str(r["date"]),
            "dl_mbps": r["avg_dl"],
            "ul_mbps": r["avg_ul"],
            "snr": r["avg_snr"]
        })
    return data


@app.get("/api/forecast/{cell_id}")
def get_forecast(cell_id: str):
    query = f"""
        SELECT ts, y_hat,
               yhat_lower AS ci_low,
               yhat_upper AS ci_high
        FROM cell_forecast_ts
        WHERE cell_id = '{cell_id}'
        ORDER BY ts ASC
        LIMIT 200
    """
    result = pd.read_sql(query, engine).to_dict("records")
    return result



@app.get("/api/energy_saving")
def get_energy_saving():
    query = """
        SELECT 
            AVG(energy_kwh) FILTER (WHERE date < '2020-02-01') AS before,
            AVG(energy_kwh) FILTER (WHERE date >= '2020-02-01') AS after
        FROM cell_kpis_daily;
    """
    result = pd.read_sql(query, engine).to_dict("records")[0]
    if result["before"] and result["after"]:
        saving = (result["before"] - result["after"]) / result["before"] * 100
    else:
        saving = 0
    return {"saving_pct": round(saving,2)}


@app.get("/api/alerts")
def get_alerts():
    query = """
         SELECT 
            id, ts, cell_id, latitude, longitude,
            operator, net_mode, state,
            rsrp_mean, rsrq_mean, snr_mean,
            ping_avg_mean, ping_loss_mean,
            dl_mbps_mean, ul_mbps_mean,
            trend_label, trend_class::text, signal_class, latency_ms
        FROM cell_features
        WHERE 
            (rsrp_mean < -100 OR snr_mean < 5 OR ping_avg_mean > 100 OR trend_class::text = '2')
        ORDER BY ts DESC
        LIMIT 50;
    """
    return pd.read_sql(query, engine).to_dict("records")


@app.get("/api/model_metrics_summary")
def get_model_metrics_summary():
    query = "SELECT model_name, metrics FROM model_registry WHERE is_active=true"
    rows = pd.read_sql(query, engine).to_dict("records")

    parsed = []
    for r in rows:
        metrics = {}
        try:
            
            if r["metrics"]:
                if isinstance(r["metrics"], str):
                    metrics = json.loads(r["metrics"])
                elif isinstance(r["metrics"], dict):
                    metrics = r["metrics"]
        except Exception as e:
            print("Parse error:", e, r["metrics"])

        parsed.append({
            "model": r["model_name"],
            **metrics  
        })

    return parsed


@app.get("/api/policy_timeline/{cell_id}")
def get_policy_timeline(cell_id: str):
    query = f"""
        SELECT ts, action
        FROM cell_policy
        WHERE cell_id = '{cell_id}'
        ORDER BY ts ASC
        LIMIT 200
    """
    return pd.read_sql(query, engine).to_dict("records")

@app.get("/api/simulate/{cell_id}")
def simulate_policy(cell_id: str):
    # Enerji → cell_kpis_daily
    q_energy = f"""
        SELECT AVG(energy_kwh) AS avg_energy
        FROM cell_kpis_daily
        WHERE cell_id = '{cell_id}'
    """
    energy_res = pd.read_sql(q_energy, engine).to_dict("records")[0]

    q_throughput = f"""
        SELECT AVG(dl_mbps_mean) AS avg_throughput
        FROM cell_features
        WHERE cell_id = '{cell_id}'
    """
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
        "simulated": {
            "energy": base_energy - saved_energy,
            "throughput": base_throughput - lost_throughput,
        },
    }


@app.get("/api/kpis/{cell_id}")
def get_kpis_by_cell(cell_id: str):
    query = f"""
        SELECT 
            date,
            dl_mbps_mean,
            ul_mbps_mean,
            rsrp_mean,
            snr_mean,
            energy_kwh
        FROM cell_kpis_daily
        WHERE cell_id = '{cell_id}'
        ORDER BY date ASC
        LIMIT 30
    """
    result = pd.read_sql(query, engine).to_dict("records")
    return result
