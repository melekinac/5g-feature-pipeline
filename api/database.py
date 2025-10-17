"""
database.py — SQLAlchemy Database Configuration
===============================================

Creates a unified SQLAlchemy engine that works seamlessly in both
local Docker and Google Cloud Run environments.

Defines:
---------
- get_engine(): dynamically builds the correct connection URL
- engine: global SQLAlchemy Engine instance
- SessionLocal: session factory for ORM operations
- Base: declarative base for model definitions
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import Engine


def get_engine() -> Engine:
    """Return SQLAlchemy engine (auto-detect Cloud Run vs Docker)."""

    # -------------------------------------------------------------
    # Environment Variables
    # -------------------------------------------------------------
    db_user = os.getenv("POSTGRES_USER", "postgres5g")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres5g")
    db_name = os.getenv("POSTGRES_DB", "user_activity_db")
    db_host = os.getenv("POSTGRES_HOST", "postgres")  # ⚡ Docker service name
    db_port = os.getenv("POSTGRES_PORT", "5432")
    instance_connection_name = "g-energy-optimize:europe-west1:g5-postgres"

    # -------------------------------------------------------------
    # Environment Detection
    # -------------------------------------------------------------
    if os.getenv("K_SERVICE"):  # ✅ Running in Cloud Run
        print("🌩 Using Unix socket connection (Cloud Run / Cloud SQL).")
        url = (
            f"postgresql+psycopg2://{db_user}:{db_pass}@/{db_name}"
            f"?host=/cloudsql/{instance_connection_name}"
        )
    else:  # ✅ Local or Docker
        print("🐳 Using TCP connection (Local / Docker).")
        url = (
            f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
        )

    # -------------------------------------------------------------
    # Create Engine
    # -------------------------------------------------------------
    return create_engine(url, echo=False, future=True, pool_pre_ping=True)


# -------------------------------------------------------------
# ORM Globals
# -------------------------------------------------------------
engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
