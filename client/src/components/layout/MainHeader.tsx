/**
 * MainHeader.tsx
 * 
 * This is the primary header component for the website, featuring sacred geometry,
 * staggered navigation, and cosmic design elements.
 * 
 * Created: 2025-04-05 - Updated with enhancements
 * Latest Update: Added sacred geometry elements and improved staggered navigation
 */

import { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
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
  Home
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion } from "framer-motion";
import SacredGeometry from "../../components/ui/sacred-geometry";

// Define the navigation items structure
interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  glowColor?: string;
}

// First row nav items - main navigation
const primaryNavItems: NavItem[] = [
  { name: "Home", path: "/", icon: <Home className="h-4 w-4 mr-1" />, glowColor: "cyan" },
  { name: "About", path: "/about", icon: <MoonStar className="h-4 w-4 mr-1" />, glowColor: "purple" },
  { name: "Music", path: "/music-release", icon: <Music className="h-4 w-4 mr-1" />, glowColor: "cyan" },
  { name: "Tour", path: "/tour", icon: <Calendar className="h-4 w-4 mr-1" />, glowColor: "purple" }
];

// Second row nav items - secondary navigation
const secondaryNavItems: NavItem[] = [
  { name: "Shop", path: "/shop", icon: <ShoppingBag className="h-4 w-4 mr-1" />, glowColor: "purple" },
  { name: "Blog", path: "/blog", icon: <Headphones className="h-4 w-4 mr-1" />, glowColor: "cyan" }
];

// Community links that should be accessible
const communityLinks: NavItem[] = [
  { name: "Newsletter", path: "/newsletter", icon: <Music className="h-4 w-4 mr-1" />, glowColor: "cyan" },
  { name: "Community", path: "/community", icon: <Music className="h-4 w-4 mr-1" />, glowColor: "purple" },
  { name: "Collaboration", path: "/collaboration", icon: <Music className="h-4 w-4 mr-1" />, glowColor: "cyan" },
  { name: "Contact", path: "/contact", icon: <Music className="h-4 w-4 mr-1" />, glowColor: "purple" }
];

// Music links for mobile
const musicLinks: NavItem[] = [
  { name: "New Releases", path: "/music-release", icon: <Music className="h-4 w-4 mr-1" /> },
  { name: "Archived Music", path: "/archived-music", icon: <Music className="h-4 w-4 mr-1" /> },
  { name: "Cosmic Connectivity", path: "/cosmic-connectivity", icon: <Music className="h-4 w-4 mr-1" /> }
];

// Social media links
const socialLinks = [
  { name: "Facebook", icon: <Facebook className="h-5 w-5" aria-hidden="true" />, path: "https://facebook.com/DaleTheWhale", external: true },
  { name: "Twitter", icon: <Twitter className="h-5 w-5" aria-hidden="true" />, path: "https://twitter.com/DaleTheWhale", external: true },
  { name: "Instagram", icon: <Instagram className="h-5 w-5" aria-hidden="true" />, path: "https://instagram.com/DaleTheWhale", external: true },
  { name: "YouTube", icon: <Youtube className="h-5 w-5" aria-hidden="true" />, path: "https://youtube.com/DaleTheWhale", external: true }
];

