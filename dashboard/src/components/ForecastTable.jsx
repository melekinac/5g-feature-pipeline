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
  const [horizon, setHorizon] = useState(60); 

  useEffect(() => {
    async function loadData() {
      const data = await fetchForecast(horizon);
      setForecast(data);
    }
    loadData();
  }, [horizon]);

  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Forecast vs Actual</h2>
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

          <Area
            type="monotone"
            dataKey="ci_high"
            stroke="none"
            fill="#8884d8"
            fillOpacity={0.2}
            name="Confidence High"
            dot={false}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="ci_low"
            stroke="none"
            fill="#8884d8"
            fillOpacity={0.2}
            name="Confidence Low"
            dot={false}
            activeDot={false}
          />

          <Line
            type="monotone"
            dataKey="y_hat"
            stroke="#8884d8"
            name="Forecast"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="dl_mbps_mean"
            stroke="#82ca9d"
            name="Actual"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
