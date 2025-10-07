import React, { useEffect, useState } from "react";
import KPIChart from "../components/KPIChart";
import MapView from "../pages/MapView";
import PolicyChart from "../components/PolicyChart";
import PolicyTable from "../components/PolicyTable";
import MultiGauge from "../components/MultiGauge";
import { fetchCellFeaturesStats, fetchPolicies, fetchCells } from "../api";
import ForecastChart from "../components/ForecastChart";
import DriftChart from "../components/DriftChart";
import ForecastMultiChart from "../components/ForecastMultiChart";
import EnergyKPI from "../components/EnergyKPI";
import ModelComparison from "../components/ModelComparison";
import SimulationPanel from "../components/SimulationPanel";
export default function Dashboard() {
  const [cells, setCells] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [energySaving, setEnergySaving] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [cellData, policyData, rawCells] = await Promise.all([
          fetchCellFeaturesStats(),
          fetchPolicies(),
          fetchCells(),
        ]);

        setCells(rawCells || []);
        setPolicies(policyData || []);

        const saving = (Math.random() * 20).toFixed(1);
        setEnergySaving(saving);

        const badCells = (rawCells || [])
          .map((d) => ({
            ...d,
            energy_kwh: d.energy_kwh || Math.floor(Math.random() * 30),
            rsrp_mean: Number(d.rsrp_mean),
          }))
          .filter((c) => c.energy_kwh < 10 || c.rsrp_mean < -110);

        setAlerts(badCells);
      } catch (err) {
        console.error("Dashboard API Error:", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-6 space-y-8">

      {alerts.length > 0 && (
        <div className="bg-red-600 text-white p-2 rounded animate-pulse text-center">
           {alerts.length} critical cells need attention!
        </div>
      )}

      <h1 className="text-2xl font-bold"> 5G Energy Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <h3 className="text-gray-500">Toplam Hücre</h3>
          <p className="text-3xl font-bold text-slate-800">{cells.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <h3 className="text-gray-500">Ortalama Enerji</h3>
          <p className="text-3xl font-bold text-slate-800">
            {cells.length > 0
              ? (
                  cells.reduce((sum, c) => sum + (c.energy_kwh || 0), 0) /
                  cells.length
                ).toFixed(1)
              : 0}{" "}
            kWh
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <h3 className="text-gray-500">Tasarruf (Son 7g)</h3>
          <p className="text-3xl font-bold text-green-600">
            {energySaving ? `${energySaving}%` : "-"}
          </p>
        </div>
      </div>


      <div className="bg-white rounded-xl shadow p-4 h-[400px]">
        <h2 className="text-lg font-semibold mb-3"> Kritik Hücreler</h2>
        {alerts.length === 0 ? (
          <p className="text-gray-500">No critical cells.</p>
        ) : (
          <ul className="divide-y max-h-full overflow-y-auto">
            {alerts.map((c) => (
              <li key={c.cell_id} className="py-2 flex justify-between">
                <span>
                  <strong>Cell {c.cell_id}</strong> —{" "}
                  <span className="text-red-600">RSRP: {c.rsrp_mean} dBm</span>,{" "}
                  Energy:{" "}
                  <span
                    className={`${
                      c.energy_kwh < 10
                        ? "text-red-600 font-semibold"
                        : "text-slate-800"
                    }`}
                  >
                    {c.energy_kwh} kWh
                  </span>
                </span>
                <span className="text-red-600 font-semibold">Critical</span>
              </li>
            ))}
          </ul>
        )}
      </div>


      <div className="grid grid-cols-3 gap-6">
        <div className="h-[400px]"><MultiGauge /></div>
        <div className="h-[400px]"><KPIChart /></div>
        <div className="h-[400px]"><EnergyKPI /></div>
      </div>

 
      <div className="grid grid-cols-3 gap-6">
        <div className="h-[400px]"><PolicyTable data={policies} /></div>
        <div className="h-[400px]"><PolicyChart /></div>
        <div className="h-[400px]"><ModelComparison /></div>
      </div>

  
      <div className="grid grid-cols-3 gap-6">
        <div className="h-[400px]"><ForecastChart /></div>
        <div className="h-[400px]"><ForecastMultiChart /></div>
        <div className="h-[400px]"><DriftChart /></div>
      </div>
<div className="grid grid-cols-1 gap-6">
  <SimulationPanel cell={cells[0]} /> 
</div>

     
      <div className="bg-white rounded-xl shadow p-4 h-[500px]">
        <MapView showTable={false} />
      </div>
    </div>
  );
}
