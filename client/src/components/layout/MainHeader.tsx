/**
 * MainHeader.tsx
 * 
 * This is the primary header component for the website.
 * 
 * Restored to previous working version with cosmic styling.
 */
import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Navigation items array to reduce repetition
const navigationItems = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/music-release", label: "New Music" },
  { path: "/archived-music", label: "Archived Music" },
  { path: "/cosmic-connectivity", label: "Cosmic Connectivity" },
  { path: "/cosmic-experience", label: "Cosmic Experience" },
  { path: "/tour", label: "Tour" },
  { path: "/shop", label: "Shop" },
  { path: "/engage", label: "Engage" },
  { path: "/newsletter", label: "Newsletter" },
  { path: "/blog", label: "Blog" },
  { path: "/collaboration", label: "Collaborate" },
  { path: "/contact", label: "Contact" }
];

export function MainHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const handleNavigationClick = useCallback((path: string) => {
    // First scroll to top with smooth behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Add a small delay to allow the scroll animation to complete
    setTimeout(() => {
      setIsMenuOpen(false);
      navigate(path);
    }, 300); // 300ms delay to allow for smooth scroll
  }, [navigate]);

  // Common styles
  const navItemStyles = "text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2";
  const mobileNavItemStyles = `${navItemStyles} p-3 block w-full text-left`;
  const searchInputStyles = "px-3 py-2 text-base border border-gray-300 rounded-md bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ebd6]";

  return (
    <header className="bg-[#0a325c] sticky top-0 z-50 border-b border-[#00ebd6] shadow-lg">
      <div className="flex items-center justify-between p-4 container mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-[#00ebd6] hover:text-[#e8e6e3] transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <button 
            onClick={() => handleNavigationClick("/")}
            className="text-[#00ebd6] text-xl sm:text-2xl font-bold no-underline font-montserrat"
          >
            Cosmic Experience
          </button>
        </div>

        <nav className="hidden md:block flex-grow mx-8">
          <ul className="flex flex-wrap gap-4 lg:gap-6 list-none p-0 justify-center">
            {navigationItems.map(({ path, label }) => (
              <li key={path}>
                <Link href={path} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={navItemStyles}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="search-container hidden sm:flex items-center gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${searchInputStyles} w-[200px] lg:w-[300px]`}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
          
          {/* Admin Portal Link - only for admin users */}
          {user?.role === 'admin' || user?.role === 'super_admin' ? (
            <Link href="/admin">
              <div className="text-[#fe0064] hover:text-[#00ebd6] font-semibold ml-4">
                Admin Portal
              </div>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Mobile navigation menu */}
      <nav className={`md:hidden transition-all duration-300 ${isMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
        <ul className="flex flex-col gap-2 p-4 border-t border-[#00ebd6]/20">
          {navigationItems.map(({ path, label }) => (
            <li key={path}>
              <Link href={path} onClick={() => {
                setIsMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className={mobileNavItemStyles}>
                {label}
              </Link>
            </li>
          ))}
          
          {/* Admin Portal Link in mobile menu - only for admin users */}
          {user?.role === 'admin' || user?.role === 'super_admin' ? (
            <li>
              <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                <div className="text-[#fe0064] hover:text-[#00ebd6] font-semibold p-3 block w-full text-left">
                  Admin Portal
                </div>
              </Link>
            </li>
          ) : null}
        </ul>

        {/* Mobile search */}
        <div className="p-4 border-t border-[#00ebd6]/20">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${searchInputStyles} w-full`}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </nav>
    </header>
  );
}