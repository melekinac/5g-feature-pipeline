import os
import numpy as np
import pandas as pd
import joblib
from utils.models import save_model
from sklearn.metrics import classification_report , accuracy_score, f1_score
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sqlalchemy import text
from utils.db import get_engine
from sklearn.preprocessing import LabelEncoder
from utils.params import load_best_params 
import re
import json
from jobs.feature_job import HORIZON_MINUTES 
from utils.models import save_model

from utils.registry import register_model

try:
    from lightgbm import LGBMClassifier, LGBMRegressor
except ImportError:
    LGBMClassifier, LGBMRegressor = None, None

try:
    from xgboost import XGBClassifier, XGBRegressor
except ImportError:
    XGBClassifier, XGBRegressor = None, None

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)


def smape(y_true, y_pred):
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    denom = (np.abs(y_true) + np.abs(y_pred))
    denom[denom == 0] = 1.0
    return np.mean(2.0 * np.abs(y_pred - y_true) / denom)


def mape_eps(y_true, y_pred, eps=5):
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    denom = np.maximum(np.abs(y_true), eps)
    return np.mean(np.abs(y_pred - y_true) / denom)


def time_split(X, y, test_ratio=0.30):
    n = len(X)
    if n == 0:
        return X, X, y, y, 0
    split_idx = int(n * (1 - test_ratio))
    if split_idx == 0 or split_idx == n:
        return X, X, y, y, 0
    return X.iloc[:split_idx], X.iloc[split_idx:], y.iloc[:split_idx], y.iloc[split_idx:], split_idx


def train_rf_classifier(X_train, X_test, y_train, y_test, model_name="rf_classifier"):
    default_params = {
        "n_estimators": 300,
        "max_depth": 12,
        "random_state": 42,
        "n_jobs": -1,
        "class_weight": "balanced",
    }
    params = load_best_params(default_params)

    clf = RandomForestClassifier(**params)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    print(f"=== {model_name.upper()} ===")
    print(classification_report(y_test, y_pred))

    save_model(clf, X_train.columns.tolist(), model_name)
    return clf, y_pred


def get_data_for_regression(test_ratio=0.3):
    eng = get_engine()
    with eng.connect() as con:
        df = pd.read_sql(text("SELECT * FROM cell_features ORDER BY ts"), con)

    if "dl_mbps_mean_fwd_1h" not in df.columns:
        raise ValueError("'dl_mbps_mean_fwd_1h' kolonu yok. Önce feature_job çalıştırmalısın.")

    df["dl_mbps_mean_fwd_1h"] = pd.to_numeric(df["dl_mbps_mean_fwd_1h"], errors="coerce")
    df["dl_mbps_mean"] = pd.to_numeric(df["dl_mbps_mean"], errors="coerce")


    df = df[df["dl_mbps_mean_fwd_1h"].notna() & df["dl_mbps_mean"].notna()].copy()

    if df.empty:
        raise ValueError("Regression için geçerli satır kalmadı. Hedef NaN görünüyor.")

    y = df["dl_mbps_mean_fwd_1h"].astype(float)

    
    leakage_cols = [
        "dl_mbps_mean_fwd_1h",
        "dl_30m_mean", "dl_1h_mean", "dl_3h_mean",
        "dl_roll15m", "dl_lag1", "dl_lag3", "dl_lag6"
    ]
    X = (
        df.select_dtypes(include=[np.number])
          .drop(columns=leakage_cols, errors="ignore")
          .fillna(0)
    )

    
    n = len(X)
    split_idx = int(n * (1 - test_ratio))
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    return X_train, X_test, y_train, y_test

def train_lgbm_classifier(X_train, X_test, y_train, y_test, model_name="lgbm_classifier"):
    if LGBMClassifier is None:
        print("LightGBM kurulu değil, atlanıyor.")
        return None, None, None

    le = LabelEncoder()
    y_train_enc = le.fit_transform(y_train)
    y_test_enc = le.transform(y_test)

    default_params = {
        "n_estimators": 300,
        "max_depth": 12,
        "random_state": 42,
        "class_weight": "balanced",
    }
    params = load_best_params(default_params)

    clf = LGBMClassifier(**params)
    clf.fit(X_train, y_train_enc)
    y_pred_enc = clf.predict(X_test)

    y_pred = le.inverse_transform(y_pred_enc)
    print(f"=== {model_name.upper()} ===")
    print(classification_report(le.inverse_transform(y_test_enc), y_pred))

    joblib.dump(clf, f"{MODEL_DIR}/{model_name}.pkl")
    joblib.dump(le, f"{MODEL_DIR}/{model_name}_encoder.pkl")
    joblib.dump(X_train.columns.tolist(), f"{MODEL_DIR}/feature_list_{model_name}.pkl")

    return clf, y_pred_enc, le


