/**
 * MainHeader.tsx
 * 
 * This is the primary header component for the website.
 * It's a simplified version of the footer with an improved, 
 * streamlined navigation interface.
 * 
 * Created: 2025-04-05
 */

import { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, ChevronDown, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion } from "framer-motion";

// Define the navigation items structure
interface NavItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

// Main navigation items based on the footer structure
const mainNavItems: NavItem[] = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Music", path: "/music-release" },
  { name: "Tour", path: "/tour" },
  { name: "Cosmic", path: "/cosmic-experience" },
  { name: "Blog", path: "/blog" },
  { name: "Shop", path: "/shop" },
];

// Dropdown menus for each main section
const musicDropdown: NavItem[] = [
  { name: "New Releases", path: "/music-release" },
  { name: "Archived Music", path: "/archived-music" },
  { name: "Cosmic Connectivity", path: "/cosmic-connectivity" },
];

const cosmicDropdown: NavItem[] = [
  { name: "Cosmic Experience", path: "/cosmic-experience" },
  { name: "Cosmic Immersive", path: "/cosmic-immersive" },
  { name: "Sacred Geometry", path: "/resources/sacred-geometry" },
];

const communityDropdown: NavItem[] = [
  { name: "Newsletter", path: "/newsletter" },
  { name: "Community", path: "/community" },
  { name: "Collaboration", path: "/collaboration" },
  { name: "Contact", path: "/contact" },
];

