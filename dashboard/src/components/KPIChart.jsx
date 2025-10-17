/**
 * KPIChart.jsx — 5G Energy Optimization Dashboard
 * =================================================
 *
 * Displays overall energy-saving percentage as a key performance indicator (KPI).
 *
 * Features:
 * ----------
 * - Fetches aggregated energy-saving data from the KPI API endpoint.
 * - Shows the most recent energy efficiency percentage in a clean, centered card layout.
 * - Supports dark and light modes with adaptive Tailwind styling.
 *
 * Technical Notes:
 * ----------------
 * - API: fetchKPIs()
 * - Data Field: energy_saving_pct (float)
 * - Display: Rounded to 1 decimal precision (e.g., 12.5%)
 */

import React, { useEffect, useState } from "react";
import { fetchKPIs } from "../api";

export default function EnergyKPI() {
  const [saving, setSaving] = useState(null);

  useEffect(() => {
   
    async function load() {
      try {
        const res = await fetchKPIs();
        setSaving(res.energy_saving_pct || 0);
      } catch (err) {
        console.error("Energy KPI error:", err);
      }
    }
    load();
  }, []);

  return (
    <div className="w-full h-full rounded-xl p-6 transition-colors duration-500 bg-white dark:bg-slate-800 shadow text-center">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        Enerji Tasarrufu
      </h2>
      <p className="text-3xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
        {saving ? `${saving.toFixed(1)}%` : "…"}
      </p>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Son 7 Gün
      </span>
    </div>
  );
}
