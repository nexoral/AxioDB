import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarSection {
  title: string;
  items: { id: string; label: string; path: string }[];
}

interface SidebarProps {
  isOpen: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction", path: "/" },
      { id: "features", label: "Features", path: "/features" },
      { id: "pain-points", label: "Pain Points", path: "/#pain-points" },
      { id: "comparison", label: "Performance Comparison", path: "/comparison" },
      { id: "limitations", label: "Current Limitations", path: "/features#limitations" },
      { id: "future-plans", label: "Future Plans", path: "/features#future-plans" },
    ]
  },
  {
    title: "Installation & Setup",
    items: [
      { id: "installation", label: "Installation", path: "/installation" },
      { id: "create-database", label: "Create Database", path: "/create-database" },
      { id: "create-collection", label: "Create Collection", path: "/create-collection" },
    ]
  },
  {
    title: "Basic Usage",
    items: [
      { id: "operations", label: "Operations", path: "/usage" },
    ]
  },
  {
    title: "Advanced Topics",
    items: [
      { id: "advanced-features", label: "Advanced Features", path: "/advanced-features" },
      { id: "api-reference", label: "API Reference", path: "/api-reference" },
      { id: "security", label: "Security", path: "/security" },
    ]
  },
  {
    title: "Community",
    items: [
      { id: "contributing", label: "Contributing", path: "/community#contributing" },
      { id: "acknowledgments", label: "Acknowledgments", path: "/community#acknowledgments" },
    ]
  },
  {
    title: "Maintainer's Zone",
    items: [
      { id: "maintainers-zone", label: "Maintainer's Zone", path: "/maintainers-zone" },
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setActiveSection }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    sidebarSections.map(section => section.title)
  );
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleNavClick = (path: string, id: string) => {
    setActiveSection(id);
    navigate(path);

    if (path.includes('#')) {
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 shadow-lg transition-all duration-300 overflow-y-auto z-40 ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-64'
        }`}
    >
      <nav className="p-4">
        <div className="mb-6">
          <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Documentation</div>
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4"></div>
        </div>

        {sidebarSections.map((section) => (
          <div key={section.title} className="mb-4">
            <button
              className="flex items-center justify-between w-full text-left text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 font-medium"
              onClick={() => toggleSection(section.title)}
            >
              <span>{section.title}</span>
              {expandedSections.includes(section.title) ?
                <ChevronDown size={18} /> :
                <ChevronRight size={18} />
              }
            </button>

            {expandedSections.includes(section.title) && (
              <ul className="mt-2 space-y-1 pl-4">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      className={`block py-1 text-sm ${location.pathname === item.path || (location.hash && item.path.includes(location.hash))
                        ? 'text-blue-500 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
                        }`}
                      onClick={() => handleNavClick(item.path, item.id)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;