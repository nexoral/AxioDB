import React, { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Titlebar from "./layout/Titlebar";
import Sidebar from "./layout/Sidebar";
import StatusBar from "./layout/StatusBar";
import Welcome from "./pages/Welcome";
import ConnectionHub from "./pages/ConnectionHub";
import Documents from "./pages/Documents";
import Dashboard from "./pages/Dashboard";
import Import from "./pages/Import";
import UserManagement from "./pages/UserManagement";
import ForcePasswordChangeModal from "./components/auth/ForcePasswordChangeModal";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { useConnectionStore } from "./store/connectionStore";
import { useAuthStore } from "./store/authStore";
import authApi from "./api/authApi";

const MainLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 text-slate-800">
      <Sidebar />
      <main
        key={location.pathname}
        className="flex-1 overflow-hidden bg-slate-50 flex flex-col animate-fadeIn min-w-0"
      >
        {children}
      </main>
    </div>
  );
};

const AppContent = () => {
  const { hasSeenWelcome, setHasSeenWelcome, isConnected, setPingLatency, getBaseUrl, hydrate, _loaded } = useConnectionStore();
  const { mustChangePassword } = useAuthStore();
  const [showForcePassword, setShowForcePassword] = useState(false);

  // Hydrate store from AxioDB on first render
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (mustChangePassword) {
      setShowForcePassword(true);
    }
  }, [mustChangePassword]);

  // Periodic health ping every 10 seconds while connected — keeps the
  // "connected X ms" latency in the titlebar and status bar fresh.
  useEffect(() => {
    if (!isConnected) return;

    const ping = async () => {
      try {
        const res = await authApi.ping(getBaseUrl());
        setPingLatency(res.latency);
      } catch {
        setPingLatency(null);
      }
    };

    ping();
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, [isConnected, getBaseUrl, setPingLatency]);

  // Show nothing while hydrating from AxioDB
  if (!_loaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xs text-slate-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  // First launch: Animated Welcome
  if (!hasSeenWelcome) {
    return (
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden text-slate-900">
        <Titlebar />
        <Welcome onGetStarted={() => setHasSeenWelcome(true)} />
      </div>
    );
  }

  // Offline: Connection Hub
  if (!isConnected) {
    return (
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden text-slate-900">
        <Titlebar />
        <ConnectionHub
          onConnected={() => {}}
          onForcePasswordChange={() => setShowForcePassword(true)}
        />
        <ForcePasswordChangeModal
          isOpen={showForcePassword}
          onSuccess={() => setShowForcePassword(false)}
        />
      </div>
    );
  }

  // Connected: Full Native Desktop Workspace
  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden text-slate-900">
      <Titlebar />

      <ErrorBoundary>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Documents />} />
            <Route path="/metrics" element={<Dashboard />} />
            <Route path="/import" element={<Import />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </ErrorBoundary>

      <StatusBar />

      <ForcePasswordChangeModal
        isOpen={showForcePassword}
        onSuccess={() => setShowForcePassword(false)}
      />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
