import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fetchPolicySummary } from "../api";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

export default function PolicyChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchPolicySummary()
      .then((json) => {
        setData(json.map((d) => ({ name: d.action, value: d.count })));
      })
      .catch((err) => console.error("Policy Summary API Error:", err));
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow h-80">
      <h2 className="text-lg font-semibold mb-3 text-slate-800">
        Policy Engine Decisions
      </h2>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
