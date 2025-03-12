import { Link, useLocation } from "wouter";
import { useState, useCallback } from "react";
import { Menu, X, Search } from "lucide-react";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Handler to close menu
  const handleNavigationClick = useCallback((path: string) => {
    setIsMenuOpen(false);
    setLocation(path);
  }, [setLocation]);

  return (
    <header className="bg-[#0a325c] sticky top-0 z-50 border-b border-[#00ebd6] shadow-lg">
      <div className="flex items-center justify-between p-4 container mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-[#00ebd6] hover:text-[#e8e6e3] transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <button 
            onClick={() => handleNavigationClick("/")}
            className="text-[#00ebd6] text-xl sm:text-2xl font-bold no-underline font-montserrat"
          >
            Dale Loves Whales
          </button>
        </div>

        <nav className="hidden md:block flex-grow mx-8">
          <ul className="flex flex-wrap gap-4 lg:gap-6 list-none p-0 justify-center">
            <li><button onClick={() => handleNavigationClick("/")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Home</button></li>
            <li><button onClick={() => handleNavigationClick("/about")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">About</button></li>
            <li><button onClick={() => handleNavigationClick("/music-release")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">New Music</button></li>
            <li><button onClick={() => handleNavigationClick("/archived-music")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Archived Music</button></li>
            <li><button onClick={() => handleNavigationClick("/tour")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Tour</button></li>
            <li><button onClick={() => handleNavigationClick("/engage")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Engage</button></li>
            <li><button onClick={() => handleNavigationClick("/newsletter")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Newsletter</button></li>
            <li><button onClick={() => handleNavigationClick("/blog")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Blog</button></li>
            <li><button onClick={() => handleNavigationClick("/collaboration")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Collaboration</button></li>
            <li><button onClick={() => handleNavigationClick("/contact")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Contact</button></li>
          </ul>
        </nav>

        <div className="search-container hidden sm:flex items-center gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 text-base border border-gray-300 rounded-md w-[200px] lg:w-[300px] bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ebd6]"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      <nav className={`md:hidden transition-all duration-300 ${isMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
        <ul className="flex flex-col gap-2 p-4 border-t border-[#00ebd6]/20">
          <li><button onClick={() => handleNavigationClick("/")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block w-full text-left">Home</button></li>
          <li><button onClick={() => handleNavigationClick("/about")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block w-full text-left">About</button></li>
          <li><button onClick={() => handleNavigationClick("/music-release")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block w-full text-left">New Music</button></li>
          <li><button onClick={() => handleNavigationClick("/archived-music")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block w-full text-left">Archived Music</button></li>
          <li><button onClick={() => handleNavigationClick("/tour")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block w-full text-left">Tour</button></li>
          <li><button onClick={() => handleNavigationClick("/engage")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block w-full text-left">Engage</button></li>
          <li><button onClick={() => handleNavigationClick("/newsletter")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block w-full text-left">Newsletter</button></li>
          <li><button onClick={() => handleNavigationClick("/blog")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block w-full text-left">Blog</button></li>
          <li><button onClick={() => handleNavigationClick("/collaboration")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block w-full text-left">Collaboration</button></li>
          <li><button onClick={() => handleNavigationClick("/contact")} className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block w-full text-left">Contact</button></li>
        </ul>

        {/* Mobile search */}
        <div className="p-4 border-t border-[#00ebd6]/20">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ebd6]"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </nav>
    </header>
  );
}