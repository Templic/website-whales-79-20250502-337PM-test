/**
 * Tailwind CSS Variables Integration
 * 
 * This module provides utilities for generating CSS variables that
 * integrate with Tailwind CSS via the tailwindcss-theme-vars plugin pattern.
 * It enables dynamic theme switching and responsive theme variations.
 */

import { baseTokens, extendedTokens, type ThemeTokens } from './tokens';
import { ThemeMode, ThemeContrast, ThemeMotion } from './ThemeContext';
import { parseColor, hexToRgb, isDarkColor, lighten, darken } from './colorUtils';
import { tailwindThemeToCssVars } from './tailwindIntegration';

// Configuration for theme mode conversion
interface ThemeModeConfig {
  lightToDark?: {
    darkenAmount?: number;
    saturateAmount?: number;
  };
  darkToLight?: {
    lightenAmount?: number;
    desaturateAmount?: number;
  };
  blackout?: {
    background?: string;
    foreground?: string;
  };
}

// Configuration for contrast adjustments
interface ContrastConfig {
  low?: {
    reduceContrastAmount?: number;
  };
  high?: {
    increaseContrastAmount?: number;
  };
  maximum?: {
    background?: string;
    foreground?: string;
  };
}

// Configuration for motion settings
interface MotionConfig {
  reduced?: {
    durationMultiplier?: number;
  };
  none?: {
    disableAllAnimations?: boolean;
  };
}

// Complete theme variables configuration
export interface ThemeVariablesConfig {
  mode?: ThemeModeConfig;
  contrast?: ContrastConfig;
  motion?: MotionConfig;
  rootSelector?: string;
  darkSelector?: string;
  blackoutSelector?: string;
  customSelectors?: Record<string, string>;
  responsiveTheme?: boolean;
  disablePrefersColorScheme?: boolean;
  disablePrefersReducedMotion?: boolean;
}

// Default configuration values
const defaultConfig: ThemeVariablesConfig = {
  mode: {
    lightToDark: {
      darkenAmount: 0.2,
      saturateAmount: 0.05,
    },
    darkToLight: {
      lightenAmount: 0.2,
      desaturateAmount: 0.05,
    },
    blackout: {
      background: '#000000',
      foreground: '#ffffff',
    },
  },
  contrast: {
    low: {
      reduceContrastAmount: 0.1,
    },
    high: {
      increaseContrastAmount: 0.1,
    },
    maximum: {
      background: '#ffffff',
      foreground: '#000000',
    },
  },
  motion: {
    reduced: {
      durationMultiplier: 1.5,
    },
    none: {
      disableAllAnimations: true,
    },
  },
  rootSelector: ':root',
  darkSelector: '.dark',
  blackoutSelector: '.blackout',
  responsiveTheme: true,
  disablePrefersColorScheme: false,
  disablePrefersReducedMotion: false,
};

/**
 * Generate CSS variables for different theme modes
 */
export function generateThemeModeVariables(
  tokens: ThemeTokens,
  config: ThemeVariablesConfig = defaultConfig
): Record<string, Record<string, string>> {
  const mergedConfig = { ...defaultConfig, ...config };
  const themeVariables: Record<string, Record<string, string>> = {};
  
  // Generate base/light theme variables
  const lightThemeVars = tailwindThemeToCssVars({
    colors: tokens.colors || {},
    // Add other token categories as needed
  });
  
  themeVariables[mergedConfig.rootSelector || ':root'] = {
    ...lightThemeVars,
    '--theme-mode': '"light"',
  };
  
  // Generate dark theme variables
  if (tokens.darkMode?.colors) {
    // Use explicit dark mode tokens if available
    const darkThemeVars = tailwindThemeToCssVars({
      colors: tokens.darkMode.colors,
      // Add other dark mode token categories
    });
    
    themeVariables[mergedConfig.darkSelector || '.dark'] = {
      ...darkThemeVars,
      '--theme-mode': '"dark"',
    };
  } else {
    // Otherwise, derive dark mode from light mode
    const derivedDarkColors: Record<string, string | Record<string, string>> = {};
    const darkenAmount = mergedConfig.mode?.lightToDark?.darkenAmount || 0.2;
    
    // Transform light colors to dark
    if (tokens.colors) {
      Object.entries(tokens.colors).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Simple color
          derivedDarkColors[key] = isDarkColor(value) 
            ? lighten(value, darkenAmount) // If already dark, lighten slightly
            : darken(value, darkenAmount); // Otherwise darken it
        } else if (typeof value === 'object') {
          // Color with shades
          derivedDarkColors[key] = {};
          Object.entries(value).forEach(([shade, color]) => {
            (derivedDarkColors[key] as Record<string, string>)[shade] = isDarkColor(color) 
              ? lighten(color, darkenAmount / 2) 
              : darken(color, darkenAmount);
          });
        }
      });
    }
    
    const darkThemeVars = tailwindThemeToCssVars({
      colors: derivedDarkColors,
      // Add other derived dark token categories
    });
    
    themeVariables[mergedConfig.darkSelector || '.dark'] = {
      ...darkThemeVars,
      '--theme-mode': '"dark"',
    };
  }
  
  // Generate blackout theme (high contrast dark) variables
  if (tokens.blackoutMode?.colors) {
    // Use explicit blackout mode tokens if available
    const blackoutThemeVars = tailwindThemeToCssVars({
      colors: tokens.blackoutMode.colors,
      // Add other blackout mode token categories
    });
    
    themeVariables[mergedConfig.blackoutSelector || '.blackout'] = {
      ...blackoutThemeVars,
      '--theme-mode': '"blackout"',
    };
  } else {
    // Use simplified blackout settings
    const blackoutBg = mergedConfig.mode?.blackout?.background || '#000000';
    const blackoutFg = mergedConfig.mode?.blackout?.foreground || '#ffffff';
    
    themeVariables[mergedConfig.blackoutSelector || '.blackout'] = {
      '--color-background': blackoutBg,
      '--color-background-rgb': '0 0 0',
      '--color-foreground': blackoutFg,
      '--color-foreground-rgb': '255 255 255',
      '--theme-mode': '"blackout"',
    };
  }
  
  return themeVariables;
}

