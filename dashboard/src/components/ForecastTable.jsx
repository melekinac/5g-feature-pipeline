import React from "react";

export default function ForecastTable({ data }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-2">Forecast</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2">Time</th>
            <th className="px-4 py-2">Cell</th>
            <th className="px-4 py-2">Prediction</th>
            <th className="px-4 py-2">Model</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((row, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-4 py-2">{row.ts}</td>
              <td className="px-4 py-2">{row.cell_id}</td>
              <td className="px-4 py-2">{row.y_hat?.toFixed(2)}</td>
              <td className="px-4 py-2">{row.model_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
