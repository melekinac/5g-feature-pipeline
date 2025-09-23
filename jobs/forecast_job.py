from prophet import Prophet
import pandas as pd
from sqlalchemy import text
from utils.db import get_engine
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX

def save_forecast_to_db(out, model_name, cell_id, horizon="1h"):
    eng = get_engine()
    out["cell_id"] = cell_id
    out["model_name"] = model_name
    out["horizon"] = horizon
    out["is_invalid"] = out["y_hat"] < 0
    out.to_sql("cell_forecast_ts", eng, if_exists="append", index=False)
    print(f"{model_name} forecast saved for {cell_id} ({len(out)} rows)")

def forecast_prophet(cell_id: str):
    eng = get_engine()
    with eng.connect() as con:
        df = pd.read_sql(
            text("SELECT ts, dl_mbps_mean FROM cell_features WHERE cell_id = :cid ORDER BY ts"),
            con, params={"cid": cell_id}
        )

    if df.empty or df["dl_mbps_mean"].nunique() < 2:
        print(f"Not enough data for Prophet on cell {cell_id}, skipping.")
        return

    df = df.rename(columns={"ts": "ds", "dl_mbps_mean": "y"})
    df["ds"] = pd.to_datetime(df["ds"]).dt.tz_localize(None)

    model = Prophet(daily_seasonality=True, weekly_seasonality=True)
    model.fit(df)

    future = model.make_future_dataframe(periods=4*24*7, freq="15min") 
    forecast = model.predict(future)

    out = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(4*24*7)
    out = out.rename(columns={"ds": "ts", "yhat": "y_hat"})
    save_forecast_to_db(out, "prophet", cell_id, horizon="1 week")

def forecast_arima(cell_id: str):
    eng = get_engine()
    with eng.connect() as con:
        df = pd.read_sql(
            text("SELECT ts, dl_mbps_mean FROM cell_features WHERE cell_id = :cid ORDER BY ts"),
            con, params={"cid": cell_id}
        )

    if len(df) < 30:
        print(f"Not enough data for ARIMA on cell {cell_id}, skipping.")
        return

    df["ts"] = pd.to_datetime(df["ts"]).dt.tz_localize(None)
    df = df.groupby("ts", as_index=False)["dl_mbps_mean"].mean()
    df = df.set_index("ts").asfreq("15min")

    series = df["dl_mbps_mean"].astype(float).ffill()

    try:
        model = ARIMA(series, order=(2,1,2))
        fitted = model.fit()

        forecast = fitted.get_forecast(steps=4*24*7)  
        pred = forecast.predicted_mean
        conf = forecast.conf_int()

        out = pd.DataFrame({
            "ts": pd.date_range(series.index[-1], periods=4*24*7+1, freq="15min")[1:],
            "y_hat": pred.values,
            "yhat_lower": conf.iloc[:, 0].values,
            "yhat_upper": conf.iloc[:, 1].values
        })
        save_forecast_to_db(out, "arima", cell_id, horizon="1 week")
    except Exception as e:
        print(f"ARIMA failed for cell {cell_id}: {e}")

def forecast_sarima(cell_id: str):
    eng = get_engine()
    with eng.connect() as con:
        df = pd.read_sql(
            text("SELECT ts, dl_mbps_mean FROM cell_features WHERE cell_id = :cid ORDER BY ts"),
            con, params={"cid": cell_id}
        )

    if len(df) < 50:
        print(f"Not enough data for SARIMA on cell {cell_id}, skipping.")
        return

    df["ts"] = pd.to_datetime(df["ts"]).dt.tz_localize(None)
    df = df.groupby("ts", as_index=False)["dl_mbps_mean"].mean()
    df = df.set_index("ts").asfreq("15min")

    series = df["dl_mbps_mean"].astype(float).ffill()

    try:

        model = SARIMAX(series, order=(1,1,1), seasonal_order=(1,1,1,96),
                        enforce_stationarity=False, enforce_invertibility=False)
        fitted = model.fit(disp=False)

        forecast = fitted.get_forecast(steps=4*24*7)  
        pred = forecast.predicted_mean
        conf = forecast.conf_int()

        out = pd.DataFrame({
            "ts": pd.date_range(series.index[-1], periods=4*24*7+1, freq="15min")[1:],
            "y_hat": pred.values,
            "yhat_lower": conf.iloc[:, 0].values,
            "yhat_upper": conf.iloc[:, 1].values
        })
        save_forecast_to_db(out, "sarima", cell_id, horizon="1 week")
    except Exception as e:
        print(f"SARIMA failed for cell {cell_id}: {e}")


if __name__ == "__main__":
    eng = get_engine()
    with eng.connect() as con:
        cells = pd.read_sql("SELECT DISTINCT cell_id FROM cell_features", con)

    print(f"Found {len(cells)} cell_ids to forecast with ALL MODELS (Prophet + ARIMA + SARIMA).")

    for cid in cells["cell_id"]:
        try:
            forecast_prophet(cid)
        except Exception as e:
            print(f"Prophet failed for {cid}: {e}")

        try:
            forecast_arima(cid)
        except Exception as e:
            print(f"ARIMA failed for {cid}: {e}")

        try:
            forecast_sarima(cid)
        except Exception as e:
            print(f"SARIMA failed for {cid}: {e}")
