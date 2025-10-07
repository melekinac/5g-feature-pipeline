import os
import time
import yaml
import pandas as pd
from sqlalchemy import text
from utils.db import get_engine
import json

POLICY_FILE = "config/policy.yaml"
LOOP_SEC = int(os.getenv("POLICY_LOOP_SEC", "30"))

def load_policy_rules():
    with open(POLICY_FILE, "r") as f:
        return yaml.safe_load(f)

def decide_action(signal_class, trend_label, rules):
    """class_rules + trend_rules birleştirerek aksiyon seçer."""
    if not rules:
        return "monitor", "no-rules"

    class_rules = rules.get("energy_actions", {}).get("class_rules", {})
    trend_rules = rules.get("energy_actions", {}).get("trend_rules", {})

  
    class_act = class_rules.get(signal_class, "monitor")
    trend_act = trend_rules.get(str(trend_label).lower(), "monitor")

    if class_act == trend_act:
        return class_act, f"class+trend agree ({class_act})"
    else:
        return class_act, f"class={class_act}, trend={trend_act}"

def run_policy_once():
    eng = get_engine()
    rules = load_policy_rules()

    with eng.connect() as con:
        df = pd.read_sql(text("""
            SELECT f.ts, f.cell_id, f.signal_class, f.trend_label, fc.y_hat
            FROM cell_features f
            LEFT JOIN cell_forecast fc
              ON f.cell_id = fc.cell_id AND f.ts = fc.ts
            WHERE f.ts > now() - interval '1 hour'
        """), con)

    if df.empty:
        print("Policy Engine: yeni data yok.")
        return

    out_rows = []
    for _, row in df.iterrows():
        action, reason = decide_action(row["signal_class"], row["trend_label"], rules)
        # out_rows.append({
        #     "ts": row["ts"],
        #     "cell_id": row["cell_id"],
        #     "class_label": row["signal_class"],
        #     "action": action,
        #     "reason": reason,
        #     "model_name": "policy_engine",
        #     "thresholds_ver": rules.get("thresholds_ver", "v1")
        # })
        out_rows.append({
            "ts": row["ts"],
            "cell_id": row["cell_id"],
            "class_label": row["signal_class"],
            "action": action,
            "reason": json.dumps({"rule": reason}),   
            "model_name": "policy_engine",
            "thresholds_ver": rules.get("thresholds_ver", "v1")
        })

    out_df = pd.DataFrame(out_rows)
    with eng.begin() as con:
        # out_df.to_sql("cell_policy", con, if_exists="append", index=False, method="multi", chunksize=500)
        out_df.to_sql("cell_policy", con,if_exists="append",index=False,chunksize=500)

    print(f" Policy Engine {len(out_df)} satır yazdı.")

def main():
    loop = os.getenv("POLICY_LOOP", "true").lower() == "true"
    while True:
        try:
            run_policy_once()
        except Exception as e:
            print(" Policy Engine hata:", e)
        if not loop:
            break
        time.sleep(LOOP_SEC)

if __name__ == "__main__":
    main()
