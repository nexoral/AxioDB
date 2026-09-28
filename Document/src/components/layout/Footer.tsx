import React from "react";
import { Link } from "react-router-dom";
import { Github, Star, GitFork } from "lucide-react";

const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: "Introduction", href: "/" },
  { label: "Installation", href: "/installation" },
  { label: "Usage", href: "/usage" },
  { label: "API Reference", href: "/api-reference" },
  { label: "Server API", href: "/server-api" },
  { label: "AxioDBCloud", href: "/cloud" },
  { label: "CLI", href: "/cli" },
  { label: "Docker", href: "/docker" },
  { label: "Security", href: "/security" },
  { label: "Changelog", href: "/changelog" },
];

const Footer: React.FC = () => (
  <footer className="bg-gray-50 border-t border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-accent-600 text-white text-xs font-semibold">
            v22.17.1
          </span>
          <span className="text-sm text-gray-500">Latest</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/nexoral/AxioDB"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-accent-600 transition-colors"
            aria-label="GitHub"
          >
            <Github size={20} />
          </a>
          <a
            href="https://github.com/nexoral/AxioDB"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-accent-600 transition-colors"
            aria-label="Star on GitHub"
          >
            <Star size={20} />
          </a>
          <a
            href="https://github.com/nexoral/AxioDB/network/members"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-accent-600 transition-colors"
            aria-label="Fork on GitHub"
          >
            <GitFork size={20} />
          </a>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed text-center max-w-4xl mx-auto mb-6">
        AxioDB is open source, released under the MIT License, and maintained by
        Ankan Saha. Contributions are welcome — see the contributing guide for
        how to get started.
      </p>

      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="text-xs text-gray-500 hover:text-accent-600 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  </footer>
);

export default Footer;
