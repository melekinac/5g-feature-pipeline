/**
 * SimulationPanel.jsx — 5G Energy Optimization Dashboard
 * ======================================================
 *
 * Purpose:
 * --------
 * Displays a “What-If Simulation” for a selected 5G cell.
 * Compares baseline (normal) vs simulated (optimized) states
 * in terms of energy consumption and throughput.
 *
 * Features:
 * ----------
 * - Fetches simulation data dynamically for a selected cell.
 * - Shows two PieCharts:
 *    • Energy saving ratio
 *    • Throughput loss ratio
 * - Automatically adapts to dark/light mode.
 * - Handles loading and error states gracefully.
 *
 * Technical Notes:
 * ----------------
 * - API: fetchSimulate(cell.cell_id)
 * - Props: { cell } → selected cell object
 * - Library: Recharts (PieChart, ResponsiveContainer)
 * - UI Language: 🇹🇷 Turkish (all frontend labels are localized)
 */

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchSimulate } from "../api";

const COLORS = ["#00C49F", "#FF8042"];

export default function SimulationPanel({ cell }) {
  const [sim, setSim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!cell) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSimulate(cell.cell_id);
        setSim(data);
      } catch (err) {
        console.error("Simulation fetch error:", err);
        setError("Simülasyon verileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cell]);


  if (!cell) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 h-[400px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          Politika etkisini görmek için bir hücre seçiniz.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 h-[400px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Simülasyon yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 h-[400px] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!sim) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 h-[400px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Simülasyon verisi bulunamadı.</p>
      </div>
    );
  }

  const energyData = [
    { name: "Referans Enerji", value: sim.baseline.energy },
    { name: "Tasarruf", value: sim.baseline.energy - sim.simulated.energy },
  ];

  const throughputData = [
    { name: "Referans Bant Genişliği", value: sim.baseline.throughput },
    { name: "Kayıp", value: sim.baseline.throughput - sim.simulated.throughput },
  ];

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className="rounded-xl shadow p-4 h-[400px] flex flex-col transition-colors duration-500 bg-white dark:bg-slate-800">
      <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">
        “Ne Olursa” Simülasyonu – Hücre {cell.cell_id}
      </h3>

      <div className="flex-1 grid grid-cols-2 gap-4">
       
        <div className="flex flex-col items-center justify-center">
          <h4 className="mb-2 text-slate-700 dark:text-slate-300">Enerji Tasarrufu</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={energyData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={40}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {energyData.map((entry, index) => (
                  <Cell key={`cell-energy-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark
                    ? "rgba(30,41,59,0.95)"
                    : "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(100,116,139,0.2)",
                  borderRadius: "8px",
                  color: isDark ? "#fff" : "#000",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  `${value.toFixed(1)}`,
                  name === "Referans Enerji" ? "Referans Enerji" : "Tasarruf",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-green-600 dark:text-green-400 font-bold mt-2">
            %{sim.energy_saving_pct?.toFixed(1) || 0} tasarruf
          </p>
        </div>

    
        <div className="flex flex-col items-center justify-center">
          <h4 className="mb-2 text-slate-700 dark:text-slate-300">Bant Genişliği Kaybı</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={throughputData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={40}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {throughputData.map((entry, index) => (
                  <Cell key={`cell-throughput-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark
                    ? "rgba(30,41,59,0.95)"
                    : "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(100,116,139,0.2)",
                  borderRadius: "8px",
                  color: isDark ? "#fff" : "#000",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  `${value.toFixed(1)}`,
                  name === "Referans Bant Genişliği" ? "Referans" : "Kayıp",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-red-600 dark:text-red-400 font-bold mt-2">
            %{sim.throughput_loss_pct?.toFixed(1) || 0} kayıp
          </p>
        </div>
      </div>
    </div>
  );
}
