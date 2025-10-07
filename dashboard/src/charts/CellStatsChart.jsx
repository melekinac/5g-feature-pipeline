import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const CellStatsChart = ({ data }) => {

  const formattedData = data.map(d => ({
    ...d,
    ts: new Date(d.ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  }));

  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold text-white mb-2">📡 Hücre Sinyal Gücü (RSRP & SNR)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="ts" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="rsrp" stroke="#82ca9d" name="RSRP (dBm)" />
          <Line type="monotone" dataKey="snr" stroke="#8884d8" name="SNR (dB)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CellStatsChart;
