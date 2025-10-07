
import React, { useEffect, useState } from "react";
import { fetchForecastCellId, fetchKpisByCell, fetchSimulate } from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

export default function CellDetailPanel({ cell, policies, onClose }) {
  const [forecast, setForecast] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    if (!cell) return;
    async function load() {
      try {
        const [fData, kpiData, sim] = await Promise.all([
          fetchForecastCellId(cell.cell_id),
          fetchKpisByCell(cell.cell_id),
          fetchSimulate(cell.cell_id),
        ]);
        setForecast(fData || []);
        setKpis(kpiData || []);
        setSimulation(sim || null);
      } catch (err) {
        console.error("Detail panel error:", err);
      }
    }
    load();
  }, [cell]);

  if (!cell) return null;


  const cellPolicies = policies.filter((p) => p.cell_id === cell.cell_id);
  const actionMap = { monitor: 0, optimize: 1, sleep: 2 };
  const timelineData = cellPolicies.map((p) => ({
    ts: p.ts,
    actionValue: actionMap[p.action] || 0,
  }));

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-xl border-l z-50 flex flex-col">
  
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-bold"> Cell {cell.cell_id}</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 text-lg"
        >
          ✖
        </button>
      </div>

  
      <div className="p-4 overflow-y-auto flex-1">
        <p><strong>RSRP:</strong> {cell.rsrp_mean} dBm</p>
        <p><strong>Energy:</strong> {cell.energy_kwh} kWh</p>
        <p><strong>TS:</strong> {cell.ts || "-"}</p>

        <h3 className="mt-4 font-semibold">Last 24h KPI</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={kpis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="dl_mbps_mean" stroke="#8884d8" name="DL Mbps"/>
            <Line type="monotone" dataKey="ul_mbps_mean" stroke="#82ca9d" name="UL Mbps"/>
          </LineChart>
        </ResponsiveContainer>

  
        <h3 className="mt-4 font-semibold">Forecast</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ts" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="y_hat" stroke="#ff7300" name="Forecast"/>
            <Line type="monotone" dataKey="ci_low" stroke="#aaa" strokeDasharray="5 5" name="Low CI"/>
            <Line type="monotone" dataKey="ci_high" stroke="#aaa" strokeDasharray="5 5" name="High CI"/>
          </LineChart>
        </ResponsiveContainer>

      
        <h3 className="mt-6 font-semibold"> What-If Simulation</h3>
        {simulation && (
          <div>
            <div className="flex justify-around items-center">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Saved", value: simulation.baseline.energy - simulation.simulated.energy },
                      { name: "Remaining", value: simulation.simulated.energy }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={35}
                    dataKey="value"
                  >
                    <Cell fill="#16a34a" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-sm ml-2">
                <p>Energy Saving: <b>{simulation.energy_saving_pct}%</b></p>
                <p>Throughput Loss: <b>{simulation.throughput_loss_pct}%</b></p>
              </div>
            </div>

        
            <div className="mt-4 text-xs text-gray-600">
              <p>Energy: {simulation.baseline.energy.toFixed(2)} → <b>{simulation.simulated.energy.toFixed(2)}</b> kWh</p>
              <p>Throughput: {simulation.baseline.throughput.toFixed(2)} → <b>{simulation.simulated.throughput.toFixed(2)}</b> Mbps</p>
            </div>
          </div>
        )}

      
        <h3 className="mt-6 font-semibold">Policy Impact Timeline</h3>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={timelineData}>
            <XAxis dataKey="ts" hide />
            <YAxis hide />
            <Tooltip />
            <Area type="monotone" dataKey="actionValue" stroke="#2563eb" fill="#93c5fd" />
          </AreaChart>
        </ResponsiveContainer>

       
        <h3 className="mt-4 font-semibold"> Policy History</h3>
        <ul className="list-disc ml-5 text-sm">
          {cellPolicies.map((p) => (
            <li key={p.id} className="mb-2">
              <div>
                <strong>{p.ts}</strong> →{" "}
                <span
                  className={`${
                    p.action === "sleep"
                      ? "text-red-500"
                      : p.action === "optimize"
                      ? "text-blue-500"
                      : "text-gray-600"
                  }`}
                >
                  {p.action}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