export function MainHeader() {
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

  // Handle navigation click
  const handleNavigationClick = useCallback((path: string) => {
    // First scroll to top with smooth behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Add a small delay to allow the scroll animation to complete
    setTimeout(() => {
      setIsMobileMenuOpen(false);
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

  // Define hover animation variants for nav items
  const navItemVariants = {
    initial: { y: 0, opacity: 1, scale: 1 },
    hover: { y: -3, opacity: 1, scale: 1.05, transition: { duration: 0.2 } }
  };

  return (
    <header 
      className={`
        sticky top-0 z-50 transition-all duration-300
        ${isScrolled ? 'py-1' : 'py-3'}
        ${autoHideNav ? 'transition-transform duration-300' : ''}
      `}
    >
      {/* Background Elements with Sacred Geometry - Centered and sides */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Center star geometry */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
          <SacredGeometry 
            variant="star" 
            size={120} 
            animated={true} 
            intensity="vivid" 
            className="text-cyan-300" 
          />
        </div>
      
        <div className="absolute -top-10 -right-10 opacity-50 transform rotate-45 animate-float">
          <SacredGeometry 
            variant="merkaba" 
            size={90} 
            animated={true} 
            intensity="vivid" 
            className="text-cyan-400" 
          />
        </div>
        <div className="absolute -bottom-10 -left-10 opacity-40 animate-float" style={{ animationDelay: '-2s' }}>
          <SacredGeometry 
            variant="hexagon" 
            size={80} 
            animated={true} 
            intensity="vivid" 
            className="text-purple-400" 
          />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-5 opacity-30 animate-float" style={{ animationDelay: '-1.5s' }}>
          <SacredGeometry 
            variant="tetrahedron" 
            size={60} 
            animated={true} 
            intensity="medium" 
            className="text-cyan-300" 
          />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -left-5 opacity-30 animate-float" style={{ animationDelay: '-3s' }}>
          <SacredGeometry 
            variant="octahedron" 
            size={60} 
            animated={true} 
            intensity="medium" 
            className="text-purple-300" 
          />
        </div>
        
        {/* Additional smaller elements for more visual interest */}
        <div className="absolute top-1/4 right-1/3 opacity-20 animate-cosmic-pulse">
          <SacredGeometry 
            variant="triangle" 
            size={30} 
            animated={true} 
            intensity="medium" 
            className="text-purple-300" 
          />
        </div>
        <div className="absolute bottom-1/4 left-1/3 opacity-20 animate-cosmic-pulse" style={{ animationDelay: '-2s' }}>
          <SacredGeometry 
            variant="pentagon" 
            size={30} 
            animated={true} 
            intensity="medium" 
            className="text-cyan-300" 
          />
        </div>
      </div>
      
      {/* Header Content */}
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Glowing Header Background with Space on Sides */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#050f28]/90 via-[#091429]/90 to-[#0a1f3c]/90 backdrop-blur-sm border border-[#00ebd6]/20 shadow-lg shadow-cyan-500/10"></div>
        
        {/* Cosmic Glow Effects */}
        <div className="absolute inset-x-0 -top-10 h-10 bg-gradient-to-b from-cyan-500/30 to-transparent"></div>
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 blur-xl opacity-50 animate-pulse" style={{ animationDuration: '4s' }}></div>
        
        {/* Additional subtle cosmic gradients */}
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-purple-500/10 to-transparent rounded-l-2xl opacity-40"></div>
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent rounded-r-2xl opacity-40"></div>
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
        
        {/* Main Content Container */}
        <div className="relative z-20 py-2">
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
              
              {/* Mobile menu button */}
              <button
                type="button"
                className="ml-4 md:hidden relative group"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <div className="relative p-2 rounded-md bg-black/30 border border-white/10 overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/30 to-cyan-500/20 animate-pulse opacity-70" style={{ animationDuration: '3s' }}></div>
                  </div>
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6 text-[#e8e6e3] group-hover:text-[#00ebd6] transition-colors relative z-10" aria-hidden="true" />
                  ) : (
                    <Menu className="h-6 w-6 text-[#e8e6e3] group-hover:text-[#00ebd6] transition-colors relative z-10" aria-hidden="true" />
                  )}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/30 blur-md"></div>
                </div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/40 to-purple-500/40 rounded-md blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>

            {/* Social Icons - Desktop - Centered */}
            <div className="hidden md:flex items-center justify-center space-x-3 mx-auto">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.name} (opens in new tab)`}
                  className="text-[#e8e6e3]/60 hover:text-cyan-400 transition-colors"
                  whileHover={{ scale: 1.2, y: -2 }}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                >
                  {link.icon}
                  <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl opacity-0 hover:opacity-70 transition-opacity"></div>
                </motion.a>
              ))}
            </div>

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
                  <div className="absolute -inset-1 rounded-full bg-cyan-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
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

          {/* Interlacing Staggered Two-Row Navigation - Desktop */}
          <div className="hidden md:block mt-2 relative">
            {/* Enhanced Sacred Geometry Background Elements with more vibrant effects */}
            <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none">
              <div className="absolute opacity-40 animate-cosmic-intense">
                <SacredGeometry 
                  variant="merkaba" 
                  size={140} 
                  animated={true} 
                  intensity="vivid" 
                  className="text-cyan-300 cosmic-glow-cyan" 
                />
              </div>
              <div className="absolute opacity-35 animate-cosmic-rotate">
                <SacredGeometry 
                  variant="octagon" 
                  size={160} 
                  animated={true} 
                  intensity="medium" 
                  className="text-purple-300 cosmic-glow-purple" 
                />
              </div>
              <div className="absolute -z-1 opacity-20 animate-cosmic-shimmer scale-150">
                <SacredGeometry 
                  variant="star" 
                  size={180} 
                  animated={true} 
                  intensity="subtle" 
                  className="text-cyan-300" 
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              {/* First Row - Staggered from left */}
              <div className="flex justify-center">
                {primaryNavItems.map((item, index) => (
                  <motion.div 
                    key={item.path}
                    className="relative mx-2 md:mx-3 lg:mx-5"
                    initial="initial"
                    whileHover="hover"
                    custom={index}
                  >
                    <Link
                      href={item.path}
                      onClick={() => handleNavigationClick(item.path)}
                      className={`px-4 py-2 text-[#e8e6e3] font-medium text-sm tracking-wide flex items-center relative rounded-md border border-white/10 bg-black/40 hover:bg-black/60 hover:border-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/50 transition-all hover:shadow-[0_0_15px_rgba(${item.glowColor === 'cyan' ? '0,235,214' : '124,58,237'},0.5)] group`}
                    >
                      <div className={`absolute inset-0 rounded-md bg-gradient-to-r from-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/5 to-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                      <div className="absolute -left-1 -top-1 opacity-50 group-hover:opacity-80 transition-opacity duration-300 group-hover:animate-cosmic-glow">
                        <SacredGeometry 
                          variant={index % 2 === 0 ? "hexagon" : "triangle"} 
                          size={16} 
                          intensity={item.glowColor === 'cyan' ? "medium" : "subtle"}
                          className={index % 2 === 0 ? "text-cyan-300" : "text-purple-300"} 
                        />
                      </div>
                      <span className={`text-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-400 transition-all duration-300`}>{item.icon}</span>
                      <span className="ml-1 relative z-10 group-hover:text-white transition-colors duration-300">{item.name}</span>
                      <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/0 via-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/70 to-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/0 transform scale-x-0 origin-center transition-transform duration-300 group-hover:scale-x-100`}></div>
                    </Link>
                    <motion.div 
                      className={`absolute inset-0 rounded-md opacity-0 bg-gradient-to-r ${
                        item.glowColor === 'cyan' 
                          ? 'from-cyan-500/20 to-cyan-500/5' 
                          : 'from-purple-500/20 to-purple-500/5'
                      } -z-10`}
                      variants={navItemVariants}
                      transition={{ delay: index * 0.05 }}
                      animate={{ opacity: [0, 0.2, 0], transition: { duration: 2, repeat: Infinity } }}
                    />
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/0 via-cyan-400 to-cyan-400/0 transform origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* Second Row - Staggered from right with different shapes */}
              <div className="flex justify-center ml-8">
                {secondaryNavItems.map((item, index) => (
                  <motion.div 
                    key={item.path}
                    className="relative mx-2 md:mx-3 lg:mx-5"
                    initial="initial"
                    whileHover="hover"
                    custom={index}
                  >
                    <Link
                      href={item.path}
                      onClick={() => handleNavigationClick(item.path)}
                      className={`px-4 py-2 text-[#e8e6e3] font-medium text-sm tracking-wide flex items-center relative rounded-md border border-white/10 bg-black/40 hover:bg-black/60 hover:border-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/50 transition-all hover:shadow-[0_0_15px_rgba(${item.glowColor === 'cyan' ? '0,235,214' : '124,58,237'},0.5)] group`}
                    >
                      <div className={`absolute inset-0 rounded-md bg-gradient-to-r from-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/5 to-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                      <div className="absolute -left-1 -top-1 opacity-50 group-hover:opacity-80 transition-opacity duration-300 group-hover:animate-cosmic-glow">
                        <SacredGeometry 
                          variant={index % 2 === 0 ? "tetrahedron" : "pentagon"} 
                          size={16} 
                          intensity={item.glowColor === 'cyan' ? "medium" : "subtle"}
                          className={index % 2 === 0 ? "text-purple-300" : "text-cyan-300"} 
                        />
                      </div>
                      <span className={`text-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-400 transition-all duration-300`}>{item.icon}</span>
                      <span className="ml-1 relative z-10 group-hover:text-white transition-colors duration-300">{item.name}</span>
                      <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/0 via-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/70 to-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/0 transform scale-x-0 origin-center transition-transform duration-300 group-hover:scale-x-100`}></div>
                    </Link>
                    <motion.div 
                      className={`absolute inset-0 rounded-md opacity-0 bg-gradient-to-r ${
                        item.glowColor === 'cyan' 
                          ? 'from-cyan-500/20 to-cyan-500/5' 
                          : 'from-purple-500/20 to-purple-500/5'
                      } -z-10`}
                      variants={navItemVariants}
                      transition={{ delay: index * 0.05 }}
                      animate={{ opacity: [0, 0.2, 0], transition: { duration: 2, repeat: Infinity, delay: index * 0.3 } }}
                    />
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400/0 via-purple-400 to-purple-400/0 transform origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                ))}

                {/* Admin link if user is admin */}
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <motion.div
                    initial="initial"
                    whileHover="hover"
                  >
                    <Link 
                      href="/admin" 
                      onClick={() => handleNavigationClick("/admin")}
                      className="px-4 py-2 text-[#fe0064] font-medium text-sm tracking-wide flex items-center relative rounded-md border border-pink-500/30 bg-black/40 hover:bg-black/60 hover:border-pink-500/50 transition-all hover:shadow-[0_0_10px_rgba(254,0,100,0.3)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Admin
                    </Link>
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500/0 via-pink-500 to-pink-500/0 transform origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Community Links - Desktop - Matching Primary Nav Style */}
          <div className="hidden md:flex justify-center mt-2 space-x-2">
            {communityLinks.map((item, index) => (
              <motion.div 
                key={item.path}
                className="relative mx-2 md:mx-3 lg:mx-5"
                initial="initial"
                whileHover="hover"
                custom={index}
              >
                <Link
                  href={item.path}
                  onClick={() => handleNavigationClick(item.path)}
                  className={`px-3 py-1.5 text-[#e8e6e3] font-medium text-xs tracking-wide flex items-center relative rounded-md border border-white/10 bg-black/20 hover:bg-black/40 hover:border-${item.glowColor === 'cyan' ? 'cyan' : 'indigo'}-500/40 transition-all hover:shadow-[0_0_10px_rgba(${item.glowColor === 'cyan' ? '0,235,214' : '99,102,241'},0.4)] group`}
                >
                  <div className={`absolute inset-0 rounded-md bg-gradient-to-r from-${item.glowColor === 'cyan' ? 'cyan' : 'indigo'}-500/5 to-${item.glowColor === 'cyan' ? 'cyan' : 'indigo'}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="absolute -left-1 -top-1 opacity-50 group-hover:opacity-80 transition-opacity duration-300 group-hover:animate-cosmic-pulse">
                    <SacredGeometry 
                      variant={index % 2 === 0 ? "hexagon" : "triangle"} 
                      size={14} 
                      intensity={item.glowColor === 'cyan' ? "medium" : "subtle"}
                      className={index % 2 === 0 ? "text-cyan-300" : "text-purple-300"} 
                    />
                  </div>
                  <span className={`text-${item.glowColor === 'cyan' ? 'cyan' : 'indigo'}-400 transition-all duration-300`}>{item.icon}</span>
                  <span className="ml-1 relative z-10 group-hover:text-white transition-colors duration-300">{item.name}</span>
                </Link>
                <motion.div 
                  className={`absolute inset-0 rounded-md opacity-0 bg-gradient-to-r ${
                    item.glowColor === 'cyan' 
                      ? 'from-cyan-500/20 to-cyan-500/5' 
                      : 'from-purple-500/20 to-purple-500/5'
                  } -z-10`}
                  variants={navItemVariants}
                  transition={{ delay: index * 0.05 }}
                  animate={{ opacity: [0, 0.2, 0], transition: { duration: 2, repeat: Infinity } }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400/0 via-cyan-400 to-cyan-400/0 transform origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </div>

          {/* Mobile Menu */}
          <div
            className={`
              fixed inset-0 top-[70px] bg-gradient-to-b from-[#050f28]/95 to-[#0a1f3c]/95 backdrop-blur-md z-40 transform transition-transform ease-in-out duration-300
              ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
            `}
          >
            {/* Enhanced Sacred Geometry Background Elements - Mobile Menu */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[20%] right-[10%] opacity-30 animate-cosmic-glow">
                <SacredGeometry 
                  variant="merkaba" 
                  size={140} 
                  animated={true} 
                  intensity="medium" 
                  className="text-cyan-300 cosmic-glow-cyan" 
                />
              </div>
              <div className="absolute bottom-[30%] left-[15%] opacity-25 animate-float">
                <SacredGeometry 
                  variant="hexagon" 
                  size={120} 
                  animated={true} 
                  intensity="medium" 
                  className="text-purple-300 cosmic-glow-purple" 
                />
              </div>
              <div className="absolute -top-20 -left-20 opacity-15 animate-cosmic-rotate">
                <SacredGeometry 
                  variant="octahedron" 
                  size={200} 
                  animated={true} 
                  intensity="subtle" 
                  className="text-purple-300" 
                />
              </div>
              <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 opacity-10 animate-cosmic-shimmer">
                <SacredGeometry 
                  variant="star" 
                  size={250} 
                  animated={true} 
                  intensity="subtle" 
                  className="text-cyan-300" 
                />
              </div>
              <div className="absolute bottom-[10%] right-[10%] opacity-20 animate-cosmic-pulse">
                <SacredGeometry 
                  variant="tetrahedron" 
                  size={80} 
                  animated={true} 
                  intensity="medium" 
                  className="text-cyan-300" 
                />
              </div>
            </div>
            
            <div className="h-full overflow-y-auto pt-4 pb-20 relative">
              <nav className="px-4 space-y-6">
                {/* Mobile Primary Links */}
                <div className="border-b border-[#00ebd6]/20 pb-6">
                  <div className="flex items-center mb-4">
                    <SacredGeometry 
                      variant="hexagon" 
                      size={18} 
                      intensity="medium" 
                      className="text-cyan-300 mr-2" 
                    />
                    <h3 className="text-xs font-semibold text-[#00ebd6] uppercase tracking-wider">
                      Navigation
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[...primaryNavItems, ...secondaryNavItems].map((item, index) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => handleNavigationClick(item.path)}
                        className={`flex items-center space-x-2 bg-black/30 rounded-md p-2 border border-${item.glowColor === 'cyan' ? '[#00ebd6]' : 'purple'}/10 hover:border-${item.glowColor === 'cyan' ? '[#00ebd6]' : 'purple'}/40 text-[#e8e6e3] hover:text-${item.glowColor === 'cyan' ? '[#00ebd6]' : 'purple-300'} transition-all relative group hover:shadow-[0_0_12px_rgba(${item.glowColor === 'cyan' ? '0,235,214' : '168,85,247'},0.25)]`}
                      >
                        <div className={`absolute inset-0 rounded-md bg-gradient-to-r from-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/5 to-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                        <div className="absolute -left-1 -top-1 opacity-30 group-hover:opacity-70 transition-opacity duration-300 group-hover:animate-cosmic-pulse">
                          <SacredGeometry 
                            variant={index % 2 === 0 ? "hexagon" : "triangle"} 
                            size={12} 
                            intensity={item.glowColor === 'cyan' ? "medium" : "subtle"}
                            className={index % 2 === 0 ? "text-cyan-300" : "text-purple-300"} 
                          />
                        </div>
                        <span className={`text-${item.glowColor === 'cyan' ? 'cyan' : 'purple'}-400 transition-all duration-300 ${item.glowColor === 'cyan' ? 'group-hover:cosmic-glow-cyan' : 'group-hover:cosmic-glow-purple'}`}>{item.icon}</span>
                        <span className="relative z-10 transition-colors duration-300">{item.name}</span>
                      </Link>
                    ))}

                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                      <Link 
                        href="/admin" 
                        onClick={() => handleNavigationClick("/admin")}
                        className="flex items-center justify-center space-x-2 bg-black/30 rounded-md py-3 px-2 border border-pink-500/20 hover:border-pink-500/50 text-[#fe0064] transition-all col-span-2 relative group hover:shadow-[0_0_15px_rgba(254,0,100,0.3)]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
                        <div className="absolute -left-2 -top-2 opacity-50 group-hover:opacity-80 group-hover:animate-cosmic-pulse transition-opacity duration-300">
                          <SacredGeometry 
                            variant="star" 
                            size={18} 
                            intensity="medium" 
                            className="text-pink-500 cosmic-glow-pink" 
                          />
                        </div>
                        <svg viewBox="0 0 24 24" className="h-5 w-5 relative text-pink-400 group-hover:text-pink-300 transition-colors duration-300" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-medium relative z-10 group-hover:text-white transition-colors duration-300">Admin Portal</span>
                        <div className="absolute -right-1 -bottom-1 opacity-30 group-hover:opacity-70 transition-opacity duration-300 group-hover:animate-cosmic-shimmer">
                          <SacredGeometry 
                            variant="pentagon"
                            size={14} 
                            intensity="medium" 
                            className="text-pink-500" 
                          />
                        </div>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Mobile Community Links */}
                <div className="border-b border-[#00ebd6]/20 pb-6">
                  <div className="flex items-center mb-4">
                    <SacredGeometry 
                      variant="pentagon" 
                      size={18} 
                      intensity="medium" 
                      className="text-purple-300 mr-2" 
                    />
                    <h3 className="text-xs font-semibold text-[#00ebd6] uppercase tracking-wider">
                      Community
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {communityLinks.map((item, index) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => handleNavigationClick(item.path)}
                        className="flex items-center space-x-1 bg-black/20 rounded-md py-1.5 px-2.5 border border-purple-500/10 hover:border-purple-500/40 text-[#e8e6e3] hover:text-purple-300 transition-all relative group hover:shadow-[0_0_10px_rgba(168,85,247,0.25)]"
                      >
                        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute -left-1 -top-1 opacity-30 group-hover:opacity-70 transition-opacity duration-300 group-hover:animate-cosmic-pulse">
                          <SacredGeometry 
                            variant="triangle" 
                            size={10} 
                            intensity="medium" 
                            className="text-purple-300 cosmic-glow-purple"
                          />
                        </div>
                        {item.icon && <span className="text-purple-400 transition-all duration-300 group-hover:cosmic-glow-purple">{item.icon}</span>}
                        <span className="text-sm relative z-10 transition-colors duration-300">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Mobile Music Links */}
                <div className="border-b border-[#00ebd6]/20 pb-6">
                  <div className="flex items-center mb-4">
                    <SacredGeometry 
                      variant="circle" 
                      size={18} 
                      intensity="medium" 
                      className="text-indigo-300 mr-2" 
                    />
                    <h3 className="text-xs font-semibold text-[#00ebd6] uppercase tracking-wider">
                      Music
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {musicLinks.map((item, index) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => handleNavigationClick(item.path)}
                        className="flex items-center space-x-1 bg-black/20 rounded-md py-1.5 px-2.5 border border-indigo-500/10 hover:border-indigo-500/40 text-[#e8e6e3] hover:text-indigo-300 transition-all relative group hover:shadow-[0_0_10px_rgba(99,102,241,0.25)]"
                      >
                        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute -left-1 -top-1 opacity-30 group-hover:opacity-70 transition-opacity duration-300 group-hover:animate-cosmic-shimmer">
                          <SacredGeometry 
                            variant="heptagon" 
                            size={10} 
                            intensity="medium" 
                            className="text-indigo-300 cosmic-glow-indigo"
                          />
                        </div>
                        {item.icon && <span className="text-indigo-400 transition-all duration-300 group-hover:cosmic-glow-indigo">{item.icon}</span>}
                        <span className="text-sm relative z-10 transition-colors duration-300">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Mobile Social Links */}
                <div className="border-b border-[#00ebd6]/20 pb-6">
                  <div className="flex items-center mb-4">
                    <SacredGeometry 
                      variant="star" 
                      size={18} 
                      intensity="medium" 
                      className="text-cyan-300 mr-2" 
                    />
                    <h3 className="text-xs font-semibold text-[#00ebd6] uppercase tracking-wider">
                      Follow Us
                    </h3>
                  </div>
                  <div className="flex justify-around">
                    {socialLinks.map(link => (
                      <a
                        key={link.name}
                        href={link.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center text-center p-2 text-[#e8e6e3]/80 hover:text-[#00ebd6] relative group"
                      >
                        <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-70 transition-opacity"></div>
                        <div className="absolute inset-0 animate-cosmic-pulse opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-full bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10"></div>
                        <span className="mb-1 relative z-10 transform transition-transform duration-300 group-hover:scale-110 group-hover:cosmic-glow-cyan">{link.icon}</span>
                        <span className="text-xs relative z-10 transition-all duration-300 group-hover:font-medium">{link.name}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Mobile Search */}
                <div className="pt-2">
                  <div className="flex items-center mb-4">
                    <SacredGeometry 
                      variant="merkaba" 
                      size={18} 
                      intensity="medium" 
                      className="text-cyan-300 mr-2" 
                    />
                    <h3 className="text-xs font-semibold text-[#00ebd6] uppercase tracking-wider">
                      Search
                    </h3>
                  </div>
                
                  <form onSubmit={handleSearchSubmit} className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm -z-10"></div>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 bg-black/30 text-white placeholder:text-gray-400 border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/30"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    <button
                      type="submit"
                      className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-md hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 relative group"
                    >
                      <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      <div className="relative flex items-center justify-center">
                        <Search className="h-4 w-4 mr-2" />
                        <span>Search</span>
                      </div>
                    </button>
                  </form>

                  {/* Mobile Auth Buttons */}
                  <div className="mt-8 space-y-4">
                    {user ? (
                      <Link
                        href="/profile"
                        onClick={() => handleNavigationClick("/profile")}
                        className="block w-full text-center py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-md hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 relative group"
                      >
                        <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative flex items-center justify-center">
                          <User className="h-4 w-4 mr-2" />
                          <span>My Profile</span>
                        </div>
                      </Link>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => handleNavigationClick("/login")}
                          className="block w-full text-center py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-md hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 relative group"
                        >
                          <div className="absolute inset-0 rounded-md bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                          <div className="relative flex items-center justify-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>Log In</span>
                          </div>
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => handleNavigationClick("/signup")}
                          className="block w-full text-center py-2.5 px-4 bg-black/30 border border-[#00ebd6]/30 text-[#00ebd6] rounded-md hover:bg-[#00ebd6]/10 hover:border-[#00ebd6]/50 transition-all duration-300 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 relative group"
                        >
                          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-30 transition-opacity"></div>
                          <div className="relative flex items-center justify-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>Sign Up</span>
                          </div>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cosmic energy waves animation on scroll */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg className="w-full h-[8px]" viewBox="0 0 1200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M0 4C150 4 150 7 300 7C450 7 450 1 600 1C750 1 750 4 900 4C1050 4 1050 7 1200 7"
            stroke="url(#paint0_linear)" 
            strokeOpacity="0.5" 
            strokeWidth="1.5"
          >
            <animate attributeName="d" 
              values="
                M0 4C150 4 150 7 300 7C450 7 450 1 600 1C750 1 750 4 900 4C1050 4 1050 7 1200 7;
                M0 4C150 4 150 1 300 1C450 1 450 7 600 7C750 7 750 4 900 4C1050 4 1050 1 1200 1;
                M0 4C150 4 150 7 300 7C450 7 450 1 600 1C750 1 750 4 900 4C1050 4 1050 7 1200 7"
              dur="15s" 
              repeatCount="indefinite" 
            />
          </path>
          <defs>
            <linearGradient id="paint0_linear" x1="0" y1="4" x2="1200" y2="4" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00EBD4" stopOpacity="0" />
              <stop offset="0.2" stopColor="#00EBD4" />
              <stop offset="0.5" stopColor="#BF5AF2" />
              <stop offset="0.8" stopColor="#00EBD4" />
              <stop offset="1" stopColor="#00EBD4" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </header>
  );
}