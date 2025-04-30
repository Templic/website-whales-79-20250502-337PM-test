/**
 * Default Themes
 * 
 * This module provides default light and dark theme tokens.
 * These are used as starting points for theme creation.
 */

import { ThemeTokens } from './tokens';

// Default Light Theme Tokens
export const defaultLightTokens: ThemeTokens = {
  // Base colors
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(222.2, 84%, 4.9%)',
  card: 'hsl(0, 0%, 100%)',
  cardForeground: 'hsl(222.2, 84%, 4.9%)',
  popover: 'hsl(0, 0%, 100%)',
  popoverForeground: 'hsl(222.2, 84%, 4.9%)',
  
  // Primary colors
  primary: 'hsl(222.2, 47.4%, 11.2%)',
  primaryForeground: 'hsl(210, 40%, 98%)',
  
  // Secondary colors
  secondary: 'hsl(210, 40%, 96.1%)',
  secondaryForeground: 'hsl(222.2, 47.4%, 11.2%)',
  
  // Accent colors
  accent: 'hsl(210, 40%, 96.1%)',
  accentForeground: 'hsl(222.2, 47.4%, 11.2%)',
  
  // Muted colors
  muted: 'hsl(210, 40%, 96.1%)',
  mutedForeground: 'hsl(215.4, 16.3%, 46.9%)',
  
  // Destructive colors
  destructive: 'hsl(0, 84.2%, 60.2%)',
  destructiveForeground: 'hsl(210, 40%, 98%)',
  
  // Border and focus ring
  border: 'hsl(214.3, 31.8%, 91.4%)',
  input: 'hsl(214.3, 31.8%, 91.4%)',
  ring: 'hsl(222.2, 84%, 4.9%)',
  
  // Typography
  typography: {
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  
  // Spacing
  spacing: {
    px: '1px',
    '0': '0',
    '0.5': '0.125rem',
    '1': '0.25rem',
    '1.5': '0.375rem',
    '2': '0.5rem',
    '2.5': '0.625rem',
    '3': '0.75rem',
    '3.5': '0.875rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '7': '1.75rem',
    '8': '2rem',
    '9': '2.25rem',
    '10': '2.5rem',
    '11': '2.75rem',
    '12': '3rem',
    '14': '3.5rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
    '28': '7rem',
    '32': '8rem',
    '36': '9rem',
    '40': '10rem',
    '44': '11rem',
    '48': '12rem',
    '52': '13rem',
    '56': '14rem',
    '60': '15rem',
    '64': '16rem',
    '72': '18rem',
    '80': '20rem',
    '96': '24rem',
  },
  
  // Border radius
  radius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  // Animation
  animation: {
    DEFAULT: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Component-specific tokens
  components: {
    button: {
      primary: {
        background: 'hsl(222.2, 47.4%, 11.2%)',
        text: 'hsl(210, 40%, 98%)',
        hover: 'hsl(222.2, 47.4%, 8%)',
        active: 'hsl(222.2, 47.4%, 16%)',
        disabled: 'hsl(214.3, 31.8%, 91.4%)',
      },
      secondary: {
        background: 'hsl(210, 40%, 96.1%)',
        text: 'hsl(222.2, 47.4%, 11.2%)',
        hover: 'hsl(210, 40%, 94%)',
        active: 'hsl(210, 40%, 92%)',
        disabled: 'hsl(210, 40%, 96.1%)',
      },
      accent: {
        background: 'hsl(210, 40%, 96.1%)',
        text: 'hsl(222.2, 47.4%, 11.2%)',
        hover: 'hsl(210, 40%, 94%)',
        active: 'hsl(210, 40%, 92%)',
        disabled: 'hsl(210, 40%, 96.1%)',
      },
      destructive: {
        background: 'hsl(0, 84.2%, 60.2%)',
        text: 'hsl(210, 40%, 98%)',
        hover: 'hsl(0, 84.2%, 55%)',
        active: 'hsl(0, 84.2%, 50%)',
        disabled: 'hsl(0, 84.2%, 70%)',
      },
      ghost: {
        background: 'transparent',
        text: 'hsl(222.2, 47.4%, 11.2%)',
        hover: 'hsl(210, 40%, 96.1%)',
        active: 'hsl(210, 40%, 94%)',
        disabled: 'transparent',
      },
      link: {
        background: 'transparent',
        text: 'hsl(222.2, 47.4%, 11.2%)',
        hover: 'transparent',
        active: 'transparent',
        disabled: 'transparent',
      },
    },
    card: {
      background: 'hsl(0, 0%, 100%)',
      text: 'hsl(222.2, 84%, 4.9%)',
      border: 'hsl(214.3, 31.8%, 91.4%)',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    },
    input: {
      background: 'hsl(0, 0%, 100%)',
      text: 'hsl(222.2, 84%, 4.9%)',
      border: 'hsl(214.3, 31.8%, 91.4%)',
      placeholder: 'hsl(215.4, 16.3%, 46.9%)',
      focus: 'hsl(222.2, 47.4%, 11.2%)',
    },
    badge: {
      default: {
        background: 'hsl(222.2, 47.4%, 11.2%)',
        text: 'hsl(210, 40%, 98%)',
      },
      secondary: {
        background: 'hsl(210, 40%, 96.1%)',
        text: 'hsl(222.2, 47.4%, 11.2%)',
      },
      outline: {
        background: 'transparent',
        text: 'hsl(222.2, 47.4%, 11.2%)',
        border: 'hsl(214.3, 31.8%, 91.4%)',
      },
      destructive: {
        background: 'hsl(0, 84.2%, 60.2%)',
        text: 'hsl(210, 40%, 98%)',
      },
    },
    tooltip: {
      background: 'hsl(222.2, 84%, 4.9%)',
      text: 'hsl(210, 40%, 98%)',
    },
  },
  
  // Z-index values
  zIndices: {
    '0': '0',
    '10': '10',
    '20': '20',
    '30': '30',
    '40': '40',
    '50': '50',
    '60': '60',
    '70': '70',
    '80': '80',
    '90': '90',
    '100': '100',
    'auto': 'auto',
  },
};

// Default Dark Theme Tokens
export const defaultDarkTokens: ThemeTokens = {
  // Base colors
  background: 'hsl(222.2, 84%, 4.9%)',
  foreground: 'hsl(210, 40%, 98%)',
  card: 'hsl(222.2, 84%, 4.9%)',
  cardForeground: 'hsl(210, 40%, 98%)',
  popover: 'hsl(222.2, 84%, 4.9%)',
  popoverForeground: 'hsl(210, 40%, 98%)',
  
  // Primary colors
  primary: 'hsl(210, 40%, 98%)',
  primaryForeground: 'hsl(222.2, 47.4%, 11.2%)',
  
  // Secondary colors
  secondary: 'hsl(217.2, 32.6%, 17.5%)',
  secondaryForeground: 'hsl(210, 40%, 98%)',
  
  // Accent colors
  accent: 'hsl(217.2, 32.6%, 17.5%)',
  accentForeground: 'hsl(210, 40%, 98%)',
  
  // Muted colors
  muted: 'hsl(217.2, 32.6%, 17.5%)',
  mutedForeground: 'hsl(215, 20.2%, 65.1%)',
  
  // Destructive colors
  destructive: 'hsl(0, 62.8%, 30.6%)',
  destructiveForeground: 'hsl(210, 40%, 98%)',
  
  // Border and focus ring
  border: 'hsl(217.2, 32.6%, 17.5%)',
  input: 'hsl(217.2, 32.6%, 17.5%)',
  ring: 'hsl(212.7, 26.8%, 83.9%)',
  
  // Typography
  typography: {
    fontFamily: {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  
  // Same spacing as light theme
  spacing: {
    px: '1px',
    '0': '0',
    '0.5': '0.125rem',
    '1': '0.25rem',
    '1.5': '0.375rem',
    '2': '0.5rem',
    '2.5': '0.625rem',
    '3': '0.75rem',
    '3.5': '0.875rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '7': '1.75rem',
    '8': '2rem',
    '9': '2.25rem',
    '10': '2.5rem',
    '11': '2.75rem',
    '12': '3rem',
    '14': '3.5rem',
    '16': '4rem',
    '20': '5rem',
    '24': '6rem',
    '28': '7rem',
    '32': '8rem',
    '36': '9rem',
    '40': '10rem',
    '44': '11rem',
    '48': '12rem',
    '52': '13rem',
    '56': '14rem',
    '60': '15rem',
    '64': '16rem',
    '72': '18rem',
    '80': '20rem',
    '96': '24rem',
  },
  
  // Same border radius as light theme
  radius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Modified shadows for dark mode
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.4)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.4)',
    none: 'none',
  },

  // Same animation as light theme
  animation: {
    DEFAULT: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Component-specific tokens for dark mode
  components: {
    button: {
      primary: {
        background: 'hsl(210, 40%, 98%)',
        text: 'hsl(222.2, 47.4%, 11.2%)',
        hover: 'hsl(210, 40%, 90%)',
        active: 'hsl(210, 40%, 85%)',
        disabled: 'hsl(217.2, 32.6%, 17.5%)',
      },
      secondary: {
        background: 'hsl(217.2, 32.6%, 17.5%)',
        text: 'hsl(210, 40%, 98%)',
        hover: 'hsl(217.2, 32.6%, 20%)',
        active: 'hsl(217.2, 32.6%, 22%)',
        disabled: 'hsl(217.2, 32.6%, 12%)',
      },
      accent: {
        background: 'hsl(217.2, 32.6%, 17.5%)',
        text: 'hsl(210, 40%, 98%)',
        hover: 'hsl(217.2, 32.6%, 20%)',
        active: 'hsl(217.2, 32.6%, 22%)',
        disabled: 'hsl(217.2, 32.6%, 12%)',
      },
      destructive: {
        background: 'hsl(0, 62.8%, 30.6%)',
        text: 'hsl(210, 40%, 98%)',
        hover: 'hsl(0, 62.8%, 35%)',
        active: 'hsl(0, 62.8%, 40%)',
        disabled: 'hsl(0, 30%, 25%)',
      },
      ghost: {
        background: 'transparent',
        text: 'hsl(210, 40%, 98%)',
        hover: 'hsl(217.2, 32.6%, 17.5%)',
        active: 'hsl(217.2, 32.6%, 20%)',
        disabled: 'transparent',
      },
      link: {
        background: 'transparent',
        text: 'hsl(210, 40%, 98%)',
        hover: 'transparent',
        active: 'transparent',
        disabled: 'transparent',
      },
    },
    card: {
      background: 'hsl(222.2, 84%, 4.9%)',
      text: 'hsl(210, 40%, 98%)',
      border: 'hsl(217.2, 32.6%, 17.5%)',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
    },
    input: {
      background: 'hsl(222.2, 84%, 4.9%)',
      text: 'hsl(210, 40%, 98%)',
      border: 'hsl(217.2, 32.6%, 17.5%)',
      placeholder: 'hsl(215, 20.2%, 65.1%)',
      focus: 'hsl(210, 40%, 98%)',
    },
    badge: {
      default: {
        background: 'hsl(210, 40%, 98%)',
        text: 'hsl(222.2, 47.4%, 11.2%)',
      },
      secondary: {
        background: 'hsl(217.2, 32.6%, 17.5%)',
        text: 'hsl(210, 40%, 98%)',
      },
      outline: {
        background: 'transparent',
        text: 'hsl(210, 40%, 98%)',
        border: 'hsl(217.2, 32.6%, 17.5%)',
      },
      destructive: {
        background: 'hsl(0, 62.8%, 30.6%)',
        text: 'hsl(210, 40%, 98%)',
      },
    },
    tooltip: {
      background: 'hsl(210, 40%, 98%)',
      text: 'hsl(222.2, 47.4%, 11.2%)',
    },
  },
  
  // Same z-indices as light theme
  zIndices: {
    '0': '0',
    '10': '10',
    '20': '20',
    '30': '30',
    '40': '40',
    '50': '50',
    '60': '60',
    '70': '70',
    '80': '80',
    '90': '90',
    '100': '100',
    'auto': 'auto',
  },
};