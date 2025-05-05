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
  MoonStar,
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
import { motion } from "framer-motion";
import SacredGeometry from "../../components/ui/sacred-geometry";

// Animation variants for navigation items
const navItemVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } }
};

// Define the navigation items structure
interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  glowColor?: 'cyan' | 'purple';
  external?: boolean;
}

// First row navigation items - based on the screenshot
const firstRowItems: NavItem[] = [
  { name: "Home", path: "/", icon: <Home className="h-4 w-4" />, glowColor: 'cyan' },
  { name: "About", path: "/about", icon: <MoonStar className="h-4 w-4" />, glowColor: 'purple' },
  { name: "Music", path: "/archived-music", icon: <Music className="h-4 w-4" />, glowColor: 'cyan' },
  { name: "Tour", path: "/tour", icon: <Calendar className="h-4 w-4" />, glowColor: 'purple' }
];

// Second row navigation items - based on the screenshot
const secondRowItems: NavItem[] = [
  { name: "Shop", path: "/shop", icon: <ShoppingBag className="h-4 w-4" />, glowColor: 'cyan' },
  { name: "Engage", path: "/engage", icon: <Heart className="h-4 w-4" />, glowColor: 'purple' },
  { name: "Blog", path: "/blog", icon: <Headphones className="h-4 w-4" />, glowColor: 'cyan' },
  { name: "AI Chat", path: "/chat", icon: <MessageSquare className="h-4 w-4" />, glowColor: 'purple' }
];

// Third row navigation items - based on the screenshot
const thirdRowItems: NavItem[] = [
  { name: "Community Hub", path: "/community", icon: <Users className="h-4 w-4" />, glowColor: 'cyan' },
  { name: "Newsletter", path: "/newsletter", icon: <Mail className="h-4 w-4" />, glowColor: 'purple' },
  { name: "Collaboration", path: "/collaboration", icon: <Heart className="h-4 w-4" />, glowColor: 'cyan' },
  { name: "Contact", path: "/contact", icon: <MessageSquare className="h-4 w-4" />, glowColor: 'purple' }
];

// Social media links
const socialLinks: NavItem[] = [
  { name: "Facebook", icon: <Facebook className="h-5 w-5" />, path: "https://facebook.com/DaleTheWhale", external: true },
  { name: "Twitter", icon: <Twitter className="h-5 w-5" />, path: "https://twitter.com/DaleTheWhale", external: true },
  { name: "Instagram", icon: <Instagram className="h-5 w-5" />, path: "https://instagram.com/DaleTheWhale", external: true },
  { name: "YouTube", icon: <Youtube className="h-5 w-5" />, path: "https://youtube.com/DaleTheWhale", external: true }
];

