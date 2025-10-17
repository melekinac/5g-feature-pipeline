#!/bin/bash
set -e

echo "=============================================================="
echo "5G ENERGY OPTIMIZATION - ORCHESTRATED PIPELINE STARTUP"
echo "=============================================================="
echo ""

# ==============================================================
# Load environment variables (.env)
# --------------------------------------------------------------
# Ensures that all services share the same DB credentials,
# simulation parameters, and KPI date range.
# ==============================================================
if [ -f ".env" ]; then
    echo "Loading environment variables from .env..."
    set -a
    source .env
    set +a
else
    echo ".env file not found!"
fi


# ==============================================================
# Wait until PostgreSQL is fully ready
# --------------------------------------------------------------
# This prevents dependent services from failing on startup
# due to a not-yet-ready database connection.
# ==============================================================
wait_for_postgres_ready() {
    echo "⏳ Waiting for PostgreSQL to become ready..."
    until docker exec pg-cell pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" > /dev/null 2>&1; do
        sleep 2
    done
    echo "PostgreSQL connection is active!"
}


# ==============================================================
# Wait for critical tables to be created
# --------------------------------------------------------------
# Ensures core schema tables (cell_raw, cell_clean_data, etc.)
# exist before running ML and feature engineering jobs.
# ==============================================================
wait_for_table() {
    local table_name=$1
    echo "Waiting for table '$table_name' to be created..."
    until docker exec pg-cell psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tAc \
        "SELECT to_regclass('public.${table_name}') IS NOT NULL;" | grep -q "t"; do
        sleep 2
    done
    echo "Table '$table_name' is ready!"
}


# ==============================================================
# Helper: Start background job
# --------------------------------------------------------------
# Launches an individual service asynchronously using Docker Compose.
# Used for feature extraction, training, inference, and policy jobs.
# ==============================================================
run_job_background() {
    local service_name=$1
    echo "Starting $service_name in background..."
    docker compose up -d --no-deps "$service_name"
    echo "$service_name started successfully."
    echo "--------------------------------------------------------------"
    sleep 2
}


# ==============================================================
# Start core database services
# --------------------------------------------------------------
# Launches PostgreSQL and pgAdmin first since all other containers
# depend on the database being available.
# ==============================================================
echo "Starting PostgreSQL and pgAdmin..."
docker compose up -d postgres pgadmin
sleep 10

wait_for_postgres_ready
wait_for_table "cell_raw"
wait_for_table "cell_clean_data"
wait_for_table "cell_features"

echo "Database fully initialized!"
echo "--------------------------------------------------------------"


# ==============================================================
# Start main AI/ML pipeline services
# --------------------------------------------------------------
# Each job runs as an isolated container:
#  - feature_job: feature engineering
#  - train_job: model training
#  - forecast_job: future KPI forecasting
#  - inference_job: live prediction
#  - policy_job: rule-based energy decisions
#  - kpis_job: daily KPI aggregation
#  - monitoring_job: drift & retraining triggers
#  - energy_operator: executes simulated energy actions
# ==============================================================
run_job_background feature_job
run_job_background train_job
run_job_background forecast_job
run_job_background inference_job
run_job_background policy_job
run_job_background kpis_job
run_job_background monitoring_job
run_job_background energy_operator


# ==============================================================
# Start API and Dashboard
# --------------------------------------------------------------
# Launches REST API (FastAPI) and Frontend Dashboard (React).
# Accessible via:
#   API → http://localhost:8000
#   Dashboard → http://localhost:3000
# ==============================================================
echo "Starting API and Dashboard..."
docker compose up -d api dashboard
sleep 5


# ==============================================================
# Display running services
# --------------------------------------------------------------
# Provides summary of all containers currently running in the pipeline.
# ==============================================================
docker compose ps
echo ""
echo "ALL PIPELINE SERVICES ARE RUNNING IN BACKGROUND!"
echo "View logs: docker compose logs -f"
echo " Stop all: docker compose down"
echo "=============================================================="
