import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fetchDrift } from "../api";

export default function DriftChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchDrift();
        setData(res || []);
      } catch (err) {
        console.error("Drift API error:", err);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-4 h-80">
      <h2 className="text-lg font-semibold mb-3">Drift Analysis</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="avg_dl" stroke="#3B82F6" name="Avg DL Mbps" />
          <Line type="monotone" dataKey="avg_ul" stroke="#10B981" name="Avg UL Mbps" />
          <Line type="monotone" dataKey="avg_rsrp" stroke="#F59E0B" name="Avg RSRP dBm" />
          <Line type="monotone" dataKey="avg_snr" stroke="#EF4444" name="Avg SNR dB" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
