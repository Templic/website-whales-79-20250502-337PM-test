/**
 * Component Style Generator
 * 
 * This module provides a system for generating consistent component styles
 * based on the theme tokens. It offers a simple API for creating reusable
 * component styles with variants and states.
 */

import { baseTokens, type ThemeTokens } from './tokens';
import { cx, createVariants } from './tailwindIntegration';

// Types for style variants
export type StyleVariant = string | number | boolean;

// Component style definition
export interface ComponentStyle<
  V extends Record<string, StyleVariant> = Record<string, StyleVariant>
> {
  // Base class names
  base: string;
  
  // Variant class mappings
  variants: {
    [K in keyof V]?: Record<string, string>;
  };
  
  // Compound class names for multiple variants
  compounds?: Array<{
    variants: Partial<V>;
    className: string;
  }>;
  
  // Default variant values
  defaultVariants?: Partial<V>;
  
  // Generate complete class name
  classNames: (props?: Partial<V>) => string;
}

/**
 * Create a component style definition that integrates with the theme system
 */
export function createComponentStyle<V extends Record<string, StyleVariant>>(
  componentName: string,
  options: {
    base?: string;
    variants?: {
      [K in keyof V]?: Record<string | number | symbol, string>;
    };
    compounds?: Array<{
      variants: Partial<V>;
      className: string;
    }>;
    defaultVariants?: Partial<V>;
  }
): ComponentStyle<V> {
  const {
    base = '',
    variants = {},
    compounds = [],
    defaultVariants = {},
  } = options;
  
  // Add data attribute for component identification
  const baseWithComponent = base ? `${base} data-component="${componentName}"` : `data-component="${componentName}"`;
  
  // Create style object
  const style: ComponentStyle<V> = {
    base: baseWithComponent,
    variants: variants as ComponentStyle<V>['variants'],
    compounds,
    defaultVariants,
    
    // Generate class names function
    classNames: (props = {} as Partial<V>) => {
      // Merge default variants with provided props
      const variantsWithDefaults = { ...defaultVariants, ...props } as Record<string, StyleVariant>;
      
      // Generate base variant classes
      const variantsGenerator = createVariants(baseWithComponent, variants as any);
      let className = variantsGenerator(variantsWithDefaults as any);
      
      // Apply compound variants if all matching variant values are present
      if (compounds && compounds.length > 0) {
        const compoundClasses = compounds
          .filter(compound => {
            return Object.entries(compound.variants).every(([key, value]) => 
              variantsWithDefaults[key] === value
            );
          })
          .map(compound => compound.className);
        
        if (compoundClasses.length > 0) {
          className = `${className} ${compoundClasses.join(' ')}`;
        }
      }
      
      return className;
    },
  };
  
  return style;
}

/**
 * Common component patterns
 */
