CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    rsrp_3h_std numeric
);


DROP TABLE IF EXISTS cell_forecast CASCADE;
CREATE TABLE cell_forecast (
    id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ts              timestamptz NOT NULL,
    cell_id         text NOT NULL,
    y_hat           numeric,
    ci_low          numeric,
    ci_high         numeric,
    confidence      numeric,
    model_name      text,
    mape            numeric,
    horizon_minutes int,
    trend_label text,
    created_at      timestamptz DEFAULT now()
);


CREATE TABLE IF NOT EXISTS cell_clean_data_sim (
    LIKE cell_clean_data INCLUDING ALL
);


DROP TABLE IF EXISTS cell_policy CASCADE;
CREATE TABLE cell_policy (
    id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ts              timestamptz NOT NULL,
    cell_id         text NOT NULL,
    model_name      text,
    class_label     text,
    action          text,
    reason          jsonb,
    thresholds_ver  text,
    decided_at      timestamptz DEFAULT now()
);


DROP TABLE IF EXISTS cell_kpis_daily CASCADE;
CREATE TABLE cell_kpis_daily (
    id SERIAL PRIMARY KEY,
    cell_id TEXT,
    date DATE,
    dl_mbps_mean DOUBLE PRECISION,
    ul_mbps_mean DOUBLE PRECISION,
    rsrp_mean DOUBLE PRECISION,
    snr_mean DOUBLE PRECISION,
    latency_p90 DOUBLE PRECISION,
    energy_kwh DOUBLE PRECISION
);



CREATE TABLE model_metrics (
    id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_name   text NOT NULL,                 
    task_type    text NOT NULL,                 
    rmse         double precision,              
    mape         double precision,             
    smape        double precision,             
    precision    double precision,             
    recall       double precision,             
    f1           double precision,             
    support      integer,                       
    trained_at   timestamptz DEFAULT now()      
);

CREATE TABLE cell_forecast_ts (
    id SERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,        
    cell_id TEXT NOT NULL,          
    y_hat DOUBLE PRECISION,          
    yhat_lower DOUBLE PRECISION,    
    yhat_upper DOUBLE PRECISION,     
    model_name TEXT,                 
    horizon INTERVAL,       
    is_invalid BOOLEAN ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CREATE TABLE IF NOT EXISTS model_registry (
--     id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
--     version text NOT NULL,
--     path text NOT NULL,
--     created_at timestamptz DEFAULT now(),
--     train_accuracy numeric,
--     train_loss numeric
-- );
CREATE TABLE IF NOT EXISTS model_registry (
    id SERIAL PRIMARY KEY,
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL, 
    version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    metrics JSONB,           
    is_active BOOLEAN DEFAULT false
);
