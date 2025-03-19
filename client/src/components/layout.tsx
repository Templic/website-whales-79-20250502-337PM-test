import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Home, User, Music, Calendar, Heart, Mail, BookOpen, Users, MessageSquare, Info, Archive, Settings, Menu } from "lucide-react";
import { useState } from "react";

// Debug text to verify component update
console.log("Layout component loaded - v2 with updated navigation labels");

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = () => {
    console.log("NavLinks component rendering - checking labels");
    return (
      <>
        <Link href="/">
          <Button variant="ghost" size="sm" className="h-9">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
        <Link href="/about">
          <Button variant="ghost" size="sm" className="h-9">
            <Info className="h-4 w-4 mr-2" />
            About
          </Button>
        </Link>
        <Link href="/music-release">
          <Button variant="ghost" size="sm" className="h-9">
            <Music className="h-4 w-4 mr-2" />
            New Music
          </Button>
        </Link>
        <Link href="/archived-music">
          <Button variant="ghost" size="sm" className="h-9">
            <Archive className="h-4 w-4 mr-2" />
            Archived Music
          </Button>
        </Link>
        <Link href="/tour">
          <Button variant="ghost" size="sm" className="h-9">
            <Calendar className="h-4 w-4 mr-2" />
            Tour
          </Button>
        </Link>
        <Link href="/engage">
          <Button variant="ghost" size="sm" className="h-9">
            <Heart className="h-4 w-4 mr-2" />
            Engage
          </Button>
        </Link>
        <Link href="/newsletter">
          <Button variant="ghost" size="sm" className="h-9">
            <Mail className="h-4 w-4 mr-2" />
            Newsletter
          </Button>
        </Link>
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="h-9">
            <BookOpen className="h-4 w-4 mr-2" />
            Blog
          </Button>
        </Link>
        <Link href="/collaboration">
          <Button variant="ghost" size="sm" className="h-9">
            <Users className="h-4 w-4 mr-2" />
            Collab
          </Button>
        </Link>
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto">
          <div className="flex h-[72px] items-center justify-between px-4">
            {/* Mobile Menu */}
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
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

            {/* Desktop Navigation */}
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

      <footer className="border-t py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/newsletter">Newsletter</Link></li>
                <li><Link href="/collaboration">Collaboration</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Content</h3>
              <ul className="space-y-2">
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/music-release">New Music</Link></li>
                <li><Link href="/archived-music">Archived Music</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2">
                <li><Link href="/engage">Engage</Link></li>
                <li><Link href="/tour">Tour Dates</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Account & Info</h3>
              <ul className="space-y-2">
                <li><Link href="/sitemap">Sitemap</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
                {user && <li><Link href="/portal">My Dashboard</Link></li>}
                {user?.role === "admin" && <li><Link href="/admin">Admin Portal</Link></li>}
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dale Love Whales. All rights reserved.
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
            <Button variant="ghost" size="sm" className="h-9">
              <User className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          {(user.role === "admin" || user.role === "super_admin") && (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="h-9">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </>
      ) : (
        <Link href="/auth">
          <Button variant="ghost" size="sm" className="h-9">
            <User className="h-4 w-4 mr-2" />
            Login
          </Button>
        </Link>
      )}
    </>
  );
};