// Define the component as a standard function
const MainHeader = () => {
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
      className="fixed top-0 z-[100] w-full bg-[#070b1a]/95 backdrop-blur-lg border-b border-white/5 transition-all duration-300"
    >
      <div className="container mx-auto py-4 relative">
        {/* Logo and Main Content */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                DLW
              </div>
              <span className="text-lg font-medium text-blue-100">Dale Loves Whales</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900/60 border border-slate-700 rounded-md px-3 py-1 pl-8 text-white w-48 text-sm"
              />
              <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </form>
            
            {/* Navigation controls */}
            <div className="flex items-center ml-4 space-x-1">
              <button 
                onClick={() => window.history.back()}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/50"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => window.history.forward()}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/50"
                aria-label="Forward"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/50"
                aria-label="Reload"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Login Button */}
          <div>
            <Link 
              href="/login" 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium"
            >
              Log In
            </Link>
          </div>
        </div>
        
        {/* Navigation - First Row */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {firstRowItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                handleNavigationClick(item.path);
              }}
              className="flex items-center text-white/80 hover:text-white space-x-1 text-sm"
            >
              <div className="h-4 w-4 flex-shrink-0 opacity-60">
                {item.icon}
              </div>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        
        {/* Navigation - Second Row */}
        <div className="mt-3 grid grid-cols-4 gap-4">
          {secondRowItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                handleNavigationClick(item.path);
              }}
              className="flex items-center text-white/80 hover:text-white space-x-1 text-sm"
            >
              <div className="h-4 w-4 flex-shrink-0 opacity-60">
                {item.icon}
              </div>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        
        {/* Navigation - Third Row */}
        <div className="mt-3 grid grid-cols-4 gap-4">
          {thirdRowItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                handleNavigationClick(item.path);
              }}
              className="flex items-center text-white/80 hover:text-white space-x-1 text-sm"
            >
              <div className="h-4 w-4 flex-shrink-0 opacity-60">
                {item.icon}
              </div>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        
        {/* Mobile Menu Button - Only visible on small screens */}
        <button
          className="md:hidden absolute top-4 right-4 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        
        {/* Sacred Geometry Elements - Left and Right */}
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
      </div>
      
      {/* Mobile menu - Only visible when open on small screens */}
      <div 
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden bg-slate-900/95 backdrop-blur-md ${
          isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-4 space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-md px-3 py-2 pl-10 text-white w-full"
            />
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          </form>
          
          {/* Mobile Nav Items - Group all items */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase text-slate-400 font-medium mb-2">Navigation</h3>
            <div className="grid grid-cols-2 gap-3">
              {[...firstRowItems, ...secondRowItems, ...thirdRowItems].map((item) => (
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
          </div>
        </div>
      </div>
    
      {/* Background Elements with Sacred Geometry - Centered and sides */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* FIRST SET - Sacred geometry circles on outer edges */}
        <div className="first-merkaba-set">
          {/* Left circle foreground - first set */}
          <div className="absolute top-1/2 left-[8%] transform -translate-x-1/2 -translate-y-1/2 hidden md:block z-20">
            <div className="animate-spin-very-slow" style={{ animationDuration: '15s' }}>
              <SacredGeometry 
                variant="merkaba" 
                size={90} 
                animated={false} 
                intensity="medium" 
                className="text-cyan-300" 
              />
            </div>
          </div>

          {/* Left circle background/shadow - first set */}
          <div className="absolute top-1/2 left-[8%] transform -translate-x-1/2 -translate-y-1/2 hidden md:block z-10">
            <div className="animate-spin-very-slow" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
              <SacredGeometry 
                variant="merkaba" 
                size={110} 
                animated={false} 
                intensity="subtle" 
                className="text-purple-500/50" 
              />
            </div>
          </div>
        </div>

        {/* SECOND SET - Sacred geometry circles on outer edges */}
        <div className="second-merkaba-set">
          {/* Right circle foreground - second set */}
          <div className="absolute top-1/2 right-[8%] transform translate-x-1/2 -translate-y-1/2 hidden md:block z-20">
            <div className="animate-spin-very-slow" style={{ animationDuration: '22s' }}>
              <SacredGeometry 
                variant="merkaba" 
                size={90} 
                animated={false} 
                intensity="medium" 
                className="text-cyan-300" 
              />
            </div>
          </div>

          {/* Right circle background/shadow - second set */}
          <div className="absolute top-1/2 right-[8%] transform translate-x-1/2 -translate-y-1/2 hidden md:block z-10">
            <div className="animate-spin-very-slow" style={{ animationDuration: '22s', animationDirection: 'reverse' }}>
              <SacredGeometry 
                variant="merkaba" 
                size={110} 
                animated={false} 
                intensity="subtle" 
                className="text-purple-500/50" 
              />
            </div>
          </div>
        </div>

        {/* THIRD SET - Sacred geometry circles on outer edges */}
        <div className="third-merkaba-set">
          {/* Left circle foreground - third set (lower) */}
          <div className="absolute bottom-[10%] left-[15%] transform -translate-x-1/2 hidden md:block z-20">
            <div className="animate-spin-very-slow" style={{ animationDuration: '18s' }}>
              <SacredGeometry 
                variant="merkaba" 
                size={70} 
                animated={false} 
                intensity="medium" 
                className="text-cyan-300" 
              />
            </div>
          </div>

          {/* Left circle background/shadow - third set (lower) */}
          <div className="absolute bottom-[10%] left-[15%] transform -translate-x-1/2 hidden md:block z-10">
            <div className="animate-spin-very-slow" style={{ animationDuration: '18s', animationDirection: 'reverse' }}>
              <SacredGeometry 
                variant="merkaba" 
                size={85} 
                animated={false} 
                intensity="subtle" 
                className="text-purple-500/50" 
              />
            </div>
          </div>
        </div>

        {/* FOURTH SET - Sacred geometry circles on outer edges */}
        <div className="fourth-merkaba-set">
          {/* Right circle foreground - fourth set (lower) */}
          <div className="absolute bottom-[10%] right-[15%] transform translate-x-1/2 hidden md:block z-20">
            <div className="animate-spin-very-slow" style={{ animationDuration: '25s' }}>
              <SacredGeometry 
                variant="merkaba" 
                size={70} 
                animated={false} 
                intensity="medium" 
                className="text-cyan-300" 
              />
            </div>
          </div>

          {/* Right circle background/shadow - fourth set (lower) */}
          <div className="absolute bottom-[10%] right-[15%] transform translate-x-1/2 hidden md:block z-10">
            <div className="animate-spin-very-slow" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
              <SacredGeometry 
                variant="merkaba" 
                size={85} 
                animated={false} 
                intensity="subtle" 
                className="text-purple-500/50" 
              />
            </div>
          </div>
        </div>

        {/* Additional geometric accents */}
        <div className="absolute inset-0 hidden md:block">
          {/* Center subtle glow */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[80px] bg-gradient-to-r from-cyan-500/5 via-purple-500/10 to-cyan-500/5 blur-2xl"></div>
          
          {/* Sacred geometry elements in center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
            <div className="animate-pulse-slow" style={{ animationDuration: '8s' }}>
              <SacredGeometry 
                variant="hexagon" 
                size={200} 
                animated={false} 
                intensity="subtle" 
                className="text-white" 
              />
            </div>
          </div>
          
          {/* Top edge accent */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
          
          {/* Bottom edge accent */}
          <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        </div>
      </div>

      {/* Semi-transparent overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0 pointer-events-none"></div>

      {/* Main header content */}
      <div className="container mx-auto relative z-10">
        {/* Top navigation bar with logo and primary navigation */}
        <div className="flex items-center justify-between mb-1">
          {/* Logo */}
          <Link 
            href="/" 
            onClick={(e) => {
              e.preventDefault();
              handleNavigationClick('/');
            }}
            className="flex items-center group"
          >
            {/* Logo container with glow effects */}
            <div className="relative w-12 h-12 mr-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/40 to-purple-600/40 opacity-90 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-600/30 blur-md opacity-70 group-hover:opacity-90 group-hover:scale-110 transition-all duration-500"></div>
              
              {/* Logo shape */}
              <div className="absolute inset-0 flex items-center justify-center">
                <SacredGeometry 
                  variant="merkaba" 
                  size={32} 
                  animated={true} 
                  className="text-white" 
                  intensity="vivid"
                />
              </div>
            </div>
            
            {/* Site title */}
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                Dale Loves Whales
              </h1>
              <div className="text-xs text-white/70">Cosmic Harmonies</div>
            </div>
          </Link>
          
          {/* Primary Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-2">
            {/* Map through primary nav items */}
            {firstRowItems.map((item) => (
              <motion.div
                key={item.path}
                variants={navItemVariants}
                initial="initial"
                whileHover="hover"
              >
                <Link
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigationClick(item.path);
                  }}
                  className={`
                    px-3 py-1.5 text-sm rounded-md flex items-center
                    transition-colors duration-300 relative group
                    ${item.path === window.location.pathname
                      ? 'text-white bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-white/10'
                      : 'text-white/80 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5'
                    }
                  `}
                >
                  {/* Glow effect for active items */}
                  {item.path === window.location.pathname && (
                    <div className={`absolute inset-0 rounded-md ${
                      item.glowColor === 'cyan' ? 'bg-cyan-600/20' : 'bg-purple-600/20'
                    } blur-sm -z-10`}></div>
                  )}
                  
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
          
          {/* Right side items - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Search form */}
            <form 
              onSubmit={handleSearchSubmit}
              className="relative mr-2"
            >
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 h-8 px-3 pl-8 text-sm bg-black/30 border border-white/10 rounded-md text-white"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            </form>
            
            {/* User Menu / Login Button */}
            {user ? (
              <button className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/80 to-purple-600/80 flex items-center justify-center text-white text-sm">
                {user.email ? user.email.charAt(0).toUpperCase() : "U"}
              </button>
            ) : (
              <Link 
                href="/login"
                className="px-3 py-1.5 text-sm rounded-md bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:from-cyan-500 hover:to-purple-500 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
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
        
        {/* Secondary Navigation - Desktop */}
        <div className="hidden md:flex justify-between items-center">
          {/* Left side - Secondary nav items */}
          <nav className="flex items-center space-x-2">
            {secondRowItems.map((item) => (
              <motion.div
                key={item.path}
                variants={navItemVariants}
                initial="initial"
                whileHover="hover"
              >
                <Link
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigationClick(item.path);
                  }}
                  className={`
                    px-3 py-1.5 text-sm rounded-md flex items-center
                    transition-colors duration-300 relative group
                    ${item.path === window.location.pathname
                      ? 'text-white bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-white/10'
                      : 'text-white/70 hover:text-white/90 border border-transparent hover:border-white/10 hover:bg-white/5'
                    }
                  `}
                >
                  {/* Glow effect */}
                  {item.path === window.location.pathname && (
                    <div className={`absolute inset-0 rounded-md ${
                      item.glowColor === 'cyan' ? 'bg-cyan-600/20' : 'bg-purple-600/20'
                    } blur-sm -z-10`}></div>
                  )}
                  
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
          
          {/* Right side - Community links */}
          <nav className="flex items-center space-x-2">
            {thirdRowItems.map((item) => (
              <motion.div
                key={item.path}
                variants={navItemVariants}
                initial="initial"
                whileHover="hover"
              >
                <Link
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigationClick(item.path);
                  }}
                  className={`
                    px-2 py-1 text-xs rounded-md flex items-center
                    transition-colors duration-300 relative group
                    ${item.path === window.location.pathname
                      ? 'text-white bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-white/10'
                      : 'text-white/60 hover:text-white/80 border border-transparent hover:border-white/5 hover:bg-white/5'
                    }
                  `}
                >
                  {/* Subtle glow */}
                  {item.path === window.location.pathname && (
                    <div className={`absolute inset-0 rounded-md ${
                      item.glowColor === 'cyan' ? 'bg-cyan-600/10' : 'bg-purple-600/10'
                    } blur-sm -z-10`}></div>
                  )}
                  
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>
        
        {/* Mobile Navigation Menu */}
        <div 
          className={`
            md:hidden fixed inset-x-0 top-[60px] bg-black/90 backdrop-blur-lg border-t border-white/10
            transform transition-transform duration-300 ease-in-out z-50
            ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}
          `}
        >
          <div className="container mx-auto py-4 px-5">
            {/* Mobile Search */}
            <form 
              onSubmit={handleSearchSubmit}
              className="relative mb-4"
            >
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-3 pl-10 text-sm bg-black/30 border border-white/10 rounded-md text-white"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            </form>
            
            {/* Navigation sections */}
            <div className="space-y-6">
              {/* Primary Navigation */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-white/40 mb-2">Navigation</h3>
                <nav className="grid grid-cols-2 gap-2">
                  {[...firstRowItems, ...secondRowItems].map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigationClick(item.path);
                      }}
                      className={`
                        px-3 py-2.5 text-sm rounded-md flex items-center
                        transition-colors duration-300 relative
                        ${item.path === window.location.pathname
                          ? 'text-white bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-white/10'
                          : 'text-white/80 border border-white/5 hover:border-white/20 hover:bg-white/5'
                        }
                      `}
                    >
                      {item.icon}
                      <span className="ml-2">{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>
              
              {/* Community Links */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-white/40 mb-2">Community</h3>
                <nav className="grid grid-cols-2 gap-2">
                  {thirdRowItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigationClick(item.path);
                      }}
                      className={`
                        px-3 py-2.5 text-sm rounded-md flex items-center
                        transition-colors duration-300 relative
                        ${item.path === window.location.pathname
                          ? 'text-white bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-white/10'
                          : 'text-white/70 border border-white/5 hover:border-white/10 hover:bg-white/5'
                        }
                      `}
                    >
                      {item.icon}
                      <span className="ml-2">{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>
              
              {/* Social Media */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-white/40 mb-2">Connect</h3>
                <div className="flex space-x-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label={social.name}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
              
              {/* Login/User */}
              <div className="pt-2 border-t border-white/10">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white">
                      {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{user.email || "User"}</div>
                      <button className="text-xs text-white/60 hover:text-white/80">Sign Out</button>
                    </div>
                  </div>
                ) : (
                  <Link 
                    href="/login"
                    className="w-full py-2.5 text-sm rounded-md bg-gradient-to-r from-cyan-600 to-purple-600 text-white flex items-center justify-center hover:from-cyan-500 hover:to-purple-500 transition-colors"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Login to your account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default MainHeader;
export { MainHeader };