/**
 * Color Utilities
 * 
 * This module provides comprehensive color manipulation utilities for the theme system,
 * enabling dynamic color operations, contrast checks, and palette generation.
 */

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };

/**
 * Parse various color formats into a standardized RGB object
 */
export function parseColor(color: string): RGB {
  // Normalize the color string
  color = color.toLowerCase().trim();
  
  // Handle HSL format
  if (color.startsWith('hsl')) {
    return hslToRgb(parseHslString(color));
  }
  
  // Handle hex format
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }
  
  // Handle RGB format
  if (color.startsWith('rgb')) {
    return parseRgbString(color);
  }
  
  // Handle named colors (basic set)
  const namedColors: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    purple: '#800080',
    teal: '#008080',
    cyan: '#00ffff',
    magenta: '#ff00ff',
  };
  
  if (color in namedColors) {
    return hexToRgb(namedColors[color]);
  }
  
  throw new Error(`Unsupported color format: ${color}`);
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (value: number) => {
    const hex = Math.round(value).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Parse RGB string into RGB object
 */
export function parseRgbString(rgb: string): RGB {
  // Extract the values from rgb(r, g, b) or rgba(r, g, b, a)
  const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/);
  
  if (!match) {
    throw new Error(`Invalid RGB format: ${rgb}`);
  }
  
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Parse HSL string into HSL object
 */
export function parseHslString(hsl: string): HSL {
  // Extract the values from hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const match = hsl.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+\s*)?\)/);
  
  if (!match) {
    throw new Error(`Invalid HSL format: ${hsl}`);
  }
  
  return {
    h: parseInt(match[1], 10),
    s: parseInt(match[2], 10),
    l: parseInt(match[3], 10),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    // Achromatic (gray)
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert HSL to HSL string representation
 */
export function hslToString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Convert RGB to RGB string representation
 */
export function rgbToString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Calculate relative luminance for accessibility calculations
 * Based on WCAG 2.0 definition
 */
export function getLuminance(rgb: RGB): number {
  // Convert RGB to linear values
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(value => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  
  // Calculate luminance using WCAG formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.0 definition
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(parseColor(color1));
  const lum2 = getLuminance(parseColor(color2));
  
  // Calculate contrast ratio
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 */
export function meetsWcagAA(color1: string, color2: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 */
export function meetsWcagAAA(color1: string, color2: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Create a lighter version of a color
 */
export function lighten(color: string, amount: number): string {
  const hsl = rgbToHsl(parseColor(color));
  const newL = Math.min(100, hsl.l + amount);
  return hslToString({ ...hsl, l: newL });
}

/**
 * Create a darker version of a color
 */
export function darken(color: string, amount: number): string {
  const hsl = rgbToHsl(parseColor(color));
  const newL = Math.max(0, hsl.l - amount);
  return hslToString({ ...hsl, l: newL });
}

/**
 * Adjust a color's saturation
 */
export function saturate(color: string, amount: number): string {
  const hsl = rgbToHsl(parseColor(color));
  const newS = Math.min(100, Math.max(0, hsl.s + amount));
  return hslToString({ ...hsl, s: newS });
}

/**
 * Desaturate a color
 */
export function desaturate(color: string, amount: number): string {
  return saturate(color, -amount);
}

/**
 * Adjust a color's opacity
 */
export function adjustAlpha(color: string, alpha: number): string {
  const rgb = parseColor(color);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Get the complementary color (opposite on the color wheel)
 */
export function getComplementary(color: string): string {
  const hsl = rgbToHsl(parseColor(color));
  const newH = (hsl.h + 180) % 360;
  return hslToString({ ...hsl, h: newH });
}

/**
 * Mix two colors together
 */
export function mix(color1: string, color2: string, weight = 0.5): string {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  
  const w = Math.min(1, Math.max(0, weight));
  
  return rgbToString({
    r: Math.round(rgb1.r * (1 - w) + rgb2.r * w),
    g: Math.round(rgb1.g * (1 - w) + rgb2.g * w),
    b: Math.round(rgb1.b * (1 - w) + rgb2.b * w),
  });
}

/**
 * Generate a color palette from a base color
 */
export function generatePalette(baseColor: string, steps = 10): string[] {
  const hsl = rgbToHsl(parseColor(baseColor));
  const palette: string[] = [];
  
  // Generate shades (darker)
  for (let i = 0; i < steps; i++) {
    const l = Math.max(0, hsl.l - ((i + 1) * (hsl.l / steps)));
    palette.push(hslToString({ ...hsl, l }));
  }
  
  // Add the base color
  palette.push(hslToString(hsl));
  
  // Generate tints (lighter)
  for (let i = 0; i < steps; i++) {
    const l = Math.min(100, hsl.l + ((i + 1) * ((100 - hsl.l) / steps)));
    palette.push(hslToString({ ...hsl, l }));
  }
  
  return palette;
}

/**
 * Generate an accessible text color based on background
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  // Determine if white or black text provides better contrast
  const white = '#ffffff';
  const black = '#000000';
  
  const whiteContrast = getContrastRatio(backgroundColor, white);
  const blackContrast = getContrastRatio(backgroundColor, black);
  
  return whiteContrast > blackContrast ? white : black;
}

/**
 * Determine if a color is considered dark
 */
export function isDarkColor(color: string): boolean {
  const rgb = parseColor(color);
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness < 128;
}

/**
 * Generate a color scheme from a base color
 */
export interface ColorScheme {
  base: string;
  complementary: string;
  analogous: string[];
  triadic: string[];
  tetradic: string[];
  monochromatic: string[];
}

export function generateColorScheme(baseColor: string): ColorScheme {
  const hsl = rgbToHsl(parseColor(baseColor));
  
  // Generate color scheme
  return {
    base: hslToString(hsl),
    complementary: hslToString({ ...hsl, h: (hsl.h + 180) % 360 }),
    analogous: [
      hslToString({ ...hsl, h: (hsl.h + 30) % 360 }),
      hslToString({ ...hsl, h: (hsl.h + 330) % 360 }),
    ],
    triadic: [
      hslToString({ ...hsl, h: (hsl.h + 120) % 360 }),
      hslToString({ ...hsl, h: (hsl.h + 240) % 360 }),
    ],
    tetradic: [
      hslToString({ ...hsl, h: (hsl.h + 90) % 360 }),
      hslToString({ ...hsl, h: (hsl.h + 180) % 360 }),
      hslToString({ ...hsl, h: (hsl.h + 270) % 360 }),
    ],
    monochromatic: [
      hslToString({ ...hsl, l: Math.max(0, hsl.l - 30) }),
      hslToString({ ...hsl, l: Math.max(0, hsl.l - 20) }),
      hslToString({ ...hsl, l: Math.max(0, hsl.l - 10) }),
      hslToString({ ...hsl, l: Math.min(100, hsl.l + 10) }),
      hslToString({ ...hsl, l: Math.min(100, hsl.l + 20) }),
      hslToString({ ...hsl, l: Math.min(100, hsl.l + 30) }),
    ],
  };
}