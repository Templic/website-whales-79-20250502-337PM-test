import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import GeometricContainer from './cosmic/GeometricContainer';
import StarBackground from './cosmic/StarBackground';
import CosmicShape from './cosmic/CosmicShapesFixed';
import SacredGeometry from './cosmic/SacredGeometry';
import { EnhancedAccessibilityControls } from './common/EnhancedAccessibilityControls';
import { useAccessibility } from '@/contexts/AccessibilityContext';
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
  { title: 'Cosmic Experience', href: '/cosmic-immersive', icon: <Goal className="h-5 w-5" />, color: '#00ebd6' },
  { title: 'Community', href: '/community', icon: <Users className="h-5 w-5" />, color: '#7c3aed' },
  { title: 'Music Archive', href: '/music-archive', icon: <Disc className="h-5 w-5" />, color: '#00ebd6' },
  { title: 'Collaborate', href: '/collaboration', icon: <MessageSquare className="h-5 w-5" />, color: '#7c3aed' },
  { title: 'Shop', href: '/shop', icon: <ShoppingBag className="h-5 w-5" />, color: '#00ebd6' },
  { title: 'Contact', href: '/contact', icon: <Mail className="h-5 w-5" />, color: '#7c3aed' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { autoHideNav } = useAccessibility();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 10);
      
      // Handle auto-hide behavior
      if (autoHideNav) {
        const header = document.querySelector('header');
        if (header) {
          if (scrollY > lastScrollY && scrollY > 150) {
            // Scrolling down - hide header
            header.classList.add('scrolled-down');
          } else {
            // Scrolling up - show header
            header.classList.remove('scrolled-down');
          }
        }
      }
      lastScrollY = scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [autoHideNav]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={cn(
      "flex flex-col min-h-screen bg-[#0a0a14]",
      autoHideNav && "nav-auto-hide"
    )}>
      {/* Star Background for cosmic theme */}
      <StarBackground colorScheme="multi" opacity={0.7} />
      
      {/* Enhanced Accessibility Controls */}
      <EnhancedAccessibilityControls />

      {/* Navigation is now provided by CosmicNavigation component in App.tsx */}

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
                  <Link to="/about">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">About Dale</div>
                  </Link>
                  <Link to="/journey">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Music Journey</div>
                  </Link>
                  <Link to="/mission">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Mission & Vision</div>
                  </Link>
                  <Link to="/press">
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
                  <Link to="/new-music">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Latest Releases</div>
                  </Link>
                  <Link to="/archived-music">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Music Archive</div>
                  </Link>
                  <Link to="/collaborations">
                    <div className="hover-glow-cyan text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Collaborations</div>
                  </Link>
                  <Link to="/licensing">
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
                  <Link to="/tour">
                    <div className="hover-glow-orange text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Tour Dates</div>
                  </Link>
                  <Link to="/engage">
                    <div className="hover-glow-orange text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Fan Engagement</div>
                  </Link>
                  <Link to="/newsletter">
                    <div className="hover-glow-orange text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Newsletter</div>
                  </Link>
                  <Link to="/contact">
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
                  <Link to="/blog">
                    <div className="hover-glow-red text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Blog</div>
                  </Link>
                  <Link to="/faq">
                    <div className="hover-glow-red text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">FAQ</div>
                  </Link>
                  <Link to="/terms">
                    <div className="hover-glow-red text-sm text-gray-300 hover:text-white transition-colors cursor-pointer">Terms of Service</div>
                  </Link>
                  <Link to="/privacy">
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