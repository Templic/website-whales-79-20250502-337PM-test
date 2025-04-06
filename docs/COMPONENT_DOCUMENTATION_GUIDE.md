# Component Documentation Guide

This guide provides standards and best practices for documenting components in the repository.

## Component Documentation

All components should have proper documentation that explains their purpose, usage, and props. This documentation helps developers understand how to use the component and maintains consistency across the codebase.

## Documentation Structure

### File Header

Every component file should have a header comment that includes:

```tsx
/**
 * @file ComponentName.tsx
 * @description Brief description of the component's purpose
 * @author [Original Author]
 * @created [Creation Date]
 * @updated [Last Update Date]
 * @source [Original Source/Inspiration, if applicable]
 * @status [Active | Deprecated | Experimental]
 */
```

### Component JSDoc

Each component should have a JSDoc comment that describes:

```tsx
/**
 * ComponentName
 * 
 * Detailed description of what the component does and its purpose in the application.
 * Include any important implementation details or usage considerations.
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   prop1="value" 
 *   prop2={value2} 
 * />
 * ```
 * 
 * @see RelatedComponent - Link to related components
 * @deprecated [If applicable] Use NewComponent instead
 */
```

### Props Documentation

Document props using TypeScript interface with JSDoc comments:

```tsx
/**
 * Props for the ComponentName component
 */
interface ComponentNameProps {
  /**
   * Description of what this prop does
   * @default default value (if applicable)
   */
  propName: PropType;
  
  /**
   * Another prop description
   * @required
   */
  requiredProp: PropType;
}
```

## Documentation Examples

### Active Component Example

```tsx
/**
 * @file AlbumShowcase.tsx
 * @description Displays album artwork and metadata with interactive features
 * @author Jane Doe
 * @created 2025-03-15
 * @updated 2025-04-02
 * @status Active
 */

import React from 'react';

/**
 * AlbumShowcase
 * 
 * Displays album artwork with metadata and provides interactive features
 * such as song previews, sharing options, and links to streaming platforms.
 * 
 * @example
 * ```tsx
 * <AlbumShowcase 
 *   albumId="album-123"
 *   showTrackList={true}
 *   enablePreview={true}
 * />
 * ```
 * 
 * @see TrackList - For displaying just the tracks
 * @see StreamingLinks - For showing streaming service links
 */
 
/**
 * Props for the AlbumShowcase component
 */
interface AlbumShowcaseProps {
  /**
   * Unique identifier for the album
   * @required
   */
  albumId: string;
  
  /**
   * Whether to display the track list
   * @default true
   */
  showTrackList?: boolean;
  
  /**
   * Enable track preview functionality
   * @default true
   */
  enablePreview?: boolean;
  
  /**
   * Callback fired when the album is shared
   */
  onShare?: (albumId: string) => void;
}

// Component implementation...
```

### Deprecated Component Example

```tsx
/**
 * @file MusicPlayer.tsx
 * @description Basic music player for audio playback
 * @author John Smith
 * @created 2024-11-02
 * @updated 2025-04-01
 * @status Deprecated
 */

import React from 'react';

/**
 * MusicPlayer
 * 
 * Basic music player for audio playback with controls.
 * 
 * @deprecated This component is deprecated. Use MoodBasedPlayer from 
 * '@/components/features/audio' instead, which provides better performance
 * and additional features.
 * 
 * @example
 * ```tsx
 * <MusicPlayer 
 *   trackUrl="/path/to/track.mp3"
 *   autoPlay={false}
 * />
 * ```
 */
 
// Component implementation...
```

## README Documentation

Each feature directory should have a README.md file that:

1. Describes the feature and its components
2. Lists the components with brief descriptions
3. Provides usage examples
4. Notes any deprecated components and their replacements

## Deprecation Notice

When deprecating a component:

1. Add the `@deprecated` tag to the JSDoc with migration guidance
2. Update the file header `@status` to "Deprecated"
3. Add a console warning in the component:

```tsx
React.useEffect(() => {
  console.warn(
    '[Deprecated] ComponentName is deprecated and will be removed in a future version. ' +
    'Please use NewComponent from @/components/features/feature-name instead.'
  );
}, []);
```

## Documentation Maintenance

Documentation should be updated when:

1. Creating new components
2. Modifying existing components
3. Deprecating components
4. Moving components between directories

By following these guidelines, we ensure that all components in the repository are properly documented, making the codebase more maintainable and easier to understand for all developers.
