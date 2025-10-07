import React, { useEffect, useState } from "react";

function KPIs() {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    async function loadKPIs() {
      try {
        const res = await fetch("/api/kpis");
        const data = await res.json();
        if (data.length > 0) {
      
          setKpis(data[data.length - 1]);
        }
      } catch (err) {
        console.error("KPIs API Error:", err);
      }
    }
    loadKPIs();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6"> Key Performance Indicators</h1>

      {kpis ? (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <h3 className="text-gray-500">Avg RSRP</h3>
            <p className="text-2xl font-bold">{kpis.avg_rsrp?.toFixed(1)} dBm</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <h3 className="text-gray-500">Avg SNR</h3>
            <p className="text-2xl font-bold">{kpis.avg_snr?.toFixed(1)} dB</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <h3 className="text-gray-500">Throughput (DL)</h3>
            <p className="text-2xl font-bold">{kpis.avg_dl?.toFixed(1)} Mbps</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <h3 className="text-gray-500">Throughput (UL)</h3>
            <p className="text-2xl font-bold">{kpis.avg_ul?.toFixed(1)} Mbps</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <h3 className="text-gray-500">Latency P90</h3>
            <p className="text-2xl font-bold">{kpis.avg_latency?.toFixed(1)} ms</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-400">KPI verileri yükleniyor...</p>
      )}
    </div>
  );
}

export default KPIs;
