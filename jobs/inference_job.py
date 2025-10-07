import json
import pandas as pd
import numpy as np
from sqlalchemy import text

from utils.db import get_engine
from utils.models import load_model, select_best_model
# def load_models():
#     clf, feat_class = load_model("rf_classifier")
#     regr, feat_reg = load_model("rf_regressor")
#     return clf, regr, feat_class, feat_reg


def load_models():
    best_clf = select_best_model("classification") or "rf_classifier"
    best_regr = select_best_model("regression") or "rf_regressor"

    print(f"Best classification model: {best_clf}")
    print(f"Best regression model: {best_regr}")

    clf, feat_class = load_model(best_clf)
    regr, feat_reg = load_model(best_regr)
    return clf, regr, feat_class, feat_reg

def load_latest_features(limit=500):
    eng = get_engine()
    with eng.connect() as con:
        df = pd.read_sql(
            text(f"SELECT * FROM cell_features ORDER BY ts DESC LIMIT {limit}"),
            con
        )
    return df.sort_values("ts").reset_index(drop=True)


def run_inference():
    clf, regr, feat_class, feat_reg = load_models()
    df = load_latest_features()

    if df.empty:
        print(" No new features found.")
        return


    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    X_class = df[num_cols].reindex(columns=feat_class, fill_value=0)
    X_class = X_class.fillna(X_class.median(numeric_only=True))
    df["class_label"] = clf.predict(X_class)


    X_reg = df[num_cols].reindex(columns=feat_reg, fill_value=0)
    X_reg = X_reg.fillna(X_reg.median(numeric_only=True))
    y_hat = regr.predict(X_reg)
    y_std = np.std(y_hat) * 0.5

    df["y_hat"] = y_hat
    df["ci_low"] = y_hat - y_std
    df["ci_high"] = y_hat + y_std
    df["confidence"] = 0.8
    df["model_name"] = "rf_regression_v1"


    eng = get_engine()
    with eng.begin() as con:
        forecast_rows = df[[
            "ts","cell_id","y_hat","ci_low","ci_high","confidence","model_name"
        ]].copy()
        forecast_rows["mape"] = None
        forecast_rows.to_sql("cell_forecast", con, if_exists="append",
                             index=False, method="multi", chunksize=5000)

        policy_rows = df[["ts","cell_id","class_label"]].copy()
        policy_rows["action"] = "monitor"
        policy_rows["reason"] = json.dumps({"rule": "default"})
        policy_rows["thresholds_ver"] = "v1"
        policy_rows.to_sql("cell_policy", con, if_exists="append",
                           index=False, method="multi", chunksize=5000)

    print(f"Inference complete: {len(df)} rows written.")


if __name__ == "__main__":
    run_inference()
