import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { fetchCells, fetchPolicies } from "../api";
import CellDetailPanel from "../components/CellDetailModal";
const getMarkerIcon = (rsrp, isLowEnergy) => {
  let color = "red";
  if (rsrp > -85) color = "green";
  else if (rsrp > -100) color = "orange";

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};
                     width:16px;
                     height:16px;
                     border:2px solid white;
                     border-radius:50%;
                     box-shadow:0 0 6px rgba(0,0,0,0.4);">
           </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

function FlyToCell({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (selected && selected.latitude && selected.longitude) {
      map.flyTo([selected.latitude, selected.longitude], 13);
    }
  }, [selected, map]);
  return null;
}

export default function MapView() {
  const [cells, setCells] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [policies, setPolicies] = useState([]);


  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    async function load() {
      try {
        const [cellData, policyData] = await Promise.all([
          fetchCells(),
          fetchPolicies(),
        ]);
        const normalized = cellData.map((d) => ({
          ...d,
          latitude: Number(d.latitude) / 1e6,
          longitude: Number(d.longitude) / 1e6,
          energy_kwh: d.energy_kwh || Math.floor(Math.random() * 20),
        }));
        setCells(normalized);
        setPolicies(policyData || []);
      } catch (err) {
        console.error("Map API error:", err);
      }
    }
    load();
  }, []);


  const avgLat =
    cells.length > 0
      ? cells.reduce((sum, c) => sum + c.latitude, 0) / cells.length
      : 39.0;
  const avgLon =
    cells.length > 0
      ? cells.reduce((sum, c) => sum + c.longitude, 0) / cells.length
      : 35.0;

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = cells.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(cells.length / rowsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages || 1);
  }, [rowsPerPage, totalPages, currentPage]);


  const selectedPolicies = selectedCell
    ? policies.filter((p) => p.cell_id === selectedCell.cell_id)
    : [];

  return (
    <div className="flex">
  
      <div className={`flex-1 transition-all ${selectedCell ? "mr-96" : ""}`}>
        <h1 className="text-2xl font-bold mb-6">🗺️ Network Map</h1>
        <div className="bg-white rounded-xl shadow p-4 h-[500px]">
          <MapContainer
            center={[avgLat, avgLon]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            <FlyToCell selected={selectedCell} />
            {cells.map((c) =>
              c.latitude && c.longitude ? (
                <Marker
                  key={c.cell_id}
                  position={[c.latitude, c.longitude]}
                  icon={getMarkerIcon(c.rsrp_mean, c.energy_kwh < 10)}
                  eventHandlers={{
                    click: () => setSelectedCell(c),
                  }}
                />
              ) : null
            )}
          </MapContainer>
        </div>

     
        <div className="mt-6 bg-white rounded-xl shadow p-4 overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Cell Data Table</h2>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <table className="table-auto w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-2">Cell ID</th>
                <th className="border p-2">RSRP (dBm)</th>
                <th className="border p-2">DL Mbps</th>
                <th className="border p-2">UL Mbps</th>
                <th className="border p-2">Energy (kWh)</th>
                <th className="border p-2">TS</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((c) => (
                <tr
                  key={c.cell_id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    c.energy_kwh < 10 ? "bg-red-100 animate-pulse" : ""
                  }`}
                  onClick={() => setSelectedCell(c)}
                >
                  <td className="border p-2">{c.cell_id}</td>
                  <td className="border p-2">{c.rsrp_mean}</td>
                  <td className="border p-2">{c.dl_mbps_mean || "-"}</td>
                  <td className="border p-2">{c.ul_mbps_mean || "-"}</td>
                  <td className="border p-2">{c.energy_kwh}</td>
                  <td className="border p-2">{c.ts || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-center mt-4 space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

 
      {selectedCell && (
        <CellDetailPanel
          cell={selectedCell}
          policies={policies}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
}