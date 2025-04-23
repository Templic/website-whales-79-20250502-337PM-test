
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User, ShoppingBag, Users, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SacredGeometry } from "@/components/ui/sacred-geometry";

const Navbar = () => {
  const isMobile = useIsMobile();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Eventful Newness", href: "/", icon: <Home className="w-4 h-4 mr-2" /> },
    { name: "Community", href: "/community", icon: <Users className="w-4 h-4 mr-2" /> },
    { name: "Shop", href: "/shop", icon: <ShoppingBag className="w-4 h-4 mr-2" /> },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:text-cosmic-primary transition-colors"
          onClick={() => setIsMenuOpen(false)}
        >
          {item.icon}
          {item.name}
        </Link>
      ))}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/70 border-b border-border">
      <div className="cosmic-container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="relative w-10 h-10 mr-2">
                <div className="absolute inset-0 bg-cosmic-primary rounded-full opacity-20 animate-pulse-gentle"></div>
                <div className="absolute inset-2 bg-cosmic-primary rounded-full"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cosmic-light via-cosmic-primary to-cosmic-blue bg-clip-text text-transparent">
                CosmicConnect
              </span>
            </Link>
          </div>

          {!isMobile && (
            <div className="hidden md:flex md:items-center md:justify-center md:flex-1">
              <div className="flex items-center space-x-4">
                <NavLinks />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5 text-cosmic-primary" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button 
                  className="bg-cosmic-primary hover:bg-cosmic-vivid text-white" 
                  size="sm"
                >
                  Sign In
                </Button>
              </Link>
            )}

            {isMobile && (
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-xl border-cosmic-primary/20">
                  <SacredGeometry variant="torus" intensity="subtle" className="h-full flex flex-col space-y-4 pt-6">
                    <NavLinks />
                  </SacredGeometry>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
