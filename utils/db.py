import os
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

def get_engine() -> Engine:
    """Always use TCP/IP connection for PostgreSQL (Cloud Run compatible)."""
    db_user = os.getenv("POSTGRES_USER", "postgres5g")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres5g")
    db_name = os.getenv("POSTGRES_DB", "user_activity_db")
    db_host = os.getenv("POSTGRES_HOST", "35.195.134.149")
    db_port = os.getenv("POSTGRES_PORT", "5432")

    url = f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

    print(f"⚙️ Connecting via TCP to {db_host}:{db_port} ...")

    engine = create_engine(
        url,
        echo=False,
        future=True,
        pool_pre_ping=True,
    )
    return engine
