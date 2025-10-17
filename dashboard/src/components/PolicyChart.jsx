/**
 * PolicyChart.jsx — 5G Energy Optimization Dashboard
 * ==================================================
 *
 * Renders a pie chart summarizing policy engine decisions across all cells.
 *
 * Purpose
 * -------
 * - Visualizes how often each policy action type (increase, decrease, etc.) is applied.
 * - Provides high-level insights into optimization behavior distribution.
 *
 * Technical Notes
 * ---------------
 * - Data Source: /api/policy_summary
 * - Fetches action counts and maps them to Turkish labels for user readability.
 * - Implements Recharts PieChart with dark/light theme support.
 * - Colors follow semantic categories for clear differentiation.
 */

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchPolicySummary } from "../api";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];


const actionLabels = {
  decrease: "Azalt",
  hold: "Sabit Tut",
  increase: "Artır",
  monitor: "İzle",
};

export default function PolicyChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchPolicySummary()
      .then((json) => {
        setData(
          json.map((d) => ({
            name: actionLabels[d.action] || d.action,
            value: d.count,
          }))
        );
      })
      .catch((err) => console.error("Politika Özeti API Hatası:", err));
  }, []);

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className="w-full h-full rounded-xl p-4 transition-colors duration-500 bg-white dark:bg-slate-800 shadow">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
        Politika Motoru Karar Dağılımı
      </h2>

      <ResponsiveContainer
        width="100%"
        height="90%"
        style={{ backgroundColor: "transparent" }}
      >
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(1)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            formatter={(value, name) => [`${value} adet`, name]}
          />

          <Legend
            formatter={(value) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
