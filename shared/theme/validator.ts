/**
 * Theme Validator
 * 
 * This module provides utilities for validating theme structures
 * to ensure they meet the expected format before saving to database.
 */

import { ThemeTokens } from './types';
import { parseColor, hexToRgb, rgbToHsl } from './colorUtils';

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate color value format
 */
function isValidColor(color: string): boolean {
  try {
    // Check if we can parse the color
    const parsed = parseColor(color);
    return !!parsed;
  } catch (e) {
    return false;
  }
}

/**
 * Validate a dimension value (spacing, border-radius, etc.)
 */
function isValidDimension(value: string): boolean {
  // Allow CSS units: px, em, rem, %, vh, vw, etc.
  const dimensionRegex = /^(-?\d*\.?\d+)(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc|cqw|cqh|cqi|cqb|cqmin|cqmax)$|^0$/;
  return dimensionRegex.test(value);
}

/**
 * Validate a font-weight value
 */
function isValidFontWeight(value: string): boolean {
  // Allow named weights and numeric weights
  const namedWeights = ['normal', 'bold', 'lighter', 'bolder', 'initial', 'inherit'];
  const numericWeightRegex = /^(100|200|300|400|500|600|700|800|900)$/;
  
  return namedWeights.includes(value) || numericWeightRegex.test(value);
}

/**
 * Validate a line-height value
 */
function isValidLineHeight(value: string): boolean {
  // Allow unitless numbers, dimensions, and named values
  const namedValues = ['normal', 'initial', 'inherit'];
  const unitlessRegex = /^(\d*\.?\d+)$/;
  
  return namedValues.includes(value) || unitlessRegex.test(value) || isValidDimension(value);
}

/**
 * Validate a box-shadow value
 */
function isValidBoxShadow(value: string): boolean {
  // This is a simplified validation, as box-shadow can be complex
  // We check for "none" or a format that likely contains offset and color
  if (value === 'none') return true;
  
  // Check for at least one numeric value and a color
  const parts = value.split(' ');
  let hasNumeric = false;
  let hasColor = false;
  
  // A valid box-shadow generally has format: x-offset y-offset blur spread color inset
  for (const part of parts) {
    if (part === 'inset') continue;
    
    if (/^-?\d/.test(part)) {
      hasNumeric = true;
    } else if (
      part.startsWith('#') || 
      part.startsWith('rgb') || 
      part.startsWith('hsl') ||
      part.startsWith('rgba') ||
      part.startsWith('hsla')
    ) {
      hasColor = true;
    }
  }
  
  return hasNumeric && hasColor;
}

/**
 * Validate theme structure to ensure it follows expected format
 */
