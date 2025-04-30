/**
 * Tailwind CSS Integration Module
 * 
 * This module provides utilities for integrating our theme system with Tailwind CSS.
 * It converts our theme tokens into Tailwind-compatible format and provides
 * functionality to extend the Tailwind config dynamically.
 */

import type { Config } from 'tailwindcss';
import { baseTokens, extendedTokens, type ThemeTokens } from './tokens';
import { parseColor, hexToRgb, rgbToHsl } from './colorUtils';

// Type definitions for Tailwind theme extension
export interface TailwindThemeExtension {
  colors?: Record<string, string | Record<string, string>>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  fontSize?: Record<string, string | [string, Record<string, string>]>;
  boxShadow?: Record<string, string>;
  fontFamily?: Record<string, string[]>;
  screens?: Record<string, string>;
  animation?: Record<string, string>;
  keyframes?: Record<string, Record<string, Record<string, string>>>;
  transitionTimingFunction?: Record<string, string>;
  transitionDuration?: Record<string, string>;
  // Add other Tailwind theme categories as needed
}

/**
 * Convert theme tokens to Tailwind-compatible format
 */
export function tokenToTailwindFormat(tokens: ThemeTokens): TailwindThemeExtension {
  const extension: TailwindThemeExtension = {
    colors: {},
    spacing: {},
    borderRadius: {},
    fontSize: {},
    boxShadow: {},
    fontFamily: {},
    screens: {},
    animation: {},
    keyframes: {},
    transitionTimingFunction: {},
    transitionDuration: {},
  };

  // Process color tokens
  if (tokens.colors) {
    extension.colors = processColorTokens(tokens.colors);
  }

  // Process spacing tokens
  if (tokens.spacing) {
    extension.spacing = Object.entries(tokens.spacing).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  // Process border radius tokens
  if (tokens.borderRadius) {
    extension.borderRadius = Object.entries(tokens.borderRadius).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  // Process font size tokens
  if (tokens.typography?.fontSize) {
    extension.fontSize = Object.entries(tokens.typography.fontSize).reduce((acc, [key, value]) => {
      // Handle both simple string values and complex size+lineHeight objects
      if (typeof value === 'string') {
        acc[key] = value;
      } else if (typeof value === 'object') {
        acc[key] = [
          value.size || '1rem',
          { lineHeight: value.lineHeight || '1.5', letterSpacing: value.letterSpacing || 'normal' }
        ];
      }
      return acc;
    }, {} as Record<string, string | [string, Record<string, string>]>);
  }

  // Process box shadow tokens
  if (tokens.shadows) {
    extension.boxShadow = Object.entries(tokens.shadows).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  // Process font family tokens
  if (tokens.typography?.fontFamily) {
    extension.fontFamily = Object.entries(tokens.typography.fontFamily).reduce((acc, [key, value]) => {
      // Convert string to array if needed
      acc[key] = Array.isArray(value) ? value : [value];
      return acc;
    }, {} as Record<string, string[]>);
  }

  // Process breakpoint tokens
  if (tokens.breakpoints) {
    extension.screens = Object.entries(tokens.breakpoints).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  // Process animation tokens
  if (tokens.animation) {
    // Animation durations
    if (tokens.animation.duration) {
      extension.transitionDuration = Object.entries(tokens.animation.duration).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    }

    // Animation timing functions
    if (tokens.animation.easing) {
      extension.transitionTimingFunction = Object.entries(tokens.animation.easing).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    }

    // Complete animations
    if (tokens.animation.animations) {
      extension.animation = Object.entries(tokens.animation.animations).reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    }

    // Keyframes
    if (tokens.animation.keyframes) {
      extension.keyframes = {};
      
      Object.entries(tokens.animation.keyframes).forEach(([name, frames]) => {
        extension.keyframes![name] = {};
        
        Object.entries(frames).forEach(([position, styles]) => {
          extension.keyframes![name][position] = styles as Record<string, string>;
        });
      });
    }
  }

  return extension;
}

/**
 * Process color tokens into a Tailwind-compatible format
 */
function processColorTokens(colorTokens: Record<string, string | Record<string, string>>): Record<string, string | Record<string, string>> {
  const tailwindColors: Record<string, string | Record<string, string>> = {};

  Object.entries(colorTokens).forEach(([key, value]) => {
    // Handle nested color objects (like primary.500, primary.600)
    if (typeof value === 'object') {
      tailwindColors[key] = {};
      Object.entries(value).forEach(([shade, color]) => {
        (tailwindColors[key] as Record<string, string>)[shade] = color;
      });
    } else {
      // Handle direct color values
      tailwindColors[key] = value;
    }
  });

  return tailwindColors;
}

/**
 * Generate a Tailwind theme object from token values
 */
export function generateTailwindTheme(customTokens?: Partial<ThemeTokens>): TailwindThemeExtension {
  // Merge base tokens with custom tokens if provided
  const mergedTokens = customTokens 
    ? { ...baseTokens, ...customTokens } 
    : { ...baseTokens, ...extendedTokens };
    
  return tokenToTailwindFormat(mergedTokens);
}

/**
 * Extend Tailwind config with our theme
 */
export function extendTailwindConfig(config: Config, customTokens?: Partial<ThemeTokens>): Config {
  const themeExtension = generateTailwindTheme(customTokens);
  
  return {
    ...config,
    theme: {
      ...config.theme,
      extend: {
        ...config.theme?.extend,
        colors: {
          ...config.theme?.extend?.colors,
          ...themeExtension.colors,
        },
        spacing: {
          ...config.theme?.extend?.spacing,
          ...themeExtension.spacing,
        },
        borderRadius: {
          ...config.theme?.extend?.borderRadius,
          ...themeExtension.borderRadius,
        },
        fontSize: {
          ...config.theme?.extend?.fontSize,
          ...themeExtension.fontSize,
        },
        boxShadow: {
          ...config.theme?.extend?.boxShadow,
          ...themeExtension.boxShadow,
        },
        fontFamily: {
          ...config.theme?.extend?.fontFamily,
          ...themeExtension.fontFamily,
        },
        screens: {
          ...config.theme?.extend?.screens,
          ...themeExtension.screens,
        },
        animation: {
          ...config.theme?.extend?.animation,
          ...themeExtension.animation,
        },
        keyframes: {
          ...config.theme?.extend?.keyframes,
          ...themeExtension.keyframes,
        },
        transitionTimingFunction: {
          ...config.theme?.extend?.transitionTimingFunction,
          ...themeExtension.transitionTimingFunction,
        },
        transitionDuration: {
          ...config.theme?.extend?.transitionDuration,
          ...themeExtension.transitionDuration,
        },
      },
    },
  };
}

/**
 * Generate CSS variables from Tailwind theme extension
 */
export function tailwindThemeToCssVars(theme: TailwindThemeExtension): Record<string, string> {
  const cssVars: Record<string, string> = {};

  // Process colors
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([colorName, value]) => {
      if (typeof value === 'string') {
        cssVars[`--color-${colorName}`] = value;
        
        // Add RGB variables for opacity support in Tailwind
        const rgb = hexToRgb(value) || { r: 0, g: 0, b: 0 };
        cssVars[`--color-${colorName}-rgb`] = `${rgb.r} ${rgb.g} ${rgb.b}`;
        
        // Add HSL variables for easier manipulation
        const hsl = rgbToHsl(rgb);
        cssVars[`--color-${colorName}-hsl`] = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
      } else {
        Object.entries(value).forEach(([shade, color]) => {
          cssVars[`--color-${colorName}-${shade}`] = color;
          
          // Add RGB and HSL variables
          const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };
          cssVars[`--color-${colorName}-${shade}-rgb`] = `${rgb.r} ${rgb.g} ${rgb.b}`;
          
          const hsl = rgbToHsl(rgb);
          cssVars[`--color-${colorName}-${shade}-hsl`] = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
        });
      }
    });
  }

  // Process spacing
  if (theme.spacing) {
    Object.entries(theme.spacing).forEach(([key, value]) => {
      cssVars[`--spacing-${key}`] = value;
    });
  }

  // Process border radius
  if (theme.borderRadius) {
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      cssVars[`--radius-${key}`] = value;
    });
  }

  // Process font sizes
  if (theme.fontSize) {
    Object.entries(theme.fontSize).forEach(([key, value]) => {
      if (typeof value === 'string') {
        cssVars[`--font-size-${key}`] = value;
      } else {
        cssVars[`--font-size-${key}`] = value[0];
        
        // Add line height and letter spacing if available
        const [, properties] = value;
        if (properties.lineHeight) {
          cssVars[`--line-height-${key}`] = properties.lineHeight;
        }
        if (properties.letterSpacing) {
          cssVars[`--letter-spacing-${key}`] = properties.letterSpacing;
        }
      }
    });
  }

  // Process shadows
  if (theme.boxShadow) {
    Object.entries(theme.boxShadow).forEach(([key, value]) => {
      cssVars[`--shadow-${key}`] = value;
    });
  }

  // Process animation durations
  if (theme.transitionDuration) {
    Object.entries(theme.transitionDuration).forEach(([key, value]) => {
      cssVars[`--duration-${key}`] = value;
    });
  }

  // Process animation timing functions
  if (theme.transitionTimingFunction) {
    Object.entries(theme.transitionTimingFunction).forEach(([key, value]) => {
      cssVars[`--ease-${key}`] = value;
    });
  }

  return cssVars;
}

