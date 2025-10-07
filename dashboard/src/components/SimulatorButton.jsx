import React, { useState } from "react";
import { simulate } from "../api";   

const SimulatorButton = () => {
  const [status, setStatus] = useState("");   

  const handleSimulate = async () => {
  setStatus("Simülasyon başlatılıyor...");
  try {
    const res = await simulate();   
    setStatus(` ${res.message}`);
  } catch (err) {
    console.error("Simülasyon hatası:", err);
    setStatus(" Simülasyon hatası!");
  }
};


  return (
    <div className="p-4 bg-slate-800 rounded-xl shadow-md">
      <button
        onClick={handleSimulate}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
         Yeni Data Yükle & Simüle Et
      </button>
      {status && <p className="mt-2 text-sm text-slate-300">{status}</p>}
    </div>
  );
};

export default SimulatorButton;
