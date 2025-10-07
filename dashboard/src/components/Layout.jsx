import React from "react";
import Sidebar from "./SideBar";
function Layout({ children }) {
  return (
    <div className="flex h-screen">
 
      <Sidebar />

   
      <div className="flex flex-col flex-1">
   
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>

    
        <footer className="bg-slate-800 text-white py-3 px-6 flex items-center justify-between">
          <span> 5G Energy Optimization Platform</span>
          <span className="text-sm text-slate-400">
            © {new Date().getFullYear()} 
          </span>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
