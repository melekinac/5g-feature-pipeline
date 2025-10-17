/**
 * PolicyActionModal.jsx — 5G Energy Optimization Dashboard
 * ========================================================
 *
 * Modal component displaying the performance history and policy details
 * for a specific cell when a policy action is selected.
 *
 * Purpose
 * -------
 * - Provides a detailed overview of cell behavior leading up to a policy action.
 * - Displays RSRP trend history to visualize signal strength patterns.
 * - Summarizes the corresponding model classification and decision rationale.
 *
 * Technical Notes
 * ---------------
 * - Fetches historical KPI data via `fetchCellHistory(cell_id)`.
 * - Supports dynamic color coding for class labels (Excellent, Good, Weak, etc.).
 * - Contains a responsive Recharts line chart for RSRP over time.
 * - Clean modal overlay with dark mode compatibility.
 */

import React, { useEffect, useState } from "react";
import { fetchCellHistory } from "../api";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function PolicyActionModal({ action, onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchCellHistory(action.cell_id);
        setHistory(res || []);
      } catch (err) {
        console.error("Hücre geçmişi alınamadı:", err);
      }
    }
    load();
  }, [action.cell_id]);


  const getColor = (label) => {
    switch (label) {
      case "Excellent": return "#22c55e";
      case "Good": return "#eab308";
      case "Weak": return "#f97316";
      case "Very Weak": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg w-[700px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Hücre #{action.cell_id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✖
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {new Date(action.decided_at).toLocaleString("tr-TR")}
        </p>

        <h3 className="text-sm font-semibold mb-2">Hücre Performans Geçmişi</h3>

        <div className="w-full h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="timestamp" hide />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rsrp_mean"
                stroke={getColor(action.class_label)}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="text-sm">
          <strong>Durum:</strong>{" "}
          <span
            className="px-2 py-1 rounded text-white"
            style={{ backgroundColor: getColor(action.class_label) }}
          >
            {action.class_label}
          </span>
        </p>

        <p className="text-sm mt-2">
          <strong>Aksiyon:</strong>{" "}
          {action.action === "increase"
            ? "Artır"
            : action.action === "decrease"
            ? "Azalt"
            : "Bekle"}
        </p>

        {action.reason && (
          <p className="text-xs italic text-gray-600 dark:text-gray-400 mt-2">
            Gerekçe:{" "}
            {typeof action.reason === "object"
              ? action.reason.rule
              : action.reason}
          </p>
        )}

        <div className="text-right mt-4">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
