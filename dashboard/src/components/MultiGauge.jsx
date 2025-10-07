
import React, { useEffect, useState } from "react";
import { fetchMultiGauge } from "../api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function MultiGauge() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchMultiGauge();
        const formatted = res.map((d) => ({
          date: d.date,
          avg_dl: d.avg_dl,
          avg_ul: d.avg_ul,
          avg_snr: d.avg_snr,
        }));
        setData(formatted.reverse()); 
      } catch (err) {
        console.error("MultiGauge API error:", err);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Multi Gauge (7 Day)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="avg_dl" stroke="#2563eb" name="DL Mbps" />
          <Line type="monotone" dataKey="avg_ul" stroke="#16a34a" name="UL Mbps" />
          <Line type="monotone" dataKey="avg_snr" stroke="#f59e0b" name="SNR" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
