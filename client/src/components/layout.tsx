import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Home, User, Music, Calendar, Heart, Mail, BookOpen, Users, MessageSquare, Info, Archive, Settings, Menu, Sparkles, Zap, Disc, ShoppingBag, ShoppingCart, ShieldAlert, FileText, Map as MapIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { GeometricContainer } from "@/components/cosmic/GeometricContainer";

// Define types for navigation items
interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

// Top and Bottom navigation items defined separately for better organization
const topNavItems: NavItem[] = [
  { path: "/", label: "Home", icon: <Home className="h-4 w-4 mr-2" /> },
  { path: "/about", label: "About", icon: <Info className="h-4 w-4 mr-2" /> },
  { path: "/music-release", label: "New Music", icon: <Music className="h-4 w-4 mr-2" /> },
  { path: "/archived-music", label: "Archived Music", icon: <Archive className="h-4 w-4 mr-2" /> },
  { path: "/tour", label: "Tour", icon: <Calendar className="h-4 w-4 mr-2" /> },
  { path: "/engage", label: "Engage", icon: <Heart className="h-4 w-4 mr-2" /> },
  { path: "/newsletter", label: "Newsletter", icon: <Mail className="h-4 w-4 mr-2" /> },
  { path: "/blog", label: "Blog", icon: <BookOpen className="h-4 w-4 mr-2" /> },
];

