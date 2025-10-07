import React from "react";
import ForecastChart from "../components/ForecastChart";
import DriftChart from "../components/DriftChart";

function Forecast() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Forecast & Drift Analysis</h1>


        <div className="bg-white rounded-xl shadow p-4">
          <ForecastChart />
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <DriftChart />
        </div>
 
    </div>
  );
}

export default Forecast;
