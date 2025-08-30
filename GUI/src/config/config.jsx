import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Footer from "../layout/Footer";
import Header from "../layout/Header";
import Dashboard from "../pages/Dashboard";
import Databases from "../pages/Databases";
import Collections from "../pages/Collections";
import { useEffect, useState } from "react";

import Documents from "../pages/Documents";
import { ExchangeKeyStore } from "../store/store";
import ApiReference from "../pages/ApiReference";
import Support from "../pages/Support";
import Status from "../pages/Status";

/**
 * Main application configuration component
 * Sets up routing and overall layout structure
 */
function MainConfig() {
  const { loadKey } = ExchangeKeyStore((state) => state);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadKey();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/operations" element={<Databases />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/api" element={<ApiReference />} />
            <Route path="/support" element={<Support />} />
            <Route path="/status" element={<Status />} />
            <Route path="/collections/documents" element={<Documents />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default MainConfig;
