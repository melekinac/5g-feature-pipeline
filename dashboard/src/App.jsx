/**
 * App.jsx — 5G Energy Optimization Dashboard
 * ==========================================
 *
 * Purpose:
 * --------
 * Defines the main routing structure of the frontend.
 * Handles authentication flow, protected routes, and page-level navigation.
 *
 * Features:
 * ----------
 * - PrivateRoute → restricts access to authenticated users (JWT-based).
 * - AuthPage → login/register system.
 * - Layout → global wrapper including sidebar, header, and footer.
 * - Uses React Router v6 for nested route handling.
 
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import PolicyActions from "./pages/LatestPolicyActionsPanel";
import AuthPage from "./pages/AuthPage"; 


function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/auth" replace />;
}


function App() {
  return (
    <Router>
      <Routes>
      
        <Route path="/auth" element={<AuthPage />} />

      
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/policy-actions" element={<PolicyActions />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
