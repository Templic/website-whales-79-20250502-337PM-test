/**
 * ThemeToggle.tsx
 * 
 * Component Type: common
 * Enhanced with improved theme switching functionality
 */
import { Moon, Sun, SunMoon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // First time component mounts, check for stored preference or system preference
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(systemPrefersDark ? "dark" : "light");
    }
  }, []);

  // When theme changes, update both classList and local storage
  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    
    // Remove any existing theme classes
    root.classList.remove("light", "dark", "system");
    
    // Add the current theme class
    if (theme === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(systemPrefersDark ? "dark" : "light");
      root.dataset.theme = systemPrefersDark ? "dark" : "light";
    } else {
      root.classList.add(theme);
      root.dataset.theme = theme;
    }
    
    // Store preference
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Add listener for system preference changes when in "system" mode
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      if (theme === "system") {
        const root = window.document.documentElement;
        const systemPrefersDark = mediaQuery.matches;
        
        root.classList.remove("light", "dark");
        root.classList.add(systemPrefersDark ? "dark" : "light");
        root.dataset.theme = systemPrefersDark ? "dark" : "light";
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const cycleTheme = () => {
    setTheme(current => {
      const themeOrder: Theme[] = ["light", "system", "dark"];
      const currentIndex = themeOrder.indexOf(current);
      return themeOrder[(currentIndex + 1) % themeOrder.length];
    });
  };

  // Avoid flash of incorrect theme while loading
  if (!mounted) {
    return <div className="w-12 h-12" />;
  }

  return (
    <Button 
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className="relative w-12 h-12 rounded-full bg-background border-2 border-cosmic-primary shadow-lg hover:shadow-cosmic-primary/50 transition-all duration-300"
    >
      <Sun className={`absolute inset-0 m-auto h-6 w-6 text-yellow-300 transition-all duration-300 ${theme !== 'light' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <Moon className={`absolute inset-0 m-auto h-6 w-6 text-blue-300 transition-all duration-300 ${theme !== 'dark' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <SunMoon className={`absolute inset-0 m-auto h-6 w-6 text-cosmic-primary transition-all duration-300 ${theme !== 'system' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <span className="sr-only">Toggle cosmic theme</span>
    </Button>
  );
}