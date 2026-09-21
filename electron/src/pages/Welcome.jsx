import React, { useState } from "react";
import { motion } from "framer-motion";
import { useConnectionStore } from "../store/connectionStore";
import axioLogo from "../assets/AXioDB.png";

const HIGHLIGHTS = [
  {
    icon: (
      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Pure JavaScript Speed",
    description: "Embedded NoSQL database with zero native bindings, zero node-gyp, and instant cold starts.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: "MongoDB-Style Queries",
    description: "Intuitive query and aggregation console with live syntax validation and code completions.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "In-Memory Cache & Metrics",
    description: "Real-time cache ceiling monitoring, disk utilization donuts, and hierarchical database tree views.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "ACID Consistency & RBAC",
    description: "Write-ahead logging, transactional safety, and robust role-based permission control.",
  },
];

const Welcome = ({ onGetStarted }) => {
  const { setHasSeenWelcome } = useConnectionStore();
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const handleStart = () => {
    if (dontShowAgain) {
      setHasSeenWelcome(true);
    }
    onGetStarted();
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-6 overflow-hidden select-none font-sans">
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-500/10 blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative max-w-3xl w-full flex flex-col items-center text-center">
        {/* Animated Logo Container */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: -16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-6"
        >
          <div className="h-20 w-20 rounded-2xl p-2 bg-white border border-slate-200 shadow-xl flex items-center justify-center">
            <img src={axioLogo} alt="AxioDB Logo" className="h-16 w-16 object-contain rounded-xl" />
          </div>
        </motion.div>

        {/* Header Titles */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="space-y-2 mb-8"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Desktop Management Suite
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            Welcome to <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">AxioDB Control</span>
          </h1>
          <p className="text-slate-600 max-w-lg text-sm leading-relaxed mx-auto">
            High-performance desktop client for exploring, querying, and managing AxioDB instances with MongoDB Compass-style productivity.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mb-8"
        >
          {HIGHLIGHTS.map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white border border-slate-200 text-left shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 mb-0.5">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Action Controls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col items-center gap-3 w-full max-w-xs"
        >
          <button
            onClick={handleStart}
            className="w-full py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Connect to Instance</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-slate-700">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Don't show welcome screen on launch</span>
          </label>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
