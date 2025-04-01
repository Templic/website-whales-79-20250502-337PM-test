import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Home, User, Music, Calendar, Heart, Mail, BookOpen, Users, MessageSquare, Info, Archive, Settings, Menu, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NavLinks = () => {
    return (
      <>
        <Link href="/">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
        <Link href="/about">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <Info className="h-4 w-4 mr-2" />
            About
          </Button>
        </Link>
        <Link href="/music-release">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <Music className="h-4 w-4 mr-2" />
            New Music
          </Button>
        </Link>
        <Link href="/archived-music">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archived Music
          </Button>
        </Link>
        <Link href="/tour">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Tour
          </Button>
        </Link>
        <Link href="/engage">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <Heart className="h-4 w-4 mr-2" />
            Engage
          </Button>
        </Link>
        <Link href="/newsletter">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <Mail className="h-4 w-4 mr-2" />
            Newsletter
          </Button>
        </Link>
        <Link href="/blog">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Blog
          </Button>
        </Link>
        <Link href="/cosmic-experience">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Cosmic Experience
          </Button>
        </Link>
        <Link href="/collaboration">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <Users className="h-4 w-4 mr-2" />
            Collaborate
          </Button>
        </Link>
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header 
        className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="container mx-auto">
          <div className="flex h-[72px] items-center justify-between px-4">
            {/* Mobile Menu with enhanced transitions */}
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="nav-link transition-all duration-300 hover:rotate-180"
                  >
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <nav className="flex flex-col gap-2">
                    <NavLinks />
                    <div className="my-4 h-[1px] bg-border" />
                    <AuthLinks />
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Navigation with enhanced animations */}
            <nav className="hidden sm:flex w-full justify-center">
              <div className="flex flex-wrap items-center gap-1 py-2 max-w-[900px]">
                <NavLinks />
              </div>
            </nav>

            {/* Auth Links */}
            <div className="hidden sm:flex items-center gap-x-2 ml-4">
              <AuthLinks />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t py-8 bg-muted/50 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Home</Link></li>
                <li><Link href="/about" className="nav-link" onClick={() => window.scrollTo(0, 0)}>About</Link></li>
                <li><Link href="/music-release" className="nav-link" onClick={() => window.scrollTo(0, 0)}>New Music</Link></li>
                <li><Link href="/archived-music" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Archived Music</Link></li>
                <li><Link href="/tour" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Tour</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2">
                <li><Link href="/engage" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Engage</Link></li>
                <li><Link href="/newsletter" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Newsletter</Link></li>
                <li><Link href="/blog" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Blog</Link></li>
                <li><Link href="/cosmic-experience" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Cosmic Experience</Link></li>
                <li><Link href="/collaboration" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Collaboration</Link></li>
                <li><Link href="/contact" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Account & Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Privacy Policy</Link></li>
                <li><Link href="/terms" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Terms of Service</Link></li>
                <li><Link href="/sitemap" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Sitemap</Link></li>
                {user && <li><Link href="/portal" className="nav-link" onClick={() => window.scrollTo(0, 0)}>My Dashboard</Link></li>}
                {user?.role === "admin" && <li><Link href="/admin" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Admin Portal</Link></li>}
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Web App Copyright Claim By Lee Swan All rights reserved.
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Language Copyright Claim By Dale Ham. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

const AuthLinks = () => {
  const { user } = useAuth();
  return (
    <>
      {user ? (
        <>
          <Link href="/portal">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
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
                className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
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
            variant="ghost" 
            size="sm" 
            className="h-9 nav-link transition-all duration-300 hover:translate-y-[-2px] hover:text-primary"
          >
            <User className="h-4 w-4 mr-2" />
            Login
          </Button>
        </Link>
      )}
    </>
  );
};