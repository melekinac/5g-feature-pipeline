import React, { useEffect, useState } from "react";
import { fetchAlerts } from "../api";

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchAlerts(); 
        setAlerts(res);
      } catch (err) {
        console.error("Alerts API error:", err);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-red-100 text-red-800 p-4 rounded-xl shadow">
      <h2 className="text-lg font-bold mb-2">Alerts</h2>
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {alerts.length === 0 ? (
          <li className="text-sm text-gray-600">No alerts</li>
        ) : (
          alerts.map((a, i) => (
            <li key={i} className="text-sm">
              <b>{a.cell_id}</b> → RSRP: {a.rsrp_mean}, SNR: {a.snr_mean}, Ping: {a.ping_avg_mean}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
