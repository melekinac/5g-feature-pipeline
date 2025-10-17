/**
 * PolicyTable.jsx — 5G Energy Optimization Dashboard
 * ==================================================
 *
 * Displays a detailed, scrollable table of the most recent policy actions.
 *
 * Purpose
 * -------
 * - Provides visibility into the last policy decisions applied per cell.
 * - Lists class (signal quality), action taken, and decision timestamp.
 * - Helps track optimization behavior and model recommendations in real time.
 *
 * Technical Notes
 * ---------------
 * - Data Source: /api/policy_history
 * - Color-coded rows indicate performance class and action type.
 * - Supports dark/light mode via TailwindCSS.
 * - Table header remains sticky during scrolling for better readability.
 */

import React, { useEffect, useState } from "react";
import { fetchPoliciesHistory } from "../api";

// English → Turkish label mappings
const actionLabels = {
  decrease: "Azalt",
  increase: "Artır",
  hold: "Sabit Tut",
  monitor: "İzle",
};

const classLabels = {
  Excellent: "Mükemmel",
  Good: "İyi",
  Weak: "Zayıf",
  "Very Weak": "Çok Zayıf",
};

export default function PolicyTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoliciesHistory()
      .then(setRows)
      .catch((err) => console.error("Politika geçmişi yüklenemedi:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-4 rounded-xl transition-colors duration-500 bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow text-center">
        Politika aksiyonları yükleniyor...
      </div>
    );

  return (
    <div className="p-4 rounded-xl transition-colors duration-500 bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-3">Son Politika Aksiyonları</h3>

      <div className="overflow-y-auto flex-1 max-h-[700px] rounded-lg border border-gray-200 dark:border-slate-700">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-2">Hücre ID</th>
              <th className="text-left p-2">Sınıf</th>
              <th className="text-left p-2">Aksiyon</th>
              <th className="text-left p-2">Karar Zamanı</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => {
              const classLabel = classLabels[r.class_label] || r.class_label;
              const actionLabel = actionLabels[r.action] || r.action;

              return (
                <tr
                  key={i}
                  className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <td className="p-2">{r.cell_id}</td>
                  <td
                    className={`p-2 font-medium ${
                      r.class_label === "Excellent"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : r.class_label === "Good"
                        ? "text-blue-600 dark:text-blue-400"
                        : r.class_label === "Weak"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {classLabel}
                  </td>
                  <td
                    className={`p-2 font-semibold ${
                      r.action === "decrease"
                        ? "text-rose-600 dark:text-rose-400"
                        : r.action === "increase"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : r.action === "hold"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {actionLabel}
                  </td>
                  <td className="p-2 text-gray-600 dark:text-slate-400">
                    {new Date(r.decided_at).toLocaleString("tr-TR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