export function MainHeader() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { autoHideNav } = useAccessibility();
  const { user } = useAuth();

  // Handle scroll event for auto-hiding navigation
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 10);
      
      // Auto-hide navigation when scrolling down and show when scrolling up
      if (autoHideNav && scrollY > 100) {
        const header = document.querySelector('header');
        if (header) {
          if (scrollY > lastScrollY) {
            // Scrolling down - add class to hide
            header.classList.add('scrolled-down');
          } else {
            // Scrolling up - remove class to show
            header.classList.remove('scrolled-down');
          }
        }
      }
      lastScrollY = scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [autoHideNav]);

  // Handle dropdown toggle
  const toggleDropdown = useCallback((dropdown: string) => {
    setActiveDropdown(prev => prev === dropdown ? null : dropdown);
  }, []);

  // Handle navigation click
  const handleNavigationClick = useCallback((path: string) => {
    // First scroll to top with smooth behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Add a small delay to allow the scroll animation to complete
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setActiveDropdown(null);
      navigate(path);
    }, 300); // 300ms delay to allow for smooth scroll
  }, [navigate]);

  // Handle search submit
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  }, [searchQuery, navigate]);

  return (
    <header 
      className={`
        bg-gradient-to-r from-[#050f28] to-[#0a1f3c] 
        sticky top-0 z-50 border-b border-[#00ebd6]/30 
        transition-all duration-300 
        ${isScrolled ? 'py-2 shadow-lg' : 'py-4'}
        ${autoHideNav ? 'transition-transform duration-300' : ''}
      `}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Dale Loves Whales - Return to home page"
            >
              <div className="relative h-10 w-10">
                {/* Animated logo with cyan-purple gradient */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">DW</span>
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300">
                Dale Loves Whales
              </span>
            </Link>
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="ml-4 md:hidden text-[#e8e6e3] hover:text-[#00ebd6] transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {mainNavItems.map((item) => {
              const hasDropdown = 
                (item.name === "Music" && musicDropdown.length > 0) ||
                (item.name === "Cosmic" && cosmicDropdown.length > 0) ||
                (item.name === "Blog" && communityDropdown.length > 0);
              
              return (
                <div key={item.name} className="relative group">
                  {hasDropdown ? (
                    <button
                      className="flex items-center px-3 py-2 text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide"
                      onClick={() => toggleDropdown(item.name)}
                      aria-expanded={activeDropdown === item.name}
                      aria-haspopup="true"
                    >
                      {item.name}
                      <ChevronDown
                        className={`ml-1 h-4 w-4 transition-transform ${
                          activeDropdown === item.name ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={() => handleNavigationClick(item.path)}
                      className="px-3 py-2 text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide"
                    >
                      {item.name}
                    </Link>
                  )}

                  {/* Dropdown menus */}
                  {hasDropdown && activeDropdown === item.name && (
                    <div className="absolute left-0 mt-2 w-48 origin-top-left bg-[#0a1f3c]/95 backdrop-blur-sm border border-[#00ebd6]/20 rounded-md shadow-lg z-50">
                      <div className="py-2" role="menu" aria-orientation="vertical">
                        {item.name === "Music" && musicDropdown.map((subItem) => (
                          <Link
                            key={subItem.path}
                            href={subItem.path}
                            onClick={() => handleNavigationClick(subItem.path)}
                            className="block px-4 py-2 text-sm text-[#e8e6e3] hover:bg-[#00ebd6]/10 hover:text-[#00ebd6]"
                            role="menuitem"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                        {item.name === "Cosmic" && cosmicDropdown.map((subItem) => (
                          <Link
                            key={subItem.path}
                            href={subItem.path}
                            onClick={() => handleNavigationClick(subItem.path)}
                            className="block px-4 py-2 text-sm text-[#e8e6e3] hover:bg-[#00ebd6]/10 hover:text-[#00ebd6]"
                            role="menuitem"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                        {item.name === "Blog" && communityDropdown.map((subItem) => (
                          <Link
                            key={subItem.path}
                            href={subItem.path}
                            onClick={() => handleNavigationClick(subItem.path)}
                            className="block px-4 py-2 text-sm text-[#e8e6e3] hover:bg-[#00ebd6]/10 hover:text-[#00ebd6]"
                            role="menuitem"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Admin link if user is admin */}
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <Link 
                href="/admin" 
                onClick={() => handleNavigationClick("/admin")}
                className="px-3 py-2 text-[#fe0064] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Search & User */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[140px] lg:w-[200px] px-3 py-2 bg-black/30 text-white placeholder:text-gray-400 border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </form>

            {user ? (
              <motion.div 
                className="relative group"
                whileHover={{ scale: 1.05 }}
              >
                <Link 
                  href="/profile" 
                  className="flex items-center justify-center h-9 w-9 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full hover:opacity-90 transition-opacity"
                  aria-label="User profile"
                >
                  <User className="h-5 w-5 text-white" />
                </Link>
              </motion.div>
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-medium hover:from-cyan-600 hover:to-purple-700 transition-colors"
              >
                Log In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`
            fixed inset-0 top-[70px] bg-[#0a1f3c]/95 backdrop-blur-md z-40 transform transition-transform ease-in-out duration-300
            ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="h-full overflow-y-auto pt-4 pb-20">
            <nav className="px-4 space-y-6">
              {/* Mobile Primary Links */}
              <div className="border-b border-[#00ebd6]/20 pb-6">
                <h3 className="text-xs font-semibold text-[#00ebd6] uppercase tracking-wider mb-4">
                  Navigation
                </h3>
                <ul className="space-y-4">
                  {mainNavItems.map(item => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        onClick={() => handleNavigationClick(item.path)}
                        className="block text-[#e8e6e3] hover:text-[#00ebd6] text-base font-medium"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}

                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <li>
                      <Link 
                        href="/admin" 
                        onClick={() => handleNavigationClick("/admin")}
                        className="block text-[#fe0064] hover:text-[#00ebd6] text-base font-medium"
                      >
                        Admin Portal
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              {/* Mobile Music Links */}
              <div className="border-b border-[#00ebd6]/20 pb-6">
                <h3 className="text-xs font-semibold text-[#00ebd6] uppercase tracking-wider mb-4">
                  Music
                </h3>
                <ul className="space-y-3">
                  {musicDropdown.map(item => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        onClick={() => handleNavigationClick(item.path)}
                        className="block text-[#e8e6e3] hover:text-[#00ebd6] text-sm"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile Cosmic Links */}
              <div className="border-b border-[#00ebd6]/20 pb-6">
                <h3 className="text-xs font-semibold text-[#00ebd6] uppercase tracking-wider mb-4">
                  Cosmic Experiences
                </h3>
                <ul className="space-y-3">
                  {cosmicDropdown.map(item => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        onClick={() => handleNavigationClick(item.path)}
                        className="block text-[#e8e6e3] hover:text-[#00ebd6] text-sm"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile Community Links */}
              <div className="border-b border-[#00ebd6]/20 pb-6">
                <h3 className="text-xs font-semibold text-[#00ebd6] uppercase tracking-wider mb-4">
                  Community
                </h3>
                <ul className="space-y-3">
                  {communityDropdown.map(item => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        onClick={() => handleNavigationClick(item.path)}
                        className="block text-[#e8e6e3] hover:text-[#00ebd6] text-sm"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mobile Search */}
              <div className="pt-2">
                <form onSubmit={handleSearchSubmit} className="mt-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 text-white placeholder:text-gray-400 border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-md hover:from-cyan-600 hover:to-purple-700 transition-all duration-300"
                  >
                    Search
                  </button>
                </form>

                {/* Mobile Auth Buttons */}
                <div className="mt-8 space-y-4">
                  {user ? (
                    <Link
                      href="/profile"
                      onClick={() => handleNavigationClick("/profile")}
                      className="block w-full text-center py-2 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-md hover:from-cyan-600 hover:to-purple-700 transition-all duration-300"
                    >
                      My Profile
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => handleNavigationClick("/login")}
                        className="block w-full text-center py-2 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-md hover:from-cyan-600 hover:to-purple-700 transition-all duration-300"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => handleNavigationClick("/signup")}
                        className="block w-full text-center py-2 px-4 border border-[#00ebd6]/50 text-[#00ebd6] rounded-md hover:bg-[#00ebd6]/10 transition-all duration-300"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Glow effect on the header border */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0"></div>
    </header>
  );
}