import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchSimulate } from "../api";

const COLORS = ["#00C49F", "#FF8042"];

export default function SimulationPanel({ cell }) {
  const [sim, setSim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cell) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSimulate(cell.cell_id);
        setSim(data);
      } catch (err) {
        console.error("Simulation error:", err);
        setError("Simulation data could not be loaded.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cell]);


  if (!cell) {
    return (
      <div className="bg-white rounded-xl shadow p-4 h-[400px] flex items-center justify-center">
        <p className="text-gray-500">
          Select a cell to simulate policy impact.
        </p>
      </div>
    );
  }


  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-4 h-[400px] flex items-center justify-center">
        <p className="text-gray-500">Loading simulation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-4 h-[400px] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }


  if (!sim) {
    return (
      <div className="bg-white rounded-xl shadow p-4 h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No simulation data available.</p>
      </div>
    );
  }


  const energyData = [
    { name: "Baseline Energy", value: sim.baseline.energy },
    { name: "Saved", value: sim.baseline.energy - sim.simulated.energy },
  ];

  const throughputData = [
    { name: "Baseline Throughput", value: sim.baseline.throughput },
    { name: "Loss", value: sim.baseline.throughput - sim.simulated.throughput },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-4 h-[400px] flex flex-col">
      <h3 className="text-lg font-semibold mb-3">
        What-If Simulation – Cell {cell.cell_id}
      </h3>

      <div className="flex-1 grid grid-cols-2 gap-4">
      
        <div className="flex flex-col items-center justify-center">
          <h4 className="mb-2 text-slate-700">Energy Saving</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={energyData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={40}
                label={({ percent }) =>
                  `${(percent * 100).toFixed(0)}%`
                }
              >
                {energyData.map((entry, index) => (
                  <Cell
                    key={`cell-energy-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toFixed(1)} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-green-600 font-bold mt-2">
             {sim.energy_saving_pct}% saving
          </p>
        </div>

      
        <div className="flex flex-col items-center justify-center">
          <h4 className="mb-2 text-slate-700">Throughput Loss</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={throughputData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={40}
                label={({ percent }) =>
                  `${(percent * 100).toFixed(0)}%`
                }
              >
                {throughputData.map((entry, index) => (
                  <Cell
                    key={`cell-throughput-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toFixed(1)} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-red-600 font-bold mt-2">
             {sim.throughput_loss_pct}% loss
          </p>
        </div>
      </div>
    </div>
  );
}
