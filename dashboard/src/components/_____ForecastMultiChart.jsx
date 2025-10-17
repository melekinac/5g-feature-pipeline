/**
 * ForecastMultiChart.jsx — 5G Energy Optimization Dashboard
 * =========================================================
 *
 * Displays comparative forecast results from multiple prediction models
 * (e.g., Prophet, ARIMA, SARIMA, Random Forest Regressor).
 *
 * Features:
 * ----------
 * - Fetches combined forecast data from the API (`/api/forecast_all`)
 * - Groups results by timestamp for side-by-side visualization
 * - Uses Recharts to plot time-series predictions from multiple models
 *
 * Technical Notes:
 * ----------------
 * - Each model’s predicted `y_hat` value is plotted against time
 * - Grouping is performed client-side by unique timestamps
 */

import React, { useEffect, useState } from "react";
import { fetchForecastAll } from "../api";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ForecastMultiChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch and transform forecast data from multiple models
    fetchForecastAll()
      .then((rows) => {
        const grouped = {};
        rows.forEach((r) => {
          const ts = new Date(r.ts).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          if (!grouped[ts]) grouped[ts] = { ts };
          grouped[ts][r.model_name] = r.y_hat;
        });
        setData(Object.values(grouped));
      })
      .catch((e) => console.error("ForecastAll API error:", e));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-4 h-[400px]">
      <h2 className="text-lg font-semibold mb-3 text-slate-800">
        Çoklu Model Tahmin Karşılaştırması
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="ts" stroke="#475569" />
          <YAxis stroke="#475569" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="rf_regressor"
            stroke="#22c55e"
            name="RF Regressor"
          />
          <Line
            type="monotone"
            dataKey="prophet"
            stroke="#3b82f6"
            name="Prophet"
          />
          <Line
            type="monotone"
            dataKey="arima"
            stroke="#f59e0b"
            name="ARIMA"
          />
          <Line
            type="monotone"
            dataKey="sarima"
            stroke="#ef4444"
            name="SARIMA"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
