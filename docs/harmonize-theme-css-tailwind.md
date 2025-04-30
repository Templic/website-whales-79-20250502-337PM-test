# Harmonize Theme System: CSS & Tailwind Integration

## Overview

The Harmonize Theme System Phase 2 implementation provides comprehensive integration with CSS and Tailwind CSS. This document outlines the key components, utilities, and methodologies for creating consistent, accessible, and responsive themes using the Tailwind ecosystem.

## Table of Contents

1. [Tailwind Integration](#tailwind-integration)
2. [CSS Variables](#css-variables)
3. [Component Styling](#component-styling)
4. [Build Tool Plugins](#build-tool-plugins)
5. [AI-Powered Theme Analysis](#ai-powered-theme-analysis)
6. [Theme Preview Component](#theme-preview-component)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

## Tailwind Integration

The Tailwind CSS integration provides utilities to convert the theme tokens into Tailwind-compatible format and extend the Tailwind configuration.

### Core Utilities

- `tokenToTailwindFormat`: Converts theme tokens to Tailwind-compatible format
- `generateTailwindTheme`: Generates a complete Tailwind theme object from tokens
- `extendTailwindConfig`: Extends a Tailwind config with theme token values

### CSS Utilities

- `tailwindThemeToCssVars`: Converts Tailwind theme extensions to CSS variables
- `generateTailwindUtilities`: Generates CSS utility classes from Tailwind theme

### Runtime Utilities

- `tw`: A runtime utility for composing Tailwind-like classes
- `cx`: Conditionally apply Tailwind classes based on state
- `createVariants`: Create variant-based class names (similar to class-variance-authority)

### Example: Extending Tailwind Config

```typescript
import { extendTailwindConfig } from '@shared/theme';
import tailwindConfig from './tailwind.config';

// Extend the Tailwind config with your theme tokens
const extendedConfig = extendTailwindConfig(tailwindConfig, customTokens);
```

## CSS Variables

The CSS Variables module generates CSS custom properties from theme tokens for different modes, contrast levels, and motion preferences.

### Key Features

- Automatic generation of CSS variables for all theme tokens
- Support for light, dark, and blackout modes
- Support for different contrast levels (low, high, maximum)
- Support for different motion preferences (normal, reduced, none)
- Responsive variables for different breakpoints

### Core Functions

- `generateThemeModeVariables`: Generate CSS variables for different theme modes
- `generateContrastVariables`: Generate CSS variables for different contrast levels
- `generateMotionVariables`: Generate CSS variables for different motion preferences
- `generateSystemPreferenceRules`: Generate media query rules for system preferences
- `generateResponsiveVariables`: Generate responsive CSS variables for breakpoints
- `generateCssVariables`: Generate complete CSS string with all theme variables
- `injectThemeStylesheet`: Inject theme CSS into the document head

### Example: Generating CSS Variables

```typescript
import { generateCssVariables, injectThemeStylesheet } from '@shared/theme';

// Generate CSS variables string
const cssVars = generateCssVariables(myTokens, {
  responsiveTheme: true,
  darkSelector: '.dark-mode',
});

// Inject into document
injectThemeStylesheet(myTokens);
```

## Component Styling

The Component Styling module provides a type-safe way to create consistent component styles based on theme tokens.

### Core Features

- Type-safe component style definitions
- Support for variants and states
- Compound variants for complex styling rules
- Predictable class name generation

### Core Functions

- `createComponentStyle`: Create a component style definition
- `createComponentLibrary`: Create a library of component styles
- `commonComponentPatterns`: Preset component patterns (button, card, input, etc.)

### Example: Creating a Button Component Style

```typescript
import { createComponentStyle } from '@shared/theme';

const buttonStyle = createComponentStyle<{
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
}>('button', {
  base: 'rounded-md inline-flex items-center justify-center',
  variants: {
    variant: {
      primary: 'bg-primary text-white',
      secondary: 'bg-secondary text-white',
      outline: 'border border-primary text-primary',
    },
    size: {
      sm: 'text-sm px-3 py-1',
      md: 'text-base px-4 py-2',
      lg: 'text-lg px-6 py-3',
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    disabled: false,
  },
});

// Usage in a React component
function Button({ variant, size, disabled, children }) {
  return (
    <button className={buttonStyle.classNames({ variant, size, disabled })}>
      {children}
    </button>
  );
}
```

## Build Tool Plugins

The Build Tool Plugins module provides plugins for popular build tools to automate theme processing during builds.

### Available Plugins

- `harmonizeThemeVitePlugin`: Plugin for Vite
- `HarmonizeThemeWebpackPlugin`: Plugin for Webpack
- `harmonizeThemeRollupPlugin`: Plugin for Rollup
- `harmonizeThemePostCssPlugin`: Plugin for PostCSS

### Plugin Features

- Automatic generation of theme files
- Injecting theme CSS into the build
- Generating JavaScript/TypeScript theme files
- Generating theme documentation
- Hot module replacement support

### Example: Using the Vite Plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { harmonizeThemeVitePlugin } from '@shared/theme';
import myTokens from './src/theme/tokens';

export default defineConfig({
  plugins: [
    react(),
    harmonizeThemeVitePlugin({
      tokens: myTokens,
      output: {
        cssVars: {
          enabled: true,
          filename: 'theme.css',
        },
        js: {
          enabled: true,
          filename: 'theme.js',
          typescript: true,
        },
      },
      features: {
        darkMode: true,
        contrastModes: true,
        motionModes: true,
        responsiveTheme: true,
      },
    }),
  ],
});
```

## AI-Powered Theme Analysis

The AI-Powered Theme Analysis module leverages OpenAI to analyze and provide recommendations for your theme.

### Core Features

- Privacy-focused AI integration
- Theme consistency analysis
- Accessibility evaluation
- Semantic naming suggestions
- Theme generation from base color or image

### Key Functions

- `analyzeTheme`: Analyze a theme with AI assistance
- `getThemeRecommendations`: Get specific theme recommendations
- `generateAITheme`: Generate a new theme with AI assistance
- `getSemanticColorNames`: Get AI-generated semantic names for colors
- `generateAccessibleVariations`: Generate accessible color variations

### Example: Analyzing Theme

```typescript
import { analyzeTheme } from '@shared/theme';

async function checkTheme() {
  const analysis = await analyzeTheme(myTokens);
  
  console.log('Overall score:', analysis.overall.score);
  console.log('Strengths:', analysis.overall.strengths);
  console.log('Recommendations:', analysis.overall.recommendations);
}
```

## Theme Preview Component

The Theme Preview Component provides a visual preview of the current theme settings and allows interactive exploration of theme capabilities.

### Features

- Interactive theme mode switching
- Color palette visualization
- Typography preview
- Spacing visualization
- Component previews
- Contrast checking

### Example: Using the Theme Preview Panel

```tsx
import { ThemePreviewPanel } from '@shared/theme';

function ThemeSettings() {
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Theme Settings</h1>
      <ThemePreviewPanel 
        variant="expanded"
        showTokenValues={true}
        onSelectColor={(name, value) => console.log(`Selected ${name}: ${value}`)}
      />
    </div>
  );
}
```

## Usage Examples

### Basic Theme Integration

```tsx
// theme.ts
import { baseTokens, generateCssVariables } from '@shared/theme';

// Create custom tokens
const myTokens = {
  ...baseTokens,
  colors: {
    primary: '#3366ff',
    secondary: '#6633ff',
    // ...other colors
  },
  // ...other token categories
};

// Generate CSS
const themeCSS = generateCssVariables(myTokens);

export default myTokens;

// In your main CSS file
import './theme.css';

// In your app
import { ThemeProvider } from '@shared/theme';

function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### Responsive Component with Theme Integration

```tsx
import { createComponentStyle, useTheme } from '@shared/theme';

// Create component style
const cardStyle = createComponentStyle<{
  variant: 'default' | 'elevated' | 'outlined';
  size: 'sm' | 'md' | 'lg';
}>('card', {
  base: 'rounded-lg overflow-hidden',
  variants: {
    variant: {
      default: 'bg-card-background',
      elevated: 'bg-card-background shadow-lg',
      outlined: 'border border-card-border',
    },
    size: {
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

// Use in component
function Card({ 
  variant = 'default', 
  size = 'md', 
  children 
}) {
  const { mode } = useTheme();
  
  return (
    <div className={cardStyle.classNames({ variant, size })}>
      {children}
    </div>
  );
}
```

## Best Practices

1. **Semantic Tokens**: Use semantic naming for tokens (e.g., "primary" instead of "blue").

2. **Accessibility First**: Always check contrast ratios and ensure your theme meets WCAG guidelines.

3. **Responsive Design**: Use the responsive variables to adapt your theme to different screen sizes.

4. **Context-Aware Styling**: Design tokens with their context of use in mind.

5. **Progressive Enhancement**: Ensure your theme works without JavaScript by using the CSS variables approach.

6. **Performance**: Use the build plugins to optimize your theme for production.

7. **Dark Mode**: Always provide a well-designed dark mode version of your theme.

8. **Motion Sensitivity**: Respect user preferences for reduced motion.

9. **Component Library Consistency**: Use the component styling system to ensure consistency across your app.

10. **Privacy-First AI**: When using AI-powered features, ensure user data privacy is maintained.

## Support and Contribution

For issues, feature requests, or contributions, please visit our GitHub repository or contact the Harmonize Theme System team.

---

© 2025 Harmonize Theme System. All rights reserved.