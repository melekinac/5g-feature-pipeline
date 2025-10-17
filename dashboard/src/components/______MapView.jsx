/**
 * MapView.jsx — 5G Energy Optimization Dashboard
 * ==============================================
 *
 * Interactive map component that visualizes 5G base station (cell) locations.
 *
 * Purpose
 * -------
 * - Displays all available cell coordinates on a Leaflet map.
 * - Provides quick insight into each cell’s KPIs (DL/UL Mbps, RSRP).
 * - Centers the map automatically based on average latitude/longitude of cells.
 *
 * Technical Notes
 * ---------------
 * - Uses React Leaflet for map rendering.
 * - Dynamically loads OpenStreetMap tiles.
 * - Includes popup tooltips for each marker with basic performance metrics.
 * - Handles missing coordinates gracefully.
 */

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapView({ cells }) {
  if (!cells || cells.length === 0) {
    return <p className="text-gray-600 text-sm">Hücre verisi bulunamadı.</p>;
  }

  const avgLat =
    cells.reduce((sum, c) => sum + (c.latitude || 0), 0) / cells.length;
  const avgLon =
    cells.reduce((sum, c) => sum + (c.longitude || 0), 0) / cells.length;

  return (
    <MapContainer
      center={[avgLat || 39, avgLon || 35]}
      zoom={6}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {cells.map((cell, i) =>
        cell.latitude && cell.longitude ? (
          <Marker key={i} position={[cell.latitude, cell.longitude]}>
            <Popup>
              <b>Hücre ID:</b> {cell.cell_id} <br />
              <b>İndirme Hızı:</b> {cell.dl_mbps_mean} Mbps <br />
              <b>Yükleme Hızı:</b> {cell.ul_mbps_mean} Mbps <br />
              <b>RSRP:</b> {cell.rsrp_mean} dBm
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
