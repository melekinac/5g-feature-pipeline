"""
Database Engine Factory (Cloud Run Compatible)
==================================================
Now always uses TCP/IP (public IP) connection for Cloud SQL.
Unix socket paths are disabled to avoid connection errors on Cloud Run.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine


def get_engine() -> Engine:
    db_user = os.getenv("POSTGRES_USER", "postgres5g")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres5g")
    db_name = os.getenv("POSTGRES_DB", "user_activity_db")
    db_host = os.getenv("POSTGRES_HOST", "35.195.134.149")  
    db_port = os.getenv("POSTGRES_PORT", "5432")

    
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        print("Using DATABASE_URL from environment.")
        url = database_url
    else:
        print("Using TCP/IP connection (Cloud Run / Local / Docker).")
        url = f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

    engine = create_engine(
        url,
        echo=False,
        future=True,
        pool_pre_ping=True,
    )

    return engine
