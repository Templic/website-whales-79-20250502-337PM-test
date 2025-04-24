import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import GeometricContainer from './cosmic/GeometricContainer';
import StarBackground from './cosmic/StarBackground';
import CosmicShape from './cosmic/CosmicShapesFixed';
import SacredGeometry from './cosmic/SacredGeometry';
import { 
  Home, 
  Info, 
  Music, 
  Archive, 
  CalendarDays, 
  Heart, 
  Mail, 
  BookOpen,
  Users, 
  Zap, 
  Disc, 
  Goal, 
  ShoppingBag, 
  MessageSquare,
  Menu,
  X,
  LogIn
} from 'lucide-react';

interface MainNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  color?: string;
}

const topNavItems: MainNavItem[] = [
  { title: 'Home', href: '/', icon: <Home className="h-5 w-5" />, color: '#00ebd6' },
  { title: 'About', href: '/about', icon: <Info className="h-5 w-5" />, color: '#7c3aed' },
  { title: 'New Music', href: '/music-release', icon: <Music className="h-5 w-5" />, color: '#00ebd6' },
  { title: 'Archived Music', href: '/archived-music', icon: <Archive className="h-5 w-5" />, color: '#7c3aed' },
  { title: 'Tour', href: '/tour', icon: <CalendarDays className="h-5 w-5" />, color: '#00ebd6' },
  { title: 'Engage', href: '/engage', icon: <Heart className="h-5 w-5" />, color: '#7c3aed' },
  { title: 'Newsletter', href: '/newsletter', icon: <Mail className="h-5 w-5" />, color: '#00ebd6' },
  { title: 'Blog', href: '/blog', icon: <BookOpen className="h-5 w-5" />, color: '#7c3aed' },
];

