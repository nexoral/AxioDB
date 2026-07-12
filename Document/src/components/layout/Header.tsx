import { Menu, MoreHorizontal, Search, X, Star, GitFork } from "lucide-react";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

interface GitHubStats {
  stars: number;
  forks: number;
}

interface SearchResult {
  title: string;
  path: string;
  description: string;
}

interface TopNavLink {
  label: string;
  path: string;
}

const TOP_NAV_LINKS: TopNavLink[] = [
  { label: "Features", path: "/features" },
  { label: "Comparison", path: "/comparison" },
  { label: "Installation", path: "/installation" },
  { label: "Usage", path: "/usage" },
  { label: "API", path: "/api-reference" },
  { label: "Maintainer's Zone", path: "/maintainers-zone" },
];

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [githubStats, setGithubStats] = useState<GitHubStats>({ stars: 0, forks: 0 });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Documentation pages for search - wrapped in useMemo for performance
  const searchablePages: SearchResult[] = useMemo(() => [
    { title: "Introduction", path: "/", description: "Get started with AxioDB - The Pure JavaScript Alternative to SQLite" },
    { title: "Features", path: "/features", description: "Explore production caching features and capabilities" },
    { title: "Limitations & Scale Considerations", path: "/limitations", description: "Understand AxioDB's design scope and when to use something else" },
    { title: "Installation", path: "/installation", description: "Install and set up AxioDB in your project" },
    { title: "AxioDBCloud (Remote/TCP)", path: "/cloud", description: "Connect remotely over TCP, with optional shared-RBAC authentication" },
    { title: "Troubleshooting", path: "/troubleshooting", description: "Common connection and authentication errors, and how to fix them" },
    { title: "Docker Deployment", path: "/docker", description: "Run AxioDB in Docker - simple quick start, then env vars, volumes, and Compose" },
    { title: "Create Database", path: "/create-database", description: "Learn how to create a database in AxioDB" },
    { title: "Create Collection", path: "/create-collection", description: "Create collections with optional encryption and schema" },
    { title: "Basic Usage & Operations", path: "/usage", description: "CRUD operations and basic database usage" },
    { title: "Advanced Features", path: "/advanced-features", description: "Advanced querying, aggregation, and optimization" },
    { title: "API Reference", path: "/api-reference", description: "Complete JavaScript/TypeScript API documentation" },
    { title: "Server API (HTTP)", path: "/server-api", description: "RESTful HTTP API for AxioDB GUI Server, including index routes" },
    { title: "Security & Access Control", path: "/security", description: "AES-256 encryption, RBAC, and TCP authentication" },
    { title: "Performance Comparison", path: "/comparison", description: "See how AxioDB compares to other databases" },
    { title: "Community & Contributing", path: "/community", description: "Join the community and contribute to AxioDB" },
    { title: "Maintainer's Zone", path: "/maintainers-zone", description: "Resources and guides for maintainers" },
  ], []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch GitHub stats
  useEffect(() => {
    const fetchGitHubStats = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/nexoral/AxioDB');
        if (response.ok) {
          const data = await response.json();
          setGithubStats({
            stars: data.stargazers_count || 0,
            forks: data.forks_count || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch GitHub stats:', error);
      }
    };

    fetchGitHubStats();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = searchablePages.filter(
      (page) =>
        page.title.toLowerCase().includes(query) ||
        page.description.toLowerCase().includes(query)
    );
    setSearchResults(results.slice(0, 5)); // Limit to 5 results
  }, [searchQuery, searchablePages]);

  const handleSearchResultClick = (path: string) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Close search on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  // Close the mobile top-nav panel on outside click, escape, or route change.
  useEffect(() => {
    if (!isMobileNavOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
        setIsMobileNavOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileNavOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileNavOpen]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-gray-900 shadow-md py-2"
        : "bg-transparent py-4"
        }`}
    >
      <div className="w-full px-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-blue-400"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Separate trigger for the top-level nav links (Features/Comparison/etc.) -
                distinct from the docs Sidebar toggle above, since they're different
                navigation concerns. */}
            <div className="relative md:hidden" ref={mobileNavRef}>
              <button
                className="p-2 rounded-md text-gray-400 hover:text-blue-400"
                onClick={() => setIsMobileNavOpen((open) => !open)}
                aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileNavOpen}
              >
                {isMobileNavOpen ? <X size={22} /> : <MoreHorizontal size={22} />}
              </button>

              {isMobileNavOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 max-w-[80vw] bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                  {TOP_NAV_LINKS.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileNavOpen(false)}
                      className={`block px-4 py-2 text-sm font-medium ${location.pathname === link.path
                        ? "text-blue-500"
                        : "text-gray-300 hover:text-blue-400"
                        }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/"
              className="flex items-center gap-2 text-white group"
            >
              <img src="/AXioDB.png" alt="AxioDB Logo" className="h-8 w-8 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="text-xl font-bold">AxioDB Docs</span>
                <span className="text-xs text-gray-400 hidden md:block">
                  Built for developers ⚡
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {TOP_NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${location.pathname === link.path
                  ? "text-blue-500"
                  : "text-gray-300 hover:text-blue-400"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* GitHub Stats Badges */}
            <a
              href="https://github.com/nexoral/AxioDB"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors group"
              aria-label="GitHub Stars"
            >
              <Star size={16} className="text-yellow-500 group-hover:fill-yellow-500 transition-all" />
              <span className="text-sm font-semibold text-gray-300">
                {githubStats.stars.toLocaleString()}
              </span>
            </a>

            <a
              href="https://github.com/nexoral/AxioDB/fork"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors group"
              aria-label="GitHub Forks"
            >
              <GitFork size={16} className="text-blue-500 transition-all" />
              <span className="text-sm font-semibold text-gray-300">
                {githubStats.forks.toLocaleString()}
              </span>
            </a>

            <div
              className={`relative ${searchOpen ? "w-[min(70vw,16rem)]" : "w-10"} transition-all duration-300`}
            >
              {searchOpen && (
                <>
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    className="w-full py-2 px-4 pr-10 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />

                  {/* Search Results Dropdown */}
                  {searchQuery.trim() !== "" && (
                    <div className="absolute top-full mt-2 w-[min(90vw,24rem)] right-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-h-96 overflow-y-auto z-50">
                      {searchResults.length > 0 ? (
                        <div className="p-2">
                          {searchResults.map((result) => (
                            <button
                              key={result.path}
                              onClick={() => handleSearchResultClick(result.path)}
                              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-700 transition-colors group"
                            >
                              <div className="font-medium text-gray-100 group-hover:text-blue-400">
                                {result.title}
                              </div>
                              <div className="text-sm text-gray-400 line-clamp-2 mt-0.5">
                                {result.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-400">
                          <Search size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No results found for "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              <button
                className={`p-2 rounded-md text-gray-400 hover:text-blue-400 ${searchOpen ? "absolute right-1 top-1/2 transform -translate-y-1/2" : ""}`}
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label={searchOpen ? "Close search" : "Open search"}
              >
                {searchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
