import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-900 text-white">
        <aside className="w-64 bg-slate-800 p-4 flex flex-col">
          <h1 className="text-xl font-bold mb-6">5G Dashboard</h1>
          <nav className="flex flex-col gap-3">
            <Link to="/" className="hover:bg-slate-700 rounded px-3 py-2">
              Dashboard
            </Link>
            <Link
              to="/forecast"
              className="hover:bg-slate-700 rounded px-3 py-2"
            >
              Forecast
            </Link>
            <Link
              to="/policies"
              className="hover:bg-slate-700 rounded px-3 py-2"
            >
              Policies
            </Link>
            <Link to="/alerts" className="hover:bg-slate-700 rounded px-3 py-2">
              Alerts
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
