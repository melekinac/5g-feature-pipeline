from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
import os
import pandas as pd

DB_USER = os.getenv("POSTGRES_USER", "postgres5g")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres5g")
DB_HOST = os.getenv("POSTGRES_HOST", "postgres")  
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "user_activity_db")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/forecast")
def get_forecast():
    return pd.read_sql("SELECT * FROM cell_forecast_ts ORDER BY ts DESC LIMIT 500", engine).to_dict("records")

@app.get("/api/cell_stats")
def get_cell_stats():
    return pd.read_sql("SELECT * FROM cell_features ORDER BY ts DESC LIMIT 500", engine).to_dict("records")

@app.get("/api/policies")
def get_policies():
    return pd.read_sql("SELECT * FROM cell_policy ORDER BY ts DESC LIMIT 500", engine).to_dict("records")

