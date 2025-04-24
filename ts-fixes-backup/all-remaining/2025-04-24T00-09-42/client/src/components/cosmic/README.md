# Cosmic Components

This directory contains a collection of cosmic-themed UI components that were imported from the cosmic-community repository.

## Components Overview

### 1. CosmicBackground

A canvas-based animated background that renders stars and particles with a cosmic theme. This creates a space-like ambiance for pages.

Usage:
```tsx
<CosmicBackground opacity={0.4} color="purple" />
```

Properties:
- `opacity`: Controls the overall opacity of the background (0-1)
- `color`: Base color theme ('purple', 'blue', or 'green')
- `speed`: Animation speed multiplier
- `particleCount`: Number of particles to render

### 2. CosmicIcon

A wrapper around Lucide icons that provides cosmic-themed icons.

Usage:
```tsx
<CosmicIcon name="star" size={24} className="text-purple-400" />
```

Properties:
- `name`: Icon name (e.g., 'star', 'moon', 'sparkles', etc.)
- `size`: Icon size in pixels
- All other Lucide icon props are supported

### 3. Animations (cosmic-animations.css)

A collection of CSS animations and effects that can be applied to any component:

- `.cosmic-slide-up`: Slide-up entrance animation
- `.cosmic-scale`: Scale entrance animation
- `.cosmic-fade-in`: Fade-in entrance animation
- `.cosmic-stagger-children`: Creates a staggered animation for child elements
- `.cosmic-hover-scale`: Scale effect on hover
- `.cosmic-hover-glow`: Glow effect on hover
- `.cosmic-glass-card`: Glass card effect with backdrop blur
- `.animate-pulse-gentle`: Gentle pulsing animation
- `.animate-float`: Floating animation
- `.cosmic-glow`: Adds a glow effect
- `.animate-twinkle`: Star twinkling animation
- `.animate-rotate-slow`: Slow rotation animation
- `.cosmic-ripple`: Ripple effect for interactive elements

To activate animations, add the `.in` class, which can be done programmatically:

```tsx
useEffect(() => {
  const elements = document.querySelectorAll('.cosmic-slide-up');
  elements.forEach((element, i) => {
    setTimeout(() => {
      element.classList.add('in');
    }, i * 100);
  });
}, []);
```

## Integration with Imported Pages

The cosmic components are used in the following imported pages:

1. **CosmicMerchandisePage**: Features a cosmic shop experience with:
   - EnhancedShoppingExperience component
   - CosmicCollectibles component 
   - ProductComparison component

2. **EnhancedCommunityPage**: Features a community experience with:
   - EnhancedFeaturedContent component
   - CommunityFeedbackLoop component

## Future Enhancements

- Add more cosmic-themed components
- Improve accessibility of animations
- Create integrated theme support for cosmic styling
- Document component APIs more thoroughly