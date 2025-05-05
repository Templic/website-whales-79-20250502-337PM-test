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
import { useToast } from "@/hooks/use-toast";
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
  Calendar,
  Send,
  BookOpen,
  Users,
  MessageCircle,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { animateScroll as scroll } from "react-scroll";
import { CosmicText } from "@/components/ui/cosmic-text";
import { Button } from "@/components/ui/button";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ShoppingCart } from "@/components/features/shop/ShoppingCart";

export function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();
  const { toast } = useToast();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Basic search validation
      if (searchQuery.length < 2) {
        toast({
          title: "Search query too short",
          description: "Please enter at least 2 characters to search",
          variant: "destructive",
        });
        return;
      }
      
      // For demonstration purposes, just show a toast
      toast({
        title: "Search initiated",
        description: `Searching for "${searchQuery}"`,
      });
      
      // Close search bar after search is submitted
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const scrollToTop = () => {
    scroll.scrollToTop({
      duration: 500,
      smooth: "easeInOutQuart",
    });
  };

  // Handle scroll events to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation items
  const navigationItems = [
    { path: "/", label: "Home" },
    { path: "/music", label: "Music", icon: <Music className="h-5 w-5" /> },
    { path: "/tour", label: "Tour", icon: <Calendar className="h-5 w-5" /> },
    { path: "/engage", label: "Engage", icon: <Send className="h-5 w-5" /> },
    { path: "/blog", label: "Blog", icon: <BookOpen className="h-5 w-5" /> },
    { path: "/community", label: "Community", icon: <Users className="h-5 w-5" /> },
    { path: "/contact", label: "Contact", icon: <MessageCircle className="h-5 w-5" /> },
  ];

  // Staggered animation for mobile menu items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const isAdminUser = true; // This would normally be determined by auth state

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/80 backdrop-blur-md py-2 shadow-lg"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer" onClick={scrollToTop}>
              <div className="relative w-12 h-12 mr-3">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
                <div className="relative flex items-center justify-center w-full h-full">
                  <div className="w-8 h-8 text-primary flex items-center justify-center">
                    {/* Logo Icon - Simplified Sacred Geometry */}
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white"
                    >
                      <path
                        d="M16 2L30 16L16 30L2 16L16 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 10L22 16L16 22L10 16L16 10Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="2"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <CosmicText
                  variant="gradient"
                  className={`text-xl font-bold transition-all duration-300 ${
                    isScrolled ? "text-white" : "text-white"
                  }`}
                >
                  Dale Loves Whales
                </CosmicText>
                <div className="text-xs text-white/70">Harmonic Journeys</div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavigationMenu>
              <NavigationMenuList>
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.path}>
                    <Link href={item.path}>
                      <NavigationMenuLink
                        className={`px-3 py-2 text-sm rounded-md inline-flex items-center transition-colors hover:bg-white/10 focus:bg-white/10 ${
                          location === item.path
                            ? "bg-white/10 text-white"
                            : "text-white/80 hover:text-white"
                        }`}
                      >
                        {item.icon && <span className="mr-1.5">{item.icon}</span>}
                        {item.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Search button */}
            <div className="relative ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Search input */}
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "300px" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-0 z-20"
                  >
                    <div className="flex flex-col">
                      <form onSubmit={handleSearch} className="flex items-center">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                          className="w-full px-4 py-2 text-sm bg-black/80 backdrop-blur-lg border border-white/20 rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Button
                          type="submit"
                          variant="default"
                          className="rounded-l-none"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </form>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-white/70 hover:text-white"
                        onClick={() => window.location.reload()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                          <path d="M3 3v5h5"></path>
                        </svg>
                        Refresh
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User and Cart */}
            <div className="flex items-center ml-2 space-x-1">
              <ShoppingCart />
              
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className="text-white/80 hover:text-white bg-transparent hover:bg-white/10 focus:bg-white/10"
                    >
                      <User className="h-5 w-5" />
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[200px] gap-1 p-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-md shadow-xl">
                        <li>
                          <Link href="/account">
                            <NavigationMenuLink className="flex items-center w-full p-2 text-white/90 rounded-md hover:bg-white/10">
                              <User className="h-4 w-4 mr-2" />
                              <span>My Account</span>
                            </NavigationMenuLink>
                          </Link>
                        </li>
                        <li>
                          <Link href="/orders">
                            <NavigationMenuLink className="flex items-center w-full p-2 text-white/90 rounded-md hover:bg-white/10">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2"
                              >
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                                <rect x="9" y="3" width="6" height="4" rx="2" />
                                <path d="M9 14h.01" />
                                <path d="M13 14h.01" />
                                <path d="M9 18h.01" />
                                <path d="M13 18h.01" />
                              </svg>
                              <span>My Orders</span>
                            </NavigationMenuLink>
                          </Link>
                        </li>
                        {isAdminUser && (
                          <li>
                            <Link href="/admin">
                              <NavigationMenuLink className="flex items-center w-full p-2 text-white/90 rounded-md hover:bg-white/10">
                                <Settings className="h-4 w-4 mr-2" />
                                <span>Admin Portal</span>
                              </NavigationMenuLink>
                            </Link>
                          </li>
                        )}
                        <li className="mt-1 pt-1 border-t border-white/10">
                          <Link href="/auth/login">
                            <NavigationMenuLink className="flex items-center w-full p-2 text-white/90 rounded-md hover:bg-white/10">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2"
                              >
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                              </svg>
                              <span>Sign Out</span>
                            </NavigationMenuLink>
                          </Link>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-2">
            <ShoppingCart />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-white hover:bg-white/10"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black/95 backdrop-blur-lg"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="container mx-auto px-4 py-4 flex flex-col"
            >
              {/* Search Bar */}
              <motion.form
                variants={itemVariants}
                onSubmit={handleSearch}
                className="mb-4"
              >
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 text-sm bg-black/80 backdrop-blur-lg border border-white/20 rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button
                    type="submit"
                    variant="default"
                    className="rounded-l-none"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </motion.form>
              
              <motion.div variants={itemVariants} className="mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-white/70 hover:text-white flex items-center justify-center"
                  onClick={() => window.location.reload()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  Refresh
                </Button>
              </motion.div>

              {/* Navigation Links */}
              <div className="space-y-1">
                {navigationItems.map((item, index) => (
                  <motion.div key={item.path} variants={itemVariants}>
                    <Link 
                      href={item.path}
                      className={`flex items-center px-4 py-3 rounded-md ${
                        location === item.path
                          ? "bg-white/10 text-white"
                          : "text-white/80 hover:bg-white/5 hover:text-white"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.icon && <span className="mr-3">{item.icon}</span>}
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* User Account */}
              <motion.div variants={itemVariants} className="mt-4 pt-4 border-t border-white/10">
                <Link 
                  href="/account"
                  className="flex items-center px-4 py-3 rounded-md text-white/80 hover:bg-white/5 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-3" />
                  <span>My Account</span>
                </Link>
              </motion.div>

              {/* Admin Link */}
              {isAdminUser && (
                <motion.div variants={itemVariants}>
                  <Link 
                    href="/admin"
                    className="flex items-center px-4 py-3 rounded-md text-white/80 hover:bg-white/5 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    <span>Admin Portal</span>
                  </Link>
                </motion.div>
              )}

              {/* Social Links */}
              <motion.div variants={itemVariants} className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-center space-x-4 py-3">
                  <a href="https://facebook.com" className="text-white/70 hover:text-white" target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-6 w-6" />
                  </a>
                  <a href="https://twitter.com" className="text-white/70 hover:text-white" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-6 w-6" />
                  </a>
                  <a href="https://instagram.com" className="text-white/70 hover:text-white" target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-6 w-6" />
                  </a>
                  <a href="https://youtube.com" className="text-white/70 hover:text-white" target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-6 w-6" />
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}