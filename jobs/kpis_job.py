import pandas as pd
from sqlalchemy import text
from utils.db import get_engine

def backfill_kpis():
    eng = get_engine()
    with eng.begin() as con:
        df = pd.read_sql(text("""
            SELECT ts::date AS day, cell_id,
                   AVG(dl_mbps_mean) AS dl_avg,
                   AVG(ul_mbps_mean) AS ul_avg,
                   AVG(rsrp_mean)    AS rsrp_avg,
                   AVG(rsrq_mean)    AS rsrq_avg,
                   AVG(snr_mean)     AS snr_avg,
                   AVG(cqi_mean)     AS cqi_avg,
                   COUNT(*)          AS sample_count
            FROM public.cell_features
            GROUP BY 1,2
            ORDER BY 1,2
        """), con)

        df.to_sql("cell_kpis_daily", con,
                  if_exists="append", index=False,
                  method="multi", chunksize=1000)

    print(f"KPI backfill tamamlandı: {len(df)} satır yazıldı.")

if __name__ == "__main__":
    backfill_kpis()
