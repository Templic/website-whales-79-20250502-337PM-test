import { Link, useLocation } from "wouter";
import { useState, useCallback } from "react";
import { Menu, X, Search } from "lucide-react";

// Navigation items array to reduce repetition
const navigationItems = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/music-release", label: "New Music" },
  { path: "/archived-music", label: "Archived Music" },
  { path: "/tour", label: "Tour" },
  { path: "/engage", label: "Engage" },
  { path: "/newsletter", label: "Newsletter" },
  { path: "/blog", label: "Blog" },
  { path: "/collaboration", label: "Collaborate" },
  // TEMPORARY TEST ITEMS - REMOVE BEFORE DEPLOYMENT
  { path: "/admin", label: "Admin" },
  { path: "/admin/analytics", label: "Analytics" },
  { path: "/contact", label: "Contact" }
];

function ChatPopup({ isOpen, onClose, title }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <button onClick={onClose} className="absolute top-2 right-2">
          &times;
        </button>
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p>Sample text for {title}.</p>
      </div>
    </div>
  );
}

const supportButtons = [
  { label: "Newsletter", onClick: () => window.open('/newsletter', '_blank') },
  { label: "Blog", onClick: () => window.open('/blog', '_blank') },
  { label: "Collaborate", onClick: () => window.open('/collaboration', '_blank') },
];

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [, navigate] = useLocation();

  const handleNavigationClick = useCallback((path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setIsMenuOpen(false);
      navigate(path);
      console.log("Navigating to:", path);
    }, 300);
  }, [navigate]);

  const navItemStyles = "text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2";
  const mobileNavItemStyles = `${navItemStyles} p-3 block w-full text-left`;
  const searchInputStyles = "px-3 py-2 text-base border border-gray-300 rounded-md bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ebd6]";

  return (
    <header className="bg-[#0a325c] sticky top-0 z-50 border-b border-[#00ebd6] shadow-lg">
      <div className="hidden">DEBUG: Header Updated - With Scroll To Top v2</div>

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-4 py-2 bg-[#00ebd6] text-[#303436] rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors"
            >
              Live Chat
            </button>
            <button
              onClick={() => setIsSupportOpen(true)}
              className="px-4 py-2 bg-[#00ebd6] text-[#303436] rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors"
            >
              Support
            </button>
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-2 absolute top-4 left-4">
          {supportButtons.map((button) => (
            <button
              key={button.label}
              onClick={button.onClick}
              className="px-4 py-2 bg-[#00ebd6] text-[#303436] rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors"
            >
              {button.label}
            </button>
          ))}
        </div>
        <nav className="hidden md:block flex-grow mx-8">
          <ul className="flex flex-wrap gap-4 lg:gap-6 list-none p-0 justify-center">
            {navigationItems.map(({ path, label }) => (
              <li key={path}>
                <Link href={path} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={navItemStyles}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="search-container hidden sm:flex items-center gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${searchInputStyles} w-[200px] lg:w-[300px]`}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </div>

      <nav className={`md:hidden transition-all duration-300 ${isMenuOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
        <ul className="flex flex-col gap-2 p-4 border-t border-[#00ebd6]/20">
          <div className="mb-4 space-y-2">
            {supportButtons.map((button) => (
              <button
                key={button.label}
                onClick={button.onClick}
                className="w-full text-left px-4 py-2 text-[#e8e6e3] hover:text-[#00ebd6] hover:bg-[#0a325c]/50"
              >
                {button.label}
              </button>
            ))}
          </div>
          {navigationItems.map(({ path, label }) => (
            <li key={path}>
              <Link href={path} onClick={() => {
                setIsMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className={mobileNavItemStyles}>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="p-4 border-t border-[#00ebd6]/20">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${searchInputStyles} w-full`}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </nav>
      <ChatPopup
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        title="Live Chat"
      />
      <ChatPopup
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        title="Customer Support"
      />
    </header>
  );
}