
/**
 * Footer component for the AxioDB GUI
 */
const Footer = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-300 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <img
                src="/AXioDB.png"
                alt="AxioDB Logo"
                className="h-8 w-8 mr-2"
              />
              <span className="font-bold text-white text-lg">AxioDB</span>
            </div>
            <p className="text-sm mt-2">High-performance document database</p>
          </div>

          <div className="text-sm">
            <div className="flex space-x-6">
              <a href="/docs" className="hover:text-white transition-colors">Documentation</a>
              <a href="/support" className="hover:text-white transition-colors">Support</a>
              <a href="/api" className="hover:text-white transition-colors">API</a>
              <a href="/status" className="hover:text-white transition-colors">Status</a>
            </div>
            <p className="mt-4 text-xs text-center md:text-right">
              © {currentYear} AxioDB, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
