/**
 * ThemeProvider.tsx
 * 
 * Component Type: ui
 * A provider for theme state that can be used across the application
 */
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "blackout" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // First time component mounts, check for stored preference
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
    root.classList.remove("light", "dark", "blackout", "system");
    
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
        
        root.classList.remove("light", "dark", "blackout");
        root.classList.add(systemPrefersDark ? "dark" : "light");
        root.dataset.theme = systemPrefersDark ? "dark" : "light";
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}