/**
 * Theme Transformer
 * 
 * Utilities for transforming themes dynamically, allowing for:
 * - Theme creation from a base color
 * - Transformation between light and dark themes
 * - Theme derivation from images or existing designs
 * - Export/import capabilities
 */

import { parseColor, rgbToHsl, hslToRgb, hslToString, rgbToString, isDarkColor } from './colorUtils';
import { baseTokens, themeTokenMappings } from './tokens';
import { getAccessibleTextColor, generateAccessiblePalette } from './accessibility';

/**
 * Transform interface between themes
 */
export interface ThemeTransformOptions {
  // Primary theme color (will derive other colors from this)
  primaryColor?: string;
  
  // Base theme to transform from
  baseTheme?: keyof typeof themeTokenMappings;
  
  // Contrast level adjustment
  contrastLevel?: number;  // 1 = normal, > 1 = higher contrast, < 1 = lower contrast
  
  // Saturation adjustment
  saturationLevel?: number;  // 1 = normal, > 1 = more saturated, < 1 = less saturated
  
  // Color shift (degrees on the color wheel)
  hueShift?: number;
  
  // Force light/dark theme
  mode?: 'light' | 'dark' | 'auto';
  
  // Preserve specific color properties from base theme
  preserveColors?: string[];
}

/**
 * Output theme type
 */
export type GeneratedTheme = {
  [key: string]: string;
};

/**
 * Create a new theme based on transformation options
 */
export function generateTheme(options: ThemeTransformOptions): GeneratedTheme {
  // Default options
  const defaults: Required<ThemeTransformOptions> = {
    primaryColor: baseTokens.colors.cosmic.purple[500],
    baseTheme: 'dark',
    contrastLevel: 1,
    saturationLevel: 1,
    hueShift: 0,
    mode: 'auto',
    preserveColors: []
  };
  
  // Merge options with defaults
  const opts = { ...defaults, ...options };
  
  // Start with base theme
  const baseTheme = { ...themeTokenMappings[opts.baseTheme] };
  const newTheme: GeneratedTheme = { ...baseTheme };
  
  // Determine theme mode (light/dark)
  let isDark = opts.baseTheme === 'dark';
  if (opts.mode !== 'auto') {
    isDark = opts.mode === 'dark';
  } else if (opts.primaryColor) {
    // Auto-detect based on primary color
    isDark = isDarkColor(opts.primaryColor);
  }
  
  // If primary color is specified, update it
  if (opts.primaryColor) {
    newTheme.primary = opts.primaryColor;
    
    // Generate color palette from primary
    const palette = generateColorPalette(opts.primaryColor, isDark, opts);
    
    // Apply palette colors to theme
    Object.entries(palette).forEach(([key, value]) => {
      // Skip preserved colors
      if (opts.preserveColors?.includes(key)) {
        return;
      }
      
      newTheme[key] = value;
    });
  }
  
  // Apply transformations to all colors
  Object.entries(newTheme).forEach(([key, value]) => {
    // Skip preserved colors or non-color values
    if (
      opts.preserveColors?.includes(key) ||
      !value.startsWith('#') && !value.startsWith('hsl') && !value.startsWith('rgb')
    ) {
      return;
    }
    
    // Apply transformations for visual properties
    try {
      // Parse the color
      const color = parseColor(value);
      
      // Convert to HSL for easier manipulation
      const hsl = rgbToHsl(color);
      
      // Apply hue shift
      if (opts.hueShift !== 0) {
        hsl.h = (hsl.h + opts.hueShift) % 360;
        if (hsl.h < 0) hsl.h += 360;
      }
      
      // Apply saturation adjustment
      if (opts.saturationLevel !== 1) {
        hsl.s = Math.max(0, Math.min(100, hsl.s * opts.saturationLevel));
      }
      
      // Apply contrast adjustment for lightness
      if (opts.contrastLevel !== 1) {
        // For dark themes, increase contrast by darkening dark colors and lightening light colors
        // For light themes, do the opposite
        if (isDark) {
          if (hsl.l < 50) {
            // Darken dark colors
            hsl.l = Math.max(0, hsl.l / opts.contrastLevel);
          } else {
            // Lighten light colors
            hsl.l = Math.min(100, hsl.l * opts.contrastLevel);
          }
        } else {
          if (hsl.l < 50) {
            // Lighten dark colors
            hsl.l = Math.min(100, hsl.l * opts.contrastLevel);
          } else {
            // Darken light colors
            hsl.l = Math.max(0, hsl.l / opts.contrastLevel);
          }
        }
      }
      
      // Update the color
      newTheme[key] = hslToString(hsl);
    } catch (e) {
      // Keep original if parsing fails
      console.warn(`Failed to transform color "${key}": ${value}`, e);
    }
  });
  
  // Ensure accessible text colors
  const backgroundKeys = ['background', 'card', 'primary', 'secondary', 'accent', 'muted'];
  const foregroundKeys = ['foreground', 'cardForeground', 'primaryForeground', 'secondaryForeground', 
                        'accentForeground', 'mutedForeground'];
  
  // Re-check foreground colors to ensure they are accessible against their backgrounds
  foregroundKeys.forEach(fgKey => {
    // Find the corresponding background key
    const bgKey = fgKey.replace('Foreground', '');
    
    if (newTheme[bgKey] && newTheme[fgKey]) {
      // Check if foreground is accessible against background
      const accessibleFg = getAccessibleTextColor(newTheme[bgKey]);
      newTheme[fgKey] = accessibleFg;
    }
  });
  
  return newTheme;
}