const bottomNavItems: NavItem[] = [
  { path: "/cosmic-experience", label: "Cosmic Experience", icon: <Sparkles className="h-4 w-4 mr-2" /> },
  { path: "/immersive", label: "Immersive", icon: <Zap className="h-4 w-4 mr-2" /> },
  { path: "/music-archive", label: "Music Archive", icon: <Disc className="h-4 w-4 mr-2" /> },
  { path: "/community", label: "Community", icon: <Users className="h-4 w-4 mr-2" /> },
  { path: "/collaboration", label: "Collaborate", icon: <Users className="h-4 w-4 mr-2" /> },
  { path: "/shop", label: "Shop", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
  { path: "/contact", label: "Contact", icon: <MessageSquare className="h-4 w-4 mr-2" /> },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    setCurrentPath(window.location.pathname);
  }, []);

  if (!mounted) {
    return null;
  }

  // Combined all navigation items for mobile view
  const allNavItems = [...topNavItems, ...bottomNavItems];

  interface NavButtonProps {
    item: NavItem;
    isMobile?: boolean;
  }

  const NavButton = ({ item, isMobile = false }: NavButtonProps) => {
    const isActive = currentPath === item.path;
    
    return (
      <Link href={item.path}>
        <Button 
          variant="ghost"
          size="sm" 
          className={`
            ${isMobile ? 'w-full justify-start' : 'h-9 px-3'} 
            nav-link text-[#00ebd6] transition-all duration-300 
            ${isActive ? 'bg-[#00ebd610] border-b-2 border-[#00ebd6] font-medium' : ''}
            hover:bg-transparent hover:text-white
          `}
          onClick={() => {
            setCurrentPath(item.path);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {item.icon}
          <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
        </Button>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a14]">
      {/* Main Navigation Header */}
      <header 
        className={`sticky top-0 z-50 w-full bg-black transition-all duration-300 ${
          isScrolled ? 'shadow-md shadow-[#00ebd6]/10' : ''
        }`}
      >
        <div className="mx-auto">
          <div className="flex flex-col px-4">
            {/* Mobile Menu */}
            <div className="md:hidden flex items-center justify-between py-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="nav-link transition-all duration-300 hover:rotate-180 text-[#00ebd6]"
                  >
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-[#0a1e3c] border-r border-[#00ebd6]/20 text-white">
                  <div className="font-orbitron text-xl text-[#00ebd6] mb-6 pt-2">Dale Loves Whales</div>
                  <nav className="flex flex-col gap-2">
                    {allNavItems.map((item) => (
                      <NavButton key={item.path} item={item} isMobile={true} />
                    ))}
                    <div className="my-4 h-[1px] bg-[#00ebd6]/20" />
                    <AuthLinks isMobile={true} />
                  </nav>
                </SheetContent>
              </Sheet>
              
              {/* Logo for Mobile */}
              <div className="font-orbitron text-xl text-[#00ebd6]">
                Dale Loves Whales
              </div>
              
              {/* Auth Icon for Mobile */}
              <Link href={user ? "/portal" : "/auth"}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="nav-link text-[#00ebd6]"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Desktop Navigation - Two Rows */}
            <div className="hidden md:flex flex-col w-full">
              {/* Top Navigation Row */}
              <div className="flex items-center justify-center space-x-1 py-2 w-full bg-black text-[#00ebd6]">
                {topNavItems.map((item) => (
                  <NavButton key={item.path} item={item} />
                ))}
                
                {/* Auth Links for Desktop - Top Right */}
                <div className="absolute right-4">
                  <AuthLinks />
                </div>
              </div>
              
              {/* Bottom Navigation Row */}
              <div className="flex items-center justify-center space-x-1 py-2 w-full bg-[#05050a] border-t border-b border-[#333]">
                {bottomNavItems.map((item) => (
                  <NavButton key={item.path} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 text-white">
        {children}
      </main>

      <footer className="cosmic-section py-8 bg-black/80 text-white relative overflow-hidden">
        <div className="absolute inset-0 nebula-triadic opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative z-10">
              <GeometricContainer 
                variant="simple" 
                borderGlow="cyan"
                className="p-4 h-full"
              >
                <h3 className="font-orbitron text-[#00ebd6] mb-4 animate-cosmic flex items-center">
                  <span className="mr-2 h-4 w-4 bg-[#00ebd6] opacity-60 rounded-full cosmic-glow-cyan"></span>
                  Quick Links
                </h3>
                <ul className="space-y-2">
                  {topNavItems.slice(0, 5).map((item) => (
                    <li key={item.path}>
                      <Link 
                        href={item.path} 
                        className="text-white hover:text-[#00ebd6] transition-colors duration-300 flex items-center" 
                        onClick={() => window.scrollTo(0, 0)}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </GeometricContainer>
            </div>
            <div className="relative z-10">
              <GeometricContainer 
                variant="sacred" 
                borderGlow="purple"
                className="p-4 h-full"
              >
                <h3 className="font-orbitron text-[#7c3aed] mb-4 animate-cosmic flex items-center">
                  <span className="mr-2 h-4 w-4 bg-[#7c3aed] opacity-60 rounded-full cosmic-glow-purple"></span>
                  Community
                </h3>
                <ul className="space-y-2">
                  {[...topNavItems.slice(5), ...bottomNavItems.slice(0, 3)].map((item) => (
                    <li key={item.path}>
                      <Link 
                        href={item.path} 
                        className="text-white hover:text-[#7c3aed] transition-colors duration-300 flex items-center" 
                        onClick={() => window.scrollTo(0, 0)}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </GeometricContainer>
            </div>
            <div className="relative z-10">
              <GeometricContainer 
                variant="complex" 
                borderGlow="orange"
                className="p-4 h-full"
              >
                <h3 className="font-orbitron text-[#e15554] mb-4 animate-cosmic flex items-center">
                  <span className="mr-2 h-4 w-4 bg-[#e15554] opacity-60 rounded-full cosmic-glow-orange"></span>
                  Connect
                </h3>
                <ul className="space-y-2">
                  {bottomNavItems.slice(3).map((item) => (
                    <li key={item.path}>
                      <Link 
                        href={item.path} 
                        className="text-white hover:text-[#e15554] transition-colors duration-300 flex items-center" 
                        onClick={() => window.scrollTo(0, 0)}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link 
                      href="/cart" 
                      className="text-white hover:text-[#e15554] transition-colors duration-300 flex items-center" 
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Your Cart
                    </Link>
                  </li>
                </ul>
              </GeometricContainer>
            </div>
            <div className="relative z-10">
              <GeometricContainer 
                variant="ethereal" 
                borderGlow="multi"
                className="p-4 h-full"
              >
                <h3 className="font-orbitron text-[#fb923c] mb-4 animate-cosmic flex items-center">
                  <span className="mr-2 h-4 w-4 bg-[#fb923c] opacity-60 rounded-full cosmic-glow-orange"></span>
                  Account & Legal
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link 
                      href="/privacy" 
                      className="text-white hover:text-[#fb923c] transition-colors duration-300 flex items-center" 
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/terms" 
                      className="text-white hover:text-[#fb923c] transition-colors duration-300 flex items-center" 
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/sitemap" 
                      className="text-white hover:text-[#fb923c] transition-colors duration-300 flex items-center" 
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <MapIcon className="h-4 w-4 mr-2" />
                      Sitemap
                    </Link>
                  </li>
                  {user && 
                    <li>
                      <Link 
                        href="/portal" 
                        className="text-white hover:text-[#fb923c] transition-colors duration-300 flex items-center" 
                        onClick={() => window.scrollTo(0, 0)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        My Dashboard
                      </Link>
                    </li>
                  }
                  {user?.role === "admin" && 
                    <li>
                      <Link 
                        href="/admin" 
                        className="text-white hover:text-[#fb923c] transition-colors duration-300 flex items-center" 
                        onClick={() => window.scrollTo(0, 0)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Portal
                      </Link>
                    </li>
                  }
                </ul>
              </GeometricContainer>
            </div>
          </div>
          
          {/* Footer Copyright Notices */}
          <div className="mt-8 relative z-10">
            <GeometricContainer 
              variant="minimal" 
              borderGlow="multi"
              className="p-4 text-center"
            >
              <div className="text-sm text-white/60">
                © {new Date().getFullYear()} Web App Copyright Claim By Lee Swan All rights reserved.
              </div>
              <div className="mt-2 text-sm text-white/60">
                © {new Date().getFullYear()} Language Copyright Claim By Dale Ham. All rights reserved.
              </div>
            </GeometricContainer>
          </div>
          
          {/* Cosmic footer accents */}
          <div className="mt-8 grid grid-cols-4 gap-1">
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#00ebd6]/70 to-transparent cosmic-glow-cyan"></div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#7c3aed]/70 to-transparent cosmic-glow-purple"></div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#e15554]/70 to-transparent"></div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#fb923c]/70 to-transparent cosmic-glow-orange"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface AuthLinksProps {
  isMobile?: boolean;
}

const AuthLinks = ({ isMobile = false }: AuthLinksProps) => {
  const { user } = useAuth();
  
  const buttonClasses = isMobile 
    ? "w-full justify-start text-white hover:text-[#00ebd6]" 
    : "h-9 text-white hover:text-[#00ebd6]";
  
  return (
    <>
      {user ? (
        <>
          <Link href="/portal">
            <Button 
              variant="cosmic" 
              size="sm" 
              className={buttonClasses}
            >
              <User className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          {(user.role === "admin" || user.role === "super_admin") && (
            <Link href="/admin">
              <Button 
                variant="ghost" 
                size="sm" 
                className={buttonClasses}
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </>
      ) : (
        <Link href="/auth">
          <Button 
            variant="cosmic" 
            size="sm" 
            className={buttonClasses}
          >
            <User className="h-4 w-4 mr-2" />
            Login
          </Button>
        </Link>
      )}
    </>
  );
};