import { Link } from "wouter";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-[#0a325c] sticky top-0 z-50 border-b border-[#00ebd6] shadow-lg">
      <div className="flex items-center justify-between p-4 container mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-[#00ebd6] hover:text-[#e8e6e3] transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link href="/" className="text-[#00ebd6] text-xl sm:text-2xl font-bold no-underline font-montserrat">
            Dale Loves Whales
          </Link>
        </div>

        <nav className="hidden md:block flex-grow mx-8">
          <ul className="flex flex-wrap gap-4 lg:gap-6 list-none p-0 justify-center">
            <li><Link href="/" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Home</Link></li>
            <li><Link href="/about" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">About</Link></li>
            <li><Link href="/music-release" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">New Music</Link></li>
            <li><Link href="/archived-music" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Archived Music</Link></li>
            <li><Link href="/tour" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Tour</Link></li>
            <li><Link href="/engage" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Engage</Link></li>
            <li><Link href="/newsletter" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Newsletter</Link></li>
            <li><Link href="/blog" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Blog</Link></li>
            <li><Link href="/collaboration" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Collaboration</Link></li>
            <li><Link href="/contact" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Contact</Link></li>
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
          <li><Link href="/" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block">Home</Link></li>
          <li><Link href="/about" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block">About</Link></li>
          <li><Link href="/music-release" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block">New Music</Link></li>
          <li><Link href="/archived-music" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block">Archived Music</Link></li>
          <li><Link href="/tour" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block">Tour</Link></li>
          <li><Link href="/engage" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block">Engage</Link></li>
          <li><Link href="/newsletter" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block">Newsletter</Link></li>
          <li><Link href="/blog" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block">Blog</Link></li>
          <li><Link href="/collaboration" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block">Collaboration</Link></li>
          <li><Link href="/contact" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-3 block">Contact</Link></li>
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