/**
 * AccessibilityContext.tsx
 * 
 * Context provider for accessibility settings across the application.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  // Text size preferences
  textSize: 'normal' | 'large' | 'larger';
  setTextSize: (size: 'normal' | 'large' | 'larger') => void;
  
  // Contrast preferences
  highContrast: boolean;
  toggleHighContrast: () => void;
  
  // Motion reduction
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  
  // Navigation preferences
  autoHideNav: boolean;
  toggleAutoHideNav: () => void;
  
  // Color blindness assistance
  colorBlindMode: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  setColorBlindMode: (mode: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia') => void;
}

// Create the context with default values
const AccessibilityContext = createContext<AccessibilityContextType>({
  textSize: 'normal',
  setTextSize: () => {},
  highContrast: false,
  toggleHighContrast: () => {},
  reducedMotion: false,
  toggleReducedMotion: () => {},
  autoHideNav: false,
  toggleAutoHideNav: () => {},
  colorBlindMode: 'normal',
  setColorBlindMode: () => {},
});

// Create provider component
export const AccessibilityProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Initialize state with values from localStorage if available
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'larger'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoHideNav, setAutoHideNav] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState<'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('normal');

  // Load settings from localStorage on initial render
  useEffect(() => {
    try {
      const savedTextSize = localStorage.getItem('accessibility_textSize');
      if (savedTextSize) {
        setTextSize(savedTextSize as 'normal' | 'large' | 'larger');
      }
      
      const savedHighContrast = localStorage.getItem('accessibility_highContrast');
      if (savedHighContrast) {
        setHighContrast(savedHighContrast === 'true');
      }
      
      const savedReducedMotion = localStorage.getItem('accessibility_reducedMotion');
      if (savedReducedMotion) {
        setReducedMotion(savedReducedMotion === 'true');
      }
      
      const savedAutoHideNav = localStorage.getItem('accessibility_autoHideNav');
      if (savedAutoHideNav) {
        setAutoHideNav(savedAutoHideNav === 'true');
      }
      
      const savedColorBlindMode = localStorage.getItem('accessibility_colorBlindMode');
      if (savedColorBlindMode) {
        setColorBlindMode(savedColorBlindMode as 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia');
      }
      
      // Check for system preference for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion && savedReducedMotion === null) {
        setReducedMotion(true);
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('accessibility_textSize', textSize);
      localStorage.setItem('accessibility_highContrast', highContrast.toString());
      localStorage.setItem('accessibility_reducedMotion', reducedMotion.toString());
      localStorage.setItem('accessibility_autoHideNav', autoHideNav.toString());
      localStorage.setItem('accessibility_colorBlindMode', colorBlindMode);
      
      // Apply classes to document body based on settings
      const body = document.body;
      
      // Text size classes
      body.classList.remove('text-size-normal', 'text-size-large', 'text-size-larger');
      body.classList.add(`text-size-${textSize}`);
      
      // High contrast
      if (highContrast) {
        body.classList.add('high-contrast');
      } else {
        body.classList.remove('high-contrast');
      }
      
      // Reduced motion
      if (reducedMotion) {
        body.classList.add('reduced-motion');
      } else {
        body.classList.remove('reduced-motion');
      }
      
      // Auto-hide navigation
      if (autoHideNav) {
        body.classList.add('nav-auto-hide');
      } else {
        body.classList.remove('nav-auto-hide');
      }
      
      // Color blindness
      body.classList.remove('normal-vision', 'protanopia', 'deuteranopia', 'tritanopia');
      body.classList.add(colorBlindMode === 'normal' ? 'normal-vision' : colorBlindMode);
      
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  }, [textSize, highContrast, reducedMotion, autoHideNav, colorBlindMode]);

  // Toggle functions
  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleReducedMotion = () => setReducedMotion(prev => !prev);
  const toggleAutoHideNav = () => setAutoHideNav(prev => !prev);

  // Context value
  const value = {
    textSize,
    setTextSize,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    autoHideNav,
    toggleAutoHideNav,
    colorBlindMode,
    setColorBlindMode,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook for using the accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityContext;