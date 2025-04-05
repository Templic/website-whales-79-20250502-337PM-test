import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

const navigationItems = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/music-release", label: "New Music" },
  { path: "/archived-music", label: "Archive" },
  { path: "/cosmic-experience", label: "Experience" },
  { path: "/tour", label: "Tour" },
  { path: "/engage", label: "Engage" },
  { path: "/shop", label: "Shop" }
];

export function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { autoHideNav } = useAccessibility();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 bg-[#0a325c] border-b border-[#00ebd6] shadow-lg transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-[#00ebd6] hover:text-[#e8e6e3] transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link 
            to="/"
            className="text-[#00ebd6] text-xl sm:text-2xl font-bold no-underline font-montserrat"
          >
            Dale Loves Whales
          </Link>
        </div>

        <nav className={`absolute md:relative top-full left-0 w-full md:w-auto bg-[#0a325c] md:bg-transparent transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-y-0' : '-translate-y-full md:translate-y-0'} md:block`}>
          <ul className="flex flex-col md:flex-row gap-2 p-4 md:p-0 md:gap-6 list-none">
            {navigationItems.map(({ path, label }) => (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide block py-2 md:py-0"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}