/**
 * Generate a color palette from a primary color
 */
function generateColorPalette(
  primaryColor: string, 
  isDark: boolean,
  options: Required<ThemeTransformOptions>
): GeneratedTheme {
  const primaryHsl = rgbToHsl(parseColor(primaryColor));
  
  // Generate accent color (complement or triad)
  const accentHue = (primaryHsl.h + 180) % 360;  // Complement
  const accentColor = hslToString({
    h: accentHue,
    s: primaryHsl.s,
    l: primaryHsl.l
  });
  
  // Generate secondary color (adjacent or split complement)
  const secondaryHue = (primaryHsl.h + 30) % 360;  // Adjacent
  const secondaryColor = hslToString({
    h: secondaryHue,
    s: Math.max(0, primaryHsl.s - 10),  // Slightly less saturated
    l: primaryHsl.l
  });
  
  // Create base palette
  const palette: GeneratedTheme = {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
  };
  
  // Add background, foreground based on dark/light mode
  if (isDark) {
    // Dark mode background: deep, desaturated version of primary color
    palette.background = hslToString({
      h: primaryHsl.h,
      s: Math.max(0, primaryHsl.s - 70),  // Much less saturated
      l: 5  // Very dark
    });
    
    // Dark mode card: slightly lighter than background
    palette.card = hslToString({
      h: primaryHsl.h,
      s: Math.max(0, primaryHsl.s - 60),
      l: 14
    });
    
    // Dark mode foreground: light color
    palette.foreground = hslToString({
      h: primaryHsl.h,
      s: 10,  // Very desaturated
      l: 96   // Very light
    });
    
    // Dark mode muted background
    palette.muted = hslToString({
      h: primaryHsl.h,
      s: Math.max(0, primaryHsl.s - 65),
      l: 15
    });
    
    // Dark mode muted foreground
    palette.mutedForeground = hslToString({
      h: primaryHsl.h,
      s: 15,
      l: 67
    });
    
    // Dark mode border
    palette.border = hslToString({
      h: primaryHsl.h,
      s: Math.max(0, primaryHsl.s - 50),
      l: 21
    });
  } else {
    // Light mode background: very light, slightly desaturated version of primary
    palette.background = hslToString({
      h: primaryHsl.h,
      s: 20,
      l: 95
    });
    
    // Light mode card: white or very light
    palette.card = hslToString({
      h: primaryHsl.h,
      s: 0,
      l: 100
    });
    
    // Light mode foreground: dark color
    palette.foreground = hslToString({
      h: primaryHsl.h,
      s: 0,
      l: 18
    });
    
    // Light mode muted background
    palette.muted = hslToString({
      h: primaryHsl.h,
      s: 23,
      l: 89
    });
    
    // Light mode muted foreground
    palette.mutedForeground = hslToString({
      h: primaryHsl.h,
      s: 0,
      l: 43
    });
    
    // Light mode border
    palette.border = hslToString({
      h: primaryHsl.h,
      s: 8,
      l: 85
    });
  }
  
  // Add foreground colors for interactive elements
  // Primary foreground
  palette.primaryForeground = getAccessibleTextColor(palette.primary);
  
  // Secondary foreground
  palette.secondaryForeground = getAccessibleTextColor(palette.secondary);
  
  // Accent foreground
  palette.accentForeground = getAccessibleTextColor(palette.accent);
  
  // Card foreground
  palette.cardForeground = palette.foreground;
  
  // Input background
  palette.input = palette.muted;
  
  // Ring color (focus)
  palette.ring = palette.primary;
  
  return palette;
}

