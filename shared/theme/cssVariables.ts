/**
 * CSS Variables Generator
 * 
 * This module generates CSS custom properties (variables) from the design tokens,
 * providing a bridge between the token definitions and the CSS implementation.
 * 
 * The generated CSS can either be:
 * 1. Used to create a static CSS file as part of a build process
 * 2. Injected at runtime to support dynamic theming
 */

import { baseTokens, themeTokenMappings, highContrastTokens, motionPresets } from './tokens';

// Convert camelCase to kebab-case for CSS variables
function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Generate CSS variables text from tokens
 */
export function generateThemeVariables(): string {
  let cssVariables = '';
  
  // Generate root variables (shared across all themes)
  cssVariables += ':root {\n';
  
  // Add base tokens as CSS variables
  
  // Typography: Font sizes
  Object.entries(baseTokens.typography.fontSizes).forEach(([key, value]) => {
    cssVariables += `  --font-size-${key}: ${value};\n`;
  });
  
  // Typography: Font weights
  Object.entries(baseTokens.typography.fontWeights).forEach(([key, value]) => {
    cssVariables += `  --font-weight-${key}: ${value};\n`;
  });
  
  // Typography: Line heights
  Object.entries(baseTokens.typography.lineHeights).forEach(([key, value]) => {
    cssVariables += `  --line-height-${key}: ${value};\n`;
  });
  
  // Typography: Letter spacings
  Object.entries(baseTokens.typography.letterSpacings).forEach(([key, value]) => {
    cssVariables += `  --letter-spacing-${key}: ${value};\n`;
  });
  
  // Spacing
  Object.entries(baseTokens.space).forEach(([key, value]) => {
    cssVariables += `  --space-${key}: ${value};\n`;
  });
  
  // Border radii
  Object.entries(baseTokens.radii).forEach(([key, value]) => {
    cssVariables += `  --radius-${key}: ${value};\n`;
  });
  
  // Shadows
  Object.entries(baseTokens.shadows).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVariables += `  --shadow-${key === 'DEFAULT' ? 'default' : key}: ${value};\n`;
    }
  });
  
  // Cosmic shadows
  Object.entries(baseTokens.shadows.cosmic).forEach(([key, value]) => {
    cssVariables += `  --shadow-cosmic-${key}: ${value};\n`;
  });
  
  // Animation durations
  Object.entries(baseTokens.animation.durations).forEach(([key, value]) => {
    cssVariables += `  --duration-${key}: ${value};\n`;
  });
  
  // Animation easings
  Object.entries(baseTokens.animation.easings).forEach(([key, value]) => {
    cssVariables += `  --ease-${key}: ${value};\n`;
  });
  
  // Z-indices
  Object.entries(baseTokens.zIndices).forEach(([key, value]) => {
    cssVariables += `  --z-${key}: ${value};\n`;
  });
  
  // Font families
  Object.entries(baseTokens.typography.fonts).forEach(([key, value]) => {
    cssVariables += `  --font-${key}: ${value};\n`;
  });
  
  // End root section
  cssVariables += '}\n\n';
  
  // Generate theme-specific variables using HSL color format
  Object.entries(themeTokenMappings).forEach(([themeName, themeTokens]) => {
    // For each theme variant
    const selector = themeName === 'dark' ? '.dark' : 
                     themeName === 'blackout' ? '.blackout' : 
                     themeName === 'light' ? ':root' : `.${themeName}`;
    
    cssVariables += `${selector} {\n`;
    
    // Add the semantic color mappings
    Object.entries(themeTokens).forEach(([tokenName, value]) => {
      const cssVarName = toKebabCase(tokenName);
      cssVariables += `  --${cssVarName}: ${value};\n`;
    });
    
    // Add HSL versions for Tailwind compatibility
    cssVariables += '\n  /* HSL color values for Tailwind compatibility */\n';
    Object.entries(themeTokens).forEach(([tokenName, value]) => {
      if (typeof value === 'string' && value.startsWith('hsl(')) {
        const cssVarName = toKebabCase(tokenName);
        // Extract HSL values: hsl(222, 47%, 5%) -> 222 47% 5%
        const hslValues = value.replace('hsl(', '').replace(')', '');
        cssVariables += `  --${cssVarName}-hsl: ${hslValues};\n`;
      }
    });
    
    cssVariables += '}\n\n';
  });
  
  // Add contrast mode overrides
  cssVariables += `.contrast-high {\n`;
  // Apply high contrast modifications
  cssVariables += `  --contrast-multiplier: 1.2;\n`;
  cssVariables += `  --foreground: ${highContrastTokens.foreground};\n`;
  cssVariables += `  --muted-foreground: ${highContrastTokens.mutedForeground};\n`;
  cssVariables += `  --border: ${highContrastTokens.border};\n`;
  cssVariables += `}\n\n`;
  
  cssVariables += `.contrast-maximum {\n`;
  // Apply maximum contrast (potentially for accessibility needs)
  cssVariables += `  --contrast-multiplier: 1.5;\n`;
  cssVariables += `  --background: ${highContrastTokens.background};\n`;
  cssVariables += `  --foreground: ${highContrastTokens.foreground};\n`;
  cssVariables += `  --card: ${highContrastTokens.card};\n`;
  cssVariables += `  --card-foreground: ${highContrastTokens.cardForeground};\n`;
  cssVariables += `  --primary: ${highContrastTokens.primary};\n`;
  cssVariables += `  --accent: ${highContrastTokens.accent};\n`;
  cssVariables += `  --border: ${highContrastTokens.border};\n`;
  cssVariables += `  --muted-foreground: ${highContrastTokens.mutedForeground};\n`;
  cssVariables += `}\n\n`;
  
  // Add motion preferences
  cssVariables += `.motion-full {\n`;
  cssVariables += `  --transition-duration: ${motionPresets.full.duration};\n`;
  cssVariables += `  --transition-timing: ${motionPresets.full.easing};\n`;
  cssVariables += `}\n\n`;
  
  cssVariables += `.motion-reduced {\n`;
  cssVariables += `  --transition-duration: ${motionPresets.reduced.duration};\n`;
  cssVariables += `  --transition-timing: ${motionPresets.reduced.easing};\n`;
  cssVariables += `}\n\n`;
  
  cssVariables += `.motion-none {\n`;
  cssVariables += `  --transition-duration: ${motionPresets.none.duration};\n`;
  cssVariables += `  --transition-timing: ${motionPresets.none.easing};\n`;
  cssVariables += `}\n\n`;
  
  // Add helper classes for reduced motion
  cssVariables += `.reduced-motion *, .motion-none * {\n`;
  cssVariables += `  animation-duration: 0.001ms !important;\n`;
  cssVariables += `  animation-iteration-count: 1 !important;\n`;
  cssVariables += `  transition-duration: 0.001ms !important;\n`;
  cssVariables += `  scroll-behavior: auto !important;\n`;
  cssVariables += `}\n\n`;
  
  return cssVariables;
}