/**
 * Generate CSS variables for different contrast modes
 */
export function generateContrastVariables(
  tokens: ThemeTokens,
  config: ThemeVariablesConfig = defaultConfig
): Record<string, Record<string, string>> {
  const mergedConfig = { ...defaultConfig, ...config };
  const contrastVariables: Record<string, Record<string, string>> = {};
  
  // Low contrast mode
  contrastVariables['.contrast-low'] = {
    '--contrast-mode': '"low"',
  };
  
  // High contrast mode
  contrastVariables['.contrast-high'] = {
    '--contrast-mode': '"high"',
  };
  
  // Maximum contrast mode (black & white)
  const maxBg = mergedConfig.contrast?.maximum?.background || '#ffffff';
  const maxFg = mergedConfig.contrast?.maximum?.foreground || '#000000';
  
  contrastVariables['.contrast-maximum'] = {
    '--color-background': maxBg,
    '--color-background-rgb': '255 255 255',
    '--color-foreground': maxFg,
    '--color-foreground-rgb': '0 0 0',
    '--contrast-mode': '"maximum"',
  };
  
  return contrastVariables;
}

/**
 * Generate CSS variables for different motion settings
 */
export function generateMotionVariables(
  tokens: ThemeTokens,
  config: ThemeVariablesConfig = defaultConfig
): Record<string, Record<string, string>> {
  const mergedConfig = { ...defaultConfig, ...config };
  const motionVariables: Record<string, Record<string, string>> = {};
  
  // Default motion
  motionVariables[':root'] = {
    '--motion-mode': '"normal"',
    '--motion-reduce': '0',
    '--motion-safe': '1',
  };
  
  // Reduced motion
  const durationMultiplier = mergedConfig.motion?.reduced?.durationMultiplier || 1.5;
  
  motionVariables['.motion-reduced'] = {
    '--motion-mode': '"reduced"',
    '--motion-reduce': '1',
    '--motion-safe': '0',
    // Increase all animation durations by multiplier
    ...(tokens.animation?.duration ? 
      Object.entries(tokens.animation.duration).reduce((acc, [key, value]) => {
        const numValue = parseFloat(value);
        const unit = value.replace(/[\d.]/g, '');
        acc[`--duration-${key}`] = `${numValue * durationMultiplier}${unit}`;
        return acc;
      }, {} as Record<string, string>) : {})
  };
  
  // No motion
  motionVariables['.motion-none'] = {
    '--motion-mode': '"none"',
    '--motion-reduce': '1',
    '--motion-safe': '0',
    // Disable all animations
    ...(tokens.animation?.duration ? 
      Object.entries(tokens.animation.duration).reduce((acc, [key, _]) => {
        acc[`--duration-${key}`] = '0s';
        return acc;
      }, {} as Record<string, string>) : {}),
    // Set all transitions to 'none'
    '--transition-none': 'none',
  };
  
  return motionVariables;
}

/**
 * Generate media query rules for system preferences
 */
export function generateSystemPreferenceRules(
  config: ThemeVariablesConfig = defaultConfig
): string {
  const mergedConfig = { ...defaultConfig, ...config };
  let css = '';
  
  // Prefers color scheme: dark
  if (!mergedConfig.disablePrefersColorScheme) {
    css += `@media (prefers-color-scheme: dark) {
  :root:not(.light):not(.dark):not(.blackout) {
    color-scheme: dark;
  }
}\n`;
  }
  
  // Prefers reduced motion
  if (!mergedConfig.disablePrefersReducedMotion) {
    css += `@media (prefers-reduced-motion: reduce) {
  :root:not(.motion-normal):not(.motion-reduced):not(.motion-none) {
    --motion-mode: "reduced";
    --motion-reduce: 1;
    --motion-safe: 0;
  }
}\n`;
  }
  
  return css;
}

