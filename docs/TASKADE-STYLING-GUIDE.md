# Taskade Styling Guide

## Overview

This document provides a visual guide and implementation details for the three styling modes available for Taskade integration in the Dale Loves Whales application: Basic, Taskade (default), and Oceanic.

## Styling Options

The Taskade integration components (`TaskadeEmbed` and `TaskadeWidget`) support three distinct styling modes to match different contexts in the application.

## 1. Basic Style

![Basic Style](../assets/images/taskade-basic-style.png)

### Description

The Basic style offers a clean, minimal appearance that seamlessly integrates with the application's default theme. It uses the application's primary colors and design patterns to create a consistent experience.

### Visual Characteristics

- Uses application's primary colors
- Clean, minimal UI elements
- Adapts to light/dark mode settings
- Understated animations and transitions
- Consistent with application's existing UI components

### Best Used For

- Content-focused pages where the AI assistant should not distract
- Pages with existing strong visual elements
- Interfaces where consistency with the application is important
- When embedding multiple Taskade components in close proximity

### Implementation Example

```jsx
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';

<TaskadeEmbed 
  taskadeId="YOUR_TASKADE_ID"
  title="Cosmic Assistant"
  style="basic"
  view="agent"
  height={500}
  width="100%"
/>
```

### CSS Classes

The Basic style uses the following Tailwind CSS classes:

```jsx
{
  border: "border border-border dark:border-border rounded-xl overflow-hidden",
  background: "bg-card dark:bg-card",
  toolbarBg: "bg-muted/50 dark:bg-muted/50",
  toolbarBorder: "border-border dark:border-border",
  iconBg: "bg-primary dark:bg-primary",
  capabilitiesBg: "bg-card dark:bg-card",
  capabilitiesItemHover: "hover:bg-muted/50 dark:hover:bg-muted/50",
  inputBg: "bg-muted/50 dark:bg-muted/50 border-border dark:border-border",
  buttonBg: "bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90",
  loaderBorder: "border-muted dark:border-muted border-t-primary dark:border-t-primary",
  loadingBg: "bg-background/90 dark:bg-background/90",
  errorBg: "bg-card dark:bg-card border-border dark:border-border",
  footerBg: "bg-muted/20 dark:bg-muted/20 border-border dark:border-border"
}
```

## 2. Taskade Style (Default)

![Taskade Style](../assets/images/taskade-default-style.png)

### Description

The Taskade style closely matches Taskade's native look and feel with sleek black backgrounds and purple/indigo accents. This style provides the most authentic Taskade experience.

### Visual Characteristics

- Dark, sleek backgrounds with purple and indigo gradients
- High contrast text for readability
- Modern, elegant UI with subtle animations
- Distinct branding elements from Taskade
- Optimized for both light and dark mode environments

### Best Used For

- Dedicated AI chat pages
- When highlighting the AI capabilities
- When the Taskade brand should be emphasized
- For a premium, sophisticated appearance

### Implementation Example

```jsx
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';

<TaskadeEmbed 
  taskadeId="YOUR_TASKADE_ID"
  title="Cosmic Assistant"
  style="taskade" // Default value
  view="agent"
  height={500}
  width="100%"
/>
```

### CSS Classes

The Taskade style uses the following Tailwind CSS classes:

```jsx
{
  border: "border border-neutral-800 dark:border-neutral-700 rounded-xl overflow-hidden",
  background: "bg-black dark:bg-gradient-to-br from-black via-gray-900 to-gray-900",
  toolbarBg: "bg-black dark:bg-black",
  toolbarBorder: "border-neutral-800 dark:border-neutral-800",
  iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
  capabilitiesBg: "bg-black dark:bg-black",
  capabilitiesItemHover: "hover:bg-neutral-900 dark:hover:bg-neutral-900",
  inputBg: "bg-neutral-900 dark:bg-neutral-900 border-neutral-800 dark:border-neutral-800",
  buttonBg: "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700",
  loaderBorder: "border-neutral-800 border-t-indigo-500",
  loadingBg: "bg-black/90 backdrop-blur-sm",
  errorBg: "bg-neutral-900 dark:bg-neutral-900 border-neutral-800 dark:border-neutral-800",
  footerBg: "bg-black dark:bg-black border-neutral-800 dark:border-neutral-800"
}
```

## 3. Oceanic Style

![Oceanic Style](../assets/images/taskade-oceanic-style.png)

### Description

The Oceanic style features blue and cyan gradients with slate backgrounds, perfectly complementing the ocean-themed content of Dale Loves Whales.

### Visual Characteristics

- Blue to cyan gradients for interactive elements
- Slate backgrounds with underwater-inspired elements
- Ocean-themed color palette
- Smooth transitions with wave-like animations
- Specialized dark mode with deeper blue tones

### Best Used For

- Ocean-related content pages
- Marine biology or oceanography information
- Meditation or relaxation-focused interactions
- Creating a calming, immersive experience

### Implementation Example

```jsx
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';

<TaskadeEmbed 
  taskadeId="YOUR_TASKADE_ID"
  title="Ocean Expert"
  style="oceanic"
  view="agent"
  height={500}
  width="100%"
/>
```

