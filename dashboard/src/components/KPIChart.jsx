// import React, { useEffect, useState } from "react";
// import { fetchKPIs } from "../api";

// function KPIChart() {
//   const [data, setData] = useState([]);

//   useEffect(() => {
//     fetchKPIs().then(setData).catch((err) => {
//       console.error("KPI fetch error:", err);
//     });
//   }, []);

//   return (
//     <div className="p-4 bg-white rounded-xl shadow text-slate-800">
//       <h2 className="text-xl font-bold mb-4">KPI Trend</h2>
//       <div className="overflow-x-auto">
//         <table className="w-full border border-slate-200 text-sm">
//           <thead>
//             <tr className="bg-slate-100 text-slate-800">
//               <th className="p-2 border border-slate-200">Date</th>
//               <th className="p-2 border border-slate-200">DL (Mbps)</th>
//               <th className="p-2 border border-slate-200">UL (Mbps)</th>
//               <th className="p-2 border border-slate-200">RSRP</th>
//               <th className="p-2 border border-slate-200">SNR</th>
//               <th className="p-2 border border-slate-200">Latency P90 (ms)</th>
//               <th className="p-2 border border-slate-200">Energy (kWh)</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((row, i) => (
//               <tr key={i} className="text-center hover:bg-slate-50">
//                 <td className="p-2 border border-slate-200">{row.date}</td>
//                 <td className="p-2 border border-slate-200">
//                   {Number(row.avg_dl).toFixed(2)}
//                 </td>
//                 <td className="p-2 border border-slate-200">
//                   {Number(row.avg_ul).toFixed(2)}
//                 </td>
//                 <td className="p-2 border border-slate-200">
//                   {Number(row.avg_rsrp).toFixed(2)}
//                 </td>
//                 <td className="p-2 border border-slate-200">
//                   {Number(row.avg_snr).toFixed(2)}
//                 </td>
//                 <td className="p-2 border border-slate-200">
//                   {Number(row.avg_latency).toFixed(2)}
//                 </td>
//                 <td className="p-2 border border-slate-200">
//                   {Number(row.total_energy).toFixed(2)}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import { fetchKPIs } from "../api";

export default function EnergyKPI() {
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchKPIs();
        setSaving(res.energy_saving_pct || 0);
      } catch (err) {
        console.error("Energy KPI error:", err);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-green-100 text-green-800 rounded-xl shadow p-6 text-center">
      <h2 className="text-lg font-semibold"> Energy Saving</h2>
      <p className="text-3xl font-bold mt-2">
        {saving ? `${saving.toFixed(1)}%` : "…"}
      </p>
      <span className="text-sm">Son 7 gün</span>
    </div>
  );
}