/**
 * Generate CSS utility classes from Tailwind theme
 */
export function generateTailwindUtilities(theme: TailwindThemeExtension): string {
  let css = '';

  // Generate color utilities
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([colorName, value]) => {
      if (typeof value === 'string') {
        // Basic color utilities
        css += `.text-${colorName} { color: var(--color-${colorName}); }\n`;
        css += `.bg-${colorName} { background-color: var(--color-${colorName}); }\n`;
        css += `.border-${colorName} { border-color: var(--color-${colorName}); }\n`;
      } else {
        Object.entries(value).forEach(([shade, _]) => {
          // Shaded color utilities
          css += `.text-${colorName}-${shade} { color: var(--color-${colorName}-${shade}); }\n`;
          css += `.bg-${colorName}-${shade} { background-color: var(--color-${colorName}-${shade}); }\n`;
          css += `.border-${colorName}-${shade} { border-color: var(--color-${colorName}-${shade}); }\n`;
        });
      }
    });
  }

  // Generate spacing utilities
  if (theme.spacing) {
    Object.entries(theme.spacing).forEach(([key, _]) => {
      css += `.p-${key} { padding: var(--spacing-${key}); }\n`;
      css += `.m-${key} { margin: var(--spacing-${key}); }\n`;
      css += `.gap-${key} { gap: var(--spacing-${key}); }\n`;
    });
  }

  // Generate border radius utilities
  if (theme.borderRadius) {
    Object.entries(theme.borderRadius).forEach(([key, _]) => {
      css += `.rounded-${key} { border-radius: var(--radius-${key}); }\n`;
    });
  }

  // Generate font size utilities
  if (theme.fontSize) {
    Object.entries(theme.fontSize).forEach(([key, _]) => {
      css += `.text-${key} { font-size: var(--font-size-${key}); `;
      
      // Add line height if available
      if (typeof theme.fontSize![key] !== 'string') {
        const [, properties] = theme.fontSize![key] as [string, Record<string, string>];
        if (properties.lineHeight) {
          css += `line-height: var(--line-height-${key}); `;
        }
        if (properties.letterSpacing) {
          css += `letter-spacing: var(--letter-spacing-${key}); `;
        }
      }
      
      css += `}\n`;
    });
  }

  // Generate shadow utilities
  if (theme.boxShadow) {
    Object.entries(theme.boxShadow).forEach(([key, _]) => {
      css += `.shadow-${key} { box-shadow: var(--shadow-${key}); }\n`;
    });
  }

  return css;
}

