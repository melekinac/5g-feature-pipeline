import React, { useEffect, useState } from "react";
import { fetchPolicyTimeline } from "../api";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceDot } from "recharts";

export default function PolicyTimeline({ cellId = "13" }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchPolicyTimeline(cellId).then(setData).catch(err =>
      console.error("PolicyTimeline API error:", err)
    );
  }, [cellId]);

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-semibold mb-2">Policy Impact Timeline</h2>
      <LineChart width={600} height={300} data={data}>
        <XAxis dataKey="ts" />
        <YAxis hide />
        <Tooltip />
        <Legend />
        {data.map((d, i) => (
          <ReferenceDot
            key={i}
            x={d.ts}
            y={0}
            r={6}
            fill={
              d.action === "sleep" ? "red" : d.action === "optimize" ? "blue" : "gray"
            }
          />
        ))}
      </LineChart>
    </div>
  );
}
