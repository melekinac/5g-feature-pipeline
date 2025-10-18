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
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_pass = os.getenv("POSTGRES_PASSWORD", "Postgres5g*")
    db_name = os.getenv("POSTGRES_DB", "user_activity_db")
    db_host = os.getenv("POSTGRES_HOST", "35.195.134.149")
    db_port = os.getenv("POSTGRES_PORT", "5432")

    # -------------------------------------------------------------
    # Connection Method
    # -------------------------------------------------------------
    # We now always use TCP (Public IP) for Cloud Run and Local environments.
    # Unix sockets are disabled because they often fail without proper IAM bindings.
    print("Using TCP/IP connection for PostgreSQL (Cloud SQL / Local / Docker).")
    url = f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

    # -------------------------------------------------------------
    # Create SQLAlchemy Engine
    # -------------------------------------------------------------
    engine = create_engine(
        url,
        echo=False,           
        future=True,         
        pool_pre_ping=True,  
        pool_size=5,         
        max_overflow=2,      
    )

    return engine


# -------------------------------------------------------------
# ORM Globals
# -------------------------------------------------------------
engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
