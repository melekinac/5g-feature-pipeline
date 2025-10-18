/**
 * Dashboard.jsx — 5G Energy Optimization Platform
 * ===============================================
 *
 * Purpose:
 * --------
 * Main analytics dashboard that visualizes the energy efficiency,
 * KPI metrics, and policy-driven optimization performance across 5G base stations.
 *
 * Features:
 * ----------
 * - Dynamic energy and CO₂ savings summary cards.
 * - Interactive panels: StatusGrid, AlertsPanel, PolicyTable, PolicyChart, SimulationPanel, MapView.
 * - Real-time data fetched from FastAPI endpoints.
 * - Supports dark/light mode toggle and guided user tour via driver.js.
 *
 * Technical Notes:
 * ----------------
 * - API Sources: fetchCellFeaturesStats, fetchPolicies, fetchCellEnergySummary.
 * - Components: MapView, PolicyChart, PolicyTable, SimulationPanel, StatusGrid, AlertsPanel.
 * - Includes a guided dashboard tour (startTour / dashboardTourSteps).
 * - TailwindCSS for adaptive responsive layout.
 */

import React, { useEffect, useState } from "react";
import MapView from "../pages/MapView";
import PolicyChart from "../components/PolicyChart";
import PolicyTable from "../components/PolicyTable";
import AlertsPanel from "../components/AlertsPanel";
import {
  fetchCellFeaturesStats,
  fetchPolicies,
  fetchCellEnergySummary,
} from "../api";
import SimulationPanel from "../components/SimulationPanel";
import StatusGrid from "../components/StatusGrid";
import { startTour } from "../components/TourManager";
import { dashboardTourSteps } from "../components/tours/dashboardTour";

export default function Dashboard() {
  const [cells, setCells] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [energySummary, setEnergySummary] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [cellFeatures, policyData, summaryData] = await Promise.all([
          fetchCellFeaturesStats(),
          fetchPolicies(),
          fetchCellEnergySummary(),
        ]);
        setCells(cellFeatures || []);
        setPolicies(policyData || []);
        setEnergySummary(summaryData || {});
      } catch (err) {
        console.error("Dashboard API Hatası:", err);
      }
    }
    loadData();
  }, []);

  const toggleTheme = () => {
    const newTheme = darkMode ? "light" : "dark";
    setDarkMode(!darkMode);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-500">

      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">5G Enerji Optimizasyonu Paneli</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Enerji verimliliği, sinyal performansı ve yapay zekâ destekli politika aksiyonlarını gerçek zamanlı olarak izleyin.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => startTour(dashboardTourSteps)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            🧭 Paneli Tanıt
          </button>
          <button
            onClick={toggleTheme}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 rounded-lg shadow-sm transition"
          >
            {darkMode ? "🌞 Açık Tema" : "🌙 Karanlık Tema"}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            🔄 Yenile
          </button>
        </div>
      </header>

    
      {energySummary && (
        <section
          id="energySummarySection"
          className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10 text-center"
        >
          <div
            id="carbonCard"
            className="bg-green-50 dark:bg-green-900 rounded-xl p-5 shadow flex flex-col justify-center"
          >
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
              Karbon Azalımı
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-200 mt-2">
              {energySummary.co2_ton_saved?.toFixed(3)} ton CO₂
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ≈ {(energySummary.co2_ton_saved * 23).toFixed(0)} ağaç
            </p>
          </div>

          <div
            id="energyCard"
            className="bg-blue-50 dark:bg-blue-900 rounded-xl p-5 shadow flex flex-col justify-center"
          >
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
              Enerji Tasarrufu
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-200 mt-2">
              {energySummary.saved_pct?.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {energySummary.saved_kwh?.toFixed(2)} kWh
            </p>
          </div>

          <div
            id="savingCard"
            className="bg-amber-50 dark:bg-amber-900 rounded-xl p-5 shadow flex flex-col justify-center"
          >
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
              Ekonomik Kazanç
            </h3>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-200 mt-2">
              {energySummary.saved_tl?.toLocaleString("tr-TR")} ₺
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Yıllık tahmini kazanç
            </p>
          </div>

           <div
  id="energyForecastCard"
  className="bg-purple-50 dark:bg-purple-900 rounded-xl p-5 shadow flex flex-col justify-center"
>
  <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
    Yıllık Tahmin
  </h3>
  <p className="text-lg font-medium text-purple-700 dark:text-purple-200 mt-1">
  {energySummary.saved_kwh
          ? `${animatedValue.toFixed(2)} MWh`
          : "Veri Yok"}

  </p>
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
    Toplam yıllık enerji tasarrufu
  </p>
</div>

        </section>
      )}

      <section
        id="topPanel"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 auto-rows-[640px]"
      >
        <div id="statusGrid" className="bg-white dark:bg-slate-800 shadow rounded-xl p-4 h-full">
          <StatusGrid />
        </div>
        <div id="alertsPanel" className="bg-white dark:bg-slate-800 shadow rounded-xl p-4 h-full">
          <AlertsPanel />
        </div>
        <div id="policyTable" className="bg-white dark:bg-slate-800 shadow rounded-xl p-4 h-full">
          <PolicyTable />
        </div>
      </section>

      <section
        id="simulationSection"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
      >
        <div id="simulationPanel" className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 h-[500px]">
          <SimulationPanel cell={cells[0]} />
        </div>
        <div id="policyChart" className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 h-[500px]">
          <PolicyChart />
        </div>
      </section>

      <section id="mapSection" className="grid grid-cols-1 gap-6">
        <div id="mapView" className="w-full h-[1300px] rounded-xl p-4 bg-white dark:bg-slate-800 shadow">
          <MapView showTable={false} />
        </div>
      </section>
    </div>
  );
}
