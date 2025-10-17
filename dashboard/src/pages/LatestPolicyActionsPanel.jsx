/**
 * LatestPolicyActionsPanel.jsx — 5G Energy Optimization Dashboard
 * ===============================================================
 *
 * Purpose:
 * --------
 * Displays the most recent AI-driven policy actions applied to 5G base stations.
 * Includes reasoning, class labels, and interactive details via PolicyActionModal.
 *
 * Features:
 * ----------
 * - Real-time list of latest policy decisions.
 * - Clickable items opening detailed modals.
 * - Integrated guided tour using driver.js.
 * - Fully localized (Turkish UI, English code).
 *
 * Technical Notes:
 * ----------------
 * - API Source: fetchLatestPolicyActions()
 * - Modal: PolicyActionModal
 * - Guided Tour: policiesTourSteps (driver.js)
 * - TailwindCSS responsive layout + dark mode support
 */

import React, { useEffect, useState } from "react";
import { fetchLatestPolicyActions } from "../api";
import PolicyActionModal from "../components/PolicyActionModal";
import { startTour } from "../components/TourManager";
import { policiesTourSteps } from "../components/tours/policiesTour";

export default function LatestPolicyActionsPanel() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchLatestPolicyActions();
        setActions(res || []);
      } catch (err) {
        console.error("Politika aksiyonları alınamadı:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getLabelColor = (label) => {
    switch (label) {
      case "Excellent":
        return "bg-green-100 text-green-800";
      case "Good":
        return "bg-yellow-100 text-yellow-800";
      case "Weak":
        return "bg-orange-100 text-orange-800";
      case "Very Weak":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "increase":
        return "🔺";
      case "decrease":
        return "🔻";
      case "hold":
        return "⏸️";
      default:
        return "⚙️";
    }
  };

  return (
    <div
      id="latestPolicyPanel"
      className="p-4 rounded-xl shadow bg-white dark:bg-slate-800 transition"
    >

      <div className="flex justify-between items-center mb-3">
        <h2
          id="latestPolicyTitle"
          className="text-lg font-bold text-gray-800 dark:text-gray-100"
        >
          🧠 Son Politika Aksiyonları
        </h2>

        
        <button
          onClick={() => startTour(policiesTourSteps)}
          id="latestPolicyTourButton"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg shadow transition"
        >
          🧭 Paneli Tanıt
        </button>
      </div>

      {loading ? (
        <p
          id="latestPolicyLoading"
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          Yükleniyor...
        </p>
      ) : actions.length === 0 ? (
        <p
          id="latestPolicyEmpty"
          className="text-sm text-gray-500 dark:text-gray-300"
        >
          Henüz aksiyon kaydı bulunmuyor.
        </p>
      ) : (
        <ul
          id="latestPolicyList"
          className="space-y-2 max-h-[1000px] overflow-y-auto pr-2"
        >
          {actions.map((a, i) => (
            <li
              key={i}
              onClick={() => setSelectedAction(a)}
              id={`policyItem-${i}`}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center 
                         bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-blue-50 dark:hover:bg-slate-600 
                         cursor-pointer transition"
            >
              <div id={`policyInfo-${i}`} className="flex flex-col">
                <span className="font-semibold text-sm" id={`policyCell-${i}`}>
                  Hücre #{a.cell_id}
                </span>
                <span
                  id={`policyDate-${i}`}
                  className="text-xs text-gray-500 dark:text-gray-300"
                >
                  {new Date(a.decided_at).toLocaleString("tr-TR")}
                </span>

                <span
                  id={`policyAction-${i}`}
                  className="text-sm text-blue-700 dark:text-blue-300 mt-1"
                >
                  {getActionIcon(a.action)} Aksiyon:{" "}
                  <strong>
                    {a.action === "increase"
                      ? "Artır"
                      : a.action === "decrease"
                      ? "Azalt"
                      : "Bekle"}
                  </strong>
                </span>

                {a.reason && (
                  <span
                    id={`policyReason-${i}`}
                    className="text-xs text-gray-500 dark:text-gray-400 italic"
                  >
                    {typeof a.reason === "object" ? a.reason.rule : a.reason}
                  </span>
                )}
              </div>

              <span
                id={`policyLabel-${i}`}
                className={`px-2 py-1 text-xs font-semibold rounded-md ${getLabelColor(
                  a.class_label
                )} mt-2 sm:mt-0`}
              >
                {a.class_label === "Excellent"
                  ? "Mükemmel"
                  : a.class_label === "Good"
                  ? "İyi"
                  : a.class_label === "Weak"
                  ? "Zayıf"
                  : "Çok Zayıf"}
              </span>
            </li>
          ))}
        </ul>
      )}


      {selectedAction && (
        <PolicyActionModal
          id="policyModal"
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
        />
      )}
    </div>
  );
}
