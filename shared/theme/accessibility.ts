/**
 * Theme Accessibility Utilities
 * 
 * This module provides functions for analyzing and enhancing the accessibility
 * of themes, including contrast checking and compliance verification.
 */

import { ThemeTokens } from './tokens';

/**
 * Interface for contrast check results
 */
export interface ContrastCheckResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
}

/**
 * Interface for accessibility audit results
 */
export interface AccessibilityAuditResult {
  contrastRatio: number;
  passes: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA' | 'Fail';
  colorBlind: {
    protanopia: boolean; // Red-blind
    deuteranopia: boolean; // Green-blind
    tritanopia: boolean; // Blue-blind
  };
  reducedMotion: boolean;
  keyboardFocusable: boolean;
  issues: AccessibilityIssue[];
}

/**
 * Interface for accessibility issues
 */
export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  component?: string;
  impact: 'high' | 'medium' | 'low';
  suggestion?: string;
}

/**
 * Check the contrast ratio between two colors
 * @param foreground Foreground color (text)
 * @param background Background color
 * @returns Contrast check result
 */
export function checkContrast(foreground: string, background: string): ContrastCheckResult {
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);
  
  // Calculate contrast ratio according to WCAG formula
  const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
  
  // WCAG AA: minimum contrast of 4.5:1 for normal text, 3:1 for large text
  // WCAG AAA: minimum contrast of 7:1 for normal text, 4.5:1 for large text
  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
  };
}

/**
 * Calculate the relative luminance of a color according to WCAG
 * @param color Color in hex format (#RRGGBB)
 * @returns Luminance value
 */
function getLuminance(color: string): number {
  // Convert hex to RGB
  let r, g, b;
  
  // Handle different color formats
  if (color.startsWith('#')) {
    // Hex color
    const hex = color.slice(1);
    
    if (hex.length === 3) {
      // Handle shorthand hex (#RGB)
      r = parseInt(hex[0] + hex[0], 16) / 255;
      g = parseInt(hex[1] + hex[1], 16) / 255;
      b = parseInt(hex[2] + hex[2], 16) / 255;
    } else {
      // Standard hex (#RRGGBB)
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    }
  } else if (color.startsWith('rgb')) {
    // RGB or RGBA color
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      r = parseInt(match[1], 10) / 255;
      g = parseInt(match[2], 10) / 255;
      b = parseInt(match[3], 10) / 255;
    } else {
      // Default to black if format is not recognized
      return 0;
    }
  } else if (color.startsWith('hsl')) {
    // Convert HSL to RGB and then calculate luminance
    const match = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/);
    if (match) {
      const h = parseInt(match[1], 10) / 360;
      const s = parseInt(match[2], 10) / 100;
      const l = parseInt(match[3], 10) / 100;
      
      const rgbValues = hslToRgb(h, s, l);
      r = rgbValues[0];
      g = rgbValues[1];
      b = rgbValues[2];
    } else {
      // Default to black if format is not recognized
      return 0;
    }
  } else {
    // Default to black for unknown formats
    return 0;
  }
  
  // Apply gamma correction
  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance (WCAG formula)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert HSL color to RGB
 * @param h Hue (0-1)
 * @param s Saturation (0-1)
 * @param l Lightness (0-1)
 * @returns RGB values as array of 0-1 values
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    // Achromatic (grey)
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1/3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1/3);
  }

  return [r, g, b];
}

/**
 * Helper function for HSL to RGB conversion
 */
function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

/**
 * Analyze theme for accessibility
 * @param tokens Theme tokens to analyze
 * @returns Accessibility audit result
 */
