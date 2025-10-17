-- =============================================================
-- 5G ENERGY OPTIMIZATION DATABASE SCHEMA
-- -------------------------------------------------------------
-- Author: Melek Inaç
-- Description:
--   This SQL schema initializes all core database tables used in
--   the 5G Energy Optimization Pipeline. Each table represents a
--   specific stage of the data lifecycle — from raw telemetry to
--   AI model forecasts and energy-saving policies.
--
-- TABLE OVERVIEW:
--   cell_raw               → Unprocessed raw network logs
--   cell_clean_data        → Cleaned & normalized data
--   cell_features          → Engineered ML feature set
--   cell_forecast          → Model-based traffic forecasts
--   cell_policy            → AI-driven policy decisions
--   cell_status            → Live operational state of cells
--   cell_operation_log     → Executed energy actions log
--   model_metrics          → Training & inference performance
--   model_registry         → Model version control registry
--   energy_impact_summary   → Energy savings & CO₂ reduction stats
--   cell_kpis_daily         → Daily aggregated KPIs
--   users                   → Authentication table (FastAPI auth)
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  

-- =============================================================
-- CELL_RAW
-- -------------------------------------------------------------
-- Stores unprocessed, raw telemetry logs directly from devices or
-- simulator before data cleaning. Every field is stored as text.
-- -------------------------------------------------------------

DROP TABLE IF EXISTS cell_raw CASCADE;
CREATE TABLE cell_raw (
    id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    imported_at     timestamptz DEFAULT now(),
    raw_timestamp   text,
    raw_latitude    text,
    raw_longitude   text,
    raw_speed       text,
    raw_operator    text,
    raw_cellid      text,
    raw_netmode     text,
    raw_rsrp        text,
    raw_rsrq        text,
    raw_snr         text,
    raw_rssi        text,
    raw_cqi         text,
    raw_dl_bitrate  text,
    raw_ul_bitrate  text,
    raw_state       text,
    raw_pingavg     text,
    raw_pingmin     text,
    raw_pingmax     text,
    raw_pingstdev   text,
    raw_pingloss    text,
    raw_cellhex     text,
    raw_nodehex     text,
    raw_lachex      text,
    raw_rawcellid   text,
    raw_nrxrsrp     text,
    raw_nrxrsrq     text
);


-- =============================================================
-- CELL_CLEAN_DATA
-- -------------------------------------------------------------
-- Cleaned and normalized version of raw telemetry. Numeric fields
-- are typed properly, used by the feature engineering pipeline.
-- Source: simulator_job or field data collector.
-- -------------------------------------------------------------
DROP TABLE IF EXISTS cell_clean_data CASCADE;
CREATE TABLE cell_clean_data (
    id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ts              timestamptz NOT NULL,
    cell_id         text NOT NULL,
    latitude        numeric,
    longitude       numeric,
    speed           numeric,
    operator        text,
    net_mode        text,
    state           text,
    rsrp            numeric,
    rsrq            numeric,
    snr             numeric,
    rssi            numeric,
    cqi             numeric,
    dl_mbps         numeric,
    ul_mbps         numeric,
    ping_avg_ms     numeric,
    ping_min_ms     numeric,
    ping_max_ms     numeric,
    ping_stdev_ms   numeric,
    ping_loss_pct   numeric,
    cellhex         text,
    nodehex         text,
    lachex          text,
    rawcellid       text,
    nrx_rsrp        numeric,
    nrx_rsrq        numeric,
    ping_jitter_ms  numeric,
    latency_ms      numeric,
    is_anomaly      boolean DEFAULT false
);


