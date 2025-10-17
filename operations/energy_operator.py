"""
=============================================================
5G ENERGY OPTIMIZATION PIPELINE – ENERGY OPERATOR MODULE
=============================================================

Author: Melek Inaç  
Version: v1.0  

Description:
------------
Simulates real-time operational behavior of 5G base stations
based on the current records stored in the `cell_status` table.
Each iteration processes active cells, determines their energy
state transition (e.g., ACTIVE → SLEEP), and logs the operation
results into the `cell_operation_log` table.

Core Responsibilities:
----------------------
1. Fetch current cell operational status from `cell_status`.
2. Simulate real-time energy actions:
   - **decrease** → trigger sleep mode (energy downscale)
   - **increase** → wake-up or energy boost
   - **hold/monitor** → maintain current operational state
3. Log all transitions (before/after status) into PostgreSQL.
4. Provide operational feedback for each executed action.

Technical Notes:
----------------
- Frequency: typically executed within orchestrator loop
- Database Tables:
  • cell_status → source of operational directives  
  • cell_operation_log → audit log of simulated operations
- Dependencies:
  • utils.db.get_engine() → SQLAlchemy DB connection helper
=============================================================
"""

import time
import pandas as pd
from sqlalchemy import text
from utils.db import get_engine

def run_energy_operations():
  
    eng = get_engine()

    with eng.connect() as con:
        df = pd.read_sql("SELECT * FROM cell_status", con)

    if df.empty:
        print(" No cell_status records found.")
        return

    for _, row in df.iterrows():
      
        if row["status"] == "SLEEP":
            print(f" Cell {row['cell_id']} → entering sleep mode (energy downscale).")
            operation = "sleep"
        elif row["status"] == "ACTIVE" and row["last_action"] == "increase":
            print(f" Cell {row['cell_id']} → boosting energy capacity.")
            operation = "increase"
        elif row["status"] == "ACTIVE":
            print(f"Cell {row['cell_id']} → operating normally.")
            operation = "active"
        else:
            operation = "unknown"

        with eng.begin() as con:
            con.execute(
                text("""
                INSERT INTO cell_operation_log (cell_id, action, status_before, status_after)
                VALUES (:cell_id, :action, :before, :after)
                """),
                {
                    "cell_id": row["cell_id"],
                    "action": row["last_action"],
                    "before": "ACTIVE" if row["status"] == "SLEEP" else "SLEEP",
                    "after": row["status"],
                }
            )

        time.sleep(0.2)  

    print("Energy operations cycle complete.")


if __name__ == "__main__":
    run_energy_operations()
