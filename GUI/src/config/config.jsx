import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Footer from "../layout/Footer";
import Header from "../layout/Header";
import Dashboard from "../pages/Dashboard";

/**
 * Main application configuration component
 * Sets up routing and overall layout structure
 */
function MainConfig() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default MainConfig;
