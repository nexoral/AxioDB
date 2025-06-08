import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { ThemeProvider } from '../../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("introduction");

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('aside');
      const sidebarButton = document.querySelector('button[aria-label="Open sidebar"]');
      
      if (sidebar && 
          !sidebar.contains(event.target as Node) && 
          sidebarButton && 
          !sidebarButton.contains(event.target as Node) &&
          window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      // Get all section elements
      const sections = document.querySelectorAll('section[id]');
      
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

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
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
          
          <main className="flex-1 pt-16 pb-16 transition-all duration-300 md:ml-64">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Layout;