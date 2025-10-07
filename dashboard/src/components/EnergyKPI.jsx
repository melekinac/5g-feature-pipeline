import React, { useEffect, useState } from "react";
import { fetchEnergySaving } from "../api";

export default function EnergyKPI() {
  const [saving, setSaving] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const d = await fetchEnergySaving();
        setSaving(d.saving_pct); 
      } catch (err) {
        console.error("Energy KPI error:", err);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-green-100 text-green-800 p-4 rounded-xl shadow text-center">
      <h3 className="text-sm">Enerji Tasarrufu</h3>
      <p className="text-2xl font-bold">{(saving * 100).toFixed(0)}%</p>
      <p className="text-xs">Son 7 gün</p>
    </div>
  );
}
