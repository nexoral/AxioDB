import { Menu, Search, X, Star, GitFork } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
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

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [githubStats, setGithubStats] = useState<GitHubStats>({ stars: 0, forks: 0 });
  const location = useLocation();
  const navigate = useNavigate();

  // Documentation pages for search - wrapped in useMemo for performance
  const searchablePages: SearchResult[] = useMemo(() => [
    { title: "Introduction", path: "/", description: "Get started with AxioDB - The Embedded Database for Node.js" },
    { title: "Features", path: "/features", description: "Explore production caching features and capabilities" },
    { title: "Limitations & Scale Considerations", path: "/limitations", description: "Understand AxioDB's design scope and when to use something else" },
    { title: "Installation", path: "/installation", description: "Install and set up AxioDB in your project" },
    { title: "AxioDBCloud (Remote/TCP)", path: "/cloud", description: "Connect remotely over TCP, with optional shared-RBAC authentication" },
    { title: "Troubleshooting", path: "/troubleshooting", description: "Common connection and authentication errors, and how to fix them" },
    { title: "Docker Deployment", path: "/docker", description: "Run AxioDB in Docker - simple quick start, then env vars, volumes, and Compose" },
    { title: "Create Database", path: "/create-database", description: "Learn how to create a database in AxioDB" },
    { title: "Create Collection", path: "/create-collection", description: "Create collections in AxioDB" },
    { title: "Basic Usage & Operations", path: "/usage", description: "CRUD operations and basic database usage" },
    { title: "Advanced Features", path: "/advanced-features", description: "Advanced querying, aggregation, and optimization" },
    { title: "API Reference", path: "/api-reference", description: "Complete JavaScript/TypeScript API documentation" },
    { title: "Server API (HTTP)", path: "/server-api", description: "RESTful HTTP API for AxioDB GUI Server, including index routes" },
    { title: "Security & Access Control", path: "/security", description: "RBAC and TCP authentication" },
    { title: "Performance Comparison", path: "/comparison", description: "See how AxioDB compares to other databases" },
    { title: "Community & Contributing", path: "/community", description: "Join the community and contribute to AxioDB" },
    { title: "Maintainer's Zone", path: "/maintainers-zone", description: "Resources and guides for maintainers" },
  ], []);

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="w-full px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center h-9 w-9 shrink-0 rounded-[3px] border border-gray-300 text-gray-700 hover:border-accent-500 hover:text-accent-600 transition-colors"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/AXioDB.png"
                alt="AxioDB Logo"
                className="h-7 w-7 group-hover:opacity-80 transition-opacity"
              />
              <span className="text-lg font-semibold text-gray-900">AxioDB</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`relative ${searchOpen ? "w-[min(70vw,18rem)]" : "w-10"} transition-all duration-300`}
            >
              {searchOpen ? (
                <>
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    className="w-full h-9 py-2 px-3 pr-16 rounded-[3px] border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-accent-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 border border-gray-200 rounded-[3px] px-1.5 py-0.5 pointer-events-none">
                    ⌘ K
                  </span>
                </>
              ) : (
                <button
                  className="h-9 w-9 flex items-center justify-center rounded-[3px] border border-gray-200 text-gray-500 hover:text-accent-600 transition-colors"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                >
                  <Search size={18} />
                </button>
              )}

              {/* Search Results Dropdown */}
              {searchOpen && searchQuery.trim() !== "" && (
                <div className="absolute top-full mt-2 w-[min(90vw,24rem)] right-0 bg-white rounded-[3px] border border-gray-200 max-h-96 overflow-y-auto z-50 shadow-sm">
                  {searchResults.length > 0 ? (
                    <div className="p-2">
                      {searchResults.map((result) => (
                        <button
                          key={result.path}
                          onClick={() => handleSearchResultClick(result.path)}
                          className="w-full text-left px-3 py-2.5 rounded-[3px] hover:bg-gray-50 transition-colors group"
                        >
                          <div className="font-medium text-sm text-gray-900 group-hover:text-accent-600">
                            {result.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                            {result.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <Search size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* GitHub link sits in the icon cluster rather than as two stat pills -
                the star/fork counts moved into the sidebar's community section. */}
            <a
              href="https://github.com/nexoral/AxioDB"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 h-9 px-2.5 rounded-[3px] border border-gray-200 text-gray-500 hover:text-accent-600 transition-colors"
              aria-label={`GitHub — ${githubStats.stars.toLocaleString()} stars, ${githubStats.forks.toLocaleString()} forks`}
            >
              <Star size={16} className="transition-colors" />
              <span className="text-xs font-medium">
                {githubStats.stars.toLocaleString()}
              </span>
              <GitFork size={16} className="transition-colors" />
              <span className="text-xs font-medium">
                {githubStats.forks.toLocaleString()}
              </span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
