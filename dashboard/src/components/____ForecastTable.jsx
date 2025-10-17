/**
 * ForecastChart.jsx — 5G Energy Optimization Dashboard
 * =====================================================
 *
 * Compares forecasted and actual network performance metrics.
 *
 * Features:
 * ----------
 * - Dynamically fetches forecast data with adjustable time horizon.
 * - Visualizes model prediction (y_hat) and actual throughput (dl_mbps_mean).
 * - Includes confidence interval shading (ci_low / ci_high) for uncertainty visualization.
 * - Supports horizon selection (15m, 30m, 1h, 3h) via dropdown.
 *
 * Technical Notes:
 * ----------------
 * - API: fetchForecast(horizon)
 * - Chart Components: Recharts (Line, Area, CartesianGrid, Legend, Tooltip)
 * - Color Codes:
 *    • Forecast → Purple (#8884d8)
 *    • Actual   → Green (#82ca9d)
 */

import React, { useEffect, useState } from "react";
import { fetchForecast } from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from "recharts";

export default function ForecastChart() {
  const [forecast, setForecast] = useState([]);
  const [horizon, setHorizon] = useState(60); // Forecast interval in minutes

  useEffect(() => {
    // Load forecast data from API based on selected horizon
    async function loadData() {
      try {
        const data = await fetchForecast(horizon);
        setForecast(data);
      } catch (err) {
        console.error("Forecast API error:", err);
      }
    }
    loadData();
  }, [horizon]);

  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">
          Tahmin vs Gerçek Değer
        </h2>
        <select
          className="bg-slate-700 text-white px-2 py-1 rounded"
          value={horizon}
          onChange={(e) => setHorizon(e.target.value)}
        >
          <option value={15}>15 dk</option>
          <option value={30}>30 dk</option>
          <option value={60}>1 saat</option>
          <option value={180}>3 saat</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={forecast}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="ts" stroke="#cbd5e1" />
          <YAxis stroke="#cbd5e1" />
          <Tooltip />
          <Legend />

          {/* Confidence Interval Shading */}
          <Area
            type="monotone"
            dataKey="ci_high"
            stroke="none"
            fill="#8884d8"
            fillOpacity={0.2}
            name="Üst Güven Aralığı"
            dot={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="ci_low"
            stroke="none"
            fill="#8884d8"
            fillOpacity={0.2}
            name="Alt Güven Aralığı"
            dot={false}
            activeDot={false}
          />

          {/* Forecast vs Actual Lines */}
          <Line
            type="monotone"
            dataKey="y_hat"
            stroke="#8884d8"
            name="Tahmin"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="dl_mbps_mean"
            stroke="#82ca9d"
            name="Gerçek"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
