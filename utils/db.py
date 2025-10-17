"""
Database Engine Factory
==================================================
This utility provides a single function get_engine()
that dynamically detects the environment (local or Cloud Run)
and returns a SQLAlchemy Engine object.

- Uses Cloud SQL socket path on Cloud Run
- Uses TCP host/port on local or Docker
- Automatically reads env vars from .env or container environment
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine


def get_engine() -> Engine:
    

    db_user = os.getenv("POSTGRES_USER", "postgres5g")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres5g")
    db_name = os.getenv("POSTGRES_DB", "user_activity_db")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    db_port = os.getenv("POSTGRES_PORT", "5432")


    instance_connection_name = os.getenv(
        "INSTANCE_CONNECTION_NAME",
        "g-energy-optimize:europe-west1:g5-postgres"
    )


    if os.getenv("K_SERVICE"):
        print("Using Cloud SQL socket path for connection (Cloud Run environment).")
        url = (
            f"postgresql+psycopg2://{db_user}:{db_pass}@/{db_name}"
            f"?host=/cloudsql/{instance_connection_name}"
        )
    else:
        print("Using TCP connection (Local or Docker environment).")
        url = (
            f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
        )


    engine = create_engine(
        url,
        echo=False,         
        future=True,          
        pool_pre_ping=True,   
    )

    return engine
