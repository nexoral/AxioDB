import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useWebMcp } from "../../hooks/useWebMcp";

const SITE_URL = "https://axiodb.in";

const navSchema = {
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  "name": [
    { "@type": "SiteNavigationElement", "name": "Introduction", "url": `${SITE_URL}/` },
    { "@type": "SiteNavigationElement", "name": "Features", "url": `${SITE_URL}/features` },
    { "@type": "SiteNavigationElement", "name": "Installation", "url": `${SITE_URL}/installation` },
    { "@type": "SiteNavigationElement", "name": "Usage", "url": `${SITE_URL}/usage` },
    { "@type": "SiteNavigationElement", "name": "API Reference", "url": `${SITE_URL}/api-reference` },
    { "@type": "SiteNavigationElement", "name": "Server API", "url": `${SITE_URL}/server-api` },
    { "@type": "SiteNavigationElement", "name": "Docker", "url": `${SITE_URL}/docker` },
    { "@type": "SiteNavigationElement", "name": "CLI", "url": `${SITE_URL}/cli` },
    { "@type": "SiteNavigationElement", "name": "Security", "url": `${SITE_URL}/security` },
    { "@type": "SiteNavigationElement", "name": "Comparison", "url": `${SITE_URL}/comparison` },
    { "@type": "SiteNavigationElement", "name": "MCP Server", "url": `${SITE_URL}/mcp-server` },
  ],
};

const Layout: React.FC = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("introduction");

  // Expose the docs as browser-side agent tools where WebMCP is supported.
  useWebMcp();

  // Mark the document as JS-capable so CSS-driven scroll-reveal animations
  // (gated behind `.js-enabled` in global.css) only ever apply once React has
  // actually hydrated - prerendered HTML and no-JS clients stay fully visible.
  useEffect(() => {
    document.documentElement.classList.add("js-enabled");
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector("aside");
      const sidebarButton = document.querySelector(
        'button[aria-label="Open sidebar"]',
      );

      if (
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        sidebarButton &&
        !sidebarButton.contains(event.target as Node) &&
        window.matchMedia("(max-width: 767px)").matches // mirrors Tailwind's `md` breakpoint
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      // Get all section elements
      const sections = document.querySelectorAll("section[id]");

      // Find the current section
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const sectionTop = (section as HTMLElement).offsetTop;

        if (scrollPosition >= sectionTop) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(navSchema) }} />
      <Header
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1">
        {/* The sidebar floats above the content as an overlay rather than
            pushing it sideways, so pages get the full viewport width whether it
            is open or closed. */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onNavigate={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 pt-16 min-w-0">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;
