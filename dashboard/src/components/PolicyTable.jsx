import React from "react";

export default function PolicyTable({ data }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-2">Policies</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2">Time</th>
            <th className="px-4 py-2">Cell</th>
            <th className="px-4 py-2">Class</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((row, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-4 py-2">{row.ts}</td>
              <td className="px-4 py-2">{row.cell_id}</td>
              <td className="px-4 py-2">{row.class_label}</td>
              <td className="px-4 py-2">{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
