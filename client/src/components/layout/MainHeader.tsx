
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
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold">
              Cosmic Community
            </Link>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10 w-[300px]"
              />
            </div>
          </div>
        </div>
        <nav className="flex justify-between py-4">
          <div className="flex flex-col gap-2">
            {navigationItems.slice(0, Math.ceil(navigationItems.length / 2)).map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className="text-sm hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {navigationItems.slice(Math.ceil(navigationItems.length / 2)).map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className="text-sm hover:text-primary transition-colors"
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
