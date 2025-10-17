
/**
 * api.js — 5G Energy Optimization Dashboard
 * =========================================
 *
 * Purpose:
 * --------
 * Centralized API client module for all frontend-to-backend interactions.
 * Handles authentication, token management, and REST endpoint abstraction.
 *
 * Features:
 * ----------
 * - Includes reusable `authFetch()` wrapper with JWT Authorization header.
 * - Automatically manages expired sessions (401 → token removal).
 * - Provides helper functions for all major API routes:
 *   authentication, forecasting, policies, energy summary, alerts, etc.
 *
 * Technical Notes:
 * ----------------
 * - Authentication: Bearer JWT
 * - Format: JSON (except token endpoint uses URLSearchParams)
 */

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";



export async function authFetch(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    console.warn("Yetkisiz erişim, oturum süresi dolmuş olabilir.");
    localStorage.removeItem("access_token");
    throw new Error("Unauthorized");
  }
  return res.json();
}


export async function login(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const res = await fetch(`${API_BASE}/auth/token`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error("Giriş başarısız");
  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  return data;
}


export async function register(username, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Kayıt başarısız");
  return res.json();
}


export async function fetchForecast() {
  return authFetch("/api/forecast");
}

export async function fetchCellFeaturesStats() {
  return authFetch("/api/cell_features");
}

export async function fetchPolicies() {
  return authFetch("/api/policies");
}


export async function fetchPolicySummary() {
  return authFetch("/api/policy_summary");
}


export async function fetchModelMetrics() {
  return authFetch("/api/model_metrics");
}

export async function fetchDrift() {
  return authFetch("/api/drift");
}

export async function fetchForecastAll() {
  return authFetch("/api/forecast_all");
}

export async function fetchCells() {
  return authFetch("/api/cells");
}

export async function fetchForecastCellId(cellId) {
  return authFetch(`/api/forecast/${cellId}`);
}

export async function fetchEnergySaving() {
  return authFetch("/api/energy_saving");
}

export async function fetchAlerts() {
  return authFetch("/api/alerts");
}


export async function fetchKpisByCell(cellId) {
  return authFetch(`/api/kpis/${cellId}`);
}

export async function fetchSimulate(cellId) {
  return authFetch(`/api/simulate/${cellId}`);
}

export async function fetchCellStatus() {
  return authFetch("/api/cell_status");
}

export async function fetchPoliciesHistory() {
  return authFetch("/api/policy_history");
}

export async function fetchCellEnergySummary() {
  return authFetch("/api/cell_energy_summary");
}

export async function fetchLatestPolicyActions() {
  return authFetch("/api/policy_actions/latest");
}

export async function fetchCellHistory(cell_id) {
  return authFetch(`/api/cell_history/${cell_id}`);
}
