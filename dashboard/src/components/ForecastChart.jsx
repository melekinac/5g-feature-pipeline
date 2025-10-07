import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, ResponsiveContainer } from "recharts";
import { fetchForecastCellId } from "../api";

export default function ForecastChart({ cellId = "57661" }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchForecastCellId(cellId);
        const formatted = res.map((d) => ({
          ts: new Date(d.ts).toLocaleDateString("tr-TR", {
            month: "2-digit",
            day: "2-digit",
          }),
          y_hat: d.y_hat,
          ci_low: d.ci_low,
          ci_high: d.ci_high,
        }));
        setData(formatted);
      } catch (err) {
        console.error("Forecast API error:", err);
      }
    }
    load();
  }, [cellId]);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Forecast for Cell {cellId}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" />
          <YAxis />
          <Tooltip />
          <Legend />

          
          <Area
            type="monotone"
            dataKey="ci_high"
            stroke="none"
            fill="orange"
            fillOpacity={0.2}
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="ci_low"
            stroke="none"
            fill="orange"
            fillOpacity={0.2}
            activeDot={false}
            isAnimationActive={false}
          />


          <Line type="monotone" dataKey="y_hat" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
