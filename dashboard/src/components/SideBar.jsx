import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/forecast", label: "Forecast", icon: "⏱️" },
    { path: "/policies", label: "Policies", icon: "📜" },
    { path: "/kpis", label: "KPIs", icon: "📈" },
    { path: "/map", label: "Map", icon: "🗺️" },
    { path: "/models", label: "Models", icon: "🤖" },
  ];

  return (
    <div className="flex">
   
      <div
        className={`${
          isOpen ? "w-64" : "w-16"
        } bg-slate-800 text-white min-h-screen flex flex-col transition-all duration-300`}
      >
        
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <span className={`${isOpen ? "block" : "hidden"} font-bold text-xl`}>
            5G Energy
          </span>
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
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className={`${isOpen ? "block" : "hidden"} text-sm`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
