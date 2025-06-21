// filepath: /workspaces/AxioDB/GUI/src/layout/Header.jsx
import { useState } from 'react';
import { FiMenu, FiPlus, FiX } from 'react-icons/fi';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <a href="/" className="flex items-center">
                <svg className="h-8 w-8 text-blue-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6m-3-3v6" />
                </svg>
                <span className="ml-2 text-white font-bold text-xl tracking-tight">AxioControl</span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex space-x-4">
                <a href="/dashboard" className="text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Dashboard</a>
                <a href="/databases" className="text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Databases</a>
                <a href="/queries" className="text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Queries</a>
                <a href="/settings" className="text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Settings</a>
              </div>
            </div>
          </div>

          {/* Right side items - User profile, notifications, etc. */}
          <div className="hidden md:flex items-center">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              New Connection
            </button>
            <div className="ml-4 relative flex-shrink-0">
              <div className="bg-blue-800 rounded-full h-8 w-8 flex items-center justify-center text-white">
                <span className="text-sm font-medium">AX</span>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <FiX className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FiMenu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-blue-800">
            <Link to="/dashboard" className="text-blue-100 hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>
            <Link to="/databases" className="text-blue-100 hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium">Databases</Link>
            <Link to="/queries" className="text-blue-100 hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium">Queries</Link>
            <Link to="/settings" className="text-blue-100 hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium">Settings</Link>
          </div>
          <div className="pt-4 pb-3 border-t border-blue-700">
            <div className="flex items-center px-5">
              <div className="bg-blue-800 rounded-full h-8 w-8 flex items-center justify-center text-white">
                <span className="text-sm font-medium">AX</span>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">Admin User</div>
                <div className="text-sm font-medium text-blue-200">admin@axiodb.com</div>
              </div>
              <button className="ml-auto bg-blue-600 hover:bg-blue-500 p-1 rounded-full text-blue-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span className="sr-only">New Connection</span>
                <FiPlus className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;