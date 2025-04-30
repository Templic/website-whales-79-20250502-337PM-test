/**
 * Design Token System for TypeScript Error Management Platform
 * 
 * This file defines the base design tokens that serve as the foundation
 * for the application's visual design system. These tokens represent
 * the single source of truth for colors, typography, spacing, etc.
 * 
 * The token structure follows a semantic naming convention to maintain
 * consistency across the application.
 */

// Define the theme tokens interface
export interface ThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  [key: string]: string; // For custom token extensions
}

// Base color palette - derived from the cosmic theme
export const baseTokens = {
  // Core color palette
  colors: {
    cosmic: {
      purple: { 
        50: 'hsl(265, 89%, 95%)', 
        100: 'hsl(265, 89%, 90%)',
        200: 'hsl(265, 89%, 80%)',
        300: 'hsl(265, 89%, 70%)',
        400: 'hsl(265, 89%, 60%)',
        500: 'hsl(265, 89%, 66%)', // Primary purple (#8B5CF6)
        600: 'hsl(265, 89%, 56%)',
        700: 'hsl(265, 89%, 46%)',
        800: 'hsl(265, 89%, 36%)',
        900: 'hsl(265, 89%, 26%)',
      },
      teal: {
        50: 'hsl(182, 100%, 95%)',
        100: 'hsl(182, 100%, 90%)',
        200: 'hsl(182, 100%, 80%)',
        300: 'hsl(182, 100%, 60%)',
        400: 'hsl(182, 100%, 50%)',
        500: 'hsl(182, 100%, 40%)', // Accent teal (#00C2CB)
        600: 'hsl(182, 100%, 35%)',
        700: 'hsl(182, 100%, 30%)',
        800: 'hsl(182, 100%, 25%)',
        900: 'hsl(182, 100%, 20%)',
      },
      // Status semantic colors
      success: 'hsl(142, 71%, 45%)', // #22c55e
      warning: 'hsl(38, 92%, 50%)',  // #f59e0b
      danger: 'hsl(0, 84%, 60%)',    // #ef4444
      info: 'hsl(217, 91%, 60%)',    // #3b82f6
    },
  },
  
  // Typography scale
  typography: {
    fonts: {
      almendra: "'Almendra', serif",
      cormorant: "'Cormorant Garamond', serif",
      space: "'Space Grotesk', sans-serif",
      nebula: "'Nebula', sans-serif",
      // Specialized UI fonts
      orbitron: "'Orbitron', sans-serif",
      cinzel: "'Cinzel', serif",
      gruppo: "'Gruppo', cursive",
      michroma: "'Michroma', sans-serif",
      poiret: "'Poiret One', cursive",
      syncopate: "'Syncopate', sans-serif",
      exo: "'Exo 2', sans-serif",
    },
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacings: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  
  // Space scale (margin, padding)
  space: {
    px: '1px',
    0: '0',
    0.5: '0.125rem', // 2px
    1: '0.25rem',    // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem',     // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem',    // 12px
    3.5: '0.875rem', // 14px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    7: '1.75rem',    // 28px
    8: '2rem',       // 32px
    9: '2.25rem',    // 36px
    10: '2.5rem',    // 40px
    11: '2.75rem',   // 44px
    12: '3rem',      // 48px
    14: '3.5rem',    // 56px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    28: '7rem',      // 112px
    32: '8rem',      // 128px
    36: '9rem',      // 144px
    40: '10rem',     // 160px
    44: '11rem',     // 176px
    48: '12rem',     // 192px
    52: '13rem',     // 208px
    56: '14rem',     // 224px
    60: '15rem',     // 240px
    64: '16rem',     // 256px
    72: '18rem',     // 288px
    80: '20rem',     // 320px
    96: '24rem',     // 384px
  },
  
  // Border radii
  radii: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    // Cosmic-specific shadows
    cosmic: {
      sm: '0 2px 5px rgba(139, 92, 246, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
      md: '0 4px 10px rgba(139, 92, 246, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 20px rgba(139, 92, 246, 0.25), 0 5px 10px rgba(0, 0, 0, 0.15)',
      glow: '0 0 15px rgba(0, 235, 214, 0.2), 0 0 30px rgba(0, 235, 214, 0.1)',
      pulse: '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.15)',
    }
  },
  
  // Animation timings
  animation: {
    durations: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      verySlow: '500ms',
    },
    easings: {
      // CSS easing functions
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Custom cosmic easings
      cosmic: 'cubic-bezier(0.16, 1, 0.3, 1)',
      bounce: 'cubic-bezier(0.87, 0, 0.13, 1)',
      gentle: 'cubic-bezier(0.33, 1, 0.68, 1)',
    },
  },
  
  // Z-index scale
  zIndices: {
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    auto: 'auto',
    // Semantic z-indices
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modal: '1040',
    tooltip: '1050',
  },
};