def train_xgb_classifier(X_train, X_test, y_train, y_test, model_name="xgb_classifier"):
    if XGBClassifier is None:
        print("XGBoost kurulu değil, atlanıyor.")
        return None, None
    
    le = LabelEncoder()
    y_train_enc = le.fit_transform(y_train)
    y_test_enc = le.transform(y_test)
    
    default_params = {
        "n_estimators": 300,
        "max_depth": 12,
        "random_state": 42,
        "n_jobs": -1,
        "objective": "multi:softprob",
        "eval_metric": "mlogloss",
        "num_class": len(le.classes_),
    }
    params = load_best_params(default_params)

    clf = XGBClassifier(**params)
    clf.fit(X_train, y_train_enc)

    y_pred_enc = clf.predict(X_test)
    y_pred = le.inverse_transform(y_pred_enc)


    print(f"=== {model_name.upper()} ===")
    print(classification_report(y_test, y_pred))

    joblib.dump(clf, f"{MODEL_DIR}/{model_name}.pkl")
    joblib.dump(le, f"{MODEL_DIR}/{model_name}_encoder.pkl")
    joblib.dump(X_train.columns.tolist(), f"{MODEL_DIR}/feature_list_{model_name}.pkl")

    return clf, y_pred_enc, le


def train_rf_regressor(X_train, X_test, y_train, y_test, model_name="rf_regressor"):
    default_params = {
        "n_estimators": 300,
        "max_depth": 12,
        "random_state": 42,
        "n_jobs": -1,
    }
    params = load_best_params(default_params)

    regr = RandomForestRegressor(**params)
    regr.fit(X_train, y_train)
    y_pred = regr.predict(X_test)

    mape = mape_eps(y_test, y_pred, eps=5)
    s_mape = smape(y_test, y_pred)
    print(f"=== {model_name.upper()} ===")
    print(f"MAPE(ε=5): {mape:.4f} | SMAPE: {s_mape:.4f}")

    joblib.dump(regr, f"{MODEL_DIR}/{model_name}.pkl")
    joblib.dump(X_train.columns.tolist(), f"{MODEL_DIR}/feature_list_{model_name}.pkl")

    return regr, y_pred, mape, s_mape


def train_lgbm_regressor(X_train, X_test, y_train, y_test, model_name="lgbm_regressor"):
    if LGBMRegressor is None:
        print("LightGBM kurulu değil, atlanıyor.")
        return None, None, None, None

    default_params = {
        "n_estimators": 300,
        "max_depth": 12,
        "random_state": 42,
    }
    params = load_best_params(default_params)

    regr = LGBMRegressor(**params)
    regr.fit(X_train, y_train)
    y_pred = regr.predict(X_test)

    mape = mape_eps(y_test, y_pred, eps=5)
    s_mape = smape(y_test, y_pred)
    print(f"=== {model_name.upper()} ===")
    print(f"MAPE(ε=5): {mape:.4f} | SMAPE: {s_mape:.4f}")

    joblib.dump(regr, f"{MODEL_DIR}/{model_name}.pkl")
    joblib.dump(X_train.columns.tolist(), f"{MODEL_DIR}/feature_list_{model_name}.pkl")

    return regr, y_pred, mape, s_mape


def train_xgb_regressor(X_train, X_test, y_train, y_test, model_name="xgb_regressor"):
    if XGBRegressor is None:
        print("XGBoost kurulu değil, atlanıyor.")
        return None, None, None, None

    default_params = {
        "n_estimators": 300,
        "max_depth": 12,
        "random_state": 42,
        "n_jobs": -1,
    }
    params = load_best_params(default_params)

    regr = XGBRegressor(**params)
    regr.fit(X_train, y_train)
    y_pred = regr.predict(X_test)

    mape = mape_eps(y_test, y_pred, eps=5)
    s_mape = smape(y_test, y_pred)
    print(f"=== {model_name.upper()} ===")
    print(f"MAPE(ε=5): {mape:.4f} | SMAPE: {s_mape:.4f}")

    joblib.dump(regr, f"{MODEL_DIR}/{model_name}.pkl")
    joblib.dump(X_train.columns.tolist(), f"{MODEL_DIR}/feature_list_{model_name}.pkl")

    return regr, y_pred, mape, s_mape