-- =============================================================
-- CELL_FEATURES
-- -------------------------------------------------------------
-- Core feature store for AI/ML models. Contains time-windowed,
-- lagged, and aggregated statistics from cell_clean_data.
-- Used by train_job, inference_job, forecast_job_fast.
-- -------------------------------------------------------------
DROP TABLE IF EXISTS cell_features CASCADE;
CREATE TABLE cell_features (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ts timestamptz NOT NULL,
    cell_id text NOT NULL,
    latitude numeric,
    longitude numeric,
    operator text,
    net_mode text,
    state text,
    speed double precision,
    speed_mean numeric,
    nrx_rsrp_mean numeric,
    nrx_rsrq_mean numeric,
    rssi_mean numeric,
    grid_id text,
    grid_lat_bin numeric,
    grid_lon_bin numeric,
    hour_of_day smallint,
    day_of_week smallint,
    is_weekend boolean,
    is_night boolean,
    is_peak_hour boolean,
    day_type integer,
    rsrp_mean numeric,
    rsrq_mean numeric,
    snr_mean numeric,
    cqi_mean numeric,
    ping_avg_mean numeric,
    ping_loss_mean numeric,
    dl_mbps_mean numeric,
    ul_mbps_mean numeric,
    rsrp_lag1 numeric,
    rsrp_lag3 numeric,
    rsrq_lag1 numeric,
    rsrq_lag3 numeric,
    snr_lag1 numeric,
    snr_lag3 numeric,
    ping_lag1 numeric,
    dl_lag1 numeric,
    rsrp_roll15m numeric,
    rsrq_roll15m numeric,
    snr_roll15m numeric,
    ping_roll15m numeric,
    dl_roll15m numeric,
    ping_jitter_ms numeric,
    ping_loss_binary int,
    cellhex text,
    nodehex text,
    lachex text,
    horizon_minutes numeric,
    trend_label text,
    latency_ms numeric,
    signal_class text,
    dl_mbps_mean_fwd_1h double precision,
    load_proxy boolean,
    trend_delta_mbps double precision,
    trend_pct double precision,
    trend_class numeric,
    snr_30m_mean numeric,
    snr_30m_std numeric,
    snr_1h_mean numeric,
    snr_1h_std numeric,
    snr_3h_mean numeric,
    snr_3h_std numeric,
    dl_mbps_30m_mean numeric,
    dl_mbps_30m_std numeric,
    dl_mbps_30m_min numeric,
    dl_mbps_30m_max numeric,
    dl_mbps_1h_mean numeric,
    dl_mbps_1h_std numeric,
    dl_mbps_1h_min numeric,
    dl_mbps_1h_max numeric,
    dl_mbps_3h_mean numeric,
    dl_mbps_3h_std numeric,
    dl_mbps_3h_min numeric,
    dl_mbps_3h_max numeric,
    rsrp_30m_mean numeric,
    rsrp_30m_std numeric,
    rsrp_1h_mean numeric,
    rsrp_1h_std numeric,
    rsrp_3h_mean numeric,
    rsrp_3h_std numeric,
    energy_kwh DOUBLE PRECISION,
    baseline_energy DOUBLE PRECISION
);


