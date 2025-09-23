// src/api.js

const API_BASE = "http://localhost:8000/api";

// Forecast verilerini çek
export async function fetchForecast() {
  const res = await fetch(`${API_BASE}/forecast`);
  if (!res.ok) throw new Error("Failed to fetch forecast");
  return res.json();
}

// Hücre istatistiklerini çek
export async function fetchCellStats() {
  const res = await fetch(`${API_BASE}/cell_stats`);
  if (!res.ok) throw new Error("Failed to fetch cell stats");
  return res.json();
}

// Policy verilerini çek
export async function fetchPolicies() {
  const res = await fetch(`${API_BASE}/policies`);
  if (!res.ok) throw new Error("Failed to fetch policies");
  return res.json();
}