def train_classification():
    eng = get_engine()
    with eng.connect() as con:
        df = pd.read_sql(text("SELECT * FROM cell_features ORDER BY ts"), con)

    if "signal_class" not in df.columns or df["signal_class"].dropna().empty:
        print("No signal_class data, skipping classification.")
        return

    y = df["signal_class"]

    leakage_cols = [
        "signal_class",
        "rsrp_mean", "rsrq_mean", "snr_mean", "cqi_mean",
        "rsrp_lag1", "rsrp_lag3", "rsrp_roll15m"
    ]
    X = df.select_dtypes(include=[np.number]).drop(columns=leakage_cols, errors="ignore").fillna(0)

    X_train, X_test, y_train, y_test, split_idx = time_split(X, y)

    clf, y_pred = train_rf_classifier(X_train, X_test, y_train, y_test)
    if clf is not None and y_pred is not None:
        out = df.iloc[split_idx:].copy()
        out["class_label"] = y_pred
        out["action"] = "monitor"
        report = classification_report(y_test, y_pred, output_dict=True)
        out["reason"] = json.dumps(report["weighted avg"])  
        out["thresholds_ver"] = "v1"
        out["model_name"] = "rf_classifier"

        out_df = out[["ts", "cell_id", "class_label", "action", "reason", "thresholds_ver", "model_name"]]
        out_df.to_sql("cell_policy", eng, if_exists="append", index=False, method="multi", chunksize=5000)
        print(f"Classification results written (rf_classifier): {len(out_df)} rows")
        
        
        save_model(clf, X_train.columns.tolist(), "rf_classifier")  
        acc = accuracy_score(y_test, y_pred)
        f1  = f1_score(y_test, y_pred, average="weighted")
        metrics = {"accuracy": acc, "f1": f1}
        register_model("rf_classifier", "classifier", "v1", metrics, is_active=True)



    if LGBMClassifier:
        result = train_lgbm_classifier(X_train, X_test, y_train, y_test)
        if result is not None:
            clf, y_pred_enc, le = result
            if clf is not None and y_pred_enc is not None:
                out = df.iloc[split_idx:].copy()
                out["class_label"] = le.inverse_transform(y_pred_enc)
                out["action"] = "monitor"
                report = classification_report(y_test, y_pred, output_dict=True)
                out["reason"] = json.dumps(report["weighted avg"])  
                out["thresholds_ver"] = "v1"
                out["model_name"] = "lgbm_classifier"

                out_df = out[["ts", "cell_id", "class_label", "action", "reason", "thresholds_ver", "model_name"]]
                out_df.to_sql("cell_policy", eng, if_exists="append", index=False, method="multi", chunksize=5000)
                print(f"Classification results written (lgbm_classifier): {len(out_df)} rows")


    if XGBClassifier:
        result = train_xgb_classifier(X_train, X_test, y_train, y_test)
    if result is not None:
        clf, y_pred_enc, le = result
        if clf is not None and y_pred_enc is not None:
            out = df.iloc[split_idx:].copy()
            out["class_label"] = le.inverse_transform(y_pred_enc)
            out["action"] = "monitor"
            report = classification_report(y_test, y_pred, output_dict=True)
            out["reason"] = json.dumps(report["weighted avg"])  
            out["thresholds_ver"] = "v1"
            out["model_name"] = "xgb_classifier"

            out_df = out[["ts", "cell_id", "class_label", "action", "reason", "thresholds_ver", "model_name"]]
            out_df.to_sql("cell_policy", eng, if_exists="append", index=False, method="multi", chunksize=5000)
            print(f"Classification results written (xgb_classifier): {len(out_df)} rows")