### CSS Classes

The Oceanic style uses the following Tailwind CSS classes:

```jsx
{
  border: "border border-slate-800 dark:border-slate-800 rounded-xl overflow-hidden",
  background: "bg-slate-900 dark:bg-gradient-to-br from-slate-900 via-blue-900/40 to-slate-900",
  toolbarBg: "bg-slate-900 dark:bg-slate-900",
  toolbarBorder: "border-slate-800 dark:border-slate-800",
  iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
  capabilitiesBg: "bg-slate-900 dark:bg-slate-900",
  capabilitiesItemHover: "hover:bg-slate-800 dark:hover:bg-slate-800",
  inputBg: "bg-slate-800 dark:bg-slate-800 border-slate-700 dark:border-slate-700",
  buttonBg: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
  loaderBorder: "border-slate-800 border-t-cyan-500",
  loadingBg: "bg-slate-900/90 backdrop-blur-sm",
  errorBg: "bg-slate-800 dark:bg-slate-800 border-slate-700 dark:border-slate-700",
  footerBg: "bg-slate-900 dark:bg-slate-900 border-slate-800 dark:border-slate-800"
}
```

## Implementation Details

The styling system uses a dynamic approach to generate appropriate CSS classes based on the selected style:

```jsx
// Get style classes based on the selected style
const getStyleClasses = () => {
  switch (style) {
    case 'basic':
      return {
        // Basic style classes
      };
    case 'oceanic':
      return {
        // Oceanic style classes
      };
    case 'taskade':
    default:
      return {
        // Taskade style classes
      };
  }
};

const styles = getStyleClasses();

// Usage in JSX
<div className={`component-container ${styles.border}`}>
  <div className={`toolbar ${styles.toolbarBg}`}>
    {/* Toolbar content */}
  </div>
  <div className={`content ${styles.background}`}>
    {/* Main content */}
  </div>
</div>
```

## Style Switching

The style can be changed dynamically through the `style` prop. The component will re-render with the new style without requiring a page reload:

```jsx
import { useState } from 'react';
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';

const TaskadeSwitcher = () => {
  const [currentStyle, setCurrentStyle] = useState('taskade');
  
  return (
    <div>
      <div className="style-controls mb-4">
        <button onClick={() => setCurrentStyle('basic')}>Basic</button>
        <button onClick={() => setCurrentStyle('taskade')}>Taskade</button>
        <button onClick={() => setCurrentStyle('oceanic')}>Oceanic</button>
      </div>
      
      <TaskadeEmbed 
        taskadeId="YOUR_TASKADE_ID"
        title="Cosmic Assistant"
        style={currentStyle}
        view="agent"
      />
    </div>
  );
};
```

## Parameters via URL

The style can also be set via URL parameters when using the Taskade embed page directly:

```
/taskade-embed?id=YOUR_TASKADE_ID&style=oceanic&view=agent&theme=dark
```

This is useful for creating direct links to specific agent experiences with predefined styling.

## Style Recommendations by Context

| Page Context | Recommended Style | Reasoning |
|--------------|-------------------|-----------|
| Home page | basic | Clean integration with marketing content |
| Cosmic Consciousness | taskade | Premium feel for spiritual content |
| Ocean Conservation | oceanic | Thematic match with ocean content |
| Meditation | basic or oceanic | Calming, non-distracting presence |
| Technical Documentation | basic | Professional, focused appearance |
| Community/Chat | taskade | Native chat experience |

## Custom Style Creation

While the three built-in styles cover most use cases, you can also create custom styles by extending the component:

```jsx
// Example custom style component
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';

const CustomStyledTaskade = (props) => {
  // Custom style classes
  const customStyle = {
    border: "border-2 border-amber-500 dark:border-amber-400 rounded-xl overflow-hidden",
    background: "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900 dark:to-orange-900",
    // ... other style properties
  };
  
  // Generate a custom background style
  const customBackground = `
    .custom-taskade-bg {
      background-image: url('/assets/images/custom-bg.svg');
      background-repeat: no-repeat;
      background-position: bottom right;
      background-size: 200px;
    }
  `;
  
  return (
    <>
      <style jsx>{customBackground}</style>
      <div className="custom-taskade-wrapper">
        <TaskadeEmbed
          {...props}
          className={`custom-taskade-bg ${props.className || ''}`}
          // Pass through all other props
        />
      </div>
    </>
  );
};

export default CustomStyledTaskade;
```

## Accessibility Considerations

Each style has been developed with accessibility in mind:

- **Basic Style**: Highest contrast ratios, simple animations
- **Taskade Style**: Enhanced focus states, clear interactive elements
- **Oceanic Style**: Careful color choices to maintain readability

All styles respect the user's motion preferences via the `reducedMotion` setting.

## Related Documentation

- [Taskade Integration Overview](./TASKADE-INTEGRATION.md)
- [Taskade Technical Details](./TASKADE-TECHNICAL.md)
- [Taskade Embed Guide](./TASKADE-EMBED-GUIDE.md)
- [Style Reference Implementation](../examples/TaskadeStylesExample.tsx)