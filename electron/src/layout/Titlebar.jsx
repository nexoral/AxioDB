import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useConnectionStore } from "../store/connectionStore";
import { useAuthStore } from "../store/authStore";
import axioLogo from "../assets/AXioDB.png";

const Titlebar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { isConnected, host, port, pingLatency, disconnect } = useConnectionStore();
  const isPingAlive = pingLatency !== null;
  const { clearSession } = useAuthStore();

  useEffect(() => {
    if (window.electronAPI?.isMaximized) {
      window.electronAPI.isMaximized().then(setIsMaximized);
    }
    if (window.electronAPI?.onMaximizeChange) {
      return window.electronAPI.onMaximizeChange(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  const handleDisconnect = () => {
    clearSession();
    disconnect();
  };

  return (
    <header className="drag-region h-10 w-full bg-white border-b border-slate-200 flex items-center justify-between px-3 select-none z-50 shrink-0 shadow-2xs">
      {/* Brand & Connection Status */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img src={axioLogo} alt="AxioDB" className="h-5 w-5 rounded-md no-drag shadow-2xs" />
        <span className="text-xs font-bold tracking-tight text-slate-800">
          AxioDB <span className="text-emerald-600 font-semibold">Control</span>
        </span>

        {isConnected ? (
          <div className="ml-3 flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 rounded-full px-2.5 py-0.5 no-drag">
            <span
              className={`relative flex h-2 w-2 rounded-full bg-emerald-500 ${isPingAlive ? "animate-pulseDot" : ""}`}
            >
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-40 animate-ping"></span>
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-700">
              {host}:{port}
            </span>
            {pingLatency !== null && (
              <motion.span
                key={pingLatency}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded"
              >
                {pingLatency}ms
              </motion.span>
            )}
          </div>
        ) : (
          <span className="ml-2 text-[10px] uppercase font-mono tracking-wider text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
            Disconnected
          </span>
        )}
      </div>

      {/* Center Drag Area */}
      <div className="flex-1 h-full" />

      {/* Right Controls */}
      <div className="no-drag flex items-center gap-1">
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="mr-2 text-[11px] font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
            title="Disconnect from server"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Disconnect
          </button>
        )}

        {/* Window controls */}
        <button
          onClick={handleMinimize}
          className="h-7 w-8 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Minimize"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <button
          onClick={handleMaximize}
          className="h-7 w-8 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="5" y="5" width="14" height="14" rx="2" strokeWidth={2} />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
            </svg>
          )}
        </button>

        <button
          onClick={handleClose}
          className="h-7 w-8 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-red-600 transition-colors"
          title="Close"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Titlebar;
