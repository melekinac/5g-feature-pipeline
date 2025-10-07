import os
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

def get_engine() -> Engine:
    """
    Create a SQLAlchemy engine for PostgreSQL using environment variables.
    
    Environment variables (from .env):
        DB_HOST
        DB_PORT
        POSTGRES_DB
        POSTGRES_USER
        POSTGRES_PASSWORD
    """
    db_host = os.getenv("DB_HOST", "postgres")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "user_activity_db")
    db_user = os.getenv("POSTGRES_USER", "postgres5g")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres5g")
    
    # url = f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    # engine = create_engine(url, pool_pre_ping=True)
    url = f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}?client_encoding=utf8"
    return create_engine(url, echo=True, future=True)
    return engine
