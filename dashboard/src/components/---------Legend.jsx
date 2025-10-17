import React from "react";

export default function Legend() {
  return (
    <div
      className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm space-y-2 border border-gray-200 z-[1000]"
      style={{ zIndex: 1000 }} 
    >
      <h3 className="font-semibold text-gray-700 mb-2"> RSRP Legend</h3>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-green-500 border" />
        <span className="text-gray-700">RSRP &gt; -85 (Strong)</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-orange-500 border" />
        <span className="text-gray-700">-100 &lt; RSRP ≤ -85 (Medium)</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-red-500 border" />
        <span className="text-gray-700">RSRP ≤ -100 (Weak)</span>
      </div>
    </div>
  );
}
