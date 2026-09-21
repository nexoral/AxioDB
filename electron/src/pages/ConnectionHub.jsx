import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConnectionStore } from "../store/connectionStore";
import { useAuthStore } from "../store/authStore";
import authApi from "../api/authApi";
import axioLogo from "../assets/AXioDB.png";

const ConnectionHub = ({ onConnected, onForcePasswordChange }) => {
  const {
    protocol,
    host,
    port,
    username,
    password,
    name,
    savedConnections,
    setConnectionParams,
    saveConnection,
    deleteSavedConnection,
    setIsConnected,
    setPingLatency,
  } = useConnectionStore();

  const { setSession } = useAuthStore();

  const [formData, setFormData] = useState({
    protocol: protocol || "http",
    host: host || "localhost",
    port: port || 27018,
    username: username || "admin",
    password: password || "",
    name: name || "Local Instance",
    saveToFavorites: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingStep, setConnectingStep] = useState("");
  const [connectionError, setConnectionError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setConnectionError("");
    setTestResult(null);
  };

  const handleSelectSaved = (conn) => {
    setFormData({
      protocol: conn.protocol || "http",
      host: conn.host || "localhost",
      port: conn.port || 27018,
      username: conn.username || "admin",
      password: conn.password || "",
      name: conn.name || "Saved Connection",
      saveToFavorites: true,
    });
    setConnectionError("");
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setConnectionError("");

    setConnectionParams({
      protocol: formData.protocol,
      host: formData.host,
      port: Number(formData.port),
      username: formData.username,
      name: formData.name,
    });

    try {
      const res = await authApi.ping();
      setTestResult({
        success: true,
        message: `Connected successfully (${res.latency}ms)`,
        latency: res.latency,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || "Failed to reach server at specified host:port",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setConnectionError("");
    setIsConnecting(true);

    setConnectionParams({
      protocol: formData.protocol,
      host: formData.host,
      port: Number(formData.port),
      username: formData.username,
      password: formData.password,
      name: formData.name,
    });

    try {
      setConnectingStep("Pinging AxioDB server...");
      const pingRes = await authApi.ping();
      setPingLatency(pingRes.latency);

      setConnectingStep("Authenticating credentials...");
      const loginRes = await authApi.login({
        username: formData.username,
        password: formData.password,
      });

      if (formData.saveToFavorites) {
        saveConnection({
          name: formData.name,
          protocol: formData.protocol,
          host: formData.host,
          port: Number(formData.port),
          username: formData.username,
        });
      }

      setConnectingStep("Syncing session...");
      setSession({
        username: formData.username,
        role: loginRes.role || "super_admin",
        permissions: loginRes.permissions || [],
        mustChangePassword: loginRes.mustChangePassword || false,
      });

      if (loginRes.mustChangePassword) {
        setIsConnecting(false);
        setIsConnected(true);
        if (onForcePasswordChange) onForcePasswordChange();
        return;
      }

      setIsConnecting(false);
      setIsConnected(true);
      if (onConnected) onConnected();
    } catch (err) {
      console.error("Connection error:", err);
      setIsConnecting(false);
      const serverMsg = err.response?.data?.message;
      if (err.response?.status === 401) {
        setConnectionError(serverMsg || "Invalid username or password. Please verify your credentials.");
      } else if (err.response?.status === 403) {
        setConnectionError(serverMsg || "Access denied (403). Account lacks connection permissions.");
      } else {
        setConnectionError(
          serverMsg ||
          err.message ||
          "Could not connect to AxioDB. Ensure the HTTP server is running on the specified port."
        );
      }
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 font-sans select-none">
      {/* Left Sidebar: Saved Connections */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saved Connections
            </h2>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {savedConnections.length}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {savedConnections.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-xs text-slate-600 font-medium">No saved connections yet</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Connections you save will appear here for 1-click access.
              </p>
            </div>
          ) : (
            savedConnections.map((conn) => (
              <div
                key={conn.id}
                onClick={() => handleSelectSaved(conn)}
                className="group relative p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500/80 hover:bg-white transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                      {conn.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                      {conn.protocol}://{conn.host}:{conn.port}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">User: {conn.username}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedConnection(conn.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Delete saved connection"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Connection Form Panel */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center p-8 bg-slate-50">
        <div className="max-w-xl w-full">
          {/* Card Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center p-2 shadow-xs">
                <img src={axioLogo} alt="AxioDB Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Connect to AxioDB</h1>
                <p className="text-xs text-slate-500 mt-0.5">Connect via HTTP to manage your databases and collections</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 shadow-2xs">
              Default Port: 27018
            </span>
          </div>

          {/* Form Box */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-md relative overflow-hidden">
            {/* Animated Connecting Overlay */}
            <AnimatePresence>
              {isConnecting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-xs"
                >
                  <div className="relative mb-6">
                    <div className="h-24 w-24 rounded-full border border-emerald-500/20 animate-ping absolute inset-0" />
                    <div className="h-24 w-24 rounded-full border border-emerald-500/40 animate-pulseGlow" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img src={axioLogo} alt="AxioDB" className="h-10 w-10 rounded-xl animate-bounce" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Connecting to AxioDB</h3>
                  <p className="text-xs font-mono text-emerald-700 mt-2 text-center animate-pulse font-medium">
                    {connectingStep || "Establishing handshake..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleConnect} className="space-y-4">
              {/* Nickname & Protocol */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Connection Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Local Dev Cluster"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Protocol</label>
                  <select
                    name="protocol"
                    value={formData.protocol}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/25 cursor-pointer"
                  >
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                  </select>
                </div>
              </div>

              {/* Host & Port */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Host / IP / Domain</label>
                  <input
                    type="text"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    placeholder="localhost or 192.168.1.100"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Port</label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    placeholder="27018"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/25"
                  />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="admin"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full px-3 py-2 pr-8 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Save to Favorites checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    name="saveToFavorites"
                    checked={formData.saveToFavorites}
                    onChange={handleChange}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Save this connection for future sessions</span>
                </label>
              </div>

              {/* Test Result Banner */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 border ${
                    testResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${testResult.success ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="truncate">{testResult.message}</span>
                </div>
              )}

              {/* Error Message */}
              {connectionError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
                  {connectionError}
                </div>
              )}

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || isConnecting}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-[0.98] border border-slate-200 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isTesting ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isConnecting}
                  className="flex-1 py-2.5 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Connect</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConnectionHub;
