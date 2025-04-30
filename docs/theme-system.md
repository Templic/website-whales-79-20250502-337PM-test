# Theme System Documentation

This document covers the design, architecture, and usage of the theme system implemented for the TypeScript Error Management Platform.

## Overview

The theme system provides a comprehensive approach to managing the visual design of the application with a focus on:

- **Design Tokens**: A centralized system of design variables
- **Theme Switching**: Support for light, dark, and blackout themes
- **Accessibility**: High contrast modes and reduced motion preferences
- **Privacy**: User control over data collection and storage
- **Performance**: Optimized CSS generation and delivery

## Architecture

The theme system follows a layered architecture:

1. **Design Tokens**: Base variables defining the design system
2. **Theme Mapping**: Semantic variables mapped to design tokens
3. **CSS Implementation**: CSS custom properties generated from tokens
4. **React Integration**: Theme provider for React components
5. **Tailwind Integration**: Token values exposed to Tailwind configuration

## Components

### 1. Design Tokens (`/shared/theme/tokens.ts`)

The foundation of the theme system is a set of design tokens that define all visual aspects:

- Color palettes
- Typography scales
- Spacing
- Border radii
- Shadows
- Animation timings
- Z-index scale

These tokens are organized in a semantic hierarchy for maintainability.

### 2. Theme Provider (`/shared/theme/ThemeContext.tsx`)

A React context provider that:

- Manages theme state (light/dark/blackout)
- Handles accessibility preferences (contrast, motion)
- Persists user preferences
- Responds to system preferences (dark mode, reduced motion)
- Provides a simple hook interface for components (`useTheme()`)

### 3. Privacy Controls (`/shared/theme/privacyControls.ts`)

User-controlled privacy settings for the theme system:

- Control over theme preference tracking
- Management of font loading behavior
- Control over preference storage
- Option to clear all theme data

### 4. Font Loader (`/shared/theme/fontLoader.ts`)

Loads fonts with a privacy-first approach:

- Self-hosted fonts as primary source
- Optional fallback to CDN
- Respects privacy settings
- Uses modern Font Loading API when available
- Preloads critical fonts for performance

### 5. CSS Variable Generator (`/shared/theme/cssVariables.ts` and `/scripts/generate-theme-css.js`)

- Generates CSS custom properties from design tokens
- Supports static file generation for production builds
- Provides runtime injection for dynamic theming
- Creates HSL variables for Tailwind compatibility

## Usage

### Basic Theme Usage

```tsx
import { useTheme } from '@/shared/theme';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

### Accessibility Preferences

```tsx
import { useTheme } from '@/shared/theme';

function AccessibilityControls() {
  const { contrast, setContrast, motion, setMotion } = useTheme();
  
  return (
    <div>
      <div>
        <h3>Contrast</h3>
        <button onClick={() => setContrast('standard')}>Standard</button>
        <button onClick={() => setContrast('high')}>High</button>
        <button onClick={() => setContrast('maximum')}>Maximum</button>
      </div>
      
      <div>
        <h3>Motion</h3>
        <button onClick={() => setMotion('full')}>Full</button>
        <button onClick={() => setMotion('reduced')}>Reduced</button>
        <button onClick={() => setMotion('none')}>None</button>
      </div>
    </div>
  );
}
```

### Privacy Controls

```tsx
import { setThemePrivacyOptions, getThemePrivacyOptions } from '@/shared/theme';

function PrivacySettings() {
  const privacyOptions = getThemePrivacyOptions();
  
  const updateSettings = (key, value) => {
    setThemePrivacyOptions({ [key]: value });
  };
  
  return (
    <div>
      <h2>Privacy Settings</h2>
      
      <div>
        <input 
          type="checkbox" 
          checked={privacyOptions.allowFonts}
          onChange={(e) => updateSettings('allowFonts', e.target.checked)}
        />
        <label>Load custom fonts</label>
      </div>
      
      <div>
        <input 
          type="checkbox" 
          checked={privacyOptions.storePreferences}
          onChange={(e) => updateSettings('storePreferences', e.target.checked)}
        />
        <label>Store theme preferences</label>
      </div>
      
      <div>
        <input 
          type="checkbox" 
          checked={privacyOptions.allowThemeTracking}
          onChange={(e) => updateSettings('allowThemeTracking', e.target.checked)}
        />
        <label>Allow theme preference analytics</label>
      </div>
    </div>
  );
}
```

### Font Loading

```tsx
import { loadFonts } from '@/shared/theme';

// In your application initialization
async function initApp() {
  // Load only critical fonts with self-hosted preference
  await loadFonts({ 
    preferSelfHosted: true,
    criticalOnly: true,
    preload: true
  });
  
  // ... initialize app
}
```

## Theme Generation

To generate the static CSS file for production:

```bash
node scripts/generate-theme-css.js
```

This creates `client/src/styles/generated-theme.css` which should be imported in your main CSS file.

## Best Practices

1. **Always use the theme tokens**: Avoid hardcoded color values or magic numbers
2. **Respect user preferences**: Honor reduced motion and high contrast settings
3. **Test across themes**: Ensure your UI works in all theme variants
4. **Consider privacy**: Don't track theme usage without explicit consent
5. **Optimize performance**: Use static CSS generation for production builds

## Accessibility Considerations

The theme system includes several accessibility features:

- **High contrast mode**: Increased contrast for users with visual impairments
- **Reduced motion**: Minimal animations for users with vestibular disorders
- **System preference detection**: Respects OS-level accessibility settings
- **Focus styles**: Maintained across themes for keyboard navigation

## Privacy Considerations

The theme system takes a privacy-first approach:

- **Self-hosted assets**: Fonts and resources can be self-hosted
- **Opt-in tracking**: Theme preference tracking is disabled by default
- **Minimal storage**: Only essential preferences are stored
- **Right to be forgotten**: Easy clearing of all theme preferences

## Browser Support

The theme system supports all modern browsers (Chrome, Firefox, Safari, Edge) with the following considerations:

- **IE11**: Not supported
- **Older browsers**: Basic theme functionality with fallback fonts
- **Feature detection**: Graceful degradation when features are not available

## Future Enhancements

Potential areas for future improvement:

1. **Theme Editor**: Visual interface for customizing themes
2. **Custom Themes**: User-defined themes beyond the built-in options
3. **Component-Level Themes**: Sub-themes for specific components or sections
4. **Dynamic Theming**: Runtime theme modification based on content
5. **Animation Library**: Theme-consistent animation presets