// Theme-specific mappings
export const themeTokenMappings = {
  light: {
    // Light theme semantic mappings (matches current light theme)
    background: 'hsl(37, 20%, 95%)', // #f5f3f0
    foreground: 'hsl(0, 0%, 18%)',   // #2d2d2d
    card: 'hsl(0, 0%, 100%)',         // #ffffff
    cardForeground: 'hsl(0, 0%, 18%)', // #2d2d2d
    primary: 'hsl(263, 83%, 58%)',     // #7c3aed
    primaryForeground: 'hsl(210, 100%, 98%)', // #f0f8ff
    secondary: 'hsl(37, 23%, 89%)',    // #e9e6df
    secondaryForeground: 'hsl(0, 0%, 18%)', // #2d2d2d
    accent: 'hsl(185, 100%, 40%)',     // #00c2cb
    accentForeground: 'hsl(210, 100%, 98%)', // #f0f8ff
    muted: 'hsl(37, 23%, 89%)',        // #e9e6df
    mutedForeground: 'hsl(0, 0%, 43%)', // #6e6e6e
    border: 'hsl(40, 8%, 85%)',         // #e0dcdc
    input: 'hsl(0, 0%, 100%)',          // #ffffff
    ring: 'hsl(263, 83%, 58%)',         // #7c3aed
  },
  dark: {
    // Dark theme (main cosmic theme)
    background: 'hsl(225, 23%, 5%)',    // #020817
    foreground: 'hsl(210, 40%, 96%)',   // #e1e7ef
    card: 'hsl(220, 47%, 14%)',         // #101b35
    cardForeground: 'hsl(210, 40%, 96%)', // #e1e7ef
    primary: 'hsl(263, 85%, 66%)',      // #8b5cf6
    primaryForeground: 'hsl(210, 100%, 98%)', // #f0f8ff
    secondary: 'hsl(218, 45%, 18%)',    // #162447
    secondaryForeground: 'hsl(210, 40%, 96%)', // #e1e7ef
    accent: 'hsl(185, 100%, 40%)',      // #00c2cb
    accentForeground: 'hsl(210, 100%, 98%)', // #f0f8ff
    muted: 'hsl(220, 45%, 15%)',        // #121f38
    mutedForeground: 'hsl(215, 25%, 67%)', // #8aa2c8
    border: 'hsl(218, 45%, 21%)',       // #1a2951
    input: 'hsl(220, 45%, 15%)',        // #121f38
    ring: 'hsl(263, 85%, 66%)',         // #8b5cf6
  },
  blackout: {
    // Blackout theme (void space with nebula accents)
    background: 'hsl(0, 0%, 0%)',       // #000000
    foreground: 'hsl(280, 100%, 98%)',  // #f8f5ff
    card: 'hsl(260, 87%, 5%)',          // #03021a
    cardForeground: 'hsl(0, 0%, 100%)', // #ffffff
    primary: 'hsl(290, 100%, 50%)',     // #d100ff
    primaryForeground: 'hsl(0, 0%, 100%)', // #ffffff
    secondary: 'hsl(260, 65%, 9%)',     // #0d0a22
    secondaryForeground: 'hsl(0, 0%, 100%)', // #ffffff
    accent: 'hsl(290, 100%, 53%)',       // #c210ff
    accentForeground: 'hsl(0, 0%, 100%)', // #ffffff
    muted: 'hsl(260, 65%, 5%)',          // #070417
    mutedForeground: 'hsl(276, 100%, 86%)', // #c9b8ff
    border: 'hsl(270, 56%, 25%)',        // #2d1a66
    input: 'hsl(260, 65%, 5%)',          // #070417
    ring: 'hsl(290, 100%, 60%)',         // #d254ff
    // Additional blackout-specific variables
    cosmicGlow: 'rgba(209, 0, 255, 0.4)',
    cosmicShadow: '0 0 20px rgba(209, 0, 255, 0.25)',
    cosmicStardust: 'rgba(102, 0, 255, 0.15)',
  },
};

