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
  const [, navigate] = useLocation();
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

  // First row navigation items
  const firstRowItems: NavItem[] = [
    { name: "Home", path: "/", icon: <Home /> },
    { name: "Music", path: "/music", icon: <Music /> },
    { name: "Tour", path: "/tour", icon: <Calendar /> },
    { name: "Shop", path: "/shop", icon: <ShoppingBag /> },
  ];

  // Second row navigation items
  const secondRowItems: NavItem[] = [
    { name: "Blog", path: "/blog", icon: <Newspaper /> },
    { name: "About", path: "/about", icon: <Info /> },
    { name: "Community", path: "/community", icon: <Users /> },
    { name: "Resources", path: "/resources", icon: <HelpCircle /> },
  ];

  // Third row navigation items
  const thirdRowItems: NavItem[] = [
    { name: "Contact", path: "/contact", icon: <Mail /> },
    { name: "Newsletter", path: "/newsletter", icon: <MessageSquare /> },
    { name: "Social", path: "/social", icon: <Heart /> },
    { name: "Settings", path: "/settings", icon: <Settings /> },
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
      className={`fixed top-0 z-[100] w-full bg-black/80 backdrop-blur-lg border-b border-white/5 transition-all duration-300 ${
        isScrolled ? 'h-16' : 'h-20'
      }`}
      style={{
        boxShadow: '0 0 20px rgba(0, 235, 214, 0.15), 0 0 40px rgba(111, 76, 255, 0.1)'
      }}
    >
      <div className="container mx-auto px-4 h-full relative">
        {/* Sacred Geometry Elements - Left Side */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 hidden md:block">
          <SacredGeometry 
            type="merkaba" 
            size={32} 
            color="cyan" 
            animated={true} 
            className="opacity-60 hover:opacity-90 transition-opacity duration-500" 
          />
        </div>
        
        {/* Sacred Geometry Elements - Right Side */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
          <SacredGeometry 
            type="merkaba" 
            size={32} 
            color="purple" 
            animated={true}
            reversed={true}
            className="opacity-60 hover:opacity-90 transition-opacity duration-500" 
          />
        </div>

        <div className="flex items-center justify-between h-full relative">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative h-10 w-10">
              {/* Main circle with gradient */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Outer glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-[2px] opacity-60 group-hover:opacity-80 group-hover:blur-[3px] transition-all duration-300 group-hover:scale-110"></div>
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
              
              {/* Inner geometric pattern */}
              <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-4 h-4 rotate-45 bg-gradient-to-r from-cyan-500/40 to-purple-600/40 rounded-sm"></div>
                </div>
              </div>
              
              {/* Text logo */}
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-[11px]">DLW</span>
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300 drop-shadow-[0_1px_1px_rgba(0,235,214,0.5)]">
              Dale Loves Whales
            </span>
          </Link>

          {/* Desktop Navigation Block */}
          <div className="hidden md:flex flex-col items-center ml-auto">
            {/* Navigation - First Row */}
            <div className="flex items-center space-x-8">
              {firstRowItems.map((item) => (
                <Link 
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigationClick(item.path);
                  }}
                  className="flex items-center text-white/80 hover:text-white space-x-1 text-sm group relative"
                >
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-1 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="h-4 w-4 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    {item.icon}
                  </div>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
            
            {/* Navigation - Second Row */}
            <div className="flex items-center space-x-8 mt-1">
              {secondRowItems.map((item) => (
                <Link 
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigationClick(item.path);
                  }}
                  className="flex items-center text-white/80 hover:text-white space-x-1 text-sm group relative"
                >
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-1 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="h-4 w-4 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    {item.icon}
                  </div>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
            
            {/* Navigation - Third Row */}
            <div className="flex items-center space-x-8 mt-1">
              {thirdRowItems.map((item) => (
                <Link 
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigationClick(item.path);
                  }}
                  className="flex items-center text-white/80 hover:text-white space-x-1 text-sm group relative"
                >
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-1 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="h-4 w-4 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    {item.icon}
                  </div>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Search Bar and Controls */}
          <div className="hidden md:flex items-center ml-8">
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
                    handleSearchSubmit(e as any);
                  }
                }}
                className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all w-48 focus:w-64"
              />
            </div>
            
            {/* Navigation controls */}
            <div className="flex items-center space-x-1 ml-3">
              <button 
                onClick={() => window.history.back()}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => window.history.forward()}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Go forward"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Reload page"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Login Button */}
          <div className="ml-4">
            <Link 
              href="/login" 
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 transition-colors text-white px-5 py-2 rounded-md text-sm font-medium"
            >
              Log In
            </Link>
          </div>
          
          {/* Mobile Menu Button - Only visible on small screens */}
          <button
            className="md:hidden ml-4 p-2 text-white/80 hover:text-white focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu - Only visible when open on small screens */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="md:hidden overflow-hidden bg-black/90 backdrop-blur-md border-t border-white/5"
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
            
            {/* Mobile Nav Items - Keep the structure with three rows */}
            <div className="px-4 py-2 border-t border-white/10">
              <motion.div variants={itemVariants} className="mb-3">
                <h3 className="text-xs uppercase text-white/50 font-medium mb-2">Main</h3>
                <div className="grid grid-cols-2 gap-3">
                  {firstRowItems.map((item) => (
                    <Link 
                      key={item.path}
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigationClick(item.path);
                      }}
                      className="flex items-center text-white/80 hover:text-white space-x-2 py-1"
                    >
                      <div className="h-4 w-4 opacity-60">
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="mb-3">
                <h3 className="text-xs uppercase text-white/50 font-medium mb-2">Content</h3>
                <div className="grid grid-cols-2 gap-3">
                  {secondRowItems.map((item) => (
                    <Link 
                      key={item.path}
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigationClick(item.path);
                      }}
                      className="flex items-center text-white/80 hover:text-white space-x-2 py-1"
                    >
                      <div className="h-4 w-4 opacity-60">
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <h3 className="text-xs uppercase text-white/50 font-medium mb-2">Engage</h3>
                <div className="grid grid-cols-2 gap-3">
                  {thirdRowItems.map((item) => (
                    <Link 
                      key={item.path}
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigationClick(item.path);
                      }}
                      className="flex items-center text-white/80 hover:text-white space-x-2 py-1"
                    >
                      <div className="h-4 w-4 opacity-60">
                        {item.icon}
                      </div>
                      <span>{item.name}</span>
                    </Link>
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
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => window.history.forward()}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  aria-label="Go forward"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  aria-label="Reload page"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
              
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 transition-colors text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Log In
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default MainHeader;