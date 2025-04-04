import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Home, User, Music, Calendar, Heart, Mail, BookOpen, Users, MessageSquare, Info, Archive, Settings, Menu, Sparkles, Zap, Disc, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";

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

      <footer className="border-t border-[#00ebd6]/20 py-8 bg-[#0a1e3c]/80 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-orbitron text-[#00ebd6] mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {topNavItems.slice(0, 5).map((item) => (
                  <li key={item.path}>
                    <Link 
                      href={item.path} 
                      className="text-white hover:text-[#00ebd6] transition-colors duration-300" 
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-orbitron text-[#00ebd6] mb-4">Community</h3>
              <ul className="space-y-2">
                {[...topNavItems.slice(5), ...bottomNavItems.slice(0, 3)].map((item) => (
                  <li key={item.path}>
                    <Link 
                      href={item.path} 
                      className="text-white hover:text-[#00ebd6] transition-colors duration-300" 
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-orbitron text-[#00ebd6] mb-4">Connect</h3>
              <ul className="space-y-2">
                {bottomNavItems.slice(3).map((item) => (
                  <li key={item.path}>
                    <Link 
                      href={item.path} 
                      className="text-white hover:text-[#00ebd6] transition-colors duration-300" 
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li><Link href="/cart" className="text-white hover:text-[#00ebd6] transition-colors duration-300" onClick={() => window.scrollTo(0, 0)}>Your Cart</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-orbitron text-[#00ebd6] mb-4">Account & Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white hover:text-[#00ebd6] transition-colors duration-300" onClick={() => window.scrollTo(0, 0)}>Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white hover:text-[#00ebd6] transition-colors duration-300" onClick={() => window.scrollTo(0, 0)}>Terms of Service</Link></li>
                <li><Link href="/sitemap" className="text-white hover:text-[#00ebd6] transition-colors duration-300" onClick={() => window.scrollTo(0, 0)}>Sitemap</Link></li>
                {user && <li><Link href="/portal" className="text-white hover:text-[#00ebd6] transition-colors duration-300" onClick={() => window.scrollTo(0, 0)}>My Dashboard</Link></li>}
                {user?.role === "admin" && <li><Link href="/admin" className="text-white hover:text-[#00ebd6] transition-colors duration-300" onClick={() => window.scrollTo(0, 0)}>Admin Portal</Link></li>}
              </ul>
            </div>
          </div>
          
          {/* Footer Copyright Notices */}
          <div className="mt-8 text-center text-sm text-white/60">
            © {new Date().getFullYear()} Web App Copyright Claim By Lee Swan All rights reserved.
          </div>
          <div className="mt-2 text-center text-sm text-white/60">
            © {new Date().getFullYear()} Language Copyright Claim By Dale Ham. All rights reserved.
          </div>
          
          {/* Cosmic footer accent */}
          <div className="mt-8 h-1 w-full bg-gradient-to-r from-purple-600/30 via-[#00ebd6]/50 to-indigo-600/30"></div>
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