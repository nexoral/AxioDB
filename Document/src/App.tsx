import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Introduction from './components/content/Introduction';
import Features from './components/content/Features';
import Installation from './components/content/Installation';
import Usage from './components/content/Usage';
import AdvancedFeatures from './components/content/AdvancedFeatures';
import ApiReference from './components/content/ApiReference';
import Security from './components/content/Security';
import Community from './components/content/Community';
import Comparison from './components/content/Comparison';
import CreateDatabase from './components/content/CreateDatabase';
import CreateCollection from './components/content/CreateCollection';
import MaintainersZone from './components/content/MaintainersZone';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Introduction />} />
          <Route path="/features" element={<Features />} />
          <Route path="/installation" element={<Installation />} />
          <Route path="/usage" element={<Usage />} />
          <Route path="/advanced-features" element={<AdvancedFeatures />} />
          <Route path="/api-reference" element={<ApiReference />} />
          <Route path="/security" element={<Security />} />
          <Route path="/community" element={<Community />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/create-database" element={<CreateDatabase />} />
          <Route path="/create-collection" element={<CreateCollection />} />
          <Route path="/maintainers-zone" element={<MaintainersZone />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;