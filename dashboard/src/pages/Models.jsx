import React from "react";

function Models() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6"> Model Registry</h1>
      <div className="bg-white rounded-xl shadow p-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-2">Model</th>
              <th className="p-2">Type</th>
              <th className="p-2">Version</th>
              <th className="p-2">Metrics</th>
              <th className="p-2">Active</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">rf_regressor</td>
              <td className="p-2">Regression</td>
              <td className="p-2">v1</td>
              <td className="p-2">MAPE=12.3%</td>
              <td className="p-2 text-green-600">✅</td>
            </tr>
            <tr>
              <td className="p-2">rf_classifier</td>
              <td className="p-2">Classification</td>
              <td className="p-2">v1</td>
              <td className="p-2">F1=0.87</td>
              <td className="p-2 text-red-600">❌</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Models;
