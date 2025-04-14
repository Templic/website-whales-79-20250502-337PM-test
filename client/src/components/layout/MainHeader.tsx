import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useAgents } from '@/contexts/AgentContext';
import { Button } from '@/components/ui/button';
import { AIAgentButton } from '@/components/ai/AIAgentButton';
import { 
  Home, 
  Music, 
  BookOpen, 
  ShoppingCart, 
  Users, 
  Settings,
  Eye,
  MessageSquare,
  Menu,
  X,
  Bot,
  Sun,
  Moon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MainHeader() {
  const [location] = useLocation();
  const { togglePanel } = useAccessibility();
  const { setContext } = useAgents();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Update agent context based on current page
  useEffect(() => {
    // Extract the main route section
    const route = location.split('/')[1] || 'home';
    setContext(route);
  }, [location, setContext]);
  
  // Handle scroll events for header appearance
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Toggle the mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Main navigation items
  const mainNavItems = [
    { name: 'Home', path: '/', icon: <Home className="h-5 w-5" /> },
    { name: 'Music', path: '/music', icon: <Music className="h-5 w-5" /> },
    { name: 'Learn', path: '/learn', icon: <BookOpen className="h-5 w-5" /> },
    { name: 'Shop', path: '/shop', icon: <ShoppingCart className="h-5 w-5" /> },
    { name: 'Community', path: '/community', icon: <Users className="h-5 w-5" /> },
  ];
  
  // Secondary navigation items
  const secondaryNavItems = [
    { 
      name: 'Accessibility', 
      action: () => {
        togglePanel();
        toast({
          title: "Accessibility Controls",
          description: "Customize your cosmic experience"
        });
      }, 
      icon: <Eye className="h-5 w-5" /> 
    },
    { 
      name: 'AI Chat', 
      path: '/ai-chat', 
      icon: <MessageSquare className="h-5 w-5" /> 
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black/70 backdrop-blur-lg shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Sun className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">Cosmic Consciousness</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Main Nav */}
            <div className="flex items-center bg-black/20 rounded-lg backdrop-blur-sm overflow-hidden p-1 mr-6">
              {mainNavItems.map((item) => (
                <Link key={item.name} href={item.path}>
                  <a className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === item.path 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}>
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                </Link>
              ))}
            </div>
            
            {/* Secondary Nav */}
            <div className="flex items-center gap-2">
              {/* Accessibility button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-sm"
                onClick={() => secondaryNavItems[0].action()}
              >
                <Eye className="h-4 w-4 mr-1" />
                <span>Accessibility</span>
              </Button>
              
              {/* AI Chat link */}
              <Link href="/ai-chat">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm ${location === '/ai-chat' ? 'bg-white/10' : ''}`}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>AI Chat</span>
                </Button>
              </Link>
              
              {/* AI Agent Button */}
              <AIAgentButton />
            </div>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <AIAgentButton />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="md:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gradient-to-b from-black/90 to-slate-900/90 backdrop-blur-lg p-4 border-t border-white/10">
          <nav className="space-y-4">
            {/* Main Nav */}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <Link key={item.name} href={item.path}>
                  <a 
                    className={`flex items-center gap-3 px-4 py-3 rounded-md ${
                      location === item.path 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                </Link>
              ))}
            </div>
            
            {/* Separator */}
            <div className="border-t border-white/10 my-2"></div>
            
            {/* Secondary Nav */}
            <div className="space-y-1">
              {/* Accessibility button */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-white/70 hover:text-white hover:bg-white/5 text-left"
                onClick={() => {
                  secondaryNavItems[0].action();
                  setIsMobileMenuOpen(false);
                }}
              >
                <Eye className="h-5 w-5" />
                <span>Accessibility</span>
              </button>
              
              {/* AI Chat link */}
              <Link href="/ai-chat">
                <a 
                  className={`flex items-center gap-3 px-4 py-3 rounded-md ${
                    location === '/ai-chat' 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>AI Chat</span>
                </a>
              </Link>
              
              {/* Settings link */}
              <Link href="/settings">
                <a 
                  className={`flex items-center gap-3 px-4 py-3 rounded-md ${
                    location === '/settings' 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </a>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default MainHeader;