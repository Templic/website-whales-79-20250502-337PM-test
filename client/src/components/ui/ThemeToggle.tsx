/**
 * ThemeToggle.tsx
 * 
 * Component Type: common
 * Enhanced with improved theme switching functionality
 * Supports light, dark, and blackout modes
 */
import { CircleDot, Moon, Sun, SunMoon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    const themeOrder = ["light", "dark", "blackout", "system"];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    setTheme(nextTheme as any); // Type is safe because we're selecting from the array
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
      aria-label="Toggle theme"
    >
      <Sun className={`absolute inset-0 m-auto h-6 w-6 text-yellow-300 transition-all duration-300 ${theme !== 'light' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <Moon className={`absolute inset-0 m-auto h-6 w-6 text-blue-300 transition-all duration-300 ${theme !== 'dark' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <CircleDot className={`absolute inset-0 m-auto h-6 w-6 text-purple-500 transition-all duration-300 ${theme !== 'blackout' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <SunMoon className={`absolute inset-0 m-auto h-6 w-6 text-cosmic-primary transition-all duration-300 ${theme !== 'system' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <span className="sr-only">Toggle cosmic theme</span>
      
      {/* Mobile and tablet indicator (visible on smaller screens) */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-1 md:hidden">
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-yellow-300' : 'bg-gray-400'}`}></div>
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-blue-300' : 'bg-gray-400'}`}></div>
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${theme === 'blackout' ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${theme === 'system' ? 'bg-cosmic-primary' : 'bg-gray-400'}`}></div>
      </div>
    </Button>
  );
}