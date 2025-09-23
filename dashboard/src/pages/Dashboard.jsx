import React, { useEffect, useState } from "react";
import { fetchForecast, fetchCellStats } from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import MapView from "../components/MapView";

export default function Dashboard() {
  const [forecast, setForecast] = useState([]);
  const [cellStats, setCellStats] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [f, c] = await Promise.all([fetchForecast(), fetchCellStats()]);
        setForecast(f);
        setCellStats(c);
      } catch (err) {
        console.error("API Error:", err);
      }
    }
    loadData();
  }, []);

  const totalCells = new Set(cellStats.map((c) => c.cell_id)).size;
  const avgDL = (
    cellStats.reduce((sum, c) => sum + (c.dl_mbps_mean || 0), 0) /
    (cellStats.length || 1)
  ).toFixed(2);
  const avgLatency = (
    cellStats.reduce((sum, c) => sum + (c.latency_ms || 0), 0) /
    (cellStats.length || 1)
  ).toFixed(2);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">5G Energy Optimization Dashboard</h1>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-slate-800 p-4 rounded-xl shadow-md">
          <h3 className="text-sm text-slate-400">Toplam Cell</h3>
          <p className="text-3xl font-bold">{totalCells}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl shadow-md">
          <h3 className="text-sm text-slate-400">Ortalama DL Mbps</h3>
          <p className="text-3xl font-bold">{avgDL}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl shadow-md">
          <h3 className="text-sm text-slate-400">Ortalama Latency</h3>
          <p className="text-3xl font-bold">{avgLatency} ms</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl shadow-md">
          <h3 className="text-sm text-slate-400">Policy Sayısı</h3>
          <p className="text-3xl font-bold">Yakında</p>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Forecast vs Actual</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="ts" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="y_hat"
              stroke="#8884d8"
              name="Forecast"
            />
            <Line
              type="monotone"
              dataKey="dl_mbps_mean"
              stroke="#82ca9d"
              name="Actual"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Latency & Packet Loss</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cellStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="ts" stroke="#cbd5e1" />
            <YAxis stroke="#cbd5e1" />
            <Tooltip />
            <Legend />
            <Bar dataKey="latency_ms" fill="#ef4444" name="Latency (ms)" />
            <Bar
              dataKey="ping_loss_mean"
              fill="#f97316"
              name="Packet Loss (%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Model Kullanımı</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={forecast.map((f) => ({ name: f.model_name, value: 1 }))}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {forecast.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={["#8884d8", "#22c55e", "#facc15", "#f43f5e"][i % 4]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Cell Locations</h2>
        <MapView cells={cellStats} />
      </div>
    </div>
  );
}
