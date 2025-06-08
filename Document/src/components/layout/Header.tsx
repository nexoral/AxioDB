import React, { useState, useEffect } from 'react';
import { Menu, X, Moon, Sun, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white dark:bg-gray-900 shadow-md py-2'
        : 'bg-transparent py-4'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="flex items-center gap-2 text-gray-900 dark:text-white">
              <img src="/AXioDB.png" alt="AxioDB Logo" className="h-8 w-8" />
              <span className="text-xl font-bold">AxioDB</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/features"
              className={`text-sm font-medium ${location.pathname === '/features'
                ? 'text-blue-500'
                : 'text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400'
                }`}
            >
              Features
            </Link>
            <Link
              to="/comparison"
              className={`text-sm font-medium ${location.pathname === '/comparison'
                ? 'text-blue-500'
                : 'text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400'
                }`}
            >
              Comparison
            </Link>
            <Link
              to="/installation"
              className={`text-sm font-medium ${location.pathname === '/installation'
                ? 'text-blue-500'
                : 'text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400'
                }`}
            >
              Installation
            </Link>
            <Link
              to="/usage"
              className={`text-sm font-medium ${location.pathname === '/usage'
                ? 'text-blue-500'
                : 'text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400'
                }`}
            >
              Usage
            </Link>
            <Link
              to="/api-reference"
              className={`text-sm font-medium ${location.pathname === '/api-reference'
                ? 'text-blue-500'
                : 'text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400'
                }`}
            >
              API
            </Link>
            <Link
              to="/maintainers-zone"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              Maintainer's Zone
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className={`relative ${searchOpen ? 'w-64' : 'w-10'} transition-all duration-300`}>
              {searchOpen && (
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full py-2 px-4 pr-10 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              )}
              <button
                className={`p-2 rounded-md text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 ${searchOpen ? 'absolute right-1 top-1/2 transform -translate-y-1/2' : ''}`}
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label={searchOpen ? "Close search" : "Open search"}
              >
                {searchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
            </div>

            <button
              className="p-2 rounded-md text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;