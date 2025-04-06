# Audio Feature Components

This directory contains components related to audio processing, playback, and visualization in the Cosmic Community Connect application.

## Component Overview

### Primary Components

- **[CosmicAudioPlayer](./CosmicAudioPlayer.tsx)** - Advanced audio player with visualization and theme integration
- **[AudioVisualizer](./AudioVisualizer.tsx)** - Customizable audio visualization component with multiple modes
- **[AudioWaveform](./AudioWaveform.tsx)** - Waveform display for audio tracks
- **[AudioFrequencySpectrum](./AudioFrequencySpectrum.tsx)** - Frequency spectrum analyzer for audio
- **[AudioController](./AudioController.tsx)** - Global audio state management component

### Utility Components

- **[VolumeControl](./VolumeControl.tsx)** - Reusable volume control slider
- **[PlaybackControls](./PlaybackControls.tsx)** - Standard playback control buttons
- **[TrackProgress](./TrackProgress.tsx)** - Track progress bar with time display
- **[AudioEffects](./AudioEffects.tsx)** - Audio effects panel (reverb, delay, etc.)

### Hooks

- **[useAudioContext](./hooks/useAudioContext.tsx)** - Hook for accessing the audio context
- **[useAudioAnalyzer](./hooks/useAudioAnalyzer.tsx)** - Hook for audio frequency analysis
- **[useMediaSession](./hooks/useMediaSession.tsx)** - Hook for Media Session API integration

## Usage Examples

### Basic Audio Player

```tsx
import { CosmicAudioPlayer } from '@/components/features/audio/CosmicAudioPlayer';

const MyMusicComponent = () => {
  return (
    <CosmicAudioPlayer
      trackSrc="/music/cosmic-journey.mp3"
      trackTitle="Cosmic Journey"
      artistName="Stellar Sounds"
      coverArt="/images/cosmic-journey-cover.jpg"
      visualizer={true}
      theme="nebula"
    />
  );
};
```

### Custom Audio Visualization

```tsx
import { useRef, useEffect } from 'react';
import { AudioVisualizer } from '@/components/features/audio/AudioVisualizer';
import { useAudioContext } from '@/components/features/audio/hooks/useAudioContext';

const MyCustomVisualizer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isPlaying } = useAudioContext();
  
  return (
    <div>
      <audio 
        ref={audioRef} 
        src="/music/ambient-space.mp3" 
        controls
      />
      
      {audioRef.current && (
        <AudioVisualizer
          audioElement={audioRef.current}
          type="circular"
          height={300}
          color="#8A2BE2"
          sensitivity={0.8}
          glow={true}
        />
      )}
    </div>
  );
};
```

## Architecture

The audio components follow a hierarchical architecture:

```
AudioController (Global state)
 ├── CosmicAudioPlayer
 │    ├── AudioVisualizer
 │    ├── PlaybackControls
 │    └── TrackProgress
 └── Other audio components
```

- **AudioController** provides global audio state management
- **CosmicAudioPlayer** is the main component for playback
- Visualization components can work independently or with the player

## API Reference

### CosmicAudioPlayer

The main audio player component with cosmic styling.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| trackSrc | string | required | Source URL of the audio track |
| trackTitle | string | '' | Title of the track |
| artistName | string | '' | Name of the artist |
| coverArt | string | undefined | URL to cover art image |
| autoPlay | boolean | false | Whether to start playing automatically |
| visualizer | boolean | true | Whether to show audio visualization |
| visualizerType | 'waveform' \| 'frequency' \| 'circular' \| 'particles' | 'waveform' | Type of visualization to show |
| theme | 'nebula' \| 'galaxy' \| 'stardust' \| 'cosmic' | 'cosmic' | Visual theme for the player |
| loopMode | 'none' \| 'single' \| 'all' | 'none' | Playback loop mode |
| initialVolume | number | 75 | Initial volume (0-100) |
| onPlay | () => void | undefined | Callback when playback starts |
| onPause | () => void | undefined | Callback when playback pauses |
| onEnded | () => void | undefined | Callback when playback ends |
| onTimeUpdate | (currentTime: number) => void | undefined | Callback when playback time updates |
| onVolumeChange | (volume: number) => void | undefined | Callback when volume changes |
| className | string | '' | Additional CSS classes |

### AudioVisualizer

Customizable audio visualization component.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| audioElement | HTMLAudioElement | required | HTML Audio element to visualize |
| type | 'waveform' \| 'frequency' \| 'circular' \| 'particles' | 'waveform' | Type of visualization |
| color | string | theme primary | Primary color for visualization |
| secondaryColor | string | derived | Secondary color for gradients |
| backgroundColor | string | 'transparent' | Background color |
| height | number | 200 | Height of visualizer |
| width | number \| string | '100%' | Width of visualizer |
| sensitivity | number | 0.8 | Sensitivity of visualization (0-1) |
| barCount | number | 64 | Number of bars for frequency visualization |
| glow | boolean | true | Whether to use glow effect |
| performanceMode | boolean | false | Whether to optimize for performance |
| className | string | undefined | Additional CSS classes |

## Accessibility

Our audio components follow WCAG 2.1 AA standards:

- All controls have proper labels and ARIA attributes
- Keyboard navigation is fully supported
- Color contrast ratios meet accessibility guidelines
- Media controls support the Media Session API for OS-level integration

## Browser Compatibility

- Full functionality in modern browsers (Chrome, Firefox, Safari, Edge)
- Basic functionality in IE11 (visualization not supported)
- Mobile browsers fully supported

## Performance Considerations

- Audio visualization can be CPU-intensive; use `performanceMode` prop for low-end devices
- For multiple audio components on one page, consider using a shared audio context
- Large audio files are streamed rather than fully loaded to improve performance

## Future Development

Planned features for future releases:

- Spatial audio support with 3D positioning
- Audio reactive background effects
- Playlist management capabilities
- Audio recording and processing tools

## Migration from Legacy Components

If you're using legacy components from the `components/music` directory, please migrate to these newer components. See the [Migration Guide](../../docs/migrations/AUDIO_MIGRATION.md) for details.
