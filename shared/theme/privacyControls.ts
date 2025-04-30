/**
 * Theme Privacy Controls
 * 
 * This module implements privacy-focused controls for the theme system,
 * ensuring user preferences are respected and stored securely.
 * 
 * Features:
 * - Control over theme preference tracking
 * - Management of font loading behavior
 * - Control over preference storage
 */

interface ThemePrivacyOptions {
  // Whether to allow tracking of theme preferences for analytics
  allowThemeTracking: boolean;
  
  // Whether to store theme preferences in localStorage
  storePreferences: boolean;
  
  // Whether to load external fonts
  allowFonts: boolean;
  
  // Whether to allow network requests for theme resources
  allowNetworkRequests: boolean;
}

// Default to most private settings
const defaultPrivacyOptions: ThemePrivacyOptions = {
  allowThemeTracking: false,
  storePreferences: true,
  allowFonts: true,
  allowNetworkRequests: false
};

// Key for storing privacy options
const PRIVACY_OPTIONS_KEY = 'theme-privacy-options';

/**
 * Set theme privacy options with partial updates
 */
export function setThemePrivacyOptions(options: Partial<ThemePrivacyOptions>): ThemePrivacyOptions {
  const currentOptions = getThemePrivacyOptions();
  const newOptions = { ...currentOptions, ...options };
  
  try {
    // Store encrypted in localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(PRIVACY_OPTIONS_KEY, JSON.stringify(newOptions));
    }
    
    // Apply privacy settings immediately
    applyPrivacySettings(newOptions);
  } catch (error) {
    console.error('Failed to save privacy options:', error);
  }
  
  return newOptions;
}

/**
 * Get current theme privacy settings
 */
export function getThemePrivacyOptions(): ThemePrivacyOptions {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultPrivacyOptions;
  }
  
  try {
    const storedOptions = localStorage.getItem(PRIVACY_OPTIONS_KEY);
    return storedOptions ? JSON.parse(storedOptions) : defaultPrivacyOptions;
  } catch (e) {
    console.error('Error retrieving privacy options:', e);
    return defaultPrivacyOptions;
  }
}

/**
 * Apply privacy settings to the application
 */
function applyPrivacySettings(options: ThemePrivacyOptions): void {
  if (typeof window === 'undefined' || !window.document) {
    return;
  }
  
  // Handle font loading based on privacy preferences
  if (!options.allowFonts) {
    // Use system fonts only by updating CSS variables
    document.documentElement.style.setProperty('--font-almendra', 'serif');
    document.documentElement.style.setProperty('--font-cormorant-garamond', 'serif');
    document.documentElement.style.setProperty('--font-nebula', 'sans-serif');
    document.documentElement.style.setProperty('--font-space', 'sans-serif');
    document.documentElement.style.setProperty('--font-orbitron', 'monospace');
    document.documentElement.style.setProperty('--font-cinzel', 'serif');
    document.documentElement.style.setProperty('--font-gruppo', 'sans-serif');
    document.documentElement.style.setProperty('--font-michroma', 'monospace');
    document.documentElement.style.setProperty('--font-poiret', 'sans-serif');
    document.documentElement.style.setProperty('--font-syncopate', 'sans-serif');
    document.documentElement.style.setProperty('--font-exo', 'sans-serif');
    
    // Remove any font stylesheets
    const fontStylesheets = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    fontStylesheets.forEach(sheet => sheet.remove());
  }
  
  // Handle storage preferences
  if (!options.storePreferences) {
    // Clear theme preferences from storage
    localStorage.removeItem('cosmic-theme-preference');
    localStorage.removeItem('cosmic-contrast-preference');
    localStorage.removeItem('cosmic-motion-preference');
    
    // Add a flag to prevent future storage
    localStorage.setItem('theme-no-storage', 'true');
  } else {
    // Remove the no-storage flag
    localStorage.removeItem('theme-no-storage');
  }
  
  // Handle network requests for theme resources
  if (!options.allowNetworkRequests) {
    // Set a document attribute that can be used by the CSS to prevent
    // loading remote resources like background images
    document.documentElement.setAttribute('data-theme-network', 'disabled');
  } else {
    document.documentElement.removeAttribute('data-theme-network');
  }
  
  // Handle tracking
  if (!options.allowThemeTracking) {
    // Set a flag that can be checked by analytics modules
    // Using type assertion since it's a custom property
    (window as any).__themeTrackingDisabled = true;
  } else {
    // Remove the flag if tracking is allowed
    if ((window as any).__themeTrackingDisabled) {
      delete (window as any).__themeTrackingDisabled;
    }
  }
}

/**
 * Reset all privacy options to defaults
 */
export function resetPrivacyOptions(): ThemePrivacyOptions {
  return setThemePrivacyOptions(defaultPrivacyOptions);
}

/**
 * Clear all stored theme data (for privacy)
 */
export function clearAllThemeData(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  
  try {
    // Clear all theme-related localStorage items
    localStorage.removeItem(PRIVACY_OPTIONS_KEY);
    localStorage.removeItem('cosmic-theme-preference');
    localStorage.removeItem('cosmic-contrast-preference');
    localStorage.removeItem('cosmic-motion-preference');
    localStorage.removeItem('theme-no-storage');
    
    // Reset to system defaults
    document.documentElement.classList.remove('light', 'dark', 'blackout');
    document.documentElement.classList.remove('contrast-standard', 'contrast-high', 'contrast-maximum');
    document.documentElement.classList.remove('motion-full', 'motion-reduced', 'motion-none');
    
    // Let the media queries take over
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add(prefersReducedMotion ? 'motion-reduced' : 'motion-full');
    
    document.documentElement.classList.add('contrast-standard');
  } catch (e) {
    console.error('Error clearing theme data:', e);
  }
}