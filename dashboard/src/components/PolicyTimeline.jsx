/**
 * PolicyTimeline.jsx — 5G Energy Optimization Dashboard
 * =====================================================
 *
 * Visual timeline of cell-level policy actions over time.
 *
 * Purpose
 * -------
 * - Displays when specific optimization actions (e.g., “sleep”, “optimize”) were applied.
 * - Helps correlate decisions with observed performance changes.
 * - Provides a clear historical overview of policy interventions for a selected cell.
 *
 * Technical Notes
 * ---------------
 * - Data Source: /api/policy_timeline
 * - Each point (ReferenceDot) represents one policy action event.
 * - Color coding:
 *    •  Red → Sleep
 *    •  Blue → Optimize
 *    • Gray → Other actions
 * - Uses Recharts for lightweight interactive visualization.
 */

import React, { useEffect, useState } from "react";
import { fetchPolicyTimeline } from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceDot,
} from "recharts";

export default function PolicyTimeline({ cellId = "13" }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchPolicyTimeline(cellId)
      .then(setData)
      .catch((err) => console.error("PolicyTimeline API error:", err));
  }, [cellId]);

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-semibold mb-2">Politika Etki Zaman Çizelgesi</h2>
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
              d.action === "sleep"
                ? "red"
                : d.action === "optimize"
                ? "blue"
                : "gray"
            }
          />
        ))}
      </LineChart>
    </div>
  );
}
