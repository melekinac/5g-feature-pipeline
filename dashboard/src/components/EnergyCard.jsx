import React, { useEffect, useState } from "react";
import { fetchEnergySummary } from "../api";

function EnergyCard() {
  const [energy, setEnergy] = useState(0);

  useEffect(() => {
    fetchEnergySummary()
      .then((res) => setEnergy(res.total_energy)) 
      .catch((err) => {
        console.error("EnergySummary fetch error:", err);
      });
  }, []);

  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow-md text-center">
      <h3 className="text-sm text-slate-400">Toplam Enerji (kWh)</h3>
      <p className="text-3xl font-bold text-white">{energy} kWh</p>
    </div>
  );
}

export default EnergyCard;
