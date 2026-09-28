import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SidebarSection {
  title: string;
  items: { id: string; label: string; path: string }[];
}

interface SidebarProps {
  isOpen: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  /** Called after a link is followed, so the overlay closes behind the user. */
  onNavigate: () => void;
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Get Started",
    items: [
      { id: "introduction", label: "Introduction", path: "/" },
      { id: "features", label: "Features", path: "/features" },
      { id: "installation", label: "Installation", path: "/installation" },
      { id: "operations", label: "Quick Start & Usage", path: "/usage" },
      {
        id: "limitations",
        label: "Current Limitations",
        path: "/limitations",
      },
    ],
  },
  {
    title: "Working with Data",
    items: [
      {
        id: "create-database",
        label: "Create Database",
        path: "/create-database",
      },
      {
        id: "create-collection",
        label: "Create Collection",
        path: "/create-collection",
      },
      {
        id: "advanced-features",
        label: "Advanced Features",
        path: "/advanced-features",
      },
    ],
  },
  {
    title: "AxioDBCloud (Remote/TCP)",
    items: [
      {
        id: "axiodb-cloud",
        label: "Connecting to AxioDBCloud",
        path: "/cloud",
      },
    ],
  },
  {
    title: "CLI (Command Line)",
    items: [
      {
        id: "cli",
        label: "AxioDB CLI",
        path: "/cli",
      },
    ],
  },
  {
    title: "Desktop GUI",
    items: [
      {
        id: "gui",
        label: "AxioDB Control GUI",
        path: "/gui",
      },
    ],
  },
  {
    title: "Troubleshooting",
    items: [
      {
        id: "troubleshooting",
        label: "Troubleshooting",
        path: "/troubleshooting",
      },
    ],
  },
  {
    title: "Docker Deployment",
    items: [{ id: "docker", label: "Docker Deployment", path: "/docker" }],
  },
  {
    title: "AI Agent Integration",
    items: [{ id: "mcp-server", label: "MCP Server", path: "/mcp-server" }],
  },
  {
    title: "API Reference",
    items: [
      { id: "api-reference", label: "SDK API Reference", path: "/api-reference" },
      { id: "server-api", label: "Server API (HTTP)", path: "/server-api" },
    ],
  },
  {
    title: "Security & Access Control",
    items: [{ id: "security", label: "Security & RBAC", path: "/security" }],
  },
  {
    title: "Comparisons",
    items: [
      {
        id: "comparison",
        label: "Performance Comparison",
        path: "/comparison",
      },
      {
        id: "performance",
        label: "Performance Benchmarks",
        path: "/performance",
      },
    ],
  },
  {
    title: "Community",
    items: [
      {
        id: "contributing",
        label: "Contributing",
        path: "/community#contributing",
      },
      {
        id: "acknowledgments",
        label: "Acknowledgments",
        path: "/community#acknowledgments",
      },
    ],
  },
  {
    title: "Changelog",
    items: [
      { id: "changelog", label: "Changelog", path: "/changelog" },
    ],
  },
  {
    title: "Maintainer's Zone",
    items: [
      {
        id: "maintainers-zone",
        label: "Maintainer's Zone",
        path: "/maintainers-zone",
      },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setActiveSection, onNavigate }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    sidebarSections.map((section) => section.title),
  );
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const handleNavClick = (path: string, id: string) => {
    setActiveSection(id);
    navigate(path);
    onNavigate();

    if (path.includes("#")) {
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gray-50 border-r border-gray-200 shadow-sm transition-transform duration-300 overflow-y-auto z-40 scrollbar-hide w-64 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <nav className="p-4">
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Documentation
          </div>
          <div className="border-b border-gray-200 mb-4"></div>
        </div>

        {sidebarSections.map((section) => (
          <div key={section.title} className="mb-3">
            <button
              className="flex items-center justify-between w-full text-left text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => toggleSection(section.title)}
            >
              <span>{section.title}</span>
              {expandedSections.includes(section.title) ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>

            {expandedSections.includes(section.title) && (
              <ul className="mt-1.5 space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      className={`block py-1 pl-3 border-l-2 text-sm transition-colors ${
                        location.pathname === item.path ||
                        (location.hash && item.path.includes(location.hash))
                          ? "border-accent-500 text-accent-700 font-medium"
                          : "border-transparent text-gray-600 hover:text-accent-600"
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
