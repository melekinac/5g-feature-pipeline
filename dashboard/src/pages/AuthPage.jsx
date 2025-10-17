/**
 * AuthPage.jsx — 5G Energy Optimization Dashboard
 * ===============================================
 *
 * Purpose:
 * --------
 * Provides authentication functionality (Login & Register)
 * for the dashboard interface.
 *
 * Features:
 * ----------
 * - Allows users to sign in or create an account.
 * - Automatically stores JWT tokens for session management.
 * - Redirects authenticated users to the main dashboard.
 *
 * Technical Notes:
 * ----------------
 * - API Endpoints: /auth/register and /auth/token
 * - Utilizes localStorage for token persistence.
 * - Dark mode compatible via Tailwind classes.
 */

import React, { useState } from "react";
import { login, register } from "../api";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const data = await login(username, password);
        localStorage.setItem("access_token", data.access_token);
        navigate("/");
      } else {
        await register(username, password);
        const data = await login(username, password);
        localStorage.setItem("access_token", data.access_token);
        navigate("/");
      }
    } catch (err) {
      setError("İşlem başarısız: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-slate-800 dark:to-slate-900 transition-colors">
      <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-8 w-[400px] text-gray-800 dark:text-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? "🔐 Giriş Yap" : "🆕 Kayıt Ol"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Kullanıcı Adı
            </label>
            <input
              id="authUsername"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring focus:ring-blue-300 dark:focus:ring-blue-700 bg-gray-50 dark:bg-slate-700"
              placeholder="örnek: melekinaç"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Şifre</label>
            <input
              id="authPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring focus:ring-blue-300 dark:focus:ring-blue-700 bg-gray-50 dark:bg-slate-700"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
          )}

          <button
            id="authSubmitButton"
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
          >
            {loading
              ? "⏳ İşlem yapılıyor..."
              : isLogin
              ? "Giriş Yap"
              : "Kayıt Ol"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            id="toggleAuthMode"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            {isLogin
              ? "Hesabın yok mu? Kayıt ol →"
              : "Zaten hesabın var mı? Giriş yap →"}
          </button>
        </div>
      </div>
    </div>
  );
}
