import React, { useEffect, useState } from "react";
import { fetchPolicies } from "../api";  
function Policies() {
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    fetchPolicies()
      .then((data) => setPolicies(data || []))
      .catch((err) => console.error("Policies API Error:", err));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">⚙️ Policy Engine Decisions</h1>
      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-slate-100">
              <th className="p-2">Timestamp</th>
              <th className="p-2">Cell</th>
              <th className="p-2">Class</th>
              <th className="p-2">Action</th>
              <th className="p-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-slate-50">
                <td className="p-2">{row.ts}</td>
                <td className="p-2">{row.cell_id}</td>
                <td className="p-2">{row.class_label}</td>
                <td
                  className={`p-2 font-semibold ${
                    row.action?.toLowerCase() === "increase"
                      ? "text-red-600"
                      : row.action?.toLowerCase() === "decrease"
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}
                >
                  {row.action}
                </td>
                <td className="p-2">
                  {typeof row.reason === "object"
                    ? JSON.stringify(row.reason)
                    : row.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Policies;
