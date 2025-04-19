/**
 * ThemeController.tsx
 * 
 * Component Type: ui
 * A controller component that manages the theme toggling functionality
 * This wrapper ensures ThemeToggle is rendered only after the context is available
 * and provides a fallback for when theme context isn't available
 */
import React, { useState, useEffect } from "react";
import { CircleDot, Moon, Sun } from "lucide-react";
import { Button } from "./button";

// Simple standalone theme toggle that doesn't rely on context
export function ThemeController() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<string>("dark");

  // Set mounted state
  useEffect(() => {
    setMounted(true);
    // Get the saved theme from localStorage or default to dark
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    
    // Apply the theme directly to the document
    document.documentElement.classList.remove("light", "dark", "blackout");
    document.documentElement.classList.add(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  const cycleTheme = () => {
    // Cycle between cosmic themes (light, dark, blackout)
    const themeOrder = ["light", "dark", "blackout"] as const;
    
    // Use dark theme as fallback
    const currentThemeValue = theme || "dark";
    const currentIndex = themeOrder.indexOf(currentThemeValue as any);
    const nextIndex = (currentIndex !== -1) 
      ? (currentIndex + 1) % themeOrder.length 
      : 0; // Default to first theme if current theme not found
    
    // Set the next theme
    const newTheme = themeOrder[nextIndex];
    setTheme(newTheme);
    
    // Apply theme directly
    document.documentElement.classList.remove("light", "dark", "blackout");
    document.documentElement.classList.add(newTheme);
    document.documentElement.dataset.theme = newTheme;
    
    // Store in localStorage
    localStorage.setItem("theme", newTheme);
  };

  // Avoid flash of incorrect theme while loading
  if (!mounted) {
    return <div className="fixed top-4 right-4 w-12 h-12" />;
  }

  // Define cosmic theme configurations
  const themeConfig: {[key: string]: any} = {
    light: {
      icon: <Sun className="h-5 w-5" />,
      color: 'text-[#00c2cb]',
      bgGlow: 'after:bg-[#00c2cb]',
      name: 'Nebula',
      borderColor: 'border-[#00c2cb]'
    },
    dark: {
      icon: <Moon className="h-5 w-5" />,
      color: 'text-[#8b5cf6]',
      bgGlow: 'after:bg-[#8b5cf6]',
      name: 'Deep Space',
      borderColor: 'border-[#8b5cf6]'
    },
    blackout: {
      icon: <CircleDot className="h-5 w-5" />,
      color: 'text-[#b565ff]',
      bgGlow: 'after:bg-[#b565ff]',
      name: 'Cosmic Void',
      borderColor: 'border-[#b565ff]'
    }
  };

  const currentTheme = themeConfig[theme as keyof typeof themeConfig] || themeConfig.dark;

  return (
    <div className="fixed top-4 right-4 z-[100] transition-all duration-300 hover:scale-105 relative group">
      {/* Main cosmic toggle button */}
      <Button 
        variant="outline"
        size="icon"
        onClick={cycleTheme}
        className={`
          cosmic-theme-toggle
          relative w-12 h-12 rounded-full 
          bg-card border-2 ${currentTheme.borderColor}
          shadow-lg hover:shadow-[0_0_15px_3px_rgba(139,92,246,0.5)]
          transition-all duration-500
          overflow-hidden
          after:content-[''] after:absolute after:inset-0 after:opacity-0 
          after:rounded-full ${currentTheme.bgGlow} after:blur-xl after:scale-0
          hover:after:opacity-20 hover:after:scale-150 hover:after:transition-all hover:after:duration-1000
        `}
        aria-label={`Toggle theme (Current: ${currentTheme.name})`}
      >
        {/* Theme icon with cosmic glow effect */}
        <div className={`
          flex items-center justify-center ${currentTheme.color}
          animate-pulse-cosmic z-10
          drop-shadow-[0_0_5px_currentColor]
        `}>
          {currentTheme.icon}
        </div>
        
        <span className="sr-only">Toggle cosmic theme</span>
      </Button>
      
      {/* Floating theme name that appears on hover (desktop) */}
      <div className="
        absolute -bottom-8 left-1/2 transform -translate-x-1/2 
        opacity-0 group-hover:opacity-100 transition-opacity duration-300 
        hidden md:block
      ">
        <span className={`
          text-xs font-medium ${currentTheme.color} 
          px-2 py-1 rounded-full bg-card/90 border border-current
          drop-shadow-[0_0_3px_currentColor]
        `}>
          {currentTheme.name}
        </span>
      </div>
      
      {/* Theme indicator dots (mobile and tablet) */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 md:hidden">
        <div className={`
          w-2 h-2 rounded-full transition-all duration-300 
          ${theme === 'light' 
            ? 'bg-[#00c2cb] w-3 h-3 shadow-[0_0_5px_#00c2cb]' 
            : 'bg-card/50'}
        `}></div>
        <div className={`
          w-2 h-2 rounded-full transition-all duration-300 
          ${theme === 'dark' 
            ? 'bg-[#8b5cf6] w-3 h-3 shadow-[0_0_5px_#8b5cf6]' 
            : 'bg-card/50'}
        `}></div>
        <div className={`
          w-2 h-2 rounded-full transition-all duration-300 
          ${theme === 'blackout' 
            ? 'bg-[#b565ff] w-3 h-3 shadow-[0_0_5px_#b565ff]' 
            : 'bg-card/50'}
        `}></div>
      </div>
    </div>
  );
}