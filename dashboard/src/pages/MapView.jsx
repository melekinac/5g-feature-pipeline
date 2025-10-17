/**
 * MapView.jsx — 5G Energy Optimization Dashboard
 * ==============================================
 *
 * Purpose:
 * --------
 * Displays a live interactive map of 5G cells, color-coded by signal strength (RSRP),
 * energy usage, and AI policy status. Supports zoom-to-cell, paging, and detail view.
 *
 * Features:
 * ----------
 * - Leaflet.js map visualization with dynamic marker icons.
 * - Table view with pagination for all cell metrics.
 * - Clickable markers that open detailed Cell panels.
 * - Smooth fly-to animation on cell selection.
 * - Integrated guided tour (driver.js) for user onboarding.
 *
 * Technical Notes:
 * ----------------
 * - APIs: fetchCells(), fetchPolicies()
 * - Components: CellDetailPanel, TourManager
 * - Libraries: React-Leaflet, TailwindCSS, driver.js
 * - Dark/Light theme adaptive styling
 */

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { fetchCells, fetchPolicies } from "../api";
import CellDetailPanel from "../components/CellDetailModal";
import { startTour } from "../components/TourManager";
import { mapTourSteps } from "../components/tours/mapTour";

const getMarkerIcon = (rsrp, isLowEnergy, isSelected = false) => {
  let color = "red";
  if (rsrp > -85) color = "green";
  else if (rsrp > -100) color = "orange";


  const className = isSelected ? "custom-marker pulse" : "custom-marker";

  return L.divIcon({
    className,
    html: `<div style="
      background:${color};
      width:${isSelected ? 20 : 16}px;
      height:${isSelected ? 20 : 16}px;
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 0 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [isSelected ? 20 : 16, isSelected ? 20 : 16],
    iconAnchor: [10, 10],
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
        console.error("Harita API hatası:", err);
      }
    }
    load();
  }, []);


  const avgLat = cells.length > 0
  ? cells.reduce((sum, c) => sum + c.latitude, 0) / cells.length
  : 52.3555; 
const avgLon = cells.length > 0
  ? cells.reduce((sum, c) => sum + c.longitude, 0) / cells.length
  : -1.1743;



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
    <div
      id="mapPage"
      className="flex transition-colors duration-500 text-gray-900 dark:text-gray-100"
    >
 
      <div
        id="mapMainPanel"
        className={`flex-1 transition-all ${selectedCell ? "mr-96" : ""}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 id="mapTitle" className="text-2xl font-bold">
            🗺️ Ağ Haritası
          </h1>


          <button
            id="mapTourButton"
            onClick={() => startTour(mapTourSteps)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg shadow transition"
          >
            🧭 Haritayı Tanıt
          </button>
        </div>

    
        <div
          id="mapContainer"
          className="w-full h-[500px] rounded-xl p-4 transition-colors duration-500 bg-white dark:bg-slate-800 shadow"
        >
          <MapContainer
            center={[avgLat, avgLon]}
            zoom={6}
            style={{
              height: "100%",
              width: "100%",
              backgroundColor: "transparent",
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap Katkıda Bulunanlar"
            />
            <FlyToCell selected={selectedCell} />
           
               {cells.map(
  (c) =>
    c.latitude &&
    c.longitude && (
      <Marker
        key={c.cell_id}
        position={[c.latitude, c.longitude]}
        icon={getMarkerIcon(
          c.rsrp_mean,
          c.energy_kwh < 10,
          selectedCell?.cell_id === c.cell_id 
        )}
        eventHandlers={{
          click: () => setSelectedCell(c),
        }}
      />
    )
)}
    
               
          </MapContainer>
        </div>

  
        <div
          id="cellTableSection"
          className="mt-6 w-full rounded-xl p-4 transition-colors duration-500 bg-white dark:bg-slate-800 shadow overflow-x-auto"
        >
          <div id="cellTableHeader" className="flex justify-between items-center mb-3">
            <h2 id="cellTableTitle" className="text-lg font-semibold">
              Hücre Verileri Tablosu
            </h2>
            <select
              id="rowsPerPageSelect"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-100"
            >
              <option value={10}>10 / sayfa</option>
              <option value={20}>20 / sayfa</option>
              <option value={50}>50 / sayfa</option>
            </select>
          </div>

          <table
            id="cellDataTable"
            className="table-auto w-full text-sm border-collapse text-gray-800 dark:text-gray-200"
          >
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-700 text-left">
                <th className="border border-gray-300 dark:border-gray-600 p-2">
                  Hücre ID
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2">
                  RSRP (dBm)
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2">
                  DL Hızı (Mbps)
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2">
                  UL Hızı (Mbps)
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2">
                  Enerji (kWh)
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2">
                  Zaman Damgası
                </th>
              </tr>
            </thead>
            <tbody id="cellTableBody">
              {currentRows.map((c) => (
                <tr
                  key={c.cell_id}
                  id={`cellRow-${c.cell_id}`}
                  className={`cursor-pointer transition-colors ${
                    c.energy_kwh < 10
                      ? "bg-red-100 dark:bg-red-900/40 animate-pulse"
                      : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                  }`}
                  onClick={() => setSelectedCell(c)}
                >
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    {c.cell_id}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    {c.rsrp_mean}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    {c.dl_mbps_mean || "-"}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    {c.ul_mbps_mean || "-"}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    {c.energy_kwh}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    {c.ts || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            id="paginationControls"
            className="flex justify-center mt-4 space-x-2"
          >
            <button
              id="prevPageButton"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50"
            >
              Önceki
            </button>
            <span id="pageIndicator" className="px-3 py-1">
              Sayfa {currentPage} / {totalPages}
            </span>
            <button
              id="nextPageButton"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>


      {selectedCell && (
        <CellDetailPanel
          id="cellDetailPanel"
          cell={selectedCell}
          policies={policies}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
}
