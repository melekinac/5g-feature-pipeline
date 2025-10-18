/**
 * Sidebar.jsx — 5G Energy Optimization Dashboard
 * ==============================================
 *
 * Collapsible sidebar navigation for the entire dashboard interface.
 *
 * Purpose
 * -------
 * - Provides quick access to key sections such as Dashboard, Map, and Policy Actions.
 * - Allows toggling between expanded and compact modes.
 * - Highlights the active route for better navigation context.
 *
 * Technical Notes
 * ---------------
 * - Uses React Router `useLocation` for route detection.
 * - State `isOpen` controls menu width (64px collapsed → 256px expanded).
 * - Integrates the official 5G Energy Optimization logo in the header.
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Kontrol Paneli", icon: "📊" },
    { path: "/map", label: "Harita", icon: "🗺️" },
    { path: "/policy-actions", label: "Son Politika Aksiyonları", icon: "🧩" },
  ];

  return (
    <div className="flex">
      <div
        className={`${
          isOpen ? "w-64" : "w-16"
        } bg-slate-800 text-white min-h-screen flex flex-col transition-all duration-300 shadow-lg`}
      >
       
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <img
              src={logo}
              alt="5G Energy Logo"
              className="h-8 w-8 rounded-md object-contain"
            />
            {isOpen && (
              <span className="font-bold text-xl whitespace-nowrap">
                 5G Enerji 
              </span>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-300 hover:text-white"
          >
            ☰
          </button>
        </div>

    
        <nav className="flex-1 p-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {isOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

  
        <div className="p-4 border-t border-slate-700 text-xs text-slate-400 text-center">
          {isOpen && "v1.0.0 – Yapay Zeka Enerji Optimizasyonu"}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
