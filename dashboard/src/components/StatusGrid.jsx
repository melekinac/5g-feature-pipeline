/**
 * StatusGrid.jsx — 5G Energy Optimization Dashboard
 * =================================================
 *
 * Purpose:
 * --------
 * Displays a quick visual summary of all active 5G cells
 * and their operational status (Active, Sleep, Alert, Idle, Offline).
 *
 * Features:
 * ----------
 * - Fetches live cell status data from the API.
 * - Color-coded grid visualization:
 *    •  ACTIVE  → Green
 *    •  SLEEP   → Indigo
 *    •  ALERT   → Amber
 *    •  IDLE    → Sky
 *    •  OFFLINE → Rose
 * - Automatically handles loading and error states.
 * - Fully supports dark/light mode transitions.
 *
 * Technical Notes:
 * ----------------
 * - API: fetchCellStatus()
 * - State: { cells[], loading, error }
 * - Language: 🇹🇷 (Frontend labels localized in Turkish)
 */

import React, { useEffect, useState } from "react";
import { fetchCellStatus } from "../api";

// English → Turkish status label mapping
const statusLabels = {
  ACTIVE: "AKTİF",
  SLEEP: "UYKU",
  ALERT: "UYARI",
  IDLE: "BOŞTA",
  OFFLINE: "ÇEVRİMDIŞI",
};

export default function StatusGrid() {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchCellStatus()
      .then((data) => setCells(data))
      .catch((err) => {
        console.error("Hücre durumu yüklenemedi:", err);
        setError("Veri alınamadı!");
      })
      .finally(() => setLoading(false));
  }, []);


  if (loading)
    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl text-center text-gray-700 dark:text-gray-200 shadow">
         Hücre durumu yükleniyor...
      </div>
    );

  if (error)
    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl text-center text-red-500 shadow">
        ❌ {error}
      </div>
    );

  
  return (
    <div className="p-4 rounded-xl transition-colors duration-500 bg-white dark:bg-slate-800 text-gray-800 dark:text-white shadow">
      <h3 className="text-lg font-semibold mb-3">Hücre Durum Özeti</h3>

      <div className="grid grid-cols-4 gap-2">
        {cells.map((c) => {
          const statusText = statusLabels[c.status] || c.status;
          let bgColor = "bg-gray-500";

          switch (c.status) {
            case "ACTIVE":
              bgColor = "bg-emerald-600";
              break;
            case "SLEEP":
              bgColor = "bg-indigo-600";
              break;
            case "ALERT":
              bgColor = "bg-amber-500";
              break;
            case "IDLE":
              bgColor = "bg-sky-500";
              break;
            case "OFFLINE":
              bgColor = "bg-rose-700";
              break;
            default:
              bgColor = "bg-gray-500";
          }

          return (
            <div
              key={c.cell_id}
              className={`${bgColor} p-3 rounded-lg text-center shadow-md transition-transform duration-300 hover:scale-105`}
            >
              <p className="font-bold text-white">{c.cell_id}</p>
              <p className="text-sm text-slate-100">{statusText}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
