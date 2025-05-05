/**
 * MainHeader.tsx
 * 
 * This is the primary header component for the website, featuring sacred geometry,
 * staggered navigation, and cosmic design elements.
 * 
 * Created: 2025-04-05 - Updated with enhancements
 * Latest Update: Complete redesign based on new specifications - May 5, 2025
 */

import { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "../../hooks/use-toast";
import { 
  Menu, 
  X, 
  Search, 
  User, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Music,
  Headphones,
  Calendar,
  ShoppingBag,
  Home,
  MessageSquare,
  Users,
  Heart,
  Info,
  Mail,
  Newspaper,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Settings,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SacredGeometry from "../ui/sacred-geometry";

// Define navigation items
interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const MainHeader = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Animation variants for mobile menu
  const containerVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.1
      }
    },
    exit: { 
      height: 0, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  // Check scroll position to adjust header appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation items aligned with the specification
  const navigationItems: NavItem[] = [
    { name: "Home", path: "/", icon: <Home className="h-4 w-4" /> },
    { name: "About", path: "/about", icon: <Users className="h-4 w-4" /> },
    { name: "New Music", path: "/music-release", icon: <Music className="h-4 w-4" /> },
    { name: "Archived Music", path: "/archived-music", icon: <Headphones className="h-4 w-4" /> },
    { name: "Tour", path: "/tour", icon: <Calendar className="h-4 w-4" /> },
    { name: "Shop", path: "/shop", icon: <ShoppingBag className="h-4 w-4" /> },
    { name: "Engage", path: "/engage", icon: <Heart className="h-4 w-4" /> },
    { name: "Contact", path: "/contact", icon: <Mail className="h-4 w-4" /> }
  ];

  // Social media links for footer/mobile menu
  const socialLinks = [
    { name: "Facebook", icon: <Facebook className="h-5 w-5" aria-hidden="true" />, path: "https://facebook.com/DaleTheWhale", external: true },
    { name: "Twitter", icon: <Twitter className="h-5 w-5" aria-hidden="true" />, path: "https://twitter.com/DaleTheWhale", external: true },
    { name: "Instagram", icon: <Instagram className="h-5 w-5" aria-hidden="true" />, path: "https://instagram.com/DaleTheWhale", external: true },
    { name: "YouTube", icon: <Youtube className="h-5 w-5" aria-hidden="true" />, path: "https://youtube.com/DaleTheWhale", external: true }
  ];

  // Handle navigation clicks
  const handleNavigationClick = useCallback((path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  }, [navigate]);

  // Handle search submission
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      
      // Show search initiated toast
      toast({
        title: "Search Initiated",
        description: `Searching for "${searchQuery.trim()}"`,
        variant: "default",
      });
    }
  }, [searchQuery, navigate, toast]);

  return (
    <header 
      className={`fixed top-0 z-fixed-header w-full backdrop-blur-lg border-b border-white/5 transition-all duration-300 ease-in-out ${
        isScrolled ? 'h-16 bg-black/90' : 'h-20 bg-black/80'
      }`}
      style={{
        boxShadow: '0 0 20px rgba(0, 235, 214, 0.15), 0 0 40px rgba(111, 76, 255, 0.1)'
      }}
    >
      {/* Subtle geometric background patterns - with z-index control */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5 z-background">
        <SacredGeometry 
          type="merkaba" 
          className="absolute -top-20 -right-20 w-64 h-64 text-cyan-400" 
          animated={true}
          aria-hidden="true"
        />
        <SacredGeometry 
          type="dodecahedron" 
          className="absolute -bottom-40 -left-40 w-96 h-96 text-purple-400" 
          animated={true}
          aria-hidden="true"
        />
      </div>
      
      <div className="container mx-auto px-4 h-full relative">
        {/* Sacred Geometry Elements - Left Side - with z-index layering system */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 hidden md:block z-content">
          <SacredGeometry 
            type="merkaba" 
            size={32} 
            color="cyan" 
            animated={true} 
            className="opacity-60 hover:opacity-90 transition-opacity duration-500 cosmic-glow-cyan z-cosmic-highlight" 
            aria-hidden="true"
          />
        </div>
        
        {/* Sacred Geometry Elements - Right Side - with z-index layering system */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden md:block z-content">
          <SacredGeometry 
            type="merkaba" 
            size={32} 
            color="purple" 
            animated={true}
            reversed={true}
            className="opacity-60 hover:opacity-90 transition-opacity duration-500 cosmic-glow-purple z-cosmic-highlight" 
            aria-hidden="true"
          />
        </div>

        <div className="flex items-center justify-between h-full relative">
          {/* Logo with Precise Positioning */}
          <Link href="/" className="flex items-center space-x-2 group z-important">
            <div className="relative h-12 w-12 flex items-center justify-center">
              {/* Main circle with gradient */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Outer glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-[2px] opacity-60 group-hover:opacity-80 group-hover:blur-[3px] transition-all duration-300 group-hover:scale-110"></div>
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
              
              {/* Inner geometric pattern - exact positioning */}
              <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="w-full h-full flex items-center justify-center">
                  <div 
                    className="w-6 h-6 bg-gradient-to-r from-cyan-500/30 to-purple-600/30 rounded-sm"
                    style={{
                      transform: "rotate(45deg) scale(0.75)",
                      transformOrigin: "center",
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Text logo positioning */}
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm tracking-wider">
                DLW
              </span>
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300 drop-shadow-[0_1px_1px_rgba(0,235,214,0.5)]">
              Dale Loves Whales
            </span>
          </Link>

          {/* Desktop Navigation - Following specification */}
          <nav className="hidden md:grid grid-flow-col auto-cols-max gap-x-1 ml-6 z-content">
            {navigationItems.map((item, index) => (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigationClick(item.path);
                }}
                className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-white nav-link ${
                  location.includes(item.path) && (item.path === "/" ? location === "/" : true)
                    ? 'text-white' 
                    : 'text-white/70'
                }`}
                aria-current={location.includes(item.path) && (item.path === "/" ? location === "/" : true) ? "page" : undefined}
              >
                <motion.span 
                  className="flex items-center space-x-1"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </motion.span>
                {location.includes(item.path) && (item.path === "/" ? location === "/" : true) && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            ))}
          </nav>
          
          {/* Search Bar and Controls - With Z-indexing and precise positioning */}
          <div className="hidden md:flex items-center ml-8 z-content">
            <div className="relative group" role="search">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-white/50 group-hover:text-cyan-400 group-focus-within:text-cyan-400 transition-colors duration-200" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSearchSubmit(e as any);
                  }
                }}
                aria-label="Search site content"
                className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder-white/50 
                focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all w-48 focus:w-64 
                hover:bg-white/7 hover:border-white/15 search-input z-interactive"
              />
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 group-focus-within:opacity-40 
              bg-gradient-to-r from-cyan-700/10 to-purple-700/10 blur-sm transition-opacity duration-300 -z-10"></div>
            </div>
            
            {/* Navigation controls with improved accessibility and visual effects */}
            <div className="flex items-center space-x-1.5 ml-4">
              <button 
                onClick={() => window.history.back()}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors
                focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus-visible:ring-2 focus-visible:ring-cyan-400/50
                relative overflow-hidden group z-interactive"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4 relative z-10" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 group-focus:opacity-30 
                bg-gradient-to-br from-cyan-400 to-purple-400 transition-opacity duration-200"></div>
              </button>
              <button 
                onClick={() => window.history.forward()}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors
                focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus-visible:ring-2 focus-visible:ring-cyan-400/50
                relative overflow-hidden group z-interactive"
                aria-label="Go forward"
              >
                <ArrowRight className="h-4 w-4 relative z-10" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 group-focus:opacity-30 
                bg-gradient-to-br from-cyan-400 to-purple-400 transition-opacity duration-200"></div>
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors
                focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus-visible:ring-2 focus-visible:ring-cyan-400/50
                relative overflow-hidden group z-interactive"
                aria-label="Reload page"
              >
                <RotateCw className="h-4 w-4 relative z-10" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 group-focus:opacity-30 
                bg-gradient-to-br from-cyan-400 to-purple-400 transition-opacity duration-200"></div>
              </button>
            </div>
          </div>
          
          {/* Login Button - Enhanced with cosmic glow and precise positioning */}
          <div className="ml-4 z-important">
            <Link 
              href="/login" 
              className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 
              transition-all duration-300 text-white px-5 py-2 rounded-md text-sm font-medium 
              focus:outline-none focus:ring-2 focus:ring-cyan-400/50 group z-interactive"
            >
              <span className="relative z-10">Log In</span>
              
              {/* Inner glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-30 group-focus:opacity-40 
              bg-gradient-to-r from-white/20 to-white/5 transition-opacity duration-300"></div>
              
              {/* Outer glow effect - positioned precisely */}
              <div className="absolute -inset-[2px] rounded-lg opacity-0 group-hover:opacity-50 group-focus:opacity-70 
              bg-gradient-to-r from-cyan-400 to-purple-500 blur-[6px] transition-all duration-300 
              scale-105 group-hover:scale-110"></div>
            </Link>
          </div>
          
          {/* Mobile Menu Button - Only visible on small screens - With enhanced styling */}
          <button
            type="button"
            className="md:hidden ml-4 p-2 text-white/80 hover:text-white 
            focus:outline-none focus:ring-2 focus:ring-cyan-400/30 
            inline-flex items-center justify-center rounded-md
            relative overflow-hidden group z-important"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 group-focus:opacity-30 
            bg-gradient-to-br from-cyan-400 to-purple-400 rounded-md transition-opacity duration-200"></div>
            
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 relative z-10" />
            ) : (
              <Menu className="h-6 w-6 relative z-10" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu - Only visible when open on small screens - with z-index system */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="md:hidden overflow-hidden bg-black/90 backdrop-blur-md border-t border-white/5 z-floating-menu"
          >
            <motion.div 
              variants={itemVariants}
              className="px-4 py-3"
            >
              {/* Mobile Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-white/50" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchQuery('');
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-10 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                />
              </div>
            </motion.div>
            
            {/* Mobile Navigation Items */}
            <div className="px-4 py-2 border-t border-white/10">
              <motion.div variants={itemVariants}>
                <h3 className="text-xs uppercase text-white/50 font-medium mb-2">Navigation</h3>
                <div className="grid grid-cols-2 gap-3">
                  {navigationItems.map((item) => (
                    <Link 
                      key={item.path}
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigationClick(item.path);
                      }}
                      className="flex items-center text-white/80 hover:text-white space-x-2 py-1 nav-link"
                      aria-current={location.includes(item.path) && (item.path === "/" ? location === "/" : true) ? "page" : undefined}
                    >
                      <div className="h-4 w-4 opacity-60">
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
              
              {/* Social Links */}
              <motion.div variants={itemVariants} className="mt-4">
                <h3 className="text-xs uppercase text-white/50 font-medium mb-2">Connect</h3>
                <div className="flex space-x-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-white transition-colors"
                      aria-label={`Follow us on ${social.name}`}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* Mobile Navigation Controls */}
            <motion.div 
              variants={itemVariants}
              className="px-4 py-3 border-t border-white/10 flex justify-between"
            >
              <div className="flex space-x-2">
                <button 
                  onClick={() => window.history.back()}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white 
                  transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/30 
                  relative overflow-hidden group"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4 relative z-10" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 group-focus:opacity-30 
                  bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full transition-opacity duration-200"></div>
                </button>
                <button 
                  onClick={() => window.history.forward()}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white 
                  transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/30 
                  relative overflow-hidden group"
                  aria-label="Go forward"
                >
                  <ArrowRight className="h-4 w-4 relative z-10" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 group-focus:opacity-30 
                  bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full transition-opacity duration-200"></div>
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white 
                  transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/30 
                  relative overflow-hidden group"
                  aria-label="Reload page"
                >
                  <RotateCw className="h-4 w-4 relative z-10" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 group-focus:opacity-30 
                  bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full transition-opacity duration-200"></div>
                </button>
              </div>
              
              <Link 
                href="/login" 
                className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 
                transition-all duration-300 text-white px-4 py-2 rounded-md text-sm font-medium 
                focus:outline-none focus:ring-2 focus:ring-cyan-400/50 group z-interactive"
              >
                <span className="relative z-10">Log In</span>
                
                {/* Inner glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-30 group-focus:opacity-40 
                bg-gradient-to-r from-white/20 to-white/5 transition-opacity duration-300"></div>
                
                {/* Outer glow effect */}
                <div className="absolute -inset-[2px] rounded-lg opacity-0 group-hover:opacity-50 group-focus:opacity-70 
                bg-gradient-to-r from-cyan-400 to-purple-500 blur-[6px] transition-all duration-300 
                scale-105 group-hover:scale-110"></div>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default MainHeader;