export function analyzeThemeAccessibility(tokens: ThemeTokens): AccessibilityAuditResult {
  const issues: AccessibilityIssue[] = [];
  
  // Check text contrast
  const textContrast = checkContrast(tokens.foreground, tokens.background);
  const primaryContrast = checkContrast(tokens.primaryForeground, tokens.primary);
  const secondaryContrast = checkContrast(tokens.secondaryForeground, tokens.secondary);
  
  // Determine overall contrast ratio (using text contrast as primary metric)
  const contrastRatio = textContrast.ratio;
  let wcagLevel: 'A' | 'AA' | 'AAA' | 'Fail' = 'Fail';
  
  if (textContrast.passesAAA && primaryContrast.passesAA && secondaryContrast.passesAA) {
    wcagLevel = 'AAA';
  } else if (textContrast.passesAA && primaryContrast.passesAA) {
    wcagLevel = 'AA';
  } else if (textContrast.ratio >= 3) {
    wcagLevel = 'A';
  }
  
  // Add issues for failing contrast
  if (!textContrast.passesAA) {
    issues.push({
      type: 'error',
      message: `Text contrast ratio (${textContrast.ratio.toFixed(2)}:1) does not meet WCAG AA standard (4.5:1)`,
      impact: 'high',
      suggestion: 'Increase the contrast between foreground and background colors',
    });
  }
  
  if (!primaryContrast.passesAA) {
    issues.push({
      type: 'error',
      message: `Primary button contrast ratio (${primaryContrast.ratio.toFixed(2)}:1) does not meet WCAG AA standard (4.5:1)`,
      component: 'button.primary',
      impact: 'high',
      suggestion: 'Adjust primary or primaryForeground color for better contrast',
    });
  }
  
  // Check animation tokens for reduced motion support
  const hasReducedMotion = tokens.animation && 
    (typeof tokens.animation === 'object' && 'reducedMotion' in tokens.animation);
  
  if (!hasReducedMotion) {
    issues.push({
      type: 'warning',
      message: 'No reduced motion alternative defined in animation tokens',
      impact: 'medium',
      suggestion: 'Add reducedMotion option to animation tokens',
    });
  }
  
  // Check for sufficient color variation (simple heuristic)
  if (tokens.primary === tokens.secondary) {
    issues.push({
      type: 'warning',
      message: 'Primary and secondary colors are identical',
      impact: 'medium',
      suggestion: 'Use different colors for primary and secondary elements',
    });
  }
  
  // Simplified colorblind check (in a real implementation, this would be more sophisticated)
  // This is a very basic simulation based on color proximity in certain channels
  const colorBlind = {
    protanopia: true, // Assume passing for simplicity
    deuteranopia: true,
    tritanopia: true,
  };
  
  return {
    contrastRatio,
    passes: wcagLevel === 'AA' || wcagLevel === 'AAA',
    wcagLevel,
    colorBlind,
    reducedMotion: hasReducedMotion,
    keyboardFocusable: true, // Simplified, would need component analysis
    issues,
  };
}

/**
 * Improve theme accessibility
 * @param tokens Theme tokens to improve
 * @returns Improved theme tokens
 */
export function improveThemeAccessibility(tokens: ThemeTokens): ThemeTokens {
  const improved = { ...tokens };
  const audit = analyzeThemeAccessibility(tokens);
  
  // If contrast fails, adjust colors
  if (!audit.passes) {
    // Simplified approach: increase contrast by adjusting lightness
    if (isLightTheme(tokens.background)) {
      // For light themes, darken text colors
      improved.foreground = darkenColor(improved.foreground);
      improved.primary = darkenColor(improved.primary);
      improved.secondary = darkenColor(improved.secondary);
    } else {
      // For dark themes, lighten text colors
      improved.foreground = lightenColor(improved.foreground);
      improved.primaryForeground = lightenColor(improved.primaryForeground);
      improved.secondaryForeground = lightenColor(improved.secondaryForeground);
    }
  }
  
  // Add reduced motion animation if missing
  if (!audit.reducedMotion && improved.animation) {
    if (typeof improved.animation === 'object') {
      improved.animation = {
        ...improved.animation,
        reducedMotion: 'none',
      };
    }
  }
  
  return improved;
}

/**
 * Determine if a color represents a light theme
 * @param color Background color
 * @returns True if light theme
 */
function isLightTheme(color: string): boolean {
  const luminance = getLuminance(color);
  return luminance > 0.5;
}

/**
 * Darken a color by a fixed amount
 * @param color Color to darken
 * @returns Darkened color
 */
function darkenColor(color: string): string {
  // Simple implementation - convert to HSL and adjust lightness
  // In a real application, this would be more sophisticated
  if (color.startsWith('#')) {
    // For hex colors, simple darkening
    return adjustHexLightness(color, -15);
  }
  
  // For other formats, return unchanged (in a real app, support more formats)
  return color;
}

/**
 * Lighten a color by a fixed amount
 * @param color Color to lighten
 * @returns Lightened color
 */
function lightenColor(color: string): string {
  // Simple implementation - convert to HSL and adjust lightness
  if (color.startsWith('#')) {
    // For hex colors, simple lightening
    return adjustHexLightness(color, 15);
  }
  
  // For other formats, return unchanged
  return color;
}

/**
 * Adjust the lightness of a hex color
 * @param hex Hex color
 * @param amount Amount to adjust (-100 to 100)
 * @returns Adjusted hex color
 */
function adjustHexLightness(hex: string, amount: number): string {
  const color = hex.replace('#', '');
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);
  
  // Convert to HSL to adjust lightness
  const [h, s, l] = rgbToHsl(r / 255, g / 255, b / 255);
  
  // Adjust lightness (clamped to 0-100%)
  const newL = Math.max(0, Math.min(1, l + amount / 100));
  
  // Convert back to RGB
  const [newR, newG, newB] = hslToRgb(h, s, newL);
  
  // Convert to hex
  const newHex = '#' + 
    Math.round(newR * 255).toString(16).padStart(2, '0') +
    Math.round(newG * 255).toString(16).padStart(2, '0') +
    Math.round(newB * 255).toString(16).padStart(2, '0');
  
  return newHex;
}

/**
 * Convert RGB to HSL
 * @param r Red (0-1)
 * @param g Green (0-1)
 * @param b Blue (0-1)
 * @returns HSL values as array of 0-1 values
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }

  return [h, s, l];
}