export function validateThemeStructure(tokens: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };
  
  if (!tokens || typeof tokens !== 'object') {
    result.valid = false;
    result.errors.push('Theme tokens must be an object');
    return result;
  }
  
  // Validate colors
  if (tokens.colors) {
    if (typeof tokens.colors !== 'object') {
      result.valid = false;
      result.errors.push('colors must be an object mapping color names to values');
    } else {
      // Check each color value
      for (const [key, value] of Object.entries(tokens.colors)) {
        if (typeof value === 'string') {
          if (!isValidColor(value)) {
            result.valid = false;
            result.errors.push(`Invalid color format for '${key}': ${value}`);
          }
        } else if (typeof value === 'object') {
          // Check color scale objects (e.g., primary.500)
          for (const [shade, colorValue] of Object.entries(value as Record<string, any>)) {
            if (typeof colorValue !== 'string' || !isValidColor(colorValue as string)) {
              result.valid = false;
              result.errors.push(`Invalid color format for '${key}.${shade}': ${colorValue}`);
            }
          }
        } else {
          result.valid = false;
          result.errors.push(`Color '${key}' must be a string or an object`);
        }
      }
      
      // Check for minimum required colors
      const requiredColors = ['primary', 'background', 'foreground'];
      for (const color of requiredColors) {
        if (!tokens.colors[color]) {
          result.warnings.push(`Missing recommended color: ${color}`);
        }
      }
    }
  } else {
    result.warnings.push('No colors defined in theme');
  }
  
  // Validate spacing
  if (tokens.spacing) {
    if (typeof tokens.spacing !== 'object') {
      result.valid = false;
      result.errors.push('spacing must be an object mapping spacing names to values');
    } else {
      for (const [key, value] of Object.entries(tokens.spacing)) {
        if (typeof value !== 'string' || !isValidDimension(value as string)) {
          result.valid = false;
          result.errors.push(`Invalid spacing value for '${key}': ${value}`);
        }
      }
    }
  }
  
  // Validate border radius
  if (tokens.borderRadius) {
    if (typeof tokens.borderRadius !== 'object') {
      result.valid = false;
      result.errors.push('borderRadius must be an object mapping radius names to values');
    } else {
      for (const [key, value] of Object.entries(tokens.borderRadius)) {
        if (typeof value !== 'string' || !isValidDimension(value as string)) {
          result.valid = false;
          result.errors.push(`Invalid border radius value for '${key}': ${value}`);
        }
      }
    }
  }
  
  // Validate typography
  if (tokens.typography) {
    if (typeof tokens.typography !== 'object') {
      result.valid = false;
      result.errors.push('typography must be an object');
    } else {
      // Validate font families
      if (tokens.typography.fontFamily) {
        if (typeof tokens.typography.fontFamily !== 'object') {
          result.valid = false;
          result.errors.push('typography.fontFamily must be an object');
        } else {
          for (const [key, value] of Object.entries(tokens.typography.fontFamily)) {
            if (typeof value !== 'string' && !Array.isArray(value)) {
              result.valid = false;
              result.errors.push(`Invalid font family for '${key}': ${value}`);
            }
          }
        }
      }
      
      // Validate font sizes
      if (tokens.typography.fontSize) {
        if (typeof tokens.typography.fontSize !== 'object') {
          result.valid = false;
          result.errors.push('typography.fontSize must be an object');
        } else {
          for (const [key, value] of Object.entries(tokens.typography.fontSize)) {
            if (typeof value === 'string') {
              if (!isValidDimension(value)) {
                result.valid = false;
                result.errors.push(`Invalid font size for '${key}': ${value}`);
              }
            } else if (typeof value === 'object') {
              // Complex font size object with size and line-height
              const fontSizeObj = value as any;
              if (!fontSizeObj.size || !isValidDimension(fontSizeObj.size)) {
                result.valid = false;
                result.errors.push(`Invalid font size value for '${key}.size': ${fontSizeObj.size}`);
              }
              
              if (fontSizeObj.lineHeight && !isValidLineHeight(fontSizeObj.lineHeight)) {
                result.valid = false;
                result.errors.push(`Invalid line height value for '${key}.lineHeight': ${fontSizeObj.lineHeight}`);
              }
              
              if (fontSizeObj.letterSpacing && !isValidDimension(fontSizeObj.letterSpacing)) {
                result.valid = false;
                result.errors.push(`Invalid letter spacing value for '${key}.letterSpacing': ${fontSizeObj.letterSpacing}`);
              }
            } else {
              result.valid = false;
              result.errors.push(`Font size '${key}' must be a string or an object`);
            }
          }
        }
      }
      
      // Validate font weights
      if (tokens.typography.fontWeight) {
        if (typeof tokens.typography.fontWeight !== 'object') {
          result.valid = false;
          result.errors.push('typography.fontWeight must be an object');
        } else {
          for (const [key, value] of Object.entries(tokens.typography.fontWeight)) {
            if (typeof value !== 'string' || !isValidFontWeight(value as string)) {
              result.valid = false;
              result.errors.push(`Invalid font weight for '${key}': ${value}`);
            }
          }
        }
      }
      
      // Validate line heights
      if (tokens.typography.lineHeight) {
        if (typeof tokens.typography.lineHeight !== 'object') {
          result.valid = false;
          result.errors.push('typography.lineHeight must be an object');
        } else {
          for (const [key, value] of Object.entries(tokens.typography.lineHeight)) {
            if (typeof value !== 'string' || !isValidLineHeight(value as string)) {
              result.valid = false;
              result.errors.push(`Invalid line height for '${key}': ${value}`);
            }
          }
        }
      }
    }
  }
  
  // Validate shadows
  if (tokens.shadows) {
    if (typeof tokens.shadows !== 'object') {
      result.valid = false;
      result.errors.push('shadows must be an object mapping shadow names to values');
    } else {
      for (const [key, value] of Object.entries(tokens.shadows)) {
        if (typeof value !== 'string' || !isValidBoxShadow(value as string)) {
          result.valid = false;
          result.errors.push(`Invalid shadow value for '${key}': ${value}`);
        }
      }
    }
  }
  
  // Validate animation durations
  if (tokens.animation?.duration) {
    if (typeof tokens.animation.duration !== 'object') {
      result.valid = false;
      result.errors.push('animation.duration must be an object');
    } else {
      for (const [key, value] of Object.entries(tokens.animation.duration)) {
        // Animation durations should be time values
        const timeRegex = /^(\d*\.?\d+)(s|ms)$/;
        if (typeof value !== 'string' || !timeRegex.test(value as string)) {
          result.valid = false;
          result.errors.push(`Invalid animation duration for '${key}': ${value}`);
        }
      }
    }
  }
  
  // Validate breakpoints
  if (tokens.breakpoints) {
    if (typeof tokens.breakpoints !== 'object') {
      result.valid = false;
      result.errors.push('breakpoints must be an object mapping breakpoint names to values');
    } else {
      for (const [key, value] of Object.entries(tokens.breakpoints)) {
        // Breakpoints should be valid dimensions
        if (typeof value !== 'string' || !isValidDimension(value as string)) {
          result.valid = false;
          result.errors.push(`Invalid breakpoint value for '${key}': ${value}`);
        }
      }
    }
  }
  
  // If dark mode is specified, validate its colors
  if (tokens.darkMode?.colors) {
    if (typeof tokens.darkMode.colors !== 'object') {
      result.valid = false;
      result.errors.push('darkMode.colors must be an object');
    } else {
      for (const [key, value] of Object.entries(tokens.darkMode.colors)) {
        if (typeof value === 'string') {
          if (!isValidColor(value)) {
            result.valid = false;
            result.errors.push(`Invalid dark mode color for '${key}': ${value}`);
          }
        } else if (typeof value === 'object') {
          for (const [shade, colorValue] of Object.entries(value as Record<string, any>)) {
            if (typeof colorValue !== 'string' || !isValidColor(colorValue as string)) {
              result.valid = false;
              result.errors.push(`Invalid dark mode color for '${key}.${shade}': ${colorValue}`);
            }
          }
        } else {
          result.valid = false;
          result.errors.push(`Dark mode color '${key}' must be a string or an object`);
        }
      }
    }
  }
  
  return result;
}