export const commonComponentPatterns = {
  // Button pattern
  button: (tokens: ThemeTokens = baseTokens) => createComponentStyle<{
    variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
    size: 'sm' | 'md' | 'lg';
    disabled: boolean;
    fullWidth: boolean;
  }>('button', {
    base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed pointer-events-none',
        false: '',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      disabled: false,
      fullWidth: false,
    },
  }),
  
  // Card pattern
  card: (tokens: ThemeTokens = baseTokens) => createComponentStyle<{
    variant: 'default' | 'bordered' | 'elevated';
    padding: 'none' | 'sm' | 'md' | 'lg';
  }>('card', {
    base: 'rounded-lg bg-card text-card-foreground shadow',
    variants: {
      variant: {
        default: 'shadow-sm',
        bordered: 'border border-border',
        elevated: 'shadow-md',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }),
  
  // Input pattern
  input: (tokens: ThemeTokens = baseTokens) => createComponentStyle<{
    variant: 'default' | 'filled' | 'outline' | 'underline';
    size: 'sm' | 'md' | 'lg';
    state: 'default' | 'error' | 'success';
    disabled: boolean;
  }>('input', {
    base: 'flex w-full rounded-md border bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    variants: {
      variant: {
        default: 'border-input shadow-sm',
        filled: 'border-transparent bg-muted/50',
        outline: 'border-input',
        underline: 'border-t-0 border-l-0 border-r-0 border-b-2 rounded-none px-1 shadow-none',
      },
      size: {
        sm: 'h-8 text-xs px-2',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base px-4',
      },
      state: {
        default: '',
        error: 'border-error focus-visible:ring-error/20',
        success: 'border-success focus-visible:ring-success/20',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed bg-muted',
        false: '',
      },
    },
    compounds: [
      {
        variants: { variant: 'underline', state: 'error' },
        className: 'border-b-error',
      },
      {
        variants: { variant: 'underline', state: 'success' },
        className: 'border-b-success',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
      disabled: false,
    },
  }),
  
  // Badge pattern
  badge: (tokens: ThemeTokens = baseTokens) => createComponentStyle<{
    variant: 'default' | 'outline' | 'secondary' | 'success' | 'warning' | 'error';
    size: 'sm' | 'md' | 'lg';
  }>('badge', {
    base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border-transparent',
        outline: 'text-foreground border-border',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        success: 'bg-success text-success-foreground border-transparent',
        warning: 'bg-warning text-warning-foreground border-transparent',
        error: 'bg-error text-error-foreground border-transparent',
      },
      size: {
        sm: 'text-xs px-1.5 py-0',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }),
  
  // Alert pattern
  alert: (tokens: ThemeTokens = baseTokens) => createComponentStyle<{
    variant: 'default' | 'success' | 'warning' | 'error' | 'info';
    size: 'sm' | 'md' | 'lg';
    withIcon: boolean;
  }>('alert', {
    base: 'relative w-full rounded-lg border p-4',
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        success: 'bg-success/15 text-success-foreground border-success/30',
        warning: 'bg-warning/15 text-warning-foreground border-warning/30',
        error: 'bg-error/15 text-error-foreground border-error/30',
        info: 'bg-info/15 text-info-foreground border-info/30',
      },
      size: {
        sm: 'p-3 text-sm',
        md: 'p-4',
        lg: 'p-6 text-lg',
      },
      withIcon: {
        true: 'pl-12',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      withIcon: false,
    },
  }),
  
  // Tooltip pattern
  tooltip: (tokens: ThemeTokens = baseTokens) => createComponentStyle<{
    variant: 'default' | 'light' | 'dark';
    size: 'sm' | 'md' | 'lg';
  }>('tooltip', {
    base: 'z-50 overflow-hidden rounded-md px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        light: 'bg-background text-foreground border border-border',
        dark: 'bg-secondary text-secondary-foreground',
      },
      size: {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }),
  
  // Menu pattern
  menu: (tokens: ThemeTokens = baseTokens) => createComponentStyle<{
    variant: 'default' | 'seamless';
    size: 'sm' | 'md' | 'lg';
  }>('menu', {
    base: 'min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
    variants: {
      variant: {
        default: 'p-1',
        seamless: 'p-0 border-0 shadow-none bg-transparent',
      },
      size: {
        sm: 'min-w-[6rem]',
        md: 'min-w-[8rem]',
        lg: 'min-w-[12rem]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }),
  
  // MenuItem pattern
  menuItem: (tokens: ThemeTokens = baseTokens) => createComponentStyle<{
    variant: 'default' | 'destructive' | 'subtle';
    active: boolean;
    disabled: boolean;
  }>('menu-item', {
    base: 'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
    variants: {
      variant: {
        default: 'focus:bg-accent focus:text-accent-foreground data-[disabled]:opacity-50',
        destructive: 'text-error focus:bg-error focus:text-error-foreground',
        subtle: 'focus:bg-accent/50 focus:text-accent-foreground data-[disabled]:opacity-50',
      },
      active: {
        true: 'bg-accent text-accent-foreground',
        false: '',
      },
      disabled: {
        true: 'pointer-events-none opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      active: false,
      disabled: false,
    },
  }),
};

/**
 * Function to create a component library using the theme system
 */
export function createComponentLibrary(tokens: ThemeTokens = baseTokens) {
  const components = {
    // Core UI components
    button: commonComponentPatterns.button(tokens),
    card: commonComponentPatterns.card(tokens),
    input: commonComponentPatterns.input(tokens),
    badge: commonComponentPatterns.badge(tokens),
    alert: commonComponentPatterns.alert(tokens),
    tooltip: commonComponentPatterns.tooltip(tokens),
    menu: commonComponentPatterns.menu(tokens),
    menuItem: commonComponentPatterns.menuItem(tokens),
    
    // Add more components as needed
  };
  
  return components;
}