/**
 * Return an object with CSS variable mappings for inline styles
 */
export function getThemeVariablesObject(): Record<string, string> {
  const variables: Record<string, string> = {};
  
  // Add global variables from base tokens
  // Font sizes
  Object.entries(baseTokens.typography.fontSizes).forEach(([key, value]) => {
    variables[`--font-size-${key}`] = value;
  });
  
  // Add other variables as needed for dynamic inline styles
  
  return variables;
}

/**
 * Inject theme variables into the document at runtime
 */
export function injectThemeVariables(): void {
  if (typeof document === 'undefined') return;
  
  // Generate CSS content
  const cssContent = generateThemeVariables();
  
  // Check if the style element already exists
  let styleElement = document.getElementById('theme-variables');
  
  if (!styleElement) {
    // Create a new style element if it doesn't exist
    styleElement = document.createElement('style');
    styleElement.id = 'theme-variables';
    document.head.appendChild(styleElement);
  }
  
  // Update the style element content
  styleElement.textContent = cssContent;
}

/**
 * Apply theme variables as inline styles to the document root
 * Useful for SSR or when style injection is not possible
 */
export function applyThemeVariablesInline(): void {
  if (typeof document === 'undefined') return;
  
  const variables = getThemeVariablesObject();
  
  // Apply variables to document root
  Object.entries(variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}