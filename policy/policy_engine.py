"""
=============================================================
5G ENERGY OPTIMIZATION PIPELINE – POLICY ENGINE
=============================================================

Description:
------------
This module dynamically evaluates cell-level KPI and forecast data 
to determine optimal energy management actions (e.g., increase, 
decrease, hold). Decision logic is defined in a YAML configuration 
(`config/policy.yaml`) that combines both signal class and traffic 
trend rules. The resulting actions are persisted into `cell_policy` 
and summarized in real-time within `cell_status`.

Core Responsibilities:
----------------------
1. Load rule definitions from YAML (`policy.yaml`).
2. Match signal/trend patterns to derive an energy action.
3. Persist the decisions into the `cell_policy` table.
4. Synchronize operational states in `cell_status` table.
5. Optionally run continuously (loop mode) for live adaptation.

Technical Notes:
----------------
- Tables:
    • cell_features   → source of signal/trend inputs  
    • cell_forecast   → predicted performance metrics  
    • cell_policy     → per-cell decision results  
    • cell_status     → current operational state
- Config:
    POLICY_FILE (default: config/policy.yaml)
    POLICY_LOOP (true/false)
    POLICY_LOOP_SEC (interval in seconds)
=============================================================
"""

import os
import time
import yaml
import pandas as pd
import json
from sqlalchemy import text
from utils.db import get_engine


POLICY_FILE = "config/policy.yaml"            
LOOP_SEC = int(os.getenv("POLICY_LOOP_SEC", "30"))  



def load_policy_rules():
    with open(POLICY_FILE, "r") as f:
        return yaml.safe_load(f)


def decide_action(signal_class, trend_label, rules):
    
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


# -------------------------------------------------------------
# APPLY ACTIONS TO STATUS TABLE
# -------------------------------------------------------------
def apply_actions_to_status(con):
    sql = """
    WITH latest_policy AS (
        SELECT DISTINCT ON (cell_id)
            cell_id, action, ts
        FROM cell_policy
        ORDER BY cell_id, ts DESC
    )
    INSERT INTO cell_status (cell_id, last_action, status, updated_at)
    SELECT 
        lp.cell_id,
        lp.action,
        CASE 
            WHEN lp.action = 'decrease' THEN 'SLEEP'
            WHEN lp.action = 'increase' THEN 'ACTIVE'
            WHEN lp.action = 'hold' THEN 'ACTIVE'
            WHEN lp.action = 'monitor' THEN 'ACTIVE'
            ELSE 'ACTIVE'
        END AS status,
        now()
    FROM latest_policy lp
    ON CONFLICT (cell_id)
    DO UPDATE SET 
        last_action = EXCLUDED.last_action,
        status = EXCLUDED.status,
        updated_at = now();
    """
    con.execute(text(sql))
    print("cell_status table updated successfully.")


# -------------------------------------------------------------
# MAIN EXECUTION CYCLE
# -------------------------------------------------------------
def run_policy_once():
   
    eng = get_engine()
    rules = load_policy_rules()

    with eng.connect() as con:
        df = pd.read_sql(text("""
            SELECT f.ts, f.cell_id, f.signal_class, f.trend_label, fc.y_hat
            FROM cell_features f
            LEFT JOIN cell_forecast fc
              ON f.cell_id = fc.cell_id AND f.ts = fc.ts
            ORDER BY f.ts ASC;
        """), con)

    if df.empty:
        print(" Policy Engine: no new data found.")
        return

    out_rows = []
    for _, row in df.iterrows():
        action, reason = decide_action(row["signal_class"], row["trend_label"], rules)
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
        out_df.to_sql("cell_policy", con, if_exists="append", index=False, chunksize=500)
        apply_actions_to_status(con)

    print(f"Policy Engine completed successfully. {len(out_df)} actions written.")



def main():
   
    loop = os.getenv("POLICY_LOOP", "true").lower() == "true"
    while True:
        try:
            run_policy_once()
        except Exception as e:
            print("Policy Engine error:", e)
        if not loop:
            break
        time.sleep(LOOP_SEC)



if __name__ == "__main__":
    main()
