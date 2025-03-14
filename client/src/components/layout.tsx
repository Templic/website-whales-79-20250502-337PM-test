import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Home, User, Music, Calendar, Heart, Mail, BookOpen, Users, MessageSquare, Info, Archive, Settings } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-4 flex-wrap">
              <Link href="/">
                <Button variant="ghost">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="ghost">
                  <Info className="h-4 w-4 mr-2" />
                  About
                </Button>
              </Link>
              <Link href="/music-release">
                <Button variant="ghost">
                  <Music className="h-4 w-4 mr-2" />
                  Music Release
                </Button>
              </Link>
              <Link href="/archived-music">
                <Button variant="ghost">
                  <Archive className="h-4 w-4 mr-2" />
                  Archived Music
                </Button>
              </Link>
              <Link href="/tour">
                <Button variant="ghost">
                  <Calendar className="h-4 w-4 mr-2" />
                  Tour
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="ghost">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Blog
                </Button>
              </Link>
              <Link href="/engage">
                <Button variant="ghost">
                  <Heart className="h-4 w-4 mr-2" />
                  Engage
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/portal">
                    <Button variant="ghost">
                      <User className="h-4 w-4 mr-2" />
                      My Dashboard
                    </Button>
                  </Link>
                  {(user.role === "admin" || user.role === "super_admin") && (
                    <Link href="/admin">
                      <Button variant="ghost">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Portal
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </nav>
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