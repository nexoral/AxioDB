import { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // eslint-disable-next-line
  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img
                  src="/AXioDB.png"
                  alt="AxioDB Logo"
                  className="h-9 w-9"
                />
                <span className="ml-2 text-white font-bold text-xl tracking-tight">
                  AxioControl
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex space-x-4">
                <Link
                  to="/"
                  className="text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/databases"
                  className="text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Databases
                </Link>
                <Link
                  to="/collections"
                  className="text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Collections
                </Link>
                <Link
                  to="/queries"
                  className="text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Queries
                </Link>
                {/* <Link
                  to="/settings"
                  className="text-blue-100 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Settings
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
