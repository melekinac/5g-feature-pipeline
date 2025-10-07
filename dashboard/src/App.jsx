import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Forecast from "./pages/Forecast";
import Policies from "./pages/Policies";
import KPIs from "./pages/KPIs";
import MapView from "./pages/MapView";
import Models from "./pages/Models";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/kpis" element={<KPIs />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/models" element={<Models />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
