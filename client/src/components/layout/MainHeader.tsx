/**
 * MainHeader.tsx
 * 
 * This is the primary header component for the website.
 * It merges the best features from existing header components.
 * 
 * Created: 2025-04-05
 */

import { Link, useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Menu, X, Search, Music, MoonStar, Heart, Calendar, Mail, Book, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Navigation items based on sitemap, excluding legacy and demo pages
const navigationItems = [
  { path: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
  { path: "/about", label: "About", icon: <MoonStar className="h-5 w-5" /> },
  { path: "/music-release", label: "New Music", icon: <Music className="h-5 w-5" /> },
  { path: "/archived-music", label: "Archived Music", icon: <Music className="h-5 w-5" /> },
  { path: "/cosmic-connectivity", label: "Cosmic Connectivity", icon: <MoonStar className="h-5 w-5" /> },
  { path: "/tour", label: "Tour", icon: <Calendar className="h-5 w-5" /> },
  { path: "/engage", label: "Engage", icon: <Heart className="h-5 w-5" /> },
  { path: "/newsletter", label: "Newsletter", icon: <Mail className="h-5 w-5" /> },
  { path: "/blog", label: "Blog", icon: <Book className="h-5 w-5" /> },
  { path: "/community", label: "Community", icon: <Heart className="h-5 w-5" /> },
  { path: "/collaboration", label: "Collaborate", icon: <Heart className="h-5 w-5" /> },
  { path: "/contact", label: "Contact", icon: <Mail className="h-5 w-5" /> },
  { path: "/shop", label: "Shop", icon: <MoonStar className="h-5 w-5" /> }
];

export function MainHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [prevScrollPosition, setPrevScrollPosition] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isAutoHideEnabled, setIsAutoHideEnabled] = useState(true);
  const [location] = useLocation();
  
  // Handle scroll event for auto-hiding navigation and background transparency
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setScrollPosition(currentScrollPos);
      
      if (isAutoHideEnabled) {
        setIsNavVisible(prevScrollPosition > currentScrollPos || currentScrollPos < 100);
      }
      
      setPrevScrollPosition(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPosition, isAutoHideEnabled]);

  // Close mobile menu on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigationClick = useCallback((path: string) => {
    // First scroll to top with smooth behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Add a small delay to allow the scroll animation to complete
    setTimeout(() => {
      setIsMenuOpen(false);
      // Navigate is handled by Link component
    }, 300); // 300ms delay
  }, []);

  // Calculate header background opacity based on scroll position
  const headerOpacity = Math.min(scrollPosition / 200, 0.95);

  return (
    <motion.header
      className={cn(
        "fixed top-0 z-[60] w-full border-b border-[#00ebd6] transition-transform duration-300",
        !isNavVisible && "transform -translate-y-full"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        backgroundColor: `rgba(10, 50, 92, ${headerOpacity})`,
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-[#00ebd6] hover:text-[#e8e6e3] transition-colors"
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isMenuOpen ? "close" : "menu"}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.div>
            </AnimatePresence>
          </button>

          <Link
            href="/"
            onClick={() => handleNavigationClick("/")}
            className="flex items-center space-x-2 group z-10"
          >
            <div className="relative h-9 w-9">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold">DW</span>
            </div>
            <span className="hidden sm:inline-block font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
              Dale Loves Whales
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block">
          <div className="bg-black/20 backdrop-blur-sm rounded-full border border-white/5 px-4 py-2 flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => handleNavigationClick(item.path)}
                className={cn(
                  "relative inline-flex items-center px-3 py-2 rounded-full transition-colors",
                  location === item.path 
                    ? "text-white bg-white/10" 
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {item.icon}
                <span className="ml-2 text-sm font-medium uppercase tracking-wide">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Tablet Navigation */}
        <nav className="hidden md:flex lg:hidden">
          <div className="bg-black/20 backdrop-blur-sm rounded-full border border-white/5 px-3 py-2 flex space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => handleNavigationClick(item.path)}
                className={cn(
                  "relative inline-flex items-center p-2 rounded-full transition-colors tooltip-trigger",
                  location === item.path 
                    ? "text-white bg-white/10" 
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
                title={item.label}
              >
                {item.icon}
                <span className="sr-only">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Search Bar */}
        <div className="search-container hidden sm:flex items-center gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 text-base border border-gray-300 rounded-md bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ebd6] w-[200px] lg:w-[250px]"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden fixed top-[72px] left-0 right-0 bg-[#0a325c]/95 backdrop-blur-lg z-[70]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="container mx-auto px-4 py-6">
              <div className="flex flex-col space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg transition-colors",
                      location === item.path
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {item.icon}
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-sm text-white/60">{item.path === location ? "Current Page" : ""}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Mobile search */}
            <div className="p-4 border-t border-[#00ebd6]/20">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 text-base border border-gray-300 rounded-md bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ebd6] w-full"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility Toggle */}
      <div className="fixed bottom-4 right-4 z-[65]">
        <button
          onClick={() => setIsAutoHideEnabled(!isAutoHideEnabled)}
          className={cn(
            "p-3 rounded-full backdrop-blur-md border border-white/10 transition-colors",
            isAutoHideEnabled ? "bg-black/30 text-white" : "bg-white/10 text-white/70"
          )}
          title={isAutoHideEnabled ? "Disable auto-hide navigation" : "Enable auto-hide navigation"}
        >
          <MoonStar className="h-5 w-5" />
        </button>
      </div>
    </motion.header>
  );
}