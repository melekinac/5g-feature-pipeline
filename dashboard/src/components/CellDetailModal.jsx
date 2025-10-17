/**
 * CellDetailPanel.jsx — 5G Energy Optimization Dashboard
 * =======================================================
 *
 * Description:
 * -------------
 * This component displays detailed performance analytics for a selected cell,
 * including KPIs, traffic forecasts, simulations, and policy actions.
 *
 * Technical Notes:
 * ----------------
 * - Fetches 3 parallel datasets:
 *      1. Forecast data (from `/api/forecast/{cell_id}`)
 *      2. KPI time series (from `/api/kpis/{cell_id}`)
 *      3. Simulation results (from `/api/simulate/{cell_id}`)
 * - Displays results using Recharts components (LineChart, AreaChart)
 * - Supports graceful closing animation
 * - Visualizes:
 *      • KPI trends (DL/UL throughput)
 *      • Forecast confidence intervals (y_hat, ci_low, ci_high)
 *      • Energy-saving vs throughput-loss simulation
 *      • Policy effect timeline
 *
 */

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { fetchForecastCellId, fetchKpisByCell, fetchSimulate } from "../api";

export default function CellDetailPanel({ cell, policies, onClose }) {
  const [forecast, setForecast] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [simulation, setSimulation] = useState(null);
  const [isClosing, setIsClosing] = useState(false);


  useEffect(() => {
    if (!cell) return;
    async function load() {
      try {
        const [fData, kpiData, sim] = await Promise.all([
          fetchForecastCellId(cell.cell_id),
          fetchKpisByCell(cell.cell_id),
          fetchSimulate(cell.cell_id),
        ]);

      
        const parsedForecast = (fData || [])
          .map((d) => ({
            ...d,
            ts: new Date(d.ts).toISOString(),
            y_hat: parseFloat(d.y_hat),
            ci_low: parseFloat(d.ci_low),
            ci_high: parseFloat(d.ci_high),
          }))
          .filter(
            (d) =>
              isFinite(d.y_hat) &&
              d.y_hat !== 0 &&
              !isNaN(d.y_hat) &&
              d.ts !== null
          )
          .sort((a, b) => new Date(a.ts) - new Date(b.ts));

        setForecast(parsedForecast);
        setKpis(kpiData || []);
        setSimulation(sim || null);
      } catch (err) {
        console.error("Cell detail panel error:", err);
      }
    }
    load();
  }, [cell]);

  if (!cell) return null;


  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };


  const cellPolicies = policies.filter((p) => p.cell_id === cell.cell_id);
  const actionMap = { monitor: 0, optimize: 1, sleep: 2 };
  const timelineData = cellPolicies.map((p) => ({
    ts: p.ts,
    actionValue: actionMap[p.action] || 0,
  }));

 
  const calcPct = (baselineRaw, simulatedRaw) => {
    const baseline = parseFloat(baselineRaw);
    const simulated = parseFloat(simulatedRaw);
    if (isNaN(baseline) || baseline <= 0) return 0;
    const diff = baseline - simulated;
    const pct = (diff / baseline) * 100;
    return pct < 0 ? 0 : Math.max(0, pct);
  };

  const energySavingPct = simulation
    ? calcPct(simulation.baseline.energy, simulation.simulated.energy)
    : 0;
  const throughputLossPct = simulation
    ? calcPct(simulation.baseline.throughput, simulation.simulated.throughput)
    : 0;

  return (
    <div
      className={`fixed top-0 right-0 w-96 h-full bg-white dark:bg-slate-900 shadow-xl border-l dark:border-slate-700 z-50 flex flex-col transition-all duration-500 ${
        isClosing
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100 animate-slideIn"
      }`}
    >

      <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Hücre {cell.cell_id} Detayları
        </h2>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white text-lg"
        >
          ✖
        </button>
      </div>


      <div className="p-4 overflow-y-auto flex-1 text-sm space-y-4">
        <p>
          <strong>RSRP:</strong> {cell.rsrp_mean} dBm
        </p>
        <p>
          <strong>Enerji:</strong> {cell.energy_kwh} kWh
        </p>
        <p>
          <strong>Zaman Damgası:</strong> {cell.ts || "-"}
        </p>

       
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
          Son 24 Saatlik KPI
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={kpis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="dl_mbps_mean"
              stroke="#3b82f6"
              name="İndirme (Mbps)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="ul_mbps_mean"
              stroke="#10b981"
              name="Yükleme (Mbps)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

       
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
          Trafik Tahmini (Model Ortalaması)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ts"
              tickFormatter={(t) =>
                new Date(t).toLocaleString("tr-TR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="y_hat"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="Tahmin"
            />
            <Line
              type="monotone"
              dataKey="ci_low"
              stroke="#9ca3af"
              strokeDasharray="5 5"
              dot={false}
              name="Alt CI"
            />
            <Line
              type="monotone"
              dataKey="ci_high"
              stroke="#9ca3af"
              strokeDasharray="5 5"
              dot={false}
              name="Üst CI"
            />
          </LineChart>
        </ResponsiveContainer>


        {simulation && (
          <>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Ne Olursa Simülasyonu
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl shadow p-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Enerji Tasarrufu
                </h4>
                <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-700"
                    style={{ width: `${energySavingPct}%` }}
                  />
                </div>
                <p className="text-green-600 dark:text-green-400 text-sm font-bold mt-1">
                  %{energySavingPct.toFixed(1)} tasarruf
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Bant Genişliği Kaybı
                </h4>
                <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-700"
                    style={{ width: `${throughputLossPct}%` }}
                  />
                </div>
                <p className="text-red-600 dark:text-red-400 text-sm font-bold mt-1">
                  %{throughputLossPct.toFixed(1)} kayıp
                </p>
              </div>
            </div>
          </>
        )}


        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
          Politika Etki Zaman Çizelgesi
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={timelineData}>
            <XAxis dataKey="ts" hide />
            <YAxis hide />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="actionValue"
              stroke="#2563eb"
              fill="#93c5fd"
            />
          </AreaChart>
        </ResponsiveContainer>


        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
          Model Bazlı Tahminler
        </h3>
        <div className="mt-2 space-y-2">
          {forecast.length > 0 ? (
            forecast.slice(0, 10).map((f, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {new Date(f.ts).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {f.model_name || "Model"}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <strong>Ŷ:</strong>{" "}
                    {isFinite(f.y_hat) ? f.y_hat.toFixed(2) : "-"}
                  </div>
                  <div>
                    <strong>Alt CI:</strong>{" "}
                    {isFinite(f.ci_low) ? f.ci_low.toFixed(2) : "-"}
                  </div>
                  <div>
                    <strong>Üst CI:</strong>{" "}
                    {isFinite(f.ci_high) ? f.ci_high.toFixed(2) : "-"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              Henüz tahmin verisi bulunmuyor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
