import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { ThemeProvider } from "../../context/ThemeContext";

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("introduction");

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
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <Header
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="flex">
          <Sidebar
            isOpen={isSidebarOpen}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />

          {/* md:ml-64 mirrors Sidebar's md:w-64 - keep both in sync if either changes */}
          <main className="flex-1 pt-16 pb-16 transition-all duration-300 md:ml-64">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Layout;
