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
import { Menu, X, Search, Music, MoonStar, Heart, Calendar, Mail, Book, Home, Info, ShoppingBag, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import SacredGeometry from "@/components/ui/sacred-geometry";

// Navigation items based on sitemap, excluding legacy and demo pages
// Group 1: Primary navigation
const primaryNavItems = [
  { path: "/", label: "Home", icon: <Home className="h-4 w-4" />, color: "cyan" },
  { path: "/about", label: "About", icon: <Info className="h-4 w-4" />, color: "purple" },
  { path: "/music-release", label: "New Music", icon: <Music className="h-4 w-4" />, color: "cyan" },
  { path: "/tour", label: "Tour", icon: <Calendar className="h-4 w-4" />, color: "purple" },
  { path: "/engage", label: "Engage", icon: <Heart className="h-4 w-4" />, color: "cyan" }
];

// Group 2: Secondary navigation
const secondaryNavItems = [
  { path: "/archived-music", label: "Archived Music", icon: <Music className="h-4 w-4" />, color: "purple" },
  { path: "/cosmic-connectivity", label: "Cosmic", icon: <MoonStar className="h-4 w-4" />, color: "cyan" },
  { path: "/newsletter", label: "Newsletter", icon: <Mail className="h-4 w-4" />, color: "purple" },
  { path: "/blog", label: "Blog", icon: <Book className="h-4 w-4" />, color: "cyan" },
  { path: "/shop", label: "Shop", icon: <ShoppingBag className="h-4 w-4" />, color: "purple" }
];

// Additional items shown in mobile menu
const additionalNavItems = [
  { path: "/community", label: "Community", icon: <Users className="h-4 w-4" />, color: "cyan" },
  { path: "/collaboration", label: "Collaborate", icon: <Users className="h-4 w-4" />, color: "purple" },
  { path: "/contact", label: "Contact", icon: <Mail className="h-4 w-4" />, color: "cyan" }
];

// All navigation items combined (for mobile menu)
const allNavItems = [...primaryNavItems, ...secondaryNavItems, ...additionalNavItems];

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

  // Helper function to get color styles for menu items
  const getColorStyles = (color: string, isActive: boolean) => {
    if (color === 'cyan') {
      return isActive 
        ? "text-cyan-300 border-cyan-500/30 bg-cyan-950/30" 
        : "text-white/80 border-white/10 hover:border-cyan-500/20 hover:bg-cyan-950/20 hover:text-cyan-300";
    } else {
      return isActive 
        ? "text-purple-300 border-purple-500/30 bg-purple-950/30" 
        : "text-white/80 border-white/10 hover:border-purple-500/20 hover:bg-purple-950/20 hover:text-purple-300";
    }
  };

  return (
    <motion.header
      className={cn(
        "fixed top-0 z-[60] w-full border-b border-[#00ebd6]/50 transition-transform duration-300",
        !isNavVisible && "transform -translate-y-full"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        backgroundColor: `rgba(5, 15, 40, ${headerOpacity})`,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="relative overflow-hidden">
        {/* Sacred Geometry Background Elements */}
        <div className="absolute left-4 -top-8 opacity-10 rotate-12 transform scale-50 lg:scale-75">
          <SacredGeometry variant="merkaba" size={80} animated={true} intensity="subtle" />
        </div>
        <div className="absolute right-4 -bottom-8 opacity-10 -rotate-12 transform scale-50 lg:scale-75">
          <SacredGeometry variant="dodecahedron" size={80} animated={true} intensity="subtle" />
        </div>

        {/* Main Header Content */}
        <div className="container mx-auto px-2 sm:px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo and mobile menu button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden flex items-center justify-center h-9 w-9 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-cyan-300"
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
                    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </motion.div>
                </AnimatePresence>
              </button>

              <Link
                href="/"
                onClick={() => handleNavigationClick("/")}
                className="flex items-center space-x-2 group z-10"
              >
                <div className="relative h-9 w-9">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">DW</span>
                </div>
                <span className="hidden sm:inline-block font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300">
                  Dale Loves Whales
                </span>
              </Link>
            </div>

            {/* Desktop Primary Navigation */}
            <nav className="hidden md:flex">
              <div className="flex items-center gap-1 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-lg border border-white/5">
                {primaryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => handleNavigationClick(item.path)}
                    className={cn(
                      "flex items-center px-2 py-1 text-xs font-medium rounded-md border transition-all duration-300 relative",
                      getColorStyles(item.color, location === item.path)
                    )}
                  >
                    {location === item.path && (
                      <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-cyan-500 to-purple-600 blur-sm rounded-md pointer-events-none"></div>
                    )}
                    {item.icon}
                    <span className="ml-1.5">{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Desktop Search and Secondary Nav */}
            <div className="hidden md:flex items-center gap-1">
              {/* Secondary Navigation */}
              <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-lg border border-white/5 mr-2">
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => handleNavigationClick(item.path)}
                    className={cn(
                      "flex items-center px-2 py-1 text-xs font-medium rounded-md border transition-all duration-300 relative",
                      getColorStyles(item.color, location === item.path)
                    )}
                  >
                    {location === item.path && (
                      <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-cyan-500 to-purple-600 blur-sm rounded-md pointer-events-none"></div>
                    )}
                    {item.icon}
                    <span className="ml-1.5">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-white/10 rounded-md bg-black/30 text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 w-[160px] lg:w-[180px]"
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              </div>
            </div>
          </div>

          {/* Secondary Row for Tablet */}
          <div className="hidden md:flex lg:hidden justify-center mt-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-lg border border-white/5">
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => handleNavigationClick(item.path)}
                  className={cn(
                    "flex items-center px-2 py-1 text-xs font-medium rounded-md border transition-all duration-300 relative",
                    getColorStyles(item.color, location === item.path)
                  )}
                >
                  {location === item.path && (
                    <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-cyan-500 to-purple-600 blur-sm rounded-md pointer-events-none"></div>
                  )}
                  {item.icon}
                  <span className="ml-1.5">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 top-[57px] bg-black/95 backdrop-blur-xl z-[70]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Sacred Geometry Elements */}
            <div className="absolute top-10 left-10 opacity-5">
              <SacredGeometry variant="merkaba" size={120} animated={true} intensity="subtle" />
            </div>
            <div className="absolute bottom-20 right-10 opacity-5">
              <SacredGeometry variant="dodecahedron" size={120} animated={true} intensity="subtle" />
            </div>
            
            <div className="container px-4 py-6 relative z-10">
              {/* Mobile Navigation Grid */}
              <div className="grid grid-cols-2 gap-3">
                {allNavItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                  >
                    <Link
                      href={item.path}
                      onClick={() => {
                        setIsMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center space-y-2 p-4 rounded-lg transition-all duration-300 border text-center relative",
                        getColorStyles(item.color, location === item.path)
                      )}
                    >
                      {location === item.path && (
                        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-cyan-500 to-purple-600 blur-sm rounded-lg pointer-events-none"></div>
                      )}
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Mobile search */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-white/10 rounded-md bg-black/30 text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
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
            "p-2 rounded-full backdrop-blur-md border border-white/10 transition-colors",
            isAutoHideEnabled ? "bg-black/30 text-cyan-300" : "bg-white/10 text-gray-400"
          )}
          title={isAutoHideEnabled ? "Disable auto-hide navigation" : "Enable auto-hide navigation"}
        >
          <MoonStar className="h-4 w-4" />
        </button>
      </div>
    </motion.header>
  );
}