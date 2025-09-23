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
    return <p>No cell data available</p>;
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
        attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {cells.map((cell, i) =>
        cell.latitude && cell.longitude ? (
          <Marker key={i} position={[cell.latitude, cell.longitude]}>
            <Popup>
              <b>Cell ID:</b> {cell.cell_id} <br />
              <b>DL Mbps:</b> {cell.dl_mbps_mean} <br />
              <b>UL Mbps:</b> {cell.ul_mbps_mean} <br />
              <b>RSRP:</b> {cell.rsrp_mean}
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
