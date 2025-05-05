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
  Mail,
  ArrowLeft,
  ArrowRight,
  RotateCw
} from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { motion, AnimatePresence } from "framer-motion";
import SacredGeometry from "../ui/sacred-geometry";

// Animation variants for mobile menu
const containerVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { 
    opacity: 1, 
    height: "auto",
    transition: { 
      duration: 0.3,
      staggerChildren: 0.05
    }
  },
  exit: { 
    opacity: 0, 
    height: 0,
    transition: { 
      duration: 0.3, 
      when: "afterChildren"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Define the navigation items structure
interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

// First row navigation items - based on the screenshot
const firstRowItems: NavItem[] = [
  { name: "Home", path: "/", icon: <Home className="h-4 w-4" /> },
  { name: "About", path: "/about", icon: <Users className="h-4 w-4" /> },
  { name: "Music", path: "/archived-music", icon: <Music className="h-4 w-4" /> },
  { name: "Tour", path: "/tour", icon: <Calendar className="h-4 w-4" /> }
];

// Second row navigation items - based on the screenshot
const secondRowItems: NavItem[] = [
  { name: "Shop", path: "/shop", icon: <ShoppingBag className="h-4 w-4" /> },
  { name: "Engage", path: "/engage", icon: <Heart className="h-4 w-4" /> },
  { name: "Blog", path: "/blog", icon: <Headphones className="h-4 w-4" /> },
  { name: "AI Chat", path: "/chat", icon: <MessageSquare className="h-4 w-4" /> }
];

// Third row navigation items - based on the screenshot
const thirdRowItems: NavItem[] = [
  { name: "Community Hub", path: "/community", icon: <Users className="h-4 w-4" /> },
  { name: "Newsletter", path: "/newsletter", icon: <Mail className="h-4 w-4" /> },
  { name: "Collaboration", path: "/collaboration", icon: <Heart className="h-4 w-4" /> },
  { name: "Contact", path: "/contact", icon: <MessageSquare className="h-4 w-4" /> }
];

// Define the component as a named export
export const MainHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  const { autoHideNav } = useAccessibility();
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle scroll event for auto-hiding navigation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle navigation click
  const handleNavigationClick = useCallback((path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  }, [navigate]);

  // Handle search submit for site-wide search
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      
      toast({
        title: "Searching",
        description: `Finding results for "${searchQuery.trim()}"`,
        variant: "default",
      });
    }
  }, [searchQuery, navigate, toast]);

  return (
    <header 
      className={`fixed top-0 z-[100] w-full bg-black/80 backdrop-blur-lg border-b border-white/5 transition-all duration-300 ${
        isScrolled ? 'h-16' : 'h-20'
      }`}
    >
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full relative">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
              
              {/* Geometric pattern inside the logo */}
              <div className="absolute inset-0 opacity-50 group-hover:opacity-80 transition-opacity">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-6 rotate-45 bg-gradient-to-r from-cyan-500/30 to-purple-600/30 rounded-sm"></div>
                </div>
              </div>
              
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">DLW</span>
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300 drop-shadow-[0_1px_1px_rgba(0,235,214,0.5)]">
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
                <h3 className="text-xs uppercase text-white/50 font-medium mb-2">Connect</h3>
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
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sacred Geometry Elements - Positioned at outside edges of the header */}
      <div className="absolute hidden md:block -left-16 top-1/2 transform -translate-y-1/2">
        <SacredGeometry 
          variant="merkaba" 
          size={60} 
          animated={true}
          intensity="medium" 
          className="text-cyan-400" 
        />
      </div>
      
      <div className="absolute hidden md:block -right-16 top-1/2 transform -translate-y-1/2">
        <SacredGeometry 
          variant="merkaba" 
          size={60} 
          animated={true}
          intensity="medium" 
          className="text-cyan-400" 
        />
      </div>
    </header>
  );
}

// Also export as default for backward compatibility
export default MainHeader;