def train_regression(log_transform=True):
    eng = get_engine()
    with eng.connect() as con:
        df = pd.read_sql(text("SELECT * FROM cell_features ORDER BY ts"), con)

    if "dl_mbps_mean_fwd_1h" not in df.columns:
        print("'dl_mbps_mean_fwd_1h' kolonu yok.")
        return

    df["dl_mbps_mean_fwd_1h"] = pd.to_numeric(df["dl_mbps_mean_fwd_1h"], errors="coerce")
    df["dl_mbps_mean"] = pd.to_numeric(df["dl_mbps_mean"], errors="coerce")

    before = len(df)
    df = df[df["dl_mbps_mean_fwd_1h"].notna() & df["dl_mbps_mean"].notna()].copy()
    dropped = before - len(df)
    if dropped > 0:
        print(f"Regression: hedefi olmayan (NaN) {dropped} satır düşüldü.")

    if df.empty:
        print("Regression için geçerli satır kalmadı.")
        return

    y_raw = df["dl_mbps_mean_fwd_1h"].astype(float)
    if log_transform:
        y = np.log1p(y_raw)   
    else:
        y = y_raw
    leakage_cols = [
        "dl_mbps_mean_fwd_1h", "dl_30m_mean", "dl_1h_mean", "dl_3h_mean",
        "dl_roll15m", "dl_lag1", "dl_lag3", "dl_lag6"
    ]
    X = df.select_dtypes(include=[np.number]).drop(columns=leakage_cols, errors="ignore").fillna(0)
    X_train, X_test, y_train, y_test, split_idx = time_split(X, y)
    regr, y_pred, mape, smape_val = train_rf_regressor(X_train, X_test, y_train, y_test)
    if regr is not None:
        rmse = float(np.sqrt(np.mean((y_test - y_pred) ** 2)))
        metrics = {"mape": mape, "smape": smape_val, "rmse": rmse}
        register_model("rf_regressor", "regressor", "v1", metrics, is_active=True)
        save_results("rf_regressor", y_pred, mape, smape_val)

    # save_model(regr, features, "rf_regressor", version="v1")
    # metrics = {"mape": mape, "rmse": rmse}
    # # register_model("rf_regressor", "regressor", "v1", metrics, is_active=True)
    # save_model(regr, X_train.columns.tolist(), "rf_regressor", version="v1")

    # leakage_cols = [c for c in df.columns if "_fwd_" in c or "_roll" in c or "_lag" in c]
    # leakage_cols.append("dl_mbps_mean_fwd_1h")

    # X = (
    #     df.select_dtypes(include=[np.number])
    #       .drop(columns=leakage_cols, errors="ignore")
    #       .fillna(0)
    # )

    # X_train, X_test, y_train, y_test, split_idx = time_split(X, y)

    def save_results(model_name, y_pred, mape, smape_val):
        if log_transform:
            y_pred = np.expm1(y_pred)
            y_true = np.expm1(y_test)
        else:
            y_true = y_test

        out = df.iloc[split_idx:].copy()
        err = np.std(y_true - y_pred)

        # out = df.iloc[split_idx:].copy()
        # err = np.std(y_test - y_pred)

        out["y_hat"] = y_pred
        out["ci_low"] = y_pred - 1.96 * err
        out["ci_high"] = y_pred + 1.96 * err
        out["confidence"] = 0.8
        out["model_name"] = model_name
        out["mape"] = mape
        out["horizon_minutes"] = HORIZON_MINUTES
        out["trend_label"] = np.where(
            out["y_hat"] > out["dl_mbps_mean"], "increase",
            np.where(out["y_hat"] < out["dl_mbps_mean"], "decrease", "stable")
        )

        out_df = out[[
            "ts", "cell_id", "y_hat", "ci_low", "ci_high",
            "confidence", "model_name", "mape",
            "horizon_minutes", "trend_label"
        ]]
        out_df.to_sql("cell_forecast", eng, if_exists="append", index=False, method="multi", chunksize=500)
        print(f"Regression results written ({model_name}): {len(out_df)} rows")

        
        metrics_df = pd.DataFrame([{
            "model_name": model_name,
            "rmse": float(np.sqrt(np.mean((y_test - y_pred) ** 2))),
            "mape": float(mape),
            "smape": float(smape_val),
            "trained_at": pd.Timestamp.utcnow()
        }])
        metrics_df.to_sql("model_metrics", eng, if_exists="append", index=False)
        print(f"Metrics written ({model_name})")

    
    regr, y_pred, mape, smape_val = train_rf_regressor(X_train, X_test, y_train, y_test)
    if regr is not None: save_results("rf_regressor", y_pred, mape, smape_val)

    if LGBMRegressor:
        regr, y_pred, mape, smape_val = train_lgbm_regressor(X_train, X_test, y_train, y_test)
        if regr is not None: save_results("lgbm_regressor", y_pred, mape, smape_val)

    if XGBRegressor:
        regr, y_pred, mape, smape_val = train_xgb_regressor(X_train, X_test, y_train, y_test)
        if regr is not None: save_results("xgb_regressor", y_pred, mape, smape_val)
