import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fetchModelMetricsSummary } from "../api";

export default function ModelComparison() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchModelMetricsSummary();
        setData(res || []);
      } catch (err) {
        console.error("Model Metrics API error:", err);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-4 h-[300px]">
      <h2 className="text-lg font-semibold mb-3 text-slate-800">Model Performance</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="model" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="mape" fill="#3b82f6" name="MAPE" />
          <Bar dataKey="rmse" fill="#10b981" name="RMSE" />
          <Bar dataKey="smape" fill="#f59e0b" name="sMAPE" />
          <Bar dataKey="f1" fill="#8b5cf6" name="F1" />
          <Bar dataKey="accuracy" fill="#ef4444" name="Accuracy" />


        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
