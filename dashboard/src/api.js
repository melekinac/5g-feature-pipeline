
const API_BASE = "http://localhost:8000/api";


export async function fetchForecast() {
  const res = await fetch(`${API_BASE}/forecast`);
  if (!res.ok) throw new Error("Failed to fetch forecast");
  return res.json();
}


// export async function fetchCellStats() {
//   const res = await fetch(`${API_BASE}/cell_stats`);
//   if (!res.ok) throw new Error("Failed to fetch cell stats");
//   return res.json();
// }

export async function fetchCellFeaturesStats() {
  const res = await fetch(`${API_BASE}/cell_features`);
  if (!res.ok) throw new Error("Failed to fetch cell stats");
  return res.json();
}

export async function fetchPolicies() {
  const res = await fetch(`${API_BASE}/policies`);
  if (!res.ok) throw new Error("Failed to fetch policies");
  return res.json();
}

export async function simulate() {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})   // boş body gönder
  });
  if (!res.ok) throw new Error("Failed to run simulation");
  return res.json();
}

export async function fetchKPIs() {
  const res = await fetch(`${API_BASE}/kpis`);
  if (!res.ok) throw new Error("Failed to fetch KPIs");
  return res.json();
}

export async function fetchPolicySummary() {
  const res = await fetch(`${API_BASE}/policy_summary`);
  if (!res.ok) throw new Error("Failed to fetch policy_summary");
  return res.json();
}

export async function fetchEnergySummary() {
  const res = await fetch(`${API_BASE}/energy_summary`);
  if (!res.ok) throw new Error("Failed to fetch energy_summary");
  return res.json();
}

export async function fetchModelMetrics() {
  const res = await fetch(`${API_BASE}/model_metrics`);
  if (!res.ok) throw new Error("Failed to fetch model_metricsy");
  return res.json();
}

export async function fetchDrift() {
  const res = await fetch(`${API_BASE}/drift`);
  if (!res.ok) throw new Error("Failed to fetch drift");
  return res.json();
}

export async function fetchForecastAll() {
  const res = await fetch(`${API_BASE}/forecast_all`);
  if (!res.ok) throw new Error("Failed to fetch all forecasts");
  return res.json();
}
export async function fetchCells() {
  const res = await fetch(`${API_BASE}/cells`);
  if (!res.ok) throw new Error("Failed to fetch cells");
  return res.json();
}

export async function fetchMultiGauge() {
  const res = await  fetch(`${API_BASE}/multi_gauge`); 
  return await res.json();
}

export async function fetchForecastCellId(cellId) {
  const res = await fetch(`${API_BASE}/forecast/${cellId}`);
  if (!res.ok) throw new Error("Forecast API error");
  return res.json();
}

export async function fetchEnergySaving() {
  const res = await fetch(`${API_BASE}/energy_saving`);
  if (!res.ok) throw new Error("Failed to Energy Saving");
  return res.json();
}
export async function fetchAlerts() {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error("Failed to Alerts");
  return res.json();
}
export async function fetchModelMetricsSummary() {
  const res = await fetch(`${API_BASE}/model_metrics_summary`);
  if (!res.ok) throw new Error("Failed to Model Metrics Summary");
  return res.json();
}

export async function fetchKpisByCell(cellId) {
  const res = await fetch(`${API_BASE}/kpis/${cellId}`);
  if (!res.ok) throw new Error("Failed to fetch KPIs");
  return res.json();
}

export async function fetchSimulate(cellId) {
  const res = await fetch(`${API_BASE}/simulate/${cellId}`);
  return res.json();
}
