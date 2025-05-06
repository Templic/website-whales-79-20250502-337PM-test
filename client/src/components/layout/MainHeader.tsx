/**
 * MainHeader.tsx
 * 
 * This is the primary header component for the website, featuring sacred geometry,
 * staggered navigation, and cosmic design elements.
 * 
 * Created: 2025-04-05 - Updated with enhancements
 * Latest Update: Complete redesign based on new specifications - May 6, 2025
 * Implemented the hexagram merkaba sacred geometry elements as shown in screenshots
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "../../hooks/use-toast";
import {
  Menu,
  X,
  Search,
  ChevronDown,
  Home,
  Users,
  Music,
  Headphones,
  Calendar,
  ShoppingBag,
  Heart,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Settings,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionTemplate } from "framer-motion";
import SacredGeometry from "../ui/sacred-geometry";
import HexagramMerkaba from "../cosmic/HexagramMerkaba";
import GlowEffects from "../ui/GlowEffects";
import AnimatedIcon from "../ui/AnimatedIcon";

// Define navigation items
interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export interface MainHeaderProps {
  title?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }>;
  showSearch?: boolean;
  showLogo?: boolean;
  variant?: 'default' | 'transparent' | 'minimal';
  className?: string;
}

export const MainHeader = ({
  title,
  actions = [],
  showSearch = true,
  showLogo = true,
  variant = 'default',
  className = ''
}: MainHeaderProps = {}) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchResultsMessage, setSearchResultsMessage] = useState('');
  
  // Implement the responsive layout hook from specifications for advanced adaptability
  const [layout, setLayout] = useState({
    logoSize: 'h-12 w-12',
    navSpacing: 'space-x-4',
    showSearchInHeader: true,
    showSocialLinks: true,
    merkabaSize: 96,
    merkabaOffset: -20,
    headerWidth: 'w-[85%]',
    showMerkaba: true
  });
  
  // Header shadow effect based on scroll position
  const headerShadow = isScrolled
    ? '0 4px 20px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(6, 182, 212, 0.1)'
    : '0 0 20px rgba(0, 235, 214, 0.15), 0 0 40px rgba(111, 76, 255, 0.1)';
  
  // Update layout based on screen width
  useEffect(() => {
    function updateLayout() {
      if (window.innerWidth < 640) {
        setLayout({
          logoSize: 'h-9 w-9',
          navSpacing: 'space-x-2',
          showSearchInHeader: false,
          showSocialLinks: true,
          merkabaSize: 70,
          merkabaOffset: -15,
          headerWidth: 'w-[92%]',
          showMerkaba: true
        });
      } else if (window.innerWidth < 1024) {
        setLayout({
          logoSize: 'h-10 w-10',
          navSpacing: 'space-x-3',
          showSearchInHeader: true,
          showSocialLinks: true,
          merkabaSize: 80,
          merkabaOffset: -15,
          headerWidth: 'w-[90%]',
          showMerkaba: true
        });
      } else {
        setLayout({
          logoSize: 'h-12 w-12',
          navSpacing: 'space-x-4',
          showSearchInHeader: true,
          showSocialLinks: true,
          merkabaSize: 96,
          merkabaOffset: -20,
          headerWidth: 'w-[85%]',
          showMerkaba: true
        });
      }
    }
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);
  
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
  const lastScrollY = useRef(0);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [headerStyles, setHeaderStyles] = useState<React.CSSProperties>({
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  });
  
  useEffect(() => {
    const SCROLL_THRESHOLD = 100;
    const HEADER_HEIGHT = 80;
    const autoHideNav = true;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Determine if header should be visible or hidden (for hide-on-scroll)
      if (autoHideNav) {
        // Hide header when scrolling down, show when scrolling up
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollY.current;
        
        if (isScrollingDown && currentScrollY > HEADER_HEIGHT && !isHeaderHidden) {
          setIsHeaderHidden(true);
        } else if (!isScrollingDown && isHeaderHidden) {
          setIsHeaderHidden(false);
        }
        
        lastScrollY.current = currentScrollY;
      }
      
      // Basic scrolled state
      setIsScrolled(scrollY > 20);
      
      // Apply blur and opacity based on scroll position
      const blurAmount = Math.min(10, scrollY / 10);
      const opacityAmount = Math.min(0.9, 0.5 + (scrollY / SCROLL_THRESHOLD) * 0.4);
      
      setHeaderStyles({
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,  // Safari support
        backgroundColor: `rgba(0, 0, 0, ${opacityAmount})`
      });
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHeaderHidden]);

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
  
  // Helper functions for navigation item sacred geometry - based on specifications
  const getGeometryForIndex = (index: number): string => {
    const types = ['hexagon', 'pentagon-star', 'merkaba', 'sri-yantra', 'flower-of-life'];
    return types[index % types.length];
  };
  
  const getColorForIndex = (index: number): string => {
    const colors = [
      'rgba(6, 182, 212, 0.7)',    // cyan
      'rgba(147, 51, 234, 0.7)',   // purple
      'rgba(59, 130, 246, 0.7)',   // blue
      'rgba(236, 72, 153, 0.7)',   // pink
      'rgba(16, 185, 129, 0.7)',   // emerald
    ];
    return colors[index % colors.length];
  };

  // Social media links for footer/mobile menu
  const socialLinks = [
    { name: "Facebook", icon: <Facebook className="h-5 w-5" aria-hidden="true" />, path: "https://facebook.com/DaleTheWhale", external: true },
    { name: "Twitter", icon: <Twitter className="h-5 w-5" aria-hidden="true" />, path: "https://twitter.com/DaleTheWhale", external: true },
    { name: "Instagram", icon: <Instagram className="h-5 w-5" aria-hidden="true" />, path: "https://instagram.com/DaleTheWhale", external: true },
    { name: "YouTube", icon: <Youtube className="h-5 w-5" aria-hidden="true" />, path: "https://youtube.com/DaleTheWhale", external: true }
  ];

  // Handle keyboard navigation for menu items
  const handleKeyboardNav = useCallback((e: React.KeyboardEvent, index: number) => {
    // Arrow key navigation for menu items
    if (e.key === 'ArrowRight') {
      const nextItem = document.querySelector(`[data-nav-index="${index + 1}"]`) as HTMLElement;
      nextItem?.focus();
    } else if (e.key === 'ArrowLeft') {
      const prevItem = document.querySelector(`[data-nav-index="${index - 1}"]`) as HTMLElement;
      prevItem?.focus();
    }
  }, []);

  // Handle navigation clicks
  const handleNavigationClick = useCallback((path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    
    // Update ARIA live region with current page
    const currentPage = navigationItems.find(item => item.path === path)?.name || 'Page';
    setSearchResultsMessage(`Navigated to ${currentPage}`);
  }, [navigate, navigationItems]);

  // Handle search submission
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      
      // Update ARIA live region with search query
      setSearchResultsMessage(`Searching for "${searchQuery.trim()}". Results loading.`);
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
    <>
      {/* Global SVG filters for glowing effects */}
      <GlowEffects idPrefix="header" />
      
      {/* Hexagram Merkaba shapes positioned behind the header */}
      <div className={`fixed z-10 left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 ${layout.showMerkaba ? 'block' : 'hidden'}`} style={{ left: layout.merkabaOffset + '%' }}>
        <HexagramMerkaba 
          size={layout.merkabaSize} 
          color="#10edb3" 
          glowColor="rgba(16, 237, 179, 0.8)"
          rotationSpeed={60}
          rotationDirection="clockwise"
          opacity={0.9}
        />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full mt-4">
          <HexagramMerkaba 
            size={layout.merkabaSize * 0.7} 
            color="#10edb3" 
            glowColor="rgba(16, 237, 179, 0.8)"
            rotationSpeed={50}
            rotationDirection="counterclockwise"
            opacity={0.8}
          />
        </div>
      </div>
      
      {/* Right side Hexagram Merkaba shapes */}
      <div className={`fixed z-10 right-0 top-1/2 -translate-y-1/2 translate-x-1/2 ${layout.showMerkaba ? 'block' : 'hidden'}`} style={{ right: layout.merkabaOffset + '%' }}>
        <HexagramMerkaba 
          size={layout.merkabaSize} 
          color="#10edb3" 
          glowColor="rgba(16, 237, 179, 0.8)"
          rotationSpeed={60}
          rotationDirection="counterclockwise"
          opacity={0.9}
        />
        <div className="absolute right-1/2 top-0 translate-x-1/2 -translate-y-full mt-4">
          <HexagramMerkaba 
            size={layout.merkabaSize * 0.7} 
            color="#10edb3" 
            glowColor="rgba(16, 237, 179, 0.8)"
            rotationSpeed={50}
            rotationDirection="clockwise"
            opacity={0.8}
          />
        </div>
      </div>
    
      <header 
        className={`fixed z-20 w-full border-b border-white/5 transition-all duration-300 ease-in-out ${
          isScrolled ? 'h-16' : 'h-20'
        } ${isHeaderHidden ? '-translate-y-full' : 'translate-y-0'}`}
        style={{
          ...headerStyles,
          boxShadow: headerShadow || '0 0 20px rgba(0, 235, 214, 0.15), 0 0 40px rgba(111, 76, 255, 0.1)',
          background: 'rgba(30, 58, 138, 0.8)'  // Dark blue with 80% opacity as shown in screenshots
        }}
      >
        {/* ARIA live region for accessibility - screen reader announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {searchResultsMessage}
        </div>
        
        {/* Enhanced geometric background patterns with multiple sacred geometry elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-background">
          {/* Top-right pattern */}
          <div className="absolute -top-8 -right-8 opacity-5">
            <SacredGeometry
              type="flower-of-life"
              color="rgba(6, 182, 212, 0.5)"
              size={200}
              animated={true}
              animationDuration={120}
              aria-hidden="true"
            />
          </div>
          
          {/* Bottom-left pattern */}
          <div className="absolute -bottom-16 -left-16 opacity-5">
            <SacredGeometry
              type="sri-yantra"
              color="rgba(147, 51, 234, 0.5)"
              size={300}
              animated={true}
              animationDuration={180}
              aria-hidden="true"
            />
          </div>
          
          {/* Subtle central pattern */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
            <SacredGeometry
              type="merkaba"
              color="white"
              size={400}
              animated={true}
              animationDuration={240}
              aria-hidden="true"
            />
          </div>
        </div>
        
        {/* Glowing bottom border */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-cyan-400/30 z-0"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-cyan-400/10 shadow-lg shadow-cyan-500/50 z-0"></div>
      
        <div className={`container mx-auto px-4 h-full relative ${layout.headerWidth}`}>
          {/* Implement the Advanced Header Layout Grid System per specifications */}
          <div className="grid grid-cols-12 gap-2 items-center h-full relative">
            {/* Logo spans 3 columns on desktop, 6 on mobile */}
            <div className="col-span-6 md:col-span-3 z-important">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className={`relative ${layout.logoSize} flex items-center justify-center`}>
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
            </div>

            {/* Desktop Navigation spans 6 columns, only on desktop */}
            <nav className="hidden md:block md:col-span-6 z-content">
              <div className="grid grid-flow-col auto-cols-max gap-x-1">
                {navigationItems.map((item, index) => (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    data-nav-index={index}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigationClick(item.path);
                    }}
                    onKeyDown={(e) => handleKeyboardNav(e, index)}
                    className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 hover:text-white nav-link group ${
                      location.includes(item.path) && (item.path === "/" ? location === "/" : true)
                        ? 'text-white' 
                        : 'text-white/70'
                    }`}
                    aria-current={location.includes(item.path) && (item.path === "/" ? location === "/" : true) ? "page" : undefined}
                    tabIndex={0}
                  >
                    {/* Interactive background geometry appears on hover - based on specifications */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-cosmic-background">
                      <SacredGeometry
                        type="merkaba"
                        color={getColorForIndex(index)}
                        size={40}
                        animated={true}
                        aria-hidden="true"
                      />
                    </div>
                    
                    <motion.span 
                      className="flex items-center space-x-1 relative z-10"
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
              </div>
            </nav>
            
            {/* Search & Controls spans 3 columns on desktop, 6 on mobile */}
            <div className="col-span-6 md:col-span-3 flex justify-end items-center z-content">
              {/* Search Bar - Only visible on desktop if showSearchInHeader is true */}
              {layout.showSearchInHeader && (
                <div className="hidden md:block relative group mr-2" role="search">
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
                    focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all w-40 focus:w-56 
                    hover:bg-white/7 hover:border-white/15 search-input z-interactive"
                  />
                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 group-focus-within:opacity-40 
                  bg-gradient-to-r from-cyan-700/10 to-purple-700/10 blur-sm transition-opacity duration-300 -z-10"></div>
                </div>
              )}
              
              {/* Navigation controls on desktop */}
              <div className="hidden md:flex items-center space-x-1.5 ml-2">
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
              
              {/* Login Button */}
              <Link 
                href="/login" 
                className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 
                transition-all duration-300 text-white px-3 md:px-5 py-2 rounded-md text-sm font-medium 
                focus:outline-none focus:ring-2 focus:ring-cyan-400/50 group z-interactive ml-2"
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
              
              {/* Mobile Menu Button - Only visible on small screens */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 ml-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors
                focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus-visible:ring-2 focus-visible:ring-cyan-400/50
                relative overflow-hidden group z-interactive"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 group-focus:opacity-30 
                bg-gradient-to-br from-cyan-400 to-purple-400 transition-opacity duration-200"></div>
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 relative z-10" />
                ) : (
                  <Menu className="h-5 w-5 relative z-10" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className={`fixed inset-x-0 top-20 z-50 md:hidden ${layout.headerWidth} mx-auto backdrop-blur-lg border-b border-white/5
            overflow-hidden flex flex-col mobile-menu rounded-b-xl`}
            style={{
              boxShadow: '0 10px 20px -3px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(6, 182, 212, 0.2)',
              background: 'rgba(30, 58, 138, 0.9)'  // Match the header background
            }}
          >
            {/* Mobile merkaba decoration */}
            <div className="absolute -left-8 top-0 opacity-40 rotate-45" style={{ transform: 'scale(0.5)' }}>
              <HexagramMerkaba 
                size={60}
                color="#10edb3" 
                glowColor="rgba(16, 237, 179, 0.6)"
                rotationSpeed={45}
                rotationDirection="clockwise"
                opacity={0.7}
              />
            </div>
            
            <div className="absolute -right-8 bottom-0 opacity-40 -rotate-45" style={{ transform: 'scale(0.5)' }}>
              <HexagramMerkaba 
                size={60}
                color="#10edb3" 
                glowColor="rgba(16, 237, 179, 0.6)"
                rotationSpeed={45}
                rotationDirection="counterclockwise"
                opacity={0.7}
              />
            </div>
            
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-5rem)] relative">
              <nav className="flex flex-col space-y-4">
                {navigationItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    variants={itemVariants}
                    className="mobile-menu-item group"
                  >
                    <Link
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigationClick(item.path);
                      }}
                      className={`flex items-center space-x-3 px-5 py-3 rounded-lg transition-all duration-300
                      ${location.includes(item.path) && (item.path === "/" ? location === "/" : true)
                        ? 'bg-cyan-600/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1'
                      } relative overflow-hidden`}
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                        <SacredGeometry
                          type={getGeometryForIndex(index)}
                          color={getColorForIndex(index)}
                          size={100}
                          animated={false}
                          aria-hidden="true"
                        />
                      </div>
                      
                      <div className="w-8 h-8 flex items-center justify-center relative">
                        <div className={`absolute inset-0 rounded-full ${
                          location.includes(item.path) && (item.path === "/" ? location === "/" : true)
                            ? 'bg-gradient-to-br from-cyan-500/40 to-purple-600/40'
                            : 'bg-white/5 group-hover:bg-gradient-to-br group-hover:from-cyan-500/20 group-hover:to-purple-600/20'
                        } transition-all duration-300 group-hover:scale-110`}></div>
                        <motion.div 
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="relative z-10"
                        >
                          {item.icon}
                        </motion.div>
                      </div>
                      <span className="font-medium">{item.name}</span>
                      
                      {/* Right side indicator for active item */}
                      {location.includes(item.path) && (item.path === "/" ? location === "/" : true) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"></div>
                        </div>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              
              {/* Mobile Search */}
              <motion.div
                variants={itemVariants}
                className="px-4 py-5 mt-5 border-t border-white/10"
              >
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-cyan-400/70" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search cosmic content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/5 border border-cyan-400/20 rounded-lg py-3 pl-12 pr-4 text-sm 
                    w-full text-white placeholder-white/50 focus:outline-none focus:ring-1 
                    focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300
                    hover:border-cyan-400/30"
                  />
                </form>
              </motion.div>
              
              {/* Social Links in mobile menu */}
              <motion.div
                variants={itemVariants}
                className="flex justify-center space-x-5 mt-6 px-4 border-t border-white/10 pt-6"
              >
                {socialLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    className="text-white/70 hover:text-white transition-colors p-2.5 rounded-full
                    hover:bg-white/5 relative group overflow-hidden"
                    aria-label={link.name}
                  >
                    {/* Glow background */}
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30
                    bg-gradient-to-r from-cyan-400/30 to-purple-400/30 transition-opacity duration-300"></div>
                    <motion.div 
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {link.icon}
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MainHeader;