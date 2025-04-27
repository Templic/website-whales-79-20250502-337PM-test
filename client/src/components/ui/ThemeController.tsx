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

// Define type for our themes
type CosmicTheme = 'light' | 'dark' | 'blackout';

// Theme configuration for each mode with specific properties
type ThemeConfig = {
  [key in CosmicTheme]: {
    icon: React.ReactNode;
    color: string;
    bgGlow: string;
    name: string;
    borderColor: string;
  }
};

// Simple standalone theme toggle that doesn't rely on context
export function ThemeController() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<CosmicTheme>("dark");

  // Set mounted state and initialize theme
  useEffect(() => {
    setMounted(true);
    
    try {
      // Always default to dark theme now 
      const savedTheme = localStorage.getItem("theme") || "dark";
      
      // Define available themes and validate
      const availableThemes: CosmicTheme[] = ["light", "dark", "blackout"];
      
      // Validate theme value is one of our allowed themes
      const validTheme: CosmicTheme = availableThemes.includes(savedTheme as CosmicTheme)
        ? (savedTheme as CosmicTheme)
        : "dark";
      
      // Set state with validated theme
      setTheme(validTheme);
      
      // Apply theme directly to the document
      document.documentElement.classList.remove(...availableThemes);
      document.documentElement.classList.add(validTheme);
      
      // Safely set dataset property
      if (document.documentElement.dataset) {
        document.documentElement.dataset.theme = validTheme;
      }
    } catch (error) {
      // Fallback to dark theme if any error occurs
      console.error("Error initializing theme:", error);
      setTheme("dark");
      document.documentElement.classList.remove("light", "blackout");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const cycleTheme = () => {
    // Cycle between cosmic themes (light, dark, blackout)
    const themeOrder: CosmicTheme[] = ["light", "dark", "blackout"];
    
    // Get current index (will always find it due to our CosmicTheme type)
    const currentIndex = themeOrder.indexOf(theme);
    
    // Calculate next theme index
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    
    // Get the next theme (guaranteed to be defined as we're accessing a valid index)
    const newTheme: CosmicTheme = themeOrder[nextIndex];
    
    // Set state
    setTheme(newTheme);
    
    // Apply theme directly to the document
    document.documentElement.classList.remove(...themeOrder);
    document.documentElement.classList.add(newTheme);
    
    // Handle the DOM updates safely
    try {
      // Safely set dataset property
      if (document.documentElement.dataset) {
        document.documentElement.dataset.theme = newTheme;
      }
      
      // Store in localStorage
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error("Error updating theme:", error);
    }
  };

  // Avoid flash of incorrect theme while loading
  if (!mounted) {
    return <div className="fixed top-4 right-4 w-12 h-12" />;
  }

  // Define cosmic theme configurations with proper typing
  const themeConfig: ThemeConfig = {
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
      color: 'text-[#d100ff]', // Updated to match our enhanced blackout theme
      bgGlow: 'after:bg-[#6633ff]', // Enhanced glow effect
      name: 'Cosmic Void',
      borderColor: 'border-[#d100ff]' // Match the new primary color
    }
  };

  // No need for type casting since we're using proper types
  const currentTheme = themeConfig[theme];

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
          shadow-lg ${theme === 'blackout' 
            ? 'hover:shadow-[0_0_15px_5px_rgba(209,0,255,0.5)]' 
            : 'hover:shadow-[0_0_15px_3px_rgba(139,92,246,0.5)]'}
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
      
      {/* Removed theme indicator dots as requested */}
    </div>
  );
}