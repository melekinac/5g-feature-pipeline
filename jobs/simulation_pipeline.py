"""
=============================================================
5G ENERGY OPTIMIZATION PIPELINE – SIMULATOR PIPELINE
=============================================================

Purpose:
--------
Coordinates and executes the **data simulation and feature creation**
pipeline that emulates realistic 5G base station telemetry for
energy optimization experiments.

Core Responsibilities:
----------------------
1. **Simulator Job**
   - Generates synthetic network data (RSRP, SNR, throughput, etc.).
   - Writes raw and cleaned measurements into PostgreSQL tables.

2. **Feature Engineering Job**
   - Aggregates recent records and computes statistical, temporal,
     and signal-based features for model training and forecasting.

3. **Inference Job**
   - Applies trained ML models to predict energy consumption and
     signal behavior, storing results in `cell_forecast` and
     `cell_policy` tables.

4. **Pipeline Coordination**
   - Runs the simulator → feature builder → inference modules in
     strict order, ensuring data dependencies are respected.

Technical Notes:
----------------
- Designed for offline simulation and reproducible pipeline testing.
- Enables end-to-end execution without external data streams.
- Commonly triggered in demo or test environments (e.g., Docker Compose).

=============================================================
"""

import traceback
from jobs import simulator_job, feature_job, inference_job

def run_pipeline():
    try:
        print(" Running simulator_job")
        simulator_job.main()
        print(" simulator_job completed")

        print("Running feature_job")
        feature_job.main()
        print(" feature_job completed")

        print(" Running inference_job")
        inference_job.main()
        print("inference_job completed")

        print(" Pipeline başarıyla completed")
    except Exception as e:
        print("Pipeline returned an error:", e)
        traceback.print_exc()
        raise e

if __name__ == "__main__":
    run_pipeline()
