/**
 * CellHistoryChart.jsx — 5G Energy Optimization Dashboard
 * =======================================================
 *
 * Renders a time-series line chart displaying recent cell-level metrics.
 * Metrics include:
 * - RSRP (signal strength)
 * - SNR (signal-to-noise ratio)
 * - DL (downlink throughput)
 * - UL (uplink throughput)
 *
 * The component uses Recharts for visualization and expects pre-fetched
 * historical data for a specific cell.
 */
import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";

export default function CellHistoryChart({ data }) {
  if (!data || data.length === 0)
    return <p className="text-sm text-gray-500 dark:text-gray-400">Veri bulunamadı.</p>;

  const formattedData = data.map((d) => ({
    ts: new Date(d.ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    RSRP: d.rsrp_mean,
    SNR: d.snr_mean,
    DL: d.dl_mbps_mean,
    UL: d.ul_mbps_mean,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={formattedData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
        <XAxis dataKey="ts" tick={{ fontSize: 10 }} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="RSRP" stroke="#10b981" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="SNR" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="DL" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="UL" stroke="#ef4444" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
