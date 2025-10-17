# ======================================================
# 5G ENERGY OPTIMIZATION - UNIFIED CONTAINER
# ======================================================
# This Dockerfile builds a unified environment for:
#   - PostgreSQL database
#   - FastAPI backend (ML + REST API)
#   - React dashboard (Node.js)
#   - Simulation, feature, policy, inference, and monitoring jobs
# Everything runs inside one clean, reproducible Python 3.11 container.
# ======================================================

FROM python:3.11-slim

# ------------------------------------------------------
# 🧩 Python Environment Variables
# ------------------------------------------------------
# PYTHONDONTWRITEBYTECODE → Prevents Python from writing .pyc files
# PYTHONUNBUFFERED → Ensures logs are printed directly to console (no buffering)
# PYTHONPATH → Ensures /app is included in module search path
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH="/app"

# ------------------------------------------------------
# System Dependencies
# ------------------------------------------------------
# Install necessary system packages for:
#   - Compilation (gcc, g++)
#   - PostgreSQL database driver support (libpq-dev)
#   - Node.js + npm for building React dashboard
#   - Bash and core utilities for orchestration scripts
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    make \
    libpq-dev \
    curl \
    gnupg \
    nodejs \
    npm \
    postgresql \
    postgresql-contrib \
    bash && \
    rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------
# Working Directory
# ------------------------------------------------------
# /app is the main working directory where all source code lives.
WORKDIR /app

# ------------------------------------------------------
# Python Dependencies
# ------------------------------------------------------
# Install all Python libraries required for the ML pipeline
# (e.g., FastAPI, SQLAlchemy, pandas, scikit-learn, xgboost, etc.)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ------------------------------------------------------
# Dashboard Dependencies
# ------------------------------------------------------
# Copy the React-based dashboard and install frontend dependencies.
# This will later allow npm build/start to run inside the same container.
COPY dashboard ./dashboard
RUN cd dashboard && npm install

# ------------------------------------------------------
# Copy All Project Files
# ------------------------------------------------------
# Copy all remaining files (backend, utils, jobs, etc.) into /app.
COPY . .

# ------------------------------------------------------
# Logs Directory
# ------------------------------------------------------
# Create a dedicated folder for runtime logs.
RUN mkdir -p logs

# ------------------------------------------------------
# Entrypoint Script
# ------------------------------------------------------
# Ensure the main orchestration script is executable.
# start_all.sh is responsible for starting:
#   1. PostgreSQL
#   2. FastAPI API service
#   3. React dashboard
#   4. Any background jobs (policy, inference, etc.)
RUN chmod +x start_all.sh

# ------------------------------------------------------
# Exposed Ports
# ------------------------------------------------------
# 5432 → PostgreSQL
# 8000 → FastAPI backend
# 3000 → React dashboard
EXPOSE 5432 8000 3000

# ------------------------------------------------------
# Default Startup Command
# ------------------------------------------------------
# When the container launches, the unified startup script runs.
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

