/**
 * AlertsPanel.jsx — 5G Energy Optimization Dashboard
 * ===================================================
 *
 * Description:
 * ------------
 * This component fetches and displays real-time network cell alerts
 * based on signal quality (RSRP, SNR) and latency metrics.
 *
 * Technical Notes:
 * ----------------
 * - Data Source: /api/alerts
 * - Automatically loads and classifies alerts into three severity levels:
 *      • "Kritik" (Critical) → severe performance degradation
 *      • "Orta" (Medium) → moderate issues
 *      • "Düşük" (Low) → minor or no issue
 * - Displays latest timestamp and KPI averages for each cell

 */

import React, { useEffect, useState } from "react";
import { fetchAlerts } from "../api";

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function load() {
      try {
        const res = await fetchAlerts();
        setAlerts(res || []);
      } catch (err) {
        console.error("Alerts API error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);


  const getSeverity = (a) => {
    if (a.rsrp_mean < -110 || a.snr_mean < 3 || a.ping_avg_mean > 150)
      return "Kritik";
    if (a.rsrp_mean < -100 || a.snr_mean < 5 || a.ping_avg_mean > 100)
      return "Orta";
    return "Düşük";
  };

  const getColor = (severity) => {
    switch (severity) {
      case "Kritik":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200";
      case "Orta":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  return (
    <div className="p-4 rounded-xl shadow bg-white dark:bg-slate-800 transition h-full flex flex-col">
      <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">
        Kritik Hücre Uyarıları
      </h2>

      <div className="flex-1 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Yükleniyor...
          </p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Şu anda aktif bir uyarı bulunmuyor.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a, i) => {
              const severity = getSeverity(a);
              return (
                <li
                  key={i}
                  className={`p-3 rounded-lg shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center transition hover:scale-[1.01] ${getColor(
                    severity
                  )}`}
                >
                  <div>
                    <span className="font-semibold">Hücre {a.cell_id}</span>{" "}
                    <span className="opacity-80 text-xs">({severity})</span>
                    <div className="text-xs sm:text-sm">
                      RSRP: {a.rsrp_mean?.toFixed?.(1)} | SNR:{" "}
                      {a.snr_mean?.toFixed?.(1)} | Ping:{" "}
                      {a.ping_avg_mean?.toFixed?.(1)} ms
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm mt-1 sm:mt-0 opacity-75">
                    {a.last_seen
                      ? new Date(a.last_seen).toLocaleString("tr-TR")
                      : a.ts
                      ? new Date(a.ts).toLocaleString("tr-TR")
                      : ""}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