const bottomNavItems: MainNavItem[] = [
  { title: 'Cosmic Experience', href: '/cosmic-experience', icon: <Goal className="h-5 w-5" />, color: '#00ebd6' },
  { title: 'Immersive', href: '/immersive', icon: <Zap className="h-5 w-5" />, color: '#7c3aed' },
  { title: 'Music Archive', href: '/music-archive', icon: <Disc className="h-5 w-5" />, color: '#00ebd6' },
  { title: 'Community', href: '/community', icon: <Users className="h-5 w-5" />, color: '#7c3aed' },
  { title: 'Collaborate', href: '/collaboration', icon: <MessageSquare className="h-5 w-5" />, color: '#00ebd6' },
  { title: 'Shop', href: '/shop', icon: <ShoppingBag className="h-5 w-5" />, color: '#7c3aed' },
  { title: 'Contact', href: '/contact', icon: <Mail className="h-5 w-5" />, color: '#00ebd6' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a14]">
      {/* Star Background for cosmic theme */}
      <StarBackground colorScheme="multi" opacity={0.7} />

      {/* Header with both nav sections */}
      <header className={cn(
        "fixed top-0 inset-x-0 z-40 transition-all duration-300",
        isScrolled ? "bg-[#0a0a14]/80 backdrop-blur-md border-b border-[#7c3aed]/20" : "bg-transparent"
      )}>
        {/* Top Navigation Bar */}
        <div className="cosmic-nav-container">
          {/* Cosmic shapes for decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <SacredGeometry type="hexagon" className="absolute top-0 right-0" color="#7c3aed" strokeWidth={1} size={80} />
            <CosmicShape type="circle" className="absolute bottom-0 left-0" color="#00ebd6" strokeWidth={1} size={60} />
          </div>
          
          <div className="container flex justify-between items-center h-16 px-4 relative z-10">
            <Link href="/">
              <div className="font-orbitron text-xl text-white hover:text-[#00ebd6] transition-all flex items-center space-x-2 cursor-pointer">
                <span className="cosmic-text-cyan glow-breathe-cyan">Dale</span>
                <span className="cosmic-text-purple">Loves</span>
                <span className="cosmic-text-orange">Whales</span>
              </div>
            </Link>

            {/* Desktop Top Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {topNavItems.map((item, index) => (
                <Link key={item.href} href={item.href}>
                  <div 
                    className={cn(
                      "cosmic-nav-item flex items-center space-x-2 px-3 py-1.5 text-sm font-medium transition-all duration-300 cursor-pointer",
                      index % 2 === 0 ? "cosmic-glow-cyan" : "cosmic-glow-purple",
                      location === item.href
                        ? index % 2 === 0 ? "active-nav-cyan" : "active-nav-purple"
                        : "hover:translate-y-[-2px]"
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Login Button */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:inline-flex items-center space-x-1 cosmic-login-btn"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="cosmic"
                size="icon"
                onClick={toggleMobileMenu}
                className="md:hidden"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="border-t border-[#090914] bg-[#050510]/80 backdrop-blur-md">
          <div className="relative">
            {/* Cosmic pattern decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
              <div className="cosmic-pattern-subtle w-full h-full"></div>
            </div>
            
            <div className="container hidden md:flex items-center h-14 px-4 relative z-10">
              <nav className="flex items-center space-x-4 w-full">
                {bottomNavItems.map((item, index) => (
                  <Link key={item.href} href={item.href}>
                    <div 
                      className={cn(
                        "cosmic-nav-item flex items-center space-x-2 px-3 py-1.5 text-sm font-medium transition-all duration-300 cursor-pointer",
                        index % 2 === 0 ? "cosmic-glow-cyan" : "cosmic-glow-purple",
                        location === item.href
                          ? index % 2 === 0 ? "active-nav-cyan" : "active-nav-purple"
                          : "hover:translate-y-[-2px]"
                      )}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={cn(
            "absolute top-16 inset-x-0 bg-[#050510]/95 backdrop-blur-xl border-b border-[#090914] transition-all duration-300 overflow-hidden md:hidden cosmic-mobile-nav",
            isMobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {/* Cosmic background patterns */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <SacredGeometry type="hexagon" className="absolute top-5 right-5" color="#7c3aed" strokeWidth={1} size={60} />
            <SacredGeometry type="merkaba" className="absolute bottom-5 left-5" color="#00ebd6" strokeWidth={1} size={60} />
            <div className="cosmic-stars-subtle absolute inset-0 opacity-20"></div>
          </div>
          
          <div className="container px-4 py-6 space-y-6 relative z-10">
            <nav className="grid grid-cols-2 gap-3">
              {topNavItems.map((item, index) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "cosmic-mobile-nav-item flex items-center space-x-2 px-3 py-2.5 rounded-lg transition-all duration-300 cursor-pointer",
                      index % 2 === 0 ? "cosmic-glow-cyan-mobile" : "cosmic-glow-purple-mobile",
                      location === item.href
                        ? index % 2 === 0 ? "active-nav-cyan-mobile" : "active-nav-purple-mobile"
                        : ""
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                </Link>
              ))}
            </nav>

            <div className="pt-4 p-4 backdrop-blur-sm bg-black/20 rounded-lg border border-purple-800/30">
              <h4 className="px-3 mb-3 text-sm uppercase tracking-wider font-orbitron cosmic-text-gradient">
                Explore More
              </h4>
              <nav className="grid grid-cols-2 gap-3">
                {bottomNavItems.map((item, index) => (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "cosmic-mobile-nav-item flex items-center space-x-2 px-3 py-2.5 rounded-lg transition-all duration-300 cursor-pointer",
                        index % 2 === 0 ? "cosmic-glow-cyan-mobile" : "cosmic-glow-purple-mobile",
                        location === item.href
                          ? index % 2 === 0 ? "active-nav-cyan-mobile" : "active-nav-purple-mobile"
                          : ""
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="pt-4 flex justify-center">
              <Button variant="cosmic" size="lg" className="w-full sm:w-auto cosmic-login-btn-mobile">
                <LogIn className="h-4 w-4 mr-2" />
                <span>Login</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-28 pb-16">
        <div className="container px-4">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#080810]/90 border-t border-[#7c3aed]/20 pt-12 pb-6">
        <div className="container px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <GeometricContainer
              variant="primary"
              geometryVariant="cosmic-corners"
              className="p-6"
            >
              <div className="space-y-3">
                <h3 className="font-orbitron text-lg font-semibold cosmic-text-cyan">About</h3>
                <nav className="flex flex-col space-y-2">
                  <Link href="/about">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">About Dale</div>
                  </Link>
                  <Link href="/journey">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Music Journey</div>
                  </Link>
                  <Link href="/mission">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Mission & Vision</div>
                  </Link>
                  <Link href="/press">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Press Kit</div>
                  </Link>
                </nav>
              </div>
            </GeometricContainer>

            <GeometricContainer
              variant="secondary"
              geometryVariant="cosmic-corners"
              className="p-6"
            >
              <div className="space-y-3">
                <h3 className="font-orbitron text-lg font-semibold cosmic-text-cyan">Music</h3>
                <nav className="flex flex-col space-y-2">
                  <Link href="/new-music">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Latest Releases</div>
                  </Link>
                  <Link href="/archived-music">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Music Archive</div>
                  </Link>
                  <Link href="/collaborations">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Collaborations</div>
                  </Link>
                  <Link href="/licensing">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Licensing</div>
                  </Link>
                </nav>
              </div>
            </GeometricContainer>

            <GeometricContainer
              variant="accent"
              geometryVariant="cosmic-corners"
              className="p-6"
            >
              <div className="space-y-3">
                <h3 className="font-orbitron text-lg font-semibold cosmic-text-orange">Connect</h3>
                <nav className="flex flex-col space-y-2">
                  <Link href="/tour">
                    <div className="hover-glow-orange text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Tour Dates</div>
                  </Link>
                  <Link href="/engage">
                    <div className="hover-glow-orange text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Fan Engagement</div>
                  </Link>
                  <Link href="/newsletter">
                    <div className="hover-glow-orange text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Newsletter</div>
                  </Link>
                  <Link href="/contact">
                    <div className="hover-glow-orange text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Contact</div>
                  </Link>
                </nav>
              </div>
            </GeometricContainer>

            <GeometricContainer
              variant="cosmic"
              geometryVariant="cosmic-corners"
              className="p-6"
            >
              <div className="space-y-3">
                <h3 className="font-orbitron text-lg font-semibold cosmic-text-red">Resources</h3>
                <nav className="flex flex-col space-y-2">
                  <Link href="/blog">
                    <div className="hover-glow-red text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Blog</div>
                  </Link>
                  <Link href="/faq">
                    <div className="hover-glow-red text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">FAQ</div>
                  </Link>
                  <Link href="/terms">
                    <div className="hover-glow-red text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Terms of Service</div>
                  </Link>
                  <Link href="/privacy">
                    <div className="hover-glow-red text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Privacy Policy</div>
                  </Link>
                </nav>
              </div>
            </GeometricContainer>
          </div>

          <div className="mt-12 border-t border-[#7c3aed]/20 pt-6">
            <GeometricContainer
              variant="minimal"
              geometryVariant="shapes-trio"
              className="p-4 flex flex-col sm:flex-row justify-between items-center"
            >
              <p className="text-sm text-gray-400 mb-4 sm:mb-0">
                © {new Date().getFullYear()} Dale Loves Whales. All rights reserved.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white hover-glow-purple transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white hover-glow-cyan transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white hover-glow-orange transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white hover-glow-red transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                  </svg>
                </a>
              </div>
            </GeometricContainer>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;