// Theme for high-contrast mode (accessibility)
export const highContrastTokens = {
  // Maximum contrast overrides
  background: 'hsl(0, 0%, 0%)',
  foreground: 'hsl(0, 0%, 100%)',
  primary: 'hsl(263, 100%, 70%)',
  accent: 'hsl(185, 100%, 60%)',
  border: 'hsl(0, 0%, 100%)',
  // Simplified for readability
  mutedForeground: 'hsl(0, 0%, 90%)',
  card: 'hsl(0, 0%, 10%)',
  cardForeground: 'hsl(0, 0%, 100%)',
};

// Motion and animation presets
export const motionPresets = {
  full: {
    // Default animation timings
    duration: baseTokens.animation.durations.normal,
    easing: baseTokens.animation.easings.cosmic,
  },
  reduced: {
    // Reduced animation for those who prefer less motion
    duration: baseTokens.animation.durations.fast,
    easing: baseTokens.animation.easings.inOut,
  },
  none: {
    // No animation for those who require no motion
    duration: '0ms',
    easing: 'linear',
  }
};

// Export specific named color palettes for ease of use
export const colorPalettes = {
  purple: baseTokens.colors.cosmic.purple,
  teal: baseTokens.colors.cosmic.teal,
  status: {
    success: baseTokens.colors.cosmic.success,
    warning: baseTokens.colors.cosmic.warning,
    danger: baseTokens.colors.cosmic.danger,
    info: baseTokens.colors.cosmic.info,
  },
};

// Extended tokens with additional properties for specific components and use cases
export const extendedTokens = {
  ...baseTokens,
  components: {
    button: {
      primary: {
        background: themeTokenMappings.dark.primary,
        text: themeTokenMappings.dark.primaryForeground,
        hover: 'hsl(263, 85%, 60%)',
        active: 'hsl(263, 85%, 56%)',
        disabled: 'hsl(263, 40%, 50%)',
      },
      secondary: {
        background: themeTokenMappings.dark.secondary,
        text: themeTokenMappings.dark.secondaryForeground,
        hover: 'hsl(218, 45%, 22%)',
        active: 'hsl(218, 45%, 25%)',
        disabled: 'hsl(218, 25%, 30%)',
      },
      accent: {
        background: themeTokenMappings.dark.accent,
        text: themeTokenMappings.dark.accentForeground,
        hover: 'hsl(185, 100%, 45%)',
        active: 'hsl(185, 100%, 50%)',
        disabled: 'hsl(185, 50%, 40%)',
      },
    },
    input: {
      background: themeTokenMappings.dark.input,
      text: themeTokenMappings.dark.foreground,
      placeholder: themeTokenMappings.dark.mutedForeground,
      border: themeTokenMappings.dark.border,
      focus: themeTokenMappings.dark.ring,
    },
    card: {
      background: themeTokenMappings.dark.card,
      text: themeTokenMappings.dark.cardForeground,
      border: themeTokenMappings.dark.border,
      highlight: 'hsl(263, 85%, 70%)',
    },
    modal: {
      background: themeTokenMappings.dark.card,
      text: themeTokenMappings.dark.cardForeground,
      overlay: 'rgba(0, 0, 0, 0.75)',
      shadow: '0 4px 25px rgba(0, 0, 0, 0.3)',
    },
    navigation: {
      background: themeTokenMappings.dark.background,
      text: themeTokenMappings.dark.foreground,
      active: themeTokenMappings.dark.primary,
      hover: 'hsl(263, 40%, 40%)',
    },
    tooltip: {
      background: 'hsl(220, 47%, 20%)',
      text: 'hsl(210, 40%, 96%)',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
    badge: {
      background: themeTokenMappings.dark.secondary,
      text: themeTokenMappings.dark.secondaryForeground,
      success: baseTokens.colors.cosmic.success,
      warning: baseTokens.colors.cosmic.warning,
      danger: baseTokens.colors.cosmic.danger,
      info: baseTokens.colors.cosmic.info,
    },
  },
  effects: {
    glow: '0 0 15px rgba(139, 92, 246, 0.3), 0 0 30px rgba(139, 92, 246, 0.15)',
    shimmer: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent)',
    glassmorphism: 'backdrop-filter: blur(10px)',
  },
};