/**
 * Generate a theme from an image by extracting its colors
 * (Note: This is a stub - in a real implementation, this would use Canvas to analyze colors)
 */
export function themeFromImage(
  imageUrl: string,
  options?: Partial<ThemeTransformOptions>
): Promise<GeneratedTheme> {
  return new Promise<GeneratedTheme>((resolve, reject) => {
    // In a real implementation, load the image in a Canvas and analyze its colors
    // For now, return a placeholder theme
    const dummyPrimaryColor = '#8B5CF6';  // Placeholder purple
    
    resolve(generateTheme({
      primaryColor: dummyPrimaryColor,
      ...options
    }));
  });
}

/**
 * Convert light theme to dark theme
 */
export function lightToDarkTheme(lightTheme: GeneratedTheme): GeneratedTheme {
  return generateTheme({
    baseTheme: 'light',
    mode: 'dark',
    primaryColor: lightTheme.primary,
    contrastLevel: 1.2  // Slightly higher contrast for dark theme
  });
}

/**
 * Convert dark theme to light theme
 */
export function darkToLightTheme(darkTheme: GeneratedTheme): GeneratedTheme {
  return generateTheme({
    baseTheme: 'dark',
    mode: 'light',
    primaryColor: darkTheme.primary,
    contrastLevel: 0.9  // Slightly lower contrast for light theme
  });
}

/**
 * Export theme to different formats
 */
export function exportTheme(
  theme: GeneratedTheme,
  format: 'json' | 'css' | 'tailwind' | 'figma'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(theme, null, 2);
      
    case 'css':
      let css = ':root {\n';
      Object.entries(theme).forEach(([key, value]) => {
        // Convert camelCase to kebab-case
        const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        css += `  --${kebabKey}: ${value};\n`;
      });
      css += '}\n';
      return css;
      
    case 'tailwind':
      let tailwind = '// Add this to your tailwind.config.js\n';
      tailwind += 'module.exports = {\n';
      tailwind += '  theme: {\n';
      tailwind += '    extend: {\n';
      tailwind += '      colors: {\n';
      
      Object.entries(theme).forEach(([key, value]) => {
        tailwind += `        "${key}": "${value}",\n`;
      });
      
      tailwind += '      },\n';
      tailwind += '    },\n';
      tailwind += '  },\n';
      tailwind += '};\n';
      return tailwind;
      
    case 'figma':
      // Format compatible with Figma Variables
      let figma = '{\n';
      figma += '  "variables": {\n';
      
      Object.entries(theme).forEach(([key, value]) => {
        figma += `    "${key}": {\n`;
        figma += `      "type": "color",\n`;
        figma += `      "value": "${value}"\n`;
        figma += '    },\n';
      });
      
      figma += '  }\n';
      figma += '}\n';
      return figma;
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Import theme from JSON
 */
export function importTheme(themeJson: string): GeneratedTheme {
  try {
    const importedTheme = JSON.parse(themeJson);
    
    // Validate imported theme (ensure it has required colors)
    const requiredColors = ['primary', 'background', 'foreground'];
    const missingColors = requiredColors.filter(color => !importedTheme[color]);
    
    if (missingColors.length > 0) {
      throw new Error(`Missing required colors: ${missingColors.join(', ')}`);
    }
    
    return importedTheme;
  } catch (e) {
    throw new Error(`Failed to import theme: ${e.message}`);
  }
}