/**
 * Layout.jsx — 5G Energy Optimization Dashboard
 * =============================================
 *
 * Main layout wrapper used across all pages.
 *
 * Responsibilities
 * ----------------
 * - Renders the persistent application chrome:
 *     • Sidebar (left navigation)
 *     • Header (title, greeting, logout)
 *     • Footer (branding, year)
 * - Extracts the current username from a JWT stored in localStorage.
 * - Handles logout by clearing credentials and redirecting to the auth page.
 *
 * Technical Notes
 * ---------------
 * - JWT parsing is done locally to avoid an extra round-trip.
 * - Uses Tailwind classes for light/dark mode and responsive layout.
 * - Children are rendered inside <main> with scrollable overflow.
 */

import React, { useEffect, useState } from "react";
import Sidebar from "./SideBar";

/**
 * Safely decode a JWT without verifying signature.
 * Only used to read non-sensitive claims (e.g., `sub`).
 * Returns `null` on malformed input.
 */
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function Layout({ children }) {
  const [username, setUsername] = useState("Kullanıcı");

 
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.sub) {
        setUsername(decoded.sub);
      }
    }
  }, []);

  /**
   * Clear session token and redirect to the authentication route.
   * This ensures protected routes are no longer accessible.
   */
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/auth";
  };

  return (
    <div className="flex h-screen">
    
      <Sidebar />

   
      <div className="flex flex-col flex-1">
      
        <header className="bg-slate-100 dark:bg-slate-900 px-6 py-3 flex justify-between items-center shadow-sm border-b border-slate-300 dark:border-slate-700">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              5G Enerji Optimizasyonu Paneli
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
           👋    Hoş geldin, <span className="font-medium">{username}</span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
                 🚪  Çıkış Yap
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-transparent dark:bg-transparent transition-colors duration-500">
          {children}
        </main>

      
        <footer className="bg-slate-800 text-white py-3 px-6 flex items-center justify-between">
          <span>5G Enerji Optimizasyon Platformu</span>
          <span className="text-sm text-slate-400">
            © {new Date().getFullYear()}
          </span>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