/**
 * Create a runtime utility to apply Tailwind-like classes dynamically
 */
export function tw(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate conditional Tailwind classes
 * @example cx({ 'bg-red-500': isError, 'p-4': true })
 */
export function cx(classMap: Record<string, boolean>): string {
  return Object.entries(classMap)
    .filter(([_, condition]) => Boolean(condition))
    .map(([className]) => className)
    .join(' ');
}

/**
 * Create a runtime utility to generate variant-based class names
 * Similar to class-variance-authority but simpler
 */
export function createVariants<T extends Record<string, unknown>>(
  baseClasses: string,
  variants: Record<keyof T, Record<string, string>>
) {
  return (props?: T): string => {
    if (!props) return baseClasses;
    
    const variantClasses = Object.entries(props).map(([propName, propValue]) => {
      // Skip undefined values
      if (propValue === undefined) return '';
      
      const propVariants = variants[propName as keyof T];
      if (!propVariants) return '';
      
      // Handle boolean props
      if (typeof propValue === 'boolean') {
        return propValue ? propVariants['true'] || '' : propVariants['false'] || '';
      }
      
      // Handle string/number props
      return propVariants[String(propValue)] || '';
    });
    
    return [baseClasses, ...variantClasses].filter(Boolean).join(' ');
  };
}