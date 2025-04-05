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
import { Menu, X, Search, Music, MoonStar, Moon, Heart, Calendar, Mail, Book, Home, Info, ShoppingBag, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import SacredGeometry from "@/components/ui/sacred-geometry";

// Navigation items based on sitemap, excluding legacy and demo pages
// Icon components with sizes for different views
const createIcon = (Icon: React.ElementType, size = "small") => {
  if (size === "large") {
    return <Icon className="h-6 w-6" />;
  } else if (size === "medium") {
    return <Icon className="h-5 w-5" />;
  } else {
    return <Icon className="h-4 w-4" />;
  }
};

// Group 1: Primary navigation
const primaryNavItems = [
  { path: "/", label: "Home", icon: <Home className="h-4 w-4" />, mobileIcon: createIcon(Home, "large"), color: "cyan" },
  { path: "/about", label: "About", icon: <Info className="h-4 w-4" />, mobileIcon: createIcon(Info, "large"), color: "purple" },
  { path: "/music-release", label: "New Music", icon: <Music className="h-4 w-4" />, mobileIcon: createIcon(Music, "large"), color: "cyan" },
  { path: "/tour", label: "Tour", icon: <Calendar className="h-4 w-4" />, mobileIcon: createIcon(Calendar, "large"), color: "purple" },
  { path: "/engage", label: "Engage", icon: <Heart className="h-4 w-4" />, mobileIcon: createIcon(Heart, "large"), color: "cyan" }
];

// Group 2: Secondary navigation
const secondaryNavItems = [
  { path: "/archived-music", label: "Archived Music", icon: <Music className="h-4 w-4" />, mobileIcon: createIcon(Music, "medium"), color: "purple" },
  { path: "/cosmic-connectivity", label: "Cosmic", icon: <MoonStar className="h-4 w-4" />, mobileIcon: createIcon(MoonStar, "medium"), color: "cyan" },
  { path: "/newsletter", label: "Newsletter", icon: <Mail className="h-4 w-4" />, mobileIcon: createIcon(Mail, "medium"), color: "purple" },
  { path: "/blog", label: "Blog", icon: <Book className="h-4 w-4" />, mobileIcon: createIcon(Book, "medium"), color: "cyan" },
  { path: "/shop", label: "Shop", icon: <ShoppingBag className="h-4 w-4" />, mobileIcon: createIcon(ShoppingBag, "medium"), color: "purple" }
];

// Additional items shown in mobile menu
const additionalNavItems = [
  { path: "/community", label: "Community", icon: <Users className="h-4 w-4" />, mobileIcon: createIcon(Users, "medium"), color: "cyan" },
  { path: "/collaboration", label: "Collaborate", icon: <Users className="h-4 w-4" />, mobileIcon: createIcon(Users, "medium"), color: "purple" },
  { path: "/contact", label: "Contact", icon: <Mail className="h-4 w-4" />, mobileIcon: createIcon(Mail, "medium"), color: "cyan" }
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
  
  // Debug mobile menu toggle
  useEffect(() => {
    console.log("Mobile menu state:", isMenuOpen);
  }, [isMenuOpen]);

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
        ? "text-cyan-300 border-cyan-500/60 bg-gradient-to-br from-cyan-950/80 to-cyan-900/40 shadow-[0_0_15px_rgba(0,235,214,0.3)]" 
        : "text-white/90 border-white/10 hover:border-cyan-500/40 hover:bg-gradient-to-br hover:from-cyan-950/60 hover:to-cyan-900/20 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(0,235,214,0.25)]";
    } else {
      return isActive 
        ? "text-purple-300 border-purple-500/60 bg-gradient-to-br from-purple-950/80 to-purple-900/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
        : "text-white/90 border-white/10 hover:border-purple-500/40 hover:bg-gradient-to-br hover:from-purple-950/60 hover:to-purple-900/20 hover:text-purple-300 hover:shadow-[0_0_12px_rgba(168,85,247,0.25)]";
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
        backgroundColor: `rgba(0, 5, 20, ${headerOpacity + 0.6})`,
        backgroundImage: "linear-gradient(to right, rgba(0, 15, 40, 0.9), rgba(10, 20, 50, 0.95))",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 20px rgba(0, 235, 214, 0.25), inset 0 0 0 1px rgba(0, 235, 214, 0.2)"
      }}
    >
      <div className="relative overflow-hidden">
        {/* Sacred Geometry Background Elements */}
        <div className="absolute left-4 -top-8 opacity-25 rotate-12 transform scale-50 lg:scale-75">
          <SacredGeometry variant="merkaba" size={80} animated={true} intensity="medium" />
        </div>
        <div className="absolute right-4 -bottom-8 opacity-25 -rotate-12 transform scale-50 lg:scale-75">
          <SacredGeometry variant="dodecahedron" size={80} animated={true} intensity="medium" />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 transform scale-75">
          <SacredGeometry variant="hexagon" size={100} animated={true} intensity="medium" />
        </div>

        {/* Main Header Content */}
        <div className="container mx-auto px-2 sm:px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo and mobile menu button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  console.log("Menu button clicked, current state:", isMenuOpen);
                  setIsMenuOpen(prev => !prev);
                }}
                className={cn(
                  "md:hidden relative flex items-center justify-center h-9 w-9 rounded-full backdrop-blur-md border transition-all duration-300",
                  isMenuOpen 
                    ? "bg-black/40 border-cyan-500/30 text-cyan-300 shadow-[0_0_8px_rgba(0,235,214,0.3)]" 
                    : "bg-black/30 border-white/10 text-white hover:text-cyan-300 hover:border-cyan-500/20"
                )}
                aria-label="Toggle menu"
                type="button"
              >
                {/* Pulse animation for the button when menu is open */}
                {isMenuOpen && (
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 opacity-0"
                    animate={{ 
                      scale: [1, 1.15, 1],
                      opacity: [0, 0.2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                  />
                )}
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isMenuOpen ? "close" : "menu"}
                    initial={{ opacity: 0, scale: 0.8, rotate: isMenuOpen ? 0 : -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: isMenuOpen ? -90 : 90 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative z-10"
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
                  
                  {/* Animated pulse */}
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-pulse"></div>
                  
                  {/* Sparkle effect */}
                  <div className="absolute top-0 right-0 h-1 w-1 rounded-full bg-white opacity-70 animate-ping"></div>
                  
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">DW</span>
                </div>
                <span className="hidden sm:inline-block font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300 hover:opacity-90 transition-opacity">
                  Dale Loves Whales
                </span>
              </Link>
            </div>

            {/* Desktop Primary Navigation */}
            <nav className="hidden md:flex">
              <div className="relative flex items-center gap-1 px-2 py-1 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden group shadow-[0_2px_15px_rgba(0,235,214,0.15)]">
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                
                {primaryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => handleNavigationClick(item.path)}
                    className={cn(
                      "flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all duration-300 relative z-10",
                      getColorStyles(item.color, location === item.path)
                    )}
                  >
                    {location === item.path && (
                      <>
                        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-cyan-500 to-purple-600 blur-sm rounded-md pointer-events-none"></div>
                        <motion.div 
                          className="absolute -inset-0.5 opacity-10 bg-gradient-to-r from-cyan-500 to-purple-600 blur-md rounded-md pointer-events-none"
                          animate={{ 
                            scale: [1, 1.02, 1],
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse" 
                          }}
                        />
                      </>
                    )}
                    <span className="mr-1.5">{item.icon}</span>
                    <span className="tracking-wide">{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Desktop Search and Secondary Nav */}
            <div className="hidden md:flex items-center gap-3">
              {/* Secondary Navigation */}
              <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 relative overflow-hidden group shadow-[0_2px_15px_rgba(168,85,247,0.15)]">
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => handleNavigationClick(item.path)}
                    className={cn(
                      "flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all duration-300 relative z-10",
                      getColorStyles(item.color, location === item.path)
                    )}
                  >
                    {location === item.path && (
                      <>
                        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-500 to-cyan-600 blur-sm rounded-md pointer-events-none"></div>
                        <motion.div 
                          className="absolute -inset-0.5 opacity-10 bg-gradient-to-r from-purple-500 to-cyan-600 blur-md rounded-md pointer-events-none"
                          animate={{ 
                            scale: [1, 1.02, 1],
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse" 
                          }}
                        />
                      </>
                    )}
                    <span className="mr-1.5">{item.icon}</span>
                    <span className="tracking-wide">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 rounded-md blur-sm opacity-30 group-hover:opacity-70 transition-opacity duration-300 group-focus-within:opacity-100"></div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-white/10 rounded-md bg-black/40 text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 w-[160px] lg:w-[180px] shadow-[0_2px_10px_rgba(0,235,214,0.15)]"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400/70 group-focus-within:text-cyan-400 transition-colors duration-300">
                    <Search size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Row for Tablet */}
          <div className="hidden md:flex lg:hidden justify-center mt-2">
            <div className="relative flex items-center gap-1 px-2 py-1 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden group shadow-[0_2px_15px_rgba(168,85,247,0.15)]">
              {/* Animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
              
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => handleNavigationClick(item.path)}
                  className={cn(
                    "flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all duration-300 relative z-10",
                    getColorStyles(item.color, location === item.path)
                  )}
                >
                  {location === item.path && (
                    <>
                      <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-500 to-cyan-600 blur-sm rounded-md pointer-events-none"></div>
                      <motion.div 
                        className="absolute -inset-0.5 opacity-10 bg-gradient-to-r from-purple-500 to-cyan-600 blur-md rounded-md pointer-events-none"
                        animate={{ 
                          scale: [1, 1.02, 1],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse" 
                        }}
                      />
                    </>
                  )}
                  <span className="mr-1.5">{item.icon}</span>
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence mode="wait">
        {isMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 top-[57px] bg-[#020B16] z-[70] overflow-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0, 235, 214, 0.05) 0%, rgba(0, 10, 30, 0.95) 70%)",
              boxShadow: "inset 0 0 100px rgba(0, 235, 214, 0.1)"
            }}
          >
            {/* Sacred Geometry Background Elements */}
            <div className="absolute top-10 left-10 opacity-20">
              <SacredGeometry variant="merkaba" size={120} animated={true} intensity="medium" />
            </div>
            <div className="absolute bottom-20 right-10 opacity-20">
              <SacredGeometry variant="dodecahedron" size={120} animated={true} intensity="medium" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15">
              <SacredGeometry variant="icosahedron" size={200} animated={true} intensity="medium" />
            </div>
            <div className="absolute top-[20%] right-[15%] opacity-20">
              <SacredGeometry variant="octahedron" size={80} animated={true} intensity="medium" />
            </div>
            <div className="absolute bottom-[15%] left-[20%] opacity-20">
              <SacredGeometry variant="tetrahedron" size={60} animated={true} intensity="medium" />
            </div>
            
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-white opacity-40"
                  initial={{ 
                    x: `${Math.random() * 100}%`, 
                    y: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.5
                  }}
                  animate={{ 
                    x: `${Math.random() * 100}%`, 
                    y: `${Math.random() * 100}%`,
                    opacity: [Math.random() * 0.3, Math.random() * 0.7, Math.random() * 0.3]
                  }}
                  transition={{ 
                    duration: 15 + Math.random() * 20,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
              ))}
            </div>
            
            <div className="container px-4 py-6 relative z-10">
              {/* Mobile search - Top for quick access */}
              <div className="mb-6 relative bg-black/40 rounded-lg p-3 backdrop-blur-sm border border-white/10 shadow-[0_3px_15px_rgba(0,235,214,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 opacity-40 rounded-lg"></div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search experiences..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md bg-black/40 text-white placeholder:text-gray-400 focus:outline-none focus:border-cyan-500/50 border border-white/10 shadow-inner"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-full p-1 shadow-[0_0_10px_rgba(0,235,214,0.3)]">
                    <Search className="text-white" size={16} />
                  </div>
                </div>
              </div>
              
              {/* Menu Title */}
              <div className="mb-6 mx-auto text-center">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300">
                  Cosmic Experience
                </h2>
              </div>
            
              {/* Primary Navigation Group */}
              <div className="mb-8">
                <div className="grid grid-cols-2 gap-4">
                  {primaryNavItems.map((item, index) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      className="relative"
                    >
                      {/* Glow effect around buttons */}
                      <div className={cn(
                        "absolute inset-0 rounded-lg opacity-30 blur-md",
                        item.color === 'cyan' ? "bg-cyan-500/20" : "bg-purple-500/20"
                      )}></div>
                      
                      <Link
                        href={item.path}
                        onClick={() => {
                          setIsMenuOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center py-6 px-3 rounded-lg transition-all duration-300 border border-white/10 text-center relative bg-black/20 backdrop-filter backdrop-blur-sm",
                          location === item.path
                            ? (item.color === 'cyan'
                              ? "border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(0,235,214,0.3)]"
                              : "border-purple-500/50 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]")
                            : "text-white hover:border-white/30"
                        )}
                      >
                        {location === item.path && (
                          <div className={cn(
                            "absolute inset-0 opacity-20 blur-sm rounded-lg pointer-events-none",
                            item.color === 'cyan'
                              ? "bg-gradient-to-br from-cyan-500/30 to-blue-600/10"
                              : "bg-gradient-to-br from-purple-500/30 to-indigo-600/10"
                          )}></div>
                        )}
                        <div className="text-2xl mb-3">{item.mobileIcon}</div>
                        <span className="text-base font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Secondary Navigation Group */}
              <div className="mb-8">
                <div className="grid grid-cols-2 gap-3">
                  {secondaryNavItems.slice(0, 4).map((item, index) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.03, duration: 0.2 }}
                      className="relative"
                    >
                      <Link
                        href={item.path}
                        onClick={() => {
                          setIsMenuOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "flex items-center justify-center py-3 px-2 rounded-lg transition-all duration-300 border border-white/10 text-center relative bg-black/30 backdrop-blur-sm",
                          location === item.path
                            ? (item.color === 'cyan'
                              ? "border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(0,235,214,0.2)]"
                              : "border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]")
                            : "text-white/90 hover:border-white/20"
                        )}
                      >
                        <div className="text-lg mr-2">{item.mobileIcon}</div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Additional Links */}
              <div className="mb-5">
                <div className="grid grid-cols-3 gap-2">
                  {[...secondaryNavItems.slice(4), ...additionalNavItems].map((item, index) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.03, duration: 0.2 }}
                    >
                      <Link
                        href={item.path}
                        onClick={() => {
                          setIsMenuOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 border text-center relative",
                          location === item.path
                            ? (item.color === 'cyan'
                              ? "border-cyan-500/40 text-cyan-300 bg-black/40 shadow-[0_0_10px_rgba(0,235,214,0.15)]"
                              : "border-purple-500/40 text-purple-300 bg-black/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]")
                            : "text-white/80 border-white/10 bg-black/20 hover:border-white/20"
                        )}
                      >
                        <div className="text-base mb-1">{item.mobileIcon}</div>
                        <span className="text-xs font-medium line-clamp-1">{item.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility Toggle */}
      <div className="fixed bottom-4 right-4 z-[65]">
        <motion.button
          onClick={() => setIsAutoHideEnabled(!isAutoHideEnabled)}
          className={cn(
            "p-2 rounded-full backdrop-blur-md border transition-all duration-300 relative overflow-hidden",
            isAutoHideEnabled 
              ? "bg-black/40 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(0,235,214,0.2)]" 
              : "bg-black/30 border-white/10 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/20"
          )}
          title={isAutoHideEnabled ? "Disable auto-hide navigation" : "Enable auto-hide navigation"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated background */}
          {isAutoHideEnabled && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 opacity-0" 
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}
          
          <span className="relative z-10">
            {isAutoHideEnabled ? 
              <MoonStar className="h-4 w-4" /> : 
              <Moon className="h-4 w-4" />
            }
          </span>
          
          {/* Tooltip */}
          <motion.div
            className="absolute -top-10 right-0 bg-black/80 text-xs text-white px-2 py-1 rounded opacity-0 pointer-events-none whitespace-nowrap backdrop-blur-sm border border-white/10"
            initial={{ opacity: 0, y: 5 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isAutoHideEnabled ? "Auto-hide navigation: On" : "Auto-hide navigation: Off"}
          </motion.div>
        </motion.button>
      </div>
    </motion.header>
  );
}