/**
 * Generate responsive CSS variables for different breakpoints
 */
export function generateResponsiveVariables(
  tokens: ThemeTokens,
  config: ThemeVariablesConfig = defaultConfig
): string {
  if (!config.responsiveTheme || !tokens.breakpoints) {
    return '';
  }
  
  let css = '';
  const breakpoints = tokens.breakpoints;
  
  // Generate responsive variable sets for each breakpoint
  Object.entries(breakpoints).forEach(([breakpointName, breakpointValue]) => {
    // Skip the 'base' breakpoint if it exists
    if (breakpointName === 'base') return;
    
    // Check if we have responsive tokens for this breakpoint
    const responsiveTokens = tokens.responsive?.[breakpointName];
    if (!responsiveTokens) return;
    
    // Generate media query with variable overrides
    css += `@media (min-width: ${breakpointValue}) {\n`;
    
    // Add responsive color tokens
    if (responsiveTokens.colors) {
      const responsiveColorVars = tailwindThemeToCssVars({
        colors: responsiveTokens.colors,
      });
      
      css += `  :root {\n`;
      Object.entries(responsiveColorVars).forEach(([varName, value]) => {
        css += `    ${varName}: ${value};\n`;
      });
      css += `  }\n`;
    }
    
    // Add responsive spacing tokens
    if (responsiveTokens.spacing) {
      css += `  :root {\n`;
      Object.entries(responsiveTokens.spacing).forEach(([key, value]) => {
        css += `    --spacing-${key}: ${value};\n`;
      });
      css += `  }\n`;
    }
    
    // Add responsive typography tokens
    if (responsiveTokens.typography?.fontSize) {
      css += `  :root {\n`;
      Object.entries(responsiveTokens.typography.fontSize).forEach(([key, value]) => {
        const size = typeof value === 'string' ? value : value.size;
        css += `    --font-size-${key}: ${size};\n`;
        
        if (typeof value !== 'string' && value.lineHeight) {
          css += `    --line-height-${key}: ${value.lineHeight};\n`;
        }
      });
      css += `  }\n`;
    }
    
    css += `}\n`;
  });
  
  return css;
}

/**
 * Generate complete CSS string with all theme mode and feature variables
 */
export function generateCssVariables(
  tokens: ThemeTokens = { ...baseTokens, ...extendedTokens },
  config: ThemeVariablesConfig = defaultConfig
): string {
  const modeVariables = generateThemeModeVariables(tokens, config);
  const contrastVariables = generateContrastVariables(tokens, config);
  const motionVariables = generateMotionVariables(tokens, config);
  const systemPreferenceRules = generateSystemPreferenceRules(config);
  const responsiveVariables = generateResponsiveVariables(tokens, config);
  
  let css = '';
  
  // Add mode variables
  Object.entries(modeVariables).forEach(([selector, variables]) => {
    css += `${selector} {\n`;
    Object.entries(variables).forEach(([property, value]) => {
      css += `  ${property}: ${value};\n`;
    });
    css += `}\n\n`;
  });
  
  // Add contrast variables
  Object.entries(contrastVariables).forEach(([selector, variables]) => {
    css += `${selector} {\n`;
    Object.entries(variables).forEach(([property, value]) => {
      css += `  ${property}: ${value};\n`;
    });
    css += `}\n\n`;
  });
  
  // Add motion variables
  Object.entries(motionVariables).forEach(([selector, variables]) => {
    // Skip root if already defined
    if (selector === ':root' && css.includes(':root {')) {
      return;
    }
    
    css += `${selector} {\n`;
    Object.entries(variables).forEach(([property, value]) => {
      css += `  ${property}: ${value};\n`;
    });
    css += `}\n\n`;
  });
  
  // Add system preference media queries
  css += systemPreferenceRules;
  
  // Add responsive variables
  css += responsiveVariables;
  
  // Add utility classes for data attributes
  css += `
/* Data attribute selectors for theme modes */
[data-theme="dark"] {
  color-scheme: dark;
}

[data-theme="light"] {
  color-scheme: light;
}

[data-contrast="high"] body {
  --contrast-mode: "high";
}

[data-motion="reduced"] body {
  --motion-mode: "reduced";
  --motion-reduce: 1;
  --motion-safe: 0;
}

/* JavaScript disabled fallbacks */
.no-js body {
  transition: none !important;
}
`;
  
  return css;
}

/**
 * Create a stylesheet element with theme variables
 */
export function injectThemeStylesheet(
  tokens: ThemeTokens = { ...baseTokens, ...extendedTokens },
  config: ThemeVariablesConfig = defaultConfig
): HTMLStyleElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const styleId = 'harmonize-theme-variables';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  const css = generateCssVariables(tokens, config);
  styleElement.textContent = css;
  
  return styleElement;
}