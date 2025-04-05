
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const navigationItems = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/music-release", label: "New Music" },
  { path: "/archived-music", label: "Archived Music" },
  { path: "/cosmic-connectivity", label: "Cosmic Connectivity" },
  { path: "/cosmic-experience", label: "Cosmic Experience" },
  { path: "/tour", label: "Tour" },
  { path: "/shop", label: "Shop" },
  { path: "/engage", label: "Engage" },
  { path: "/newsletter", label: "Newsletter" },
  { path: "/blog", label: "Blog" },
  { path: "/collaboration", label: "Collaborate" },
  { path: "/contact", label: "Contact" }
];

export function MainHeader() {
  return (
    <header className="w-full bg-background/80 backdrop-blur-sm border-b">
      <div className="container px-4 mx-auto">
        {/* Top bar with logo and search */}
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Dale Loves Whales
          </Link>
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 w-full"
            />
          </div>
        </div>
        
        {/* Two column navigation */}
        <nav className="grid grid-cols-2 gap-8 py-6">
          <div className="space-y-2">
            {navigationItems.slice(0, Math.ceil(navigationItems.length / 2)).map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className="block text-sm font-medium hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="space-y-2">
            {navigationItems.slice(Math.ceil(navigationItems.length / 2)).map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className="block text-sm font-medium hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
