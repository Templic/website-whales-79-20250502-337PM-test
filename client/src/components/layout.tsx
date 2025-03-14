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

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link href="/">
        <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </Link>
      <Link href="/about">
        <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
          <Info className="h-4 w-4 mr-2" />
          About
        </Button>
      </Link>
      <Link href="/music-release">
        <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
          <Music className="h-4 w-4 mr-2" />
          Music Release
        </Button>
      </Link>
      <Link href="/archived-music">
        <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
          <Archive className="h-4 w-4 mr-2" />
          Archived Music
        </Button>
      </Link>
      <Link href="/tour">
        <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
          <Calendar className="h-4 w-4 mr-2" />
          Tour
        </Button>
      </Link>
      <Link href="/blog">
        <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
          <BookOpen className="h-4 w-4 mr-2" />
          Blog
        </Button>
      </Link>
      <Link href="/engage">
        <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
          <Heart className="h-4 w-4 mr-2" />
          Engage
        </Button>
      </Link>
      <Link href="/contact">
        <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          Contact
        </Button>
      </Link>
    </>
  );

  const AuthLinks = () => (
    <>
      {user ? (
        <>
          <Link href="/portal">
            <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
              <User className="h-4 w-4 mr-2" />
              My Dashboard
            </Button>
          </Link>
          {(user.role === "admin" || user.role === "super_admin") && (
            <Link href="/admin">
              <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
                <Settings className="h-4 w-4 mr-2" />
                Admin Portal
              </Button>
            </Link>
          )}
        </>
      ) : (
        <Link href="/auth">
          <Button variant="ghost" className="w-full sm:w-auto justify-start sm:justify-center">
            <User className="h-4 w-4 mr-2" />
            Login
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-auto py-2 sm:h-16 items-center justify-between">
            {/* Mobile Menu (visible only on smallest screens) */}
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <nav className="flex flex-col gap-4">
                    <NavLinks />
                    <div className="my-4 h-[1px] bg-border" />
                    <AuthLinks />
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Navigation (2 rows on medium screens, 1 row on large screens) */}
            <nav className="hidden sm:flex flex-col lg:flex-row lg:items-center lg:gap-x-2 flex-grow">
              <div className="flex flex-wrap gap-2 justify-center">
                <NavLinks />
              </div>
            </nav>

            {/* Auth Links (always on the right) */}
            <div className="hidden sm:flex sm:items-center sm:gap-x-2">
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
              <h3 className="font-semibold mb-4">Music</h3>
              <ul className="space-y-2">
                <li><Link href="/music-release">Latest Release</Link></li>
                <li><Link href="/archived-music">Archive</Link></li>
                <li><Link href="/tour">Tour Dates</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Content</h3>
              <ul className="space-y-2">
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/newsletter">Newsletter</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2">
                <li><Link href="/engage">Engage</Link></li>
                <li><Link href="/collaboration">Collaboration</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal & Account</h3>
              <ul className="space-y-2">
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