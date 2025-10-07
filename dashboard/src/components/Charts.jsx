import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Charts({ data }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-2">Throughput Trends</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="ts" hide />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="dl_mbps_mean"
            stroke="#3b82f6"
            name="DL Mbps"
          />
          <Line
            type="monotone"
            dataKey="ul_mbps_mean"
            stroke="#10b981"
            name="UL Mbps"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
