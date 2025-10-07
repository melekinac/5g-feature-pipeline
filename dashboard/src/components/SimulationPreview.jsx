import React, { useEffect, useState } from "react";
import { fetchSimulation } from "../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function SimulationPreview({ cellId = "13" }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchSimulation(cellId).then(res => {
      setData([
        { metric: "Energy", Baseline: res.baseline.energy, Simulated: res.simulated.energy },
        { metric: "Throughput", Baseline: res.baseline.throughput, Simulated: res.simulated.throughput },
      ]);
    });
  }, [cellId]);

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-semibold mb-2"> What-If Simulation</h2>
      <BarChart width={500} height={300} data={data}>
        <XAxis dataKey="metric" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Baseline" fill="#8884d8" />
        <Bar dataKey="Simulated" fill="#82ca9d" />
      </BarChart>
    </div>
  );
}