/**
 * Check theme for common issues and provide recommendations
 */
export function auditTheme(tokens: ThemeTokens): {
  issues: string[];
  recommendations: string[];
  score: number;
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100; // Start with perfect score and deduct points
  
  // Check for primary color and its contrast
  if (tokens.colors?.primary) {
    const primaryColor = typeof tokens.colors.primary === 'string' 
      ? tokens.colors.primary 
      : tokens.colors.primary[500] || Object.values(tokens.colors.primary)[0];
    
    if (primaryColor) {
      const rgb = hexToRgb(primaryColor);
      if (rgb) {
        const hsl = rgbToHsl(rgb);
        
        // Check saturation level
        if (hsl.s < 10) {
          issues.push('Primary color has very low saturation');
          recommendations.push('Consider using a more saturated primary color for better visual impact');
          score -= 5;
        } else if (hsl.s > 90) {
          issues.push('Primary color has very high saturation');
          recommendations.push('Consider reducing saturation of primary color for better visual comfort');
          score -= 3;
        }
        
        // Check luminance level
        if (hsl.l < 20) {
          issues.push('Primary color is very dark');
          recommendations.push('Consider using a lighter primary color for better visibility in light mode');
          score -= 3;
        } else if (hsl.l > 80) {
          issues.push('Primary color is very light');
          recommendations.push('Consider using a darker primary color for better visibility');
          score -= 3;
        }
      }
    }
  } else {
    issues.push('Missing primary color');
    recommendations.push('Add a primary color to your theme');
    score -= 10;
  }
  
  // Check for background and foreground colors
  if (!tokens.colors?.background) {
    issues.push('Missing background color');
    recommendations.push('Add a background color to your theme');
    score -= 8;
  }
  
  if (!tokens.colors?.foreground) {
    issues.push('Missing foreground color');
    recommendations.push('Add a foreground color to your theme');
    score -= 8;
  }
  
  // Check for semantic colors
  const semanticColors = ['success', 'warning', 'error', 'info'];
  const missingSemanticColors = semanticColors.filter(color => !tokens.colors?.[color]);
  
  if (missingSemanticColors.length > 0) {
    issues.push(`Missing semantic colors: ${missingSemanticColors.join(', ')}`);
    recommendations.push('Add semantic colors for better user feedback');
    score -= missingSemanticColors.length * 2;
  }
  
  // Check for spacing scale
  if (!tokens.spacing) {
    issues.push('Missing spacing scale');
    recommendations.push('Add a spacing scale for consistent layout');
    score -= 7;
  } else {
    const spacingValues = Object.values(tokens.spacing) as string[];
    
    // Check for consistency in spacing units
    const units = spacingValues.map(value => value.replace(/[\d.-]/g, ''));
    const uniqueUnits = new Set(units);
    
    if (uniqueUnits.size > 1) {
      issues.push('Inconsistent spacing units');
      recommendations.push('Use consistent units for spacing values (prefer rem or px)');
      score -= 5;
    }
  }
  
  // Check for typography scale
  if (!tokens.typography?.fontSize) {
    issues.push('Missing font size scale');
    recommendations.push('Add a font size scale for consistent typography');
    score -= 7;
  }
  
  // Check for dark mode
  if (!tokens.darkMode) {
    issues.push('Missing dark mode');
    recommendations.push('Add dark mode colors for better accessibility');
    score -= 5;
  }
  
  // Check for border radius consistency
  if (tokens.borderRadius) {
    const borderRadiusValues = Object.values(tokens.borderRadius) as string[];
    const units = borderRadiusValues.map(value => value.replace(/[\d.-]/g, ''));
    const uniqueUnits = new Set(units);
    
    if (uniqueUnits.size > 1) {
      issues.push('Inconsistent border radius units');
      recommendations.push('Use consistent units for border radius values');
      score -= 3;
    }
  }
  
  // Ensure score is within 0-100 range
  score = Math.max(0, Math.min(100, score));
  
  return {
    issues,
    recommendations,
    score,
  };
}