CREATE INDEX IF NOT EXISTS idx_cell_features_cellid ON cell_features (cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_features_ts ON cell_features (ts DESC);
CREATE INDEX IF NOT EXISTS idx_cell_features_cellid_ts ON cell_features (cell_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_cell_features_rsrp ON cell_features (rsrp_mean);
ANALYZE cell_features;
CLUSTER cell_features USING idx_cell_features_ts;
VACUUM ANALYZE cell_features;

-- =============================================================
-- CELL_FORECAST
-- -------------------------------------------------------------
-- Holds predicted throughput/energy forecasts generated by
-- Used by train_job, inference_job, dashboards ,forecast_job.
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cell_forecast (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ts timestamptz NOT NULL,
    cell_id text NOT NULL,
    y_hat numeric,
    ci_low numeric,
    ci_high numeric,
    confidence numeric,
    model_name text,
    mape numeric,
    horizon_minutes int,
    trend_label text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cell_clean_data_sim (LIKE cell_clean_data INCLUDING ALL);

-- =============================================================
-- CELL_POLICY — Decision Layer
-- -------------------------------------------------------------
-- Contains AI-driven energy management decisions.
-- Each row = one decision event with justification (JSON).
-- Produced by: policy_job
-- =============================================================

CREATE TABLE IF NOT EXISTS cell_policy (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ts timestamptz NOT NULL,
    cell_id text NOT NULL,
    model_name text,
    class_label text,
    action text,
    reason jsonb,
    thresholds_ver text,
    decided_at timestamptz DEFAULT now()
);

-- =============================================================
-- CELL_KPIS_DAILY — Aggregated KPIs
-- -------------------------------------------------------------
-- Contains daily performance summaries for each cell.
-- Produced by: kpi_job (compute_kpis.py)
-- =============================================================

CREATE TABLE IF NOT EXISTS cell_kpis_daily (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    cell_id TEXT,
    date DATE,
    dl_mbps_mean DOUBLE PRECISION,
    ul_mbps_mean DOUBLE PRECISION,
    rsrp_mean DOUBLE PRECISION,
    snr_mean DOUBLE PRECISION,
    latency_p90 DOUBLE PRECISION,
    energy_kwh DOUBLE PRECISION
);

-- =============================================================
-- MODEL_METRICS — Model Evaluation Records
-- -------------------------------------------------------------
-- Stores ML performance metrics after training or inference.
-- Used by: train_job, monitor_job
-- =============================================================

CREATE TABLE IF NOT EXISTS model_metrics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_name text NOT NULL,
    task_type text NOT NULL,
    rmse double precision,
    mape double precision,
    smape double precision,
    precision double precision,
    recall double precision,
    f1 double precision,
    support integer,
    trained_at timestamptz DEFAULT now()
);

-- =============================================================
-- CELL_FORECAST_TS — Time-Series Forecast Results
-- -------------------------------------------------------------
--   Stores detailed time-series forecasts generated by models
--   such as Prophet, ARIMA, or SARIMA.Each record corresponds to one future timestamp prediction
--   for a specific cell_id and model type.
-- Used by:
--   • forecast_job_fast.py → writes multiple horizon forecasts
--   • dashboard (Recharts) → visualizes predicted trends
-- =============================================================

CREATE TABLE IF NOT EXISTS cell_forecast_ts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    cell_id TEXT NOT NULL,
    y_hat DOUBLE PRECISION,
    yhat_lower DOUBLE PRECISION,
    yhat_upper DOUBLE PRECISION,
    model_name TEXT,
    horizon INTERVAL,
    is_invalid BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- MODEL_REGISTRY — Model Version Control
-- -------------------------------------------------------------
-- Tracks all trained models and their metadata.
-- Used by: inference_job, monitor_job
-- =============================================================

CREATE TABLE IF NOT EXISTS model_registry (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL,
    version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    metrics JSONB,
    is_active BOOLEAN DEFAULT false
);

-- =============================================================
-- CELL_STATUS — Real-Time Operational State
-- -------------------------------------------------------------
-- Tracks latest operational mode per cell.
-- Used by: energy_operator to execute state transitions.
-- =============================================================

CREATE TABLE IF NOT EXISTS cell_status (
    cell_id TEXT PRIMARY KEY,
    last_action TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT now()
);

-- =============================================================
-- CELL_OPERATION_LOG — Executed Actions Log
-- -------------------------------------------------------------
-- Records the history of performed energy actions (e.g., sleep,
-- wake-up, hold). Useful for auditing and traceability.
-- Produced by: energy_operator
-- =============================================================

CREATE TABLE IF NOT EXISTS cell_operation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cell_id TEXT,
    action TEXT,
    status_before TEXT,
    status_after TEXT,
    executed_at TIMESTAMP DEFAULT now()
);

-- =============================================================
-- ENERGY_IMPACT_SUMMARY — Sustainability Metrics
-- -------------------------------------------------------------
-- Aggregated energy impact table used for carbon footprint
-- evaluation and project reporting.
-- Produced by: inference_job
-- =============================================================

CREATE TABLE IF NOT EXISTS energy_impact_summary (
    cell_id TEXT,
    date DATE,
    forecast_kwh DOUBLE PRECISION,
    real_kwh DOUBLE PRECISION,
    diff_kwh DOUBLE PRECISION,
    reduction_pct DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT now()
);

-- =============================================================
-- MODEL_METRICS — Model Evaluation Records
-- -------------------------------------------------------------
-- Stores ML performance metrics after training or inference.
-- Used by: train_job, monitor_job
-- =============================================================

CREATE TABLE IF NOT EXISTS model_metrics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_name text NOT NULL,
    task_type text NOT NULL,
    rmse double precision,
    mape double precision,
    smape double precision,
    precision double precision,
    recall double precision,
    f1 double precision,
    support integer,
    trained_at timestamptz DEFAULT now()
);

-- =============================================================
-- MODEL_REGISTRY — Model Version Control
-- -------------------------------------------------------------
-- Tracks all trained models and their metadata.
-- Used by: inference_job, monitor_job
-- =============================================================

CREATE TABLE IF NOT EXISTS model_registry (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL,
    version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    metrics JSONB,
    is_active BOOLEAN DEFAULT false
);

-- =============================================================
-- CELL_KPIS_DAILY — Aggregated KPIs
-- -------------------------------------------------------------
-- Contains daily performance summaries for each cell.
-- Produced by: kpi_job (compute_kpis.py)
-- =============================================================

CREATE TABLE IF NOT EXISTS cell_kpis_daily (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    cell_id TEXT,
    date DATE,
    dl_mbps_mean DOUBLE PRECISION,
    ul_mbps_mean DOUBLE PRECISION,
    rsrp_mean DOUBLE PRECISION,
    snr_mean DOUBLE PRECISION,
    latency_p90 DOUBLE PRECISION,
    energy_kwh DOUBLE PRECISION
);

-- =============================================================
-- USERS — Authentication Table
-- -------------------------------------------------------------
-- User credentials for FastAPI / JWT authentication system.
-- =============================================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);