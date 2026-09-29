import React from "react";
import { Link } from "react-router-dom";
import { Github, Star, GitFork, Package, ExternalLink, Heart } from "lucide-react";

interface FooterSection {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Get Started",
    links: [
      { label: "Introduction", href: "/" },
      { label: "Installation", href: "/installation" },
      { label: "Usage", href: "/usage" },
      { label: "Advanced Features", href: "/advanced-features" },
    ],
  },
  {
    title: "API & Data",
    links: [
      { label: "API Reference", href: "/api-reference" },
      { label: "Server API (HTTP)", href: "/server-api" },
      { label: "Create Database", href: "/create-database" },
      { label: "Create Collection", href: "/create-collection" },
    ],
  },
  {
    title: "Surfaces",
    links: [
      { label: "AxioDBCloud (TCP)", href: "/cloud" },
      { label: "CLI", href: "/cli" },
      { label: "Docker", href: "/docker" },
      { label: "MCP Server", href: "/mcp-server" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Security & RBAC", href: "/security" },
      { label: "Troubleshooting", href: "/troubleshooting" },
      { label: "Comparison", href: "/comparison" },
      { label: "Changelog", href: "/changelog" },
      { label: "RSS Feed", href: "/feed.xml", external: true },
    ],
  },
];

const Footer: React.FC = () => (
  <footer className="bg-gray-50 border-t border-gray-200">
    <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-8 mb-10">
        {/* Brand column */}
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-3 group">
            <img
              src="/AXioDB.png"
              alt="AxioDB"
              className="h-7 w-7 group-hover:opacity-80 transition-opacity"
            />
            <span className="text-lg font-semibold text-gray-900">AxioDB</span>
          </Link>
          <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-xs">
            The embedded NoSQL database for Node.js. MongoDB-style queries, ACID
            transactions, zero native dependencies.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-accent-600 text-white text-xs font-semibold">
              v22.20.0
            </span>
            <a
              href="https://www.npmjs.com/package/axiodb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-accent-600 transition-colors"
            >
              <Package size={14} />
              npm
              <ExternalLink size={10} />
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/nexoral/AxioDB"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-gray-500 hover:text-accent-600 transition-colors"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a
              href="https://github.com/nexoral/AxioDB/stargazers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-500 hover:text-accent-600 transition-colors"
              aria-label="Stars"
            >
              <Star size={16} />
            </a>
            <a
              href="https://github.com/nexoral/AxioDB/network/members"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-500 hover:text-accent-600 transition-colors"
              aria-label="Forks"
            >
              <GitFork size={16} />
            </a>
          </div>
        </div>

        {/* Link columns */}
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-accent-600 transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm text-gray-500 hover:text-accent-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          Released under the{" "}
          <a
            href="https://github.com/nexoral/AxioDB/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-accent-600 transition-colors"
          >
            MIT License
          </a>
          . Maintained by Ankan Saha.
        </p>
        <p className="flex items-center gap-1 text-xs text-gray-400">
          Built with <Heart size={12} className="text-accent-500" /> for the Node.js community
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
