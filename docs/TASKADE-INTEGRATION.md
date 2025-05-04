# Taskade Integration Documentation

## Overview

This document provides comprehensive information about the integration of Taskade AI assistants into the Dale Loves Whales application. The implementation includes support for multiple embedding methods and styling options.

## Components

The Taskade integration includes the following key components:

1. **TaskadeEmbed Component**: Core component for embedding Taskade AI assistants in various view modes
2. **TaskadeWidget Component**: Floating chat widget that leverages TaskadeEmbed
3. **Taskade Embed HTML Page**: Custom server-side embedding page for improved security and performance
4. **Content API CSRF Bypass**: Enhanced middleware for secure third-party integrations

## Styling Options

The integration supports three distinct styling modes:

### 1. Basic Style

A clean, minimal styling that integrates with the application's default theme:

- Uses the application's primary colors
- Simple, unobtrusive UI elements
- Consistent with the rest of the application's UI
- Adapts to light/dark mode settings

### 2. Taskade Style (Default)

Styled to match Taskade's native look and feel:

- Sleek black backgrounds with purple and indigo gradients
- Modern, elegant UI with subtle animations
- High contrast text for readability
- Distinct branding elements from Taskade

### 3. Oceanic Style

An ocean-themed styling option with blue gradients:

- Oceanic color palette with blue to cyan gradients
- Slate backgrounds with underwater-inspired elements
- Smooth transitions and subtle animations
- Thematically aligned with Dale Loves Whales' oceanic focus

## Usage

### Basic Usage

```tsx
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';

// Basic implementation
<TaskadeEmbed 
  taskadeId="YOUR_TASKADE_ID" 
  title="Cosmic Assistant" 
/>
```

### Widget Implementation

```tsx
import TaskadeWidget from '@/components/chat/TaskadeWidget';

// Floating chat widget
<TaskadeWidget 
  enabled={true}
  taskadeId="YOUR_TASKADE_ID"
  title="Cosmic Assistant"
  style="oceanic" // "basic", "taskade", or "oceanic"
  theme="system" // "light", "dark", or "system"
  position="bottom-right" // "bottom-right", "bottom-left", "top-right", "top-left"
/>
```

### Customization Options

Both components accept the following props for extensive customization:

#### Common Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `taskadeId` | string | '01JRV02MYWJW6VJS9XGR1VB5J4' | The Taskade agent/workspace ID |
| `title` | string | 'Cosmic Assistant' | Display title for the component |
| `style` | 'basic' \| 'taskade' \| 'oceanic' | 'taskade' | The styling theme to use |
| `theme` | 'light' \| 'dark' \| 'system' | 'system' | Light/dark mode preference |
| `enableMemory` | boolean | true | Whether the assistant remembers conversation context |
| `className` | string | '' | Additional CSS classes to apply |

#### TaskadeEmbed Specific Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `view` | 'agent' \| 'embed' \| 'widget' \| 'chat' | 'agent' | The Taskade view mode |
| `height` | string \| number | '100%' | Component height |
| `width` | string \| number | '100%' | Component width |
| `showToolbar` | boolean | true | Whether to display the toolbar |
| `showCapabilities` | boolean | true | Whether to show agent capabilities UI |
| `chatOnly` | boolean | false | Simplified chat-only mode |

#### TaskadeWidget Specific Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | boolean | true | Whether the widget is displayed |
| `position` | 'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left' | 'bottom-right' | Widget position |
| `showBranding` | boolean | true | Whether to show "Powered by Taskade" |
| `greetingMessage` | string | "Ask me about..." | Initial greeting message |

## Security Considerations

The implementation includes several security enhancements:

1. **Custom Embedding**: Uses a custom embed page instead of direct iframe embeddings
2. **CSRF Protection**: Implements CSRF exemptions for Taskade domains
3. **Content Security Policy**: Enhanced CSP headers for iframe embedding
4. **Frame Protection**: Configurable X-Frame-Options for embedding

## Server-Side Implementation

The implementation includes a custom embed page at `/taskade-embed` which provides:

1. Enhanced security controls
2. Improved loading performance
3. Custom styling options
4. CSRF protection bypass for trusted Taskade domains

## Accessibility Features

The components include several accessibility enhancements:

1. ARIA labels on all interactive elements
2. Support for reduced motion preferences
3. High contrast text options
4. Keyboard navigation support
5. Screen reader compatibility

## Troubleshooting

Common issues and their solutions:

1. **Widget Not Appearing**: Ensure the `enabled` prop is set to true and check for console errors.
2. **CSRF Errors**: Verify that the contentApiCsrfBypass middleware is properly configured.
3. **Style Not Applying**: Confirm the `style` prop is set to a valid option and that global CSS is not conflicting.
4. **Memory Not Working**: Check that `enableMemory` is set to true and verify Taskade configurations.

## Additional Resources

- [Taskade API Documentation](https://www.taskade.com/developers)
- [Internal Security Documentation](./SECURITY.md)
- [Third-Party Integration Guide](./THIRD-PARTY-INTEGRATIONS.md)