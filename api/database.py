"""
SQLAlchemy Database Configuration
================================================

This module initializes the SQLAlchemy database engine, session factory,
and declarative base used across the FastAPI application.

It reads connection parameters from environment variables (with sensible defaults),
establishes a PostgreSQL connection, and provides the session maker (`SessionLocal`)
to be used in dependency injection for API routes.

Environment Variables:
----------------------
- POSTGRES_USER:     Database username          (default: postgres5g)
- POSTGRES_PASSWORD: Database password          (default: postgres5g)
- POSTGRES_HOST:     Database host/service name (default: postgres)
- POSTGRES_PORT:     Database port              (default: 5432)
- POSTGRES_DB:       Database name              (default: user_activity_db)

Exports:
--------
- engine: SQLAlchemy Engine bound to the PostgreSQL database
- SessionLocal: Factory for database sessions (used via dependency injection)
- Base: Declarative base class for defining ORM models
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# -------------------------------------------------
# Environment-Based Database Configuration
# -------------------------------------------------

DB_USER = os.getenv("POSTGRES_USER", "postgres5g")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres5g")
DB_HOST = os.getenv("POSTGRES_HOST", "postgres")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "user_activity_db")

# -------------------------------------------------
# Connection String
# -------------------------------------------------
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


# -------------------------------------------------
#  SQLAlchemy Engine & Session Factory
# -------------------------------------------------
# The engine manages the database connection pool.
# The SessionLocal factory provides transactional session objects per request.

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False,
                             autoflush=False, # Transactions must be explicitly committed
                               bind=engine# Prevent automatic flush before queries 
                               ) 
  
# -------------------------------------------------
# Declarative Base
# -------------------------------------------------
# All ORM models should inherit from this base class.
Base = declarative_base()
