# Deprecated Component Example

This example demonstrates the proper documentation format for deprecated components in the Cosmic Community Connect project.

## Example Implementation

```tsx
/**
 * @file LegacyMusicPlayer.tsx
 * @description A music player component from the original version (v0)
 * @author Original Development Team
 * @created 2024-09-10
 * @updated 2025-04-06
 * @status Deprecated
 * @replacement CosmicAudioPlayer
 * @deprecationReason Replaced with a more sophisticated and accessible audio player
 * @removalDate 2025-06-30
 */

import React, { useState, useRef } from 'react';

/**
 * @deprecated Use CosmicAudioPlayer from @/components/features/audio instead.
 * This component will be removed in the June 2025 release.
 * 
 * LegacyMusicPlayer was part of the original v0 implementation and lacks
 * several important features including:
 * - Proper accessibility support
 * - Mobile responsiveness
 * - Audio visualization
 * - Integration with the cosmic theme
 * 
 * Migration Guide:
 * To migrate from LegacyMusicPlayer to CosmicAudioPlayer:
 * 
 * 1. Replace the import statement:
 *    - Old: import LegacyMusicPlayer from '@/components/music/LegacyMusicPlayer';
 *    - New: import { CosmicAudioPlayer } from '@/components/features/audio/CosmicAudioPlayer';
 * 
 * 2. Update the component usage:
 *    - Old: <LegacyMusicPlayer src="/music/track.mp3" autoPlay={false} />
 *    - New: <CosmicAudioPlayer 
 *             trackSrc="/music/track.mp3" 
 *             autoPlay={false}
 *             visualizer={true}
 *           />
 * 
 * 3. Additional considerations:
 *    - The 'loop' prop is now 'loopMode' with options 'none', 'single', or 'all'
 *    - Volume is now controlled via the 'initialVolume' prop (0-100)
 *    - Add the 'theme' prop to match your app's color scheme
 * 
 * @see CosmicAudioPlayer - The replacement component
 * @see MusicMigrationGuide - Full guide on migrating music components
 */

/**
 * Props for the LegacyMusicPlayer component
 * @deprecated Use CosmicAudioPlayerProps instead
 */
interface LegacyMusicPlayerProps {
  /**
   * Source URL of the audio file
   */
  src: string;
  
  /**
   * Whether to start playing automatically
   * @default false
   */
  autoPlay?: boolean;
  
  /**
   * Whether to loop the audio
   * @default false
   */
  loop?: boolean;
  
  /**
   * Initial volume (0-1)
   * @default 0.5
   */
  volume?: number;
  
  /**
   * Label to display
   */
  label?: string;
  
  /**
   * CSS class for styling
   */
  className?: string;
}

/**
 * LegacyMusicPlayer component
 * @deprecated Use CosmicAudioPlayer instead
 */
const LegacyMusicPlayer: React.FC<LegacyMusicPlayerProps> = ({
  src,
  autoPlay = false,
  loop = false,
  volume = 0.5,
  label,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newVolume = parseFloat(e.target.value);
      audioRef.current.volume = newVolume;
    }
  };
  
  return (
    <div className={`legacy-music-player ${className}`}>
      {label && <div className="player-label">{label}</div>}
      
      <div className="player-controls">
        <button 
          className="play-button" 
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          aria-label="Volume"
        />
      </div>
      
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default LegacyMusicPlayer;
```

## Documentation Breakdown

### File Header

The file header includes standard metadata plus deprecation-specific fields:

```tsx
/**
 * @file LegacyMusicPlayer.tsx
 * @description A music player component from the original version (v0)
 * @author Original Development Team
 * @created 2024-09-10
 * @updated 2025-04-06
 * @status Deprecated
 * @replacement CosmicAudioPlayer
 * @deprecationReason Replaced with a more sophisticated and accessible audio player
 * @removalDate 2025-06-30
 */
```

Deprecation-specific fields include:
- **@status Deprecated**: Explicitly marks the component as deprecated
- **@replacement**: The component that should be used instead
- **@deprecationReason**: Why the component is deprecated
- **@removalDate**: When the component will be removed

### Deprecation Notice

A detailed deprecation notice follows the file header:

```tsx
/**
 * @deprecated Use CosmicAudioPlayer from @/components/features/audio instead.
 * This component will be removed in the June 2025 release.
 * 
 * LegacyMusicPlayer was part of the original v0 implementation and lacks
 * several important features including:
 * - Proper accessibility support
 * - Mobile responsiveness
 * - Audio visualization
 * - Integration with the cosmic theme
 * 
 * Migration Guide:
 * To migrate from LegacyMusicPlayer to CosmicAudioPlayer:
 * 
 * 1. Replace the import statement:
 *    - Old: import LegacyMusicPlayer from '@/components/music/LegacyMusicPlayer';
 *    - New: import { CosmicAudioPlayer } from '@/components/features/audio/CosmicAudioPlayer';
 * 
 * 2. Update the component usage:
 *    - Old: <LegacyMusicPlayer src="/music/track.mp3" autoPlay={false} />
 *    - New: <CosmicAudioPlayer 
 *             trackSrc="/music/track.mp3" 
 *             autoPlay={false}
 *             visualizer={true}
 *           />
 * 
 * 3. Additional considerations:
 *    - The 'loop' prop is now 'loopMode' with options 'none', 'single', or 'all'
 *    - Volume is now controlled via the 'initialVolume' prop (0-100)
 *    - Add the 'theme' prop to match your app's color scheme
 * 
 * @see CosmicAudioPlayer - The replacement component
 * @see MusicMigrationGuide - Full guide on migrating music components
 */
```

The notice includes:
- Clear indication that the component is deprecated
- When it will be removed
- Reasons for deprecation (features it lacks)
- Step-by-step migration guide
- References to replacement components and migration guides

### Prop Interface and Component

Both the prop interface and the component itself are marked as deprecated:

```tsx
/**
 * Props for the LegacyMusicPlayer component
 * @deprecated Use CosmicAudioPlayerProps instead
 */
interface LegacyMusicPlayerProps {
  // ...
}

/**
 * LegacyMusicPlayer component
 * @deprecated Use CosmicAudioPlayer instead
 */
const LegacyMusicPlayer: React.FC<LegacyMusicPlayerProps> = ({
  // ...
});
```

## Best Practices for Deprecated Components

1. **Clear Marking**: Clearly mark all elements (file, interface, component) as deprecated
2. **Specify Replacement**: Always indicate what should be used instead
3. **Provide Timeline**: Include a planned removal date
4. **Migration Path**: Include a detailed migration guide with examples
5. **Avoid Changes**: Minimize changes to deprecated components
6. **Maintain Functionality**: Ensure the component still works until removal
7. **Consistent Notices**: Use consistent formatting for all deprecation notices

## Additional Notes

- Keep deprecated components in a separate directory (e.g., `/components/deprecated/` or `/components/legacy/`)
- Include console warnings (in development only) to alert developers using deprecated components
- Document migration paths in central documentation as well as in the component
- Consider creating automated migration scripts for complex components
