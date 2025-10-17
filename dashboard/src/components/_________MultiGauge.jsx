import React, { useEffect, useState } from "react";
import { fetchMultiGauge } from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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
    <div className="w-full h-full rounded-xl p-4 transition-colors duration-500 bg-white dark:bg-slate-800 shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Multi Gauge (7 Day)
      </h2>
      <ResponsiveContainer
        width="100%"
        height={300}
        style={{ backgroundColor: "transparent" }}
      >
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "none",
              color: "#f8fafc",
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="avg_dl" stroke="#3B82F6" name="DL Mbps" />
          <Line type="monotone" dataKey="avg_ul" stroke="#10B981" name="UL Mbps" />
          <Line type="monotone" dataKey="avg_snr" stroke="#F59E0B" name="SNR" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
