# Audio Components

This directory contains audio-related components for playback, visualization, and interaction with audio content.

## Components

### Active Components

| Component | Description | Status |
|-----------|-------------|--------|
| `AudioPlayer` | Modern audio player with controls and visualization | Active |
| `AudioControls` | Comprehensive playback controls component | Active |
| `AudioPlaylist` | Interactive audio playlist with drag-and-drop support | Active |
| `AudioTrackList` | List of audio tracks with information | Active |
| `AudioVisualizer` | Advanced audio visualization with multiple modes | Active |
| `WaveformDisplay` | Audio waveform visualization | Active |
| `SpectrumAnalyzer` | Audio frequency spectrum visualization | Active |
| `AmbientAudio` | Background ambient sound effects | Active |
| `MoodBasedPlayer` | Mood-aware audio player | Active |

## Usage

### Basic Audio Player

```tsx
import { AudioPlayer } from '@/components/features/audio';

export default function AudioPlayerExample() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Audio Player</h1>
      
      <AudioPlayer 
        src="/path/to/audio.mp3"
        title="Track Title"
        artist="Artist Name"
        coverArt="/path/to/cover.jpg"
        visualizer={true}
        visualizerType="waveform"
      />
    </div>
  );
}
```

### Advanced Audio Player with Playlist

```tsx
import { AudioPlayer, AudioPlaylist } from '@/components/features/audio';
import { useState } from 'react';

export default function AdvancedAudioExample() {
  const [currentTrack, setCurrentTrack] = useState(0);
  
  const tracks = [
    { id: 1, title: 'Track 1', artist: 'Artist 1', src: '/path/to/track1.mp3', coverArt: '/path/to/cover1.jpg' },
    { id: 2, title: 'Track 2', artist: 'Artist 2', src: '/path/to/track2.mp3', coverArt: '/path/to/cover2.jpg' },
    { id: 3, title: 'Track 3', artist: 'Artist 3', src: '/path/to/track3.mp3', coverArt: '/path/to/cover3.jpg' },
  ];
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Advanced Audio Player</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <AudioPlayer 
            {...tracks[currentTrack]}
            visualizer={true}
            visualizerType="spectrum"
            onNext={() => setCurrentTrack((prev) => (prev + 1) % tracks.length)}
            onPrevious={() => setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length)}
          />
        </div>
        
        <div>
          <AudioPlaylist
            tracks={tracks}
            currentTrack={currentTrack}
            onTrackSelect={setCurrentTrack}
            allowReordering={true}
          />
        </div>
      </div>
    </div>
  );
}
```

### Customized Visualizer

```tsx
import { AudioVisualizer } from '@/components/features/audio';
import { useRef, useState } from 'react';

export default function CustomVisualizerExample() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Custom Audio Visualizer</h1>
      
      <audio 
        ref={audioRef}
        src="/path/to/audio.mp3"
        controls
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="w-full mb-6"
      />
      
      {playing && (
        <AudioVisualizer
          audioElement={audioRef.current}
          type="spectrum"
          barCount={64}
          barColor="hsl(var(--primary))"
          backgroundColor="transparent"
          height={200}
          className="w-full rounded-lg border"
        />
      )}
    </div>
  );
}
```

## Component Relationships

```
AudioPlayer
├── AudioControls
├── AudioVisualizer
│   ├── WaveformDisplay
│   └── SpectrumAnalyzer
└── Metadata Display

AudioPlaylist
└── AudioTrackList
    └── Track Items

MoodBasedPlayer
├── AudioPlayer
└── Mood Detection
```

## Props Documentation

### AudioPlayer Props

```tsx
interface AudioPlayerProps {
  /**
   * URL to the audio file
   * @required
   */
  src: string;
  
  /**
   * Title of the track
   */
  title?: string;
  
  /**
   * Artist name
   */
  artist?: string;
  
  /**
   * URL to cover art image
   */
  coverArt?: string;
  
  /**
   * Whether to show visualizer
   * @default false
   */
  visualizer?: boolean;
  
  /**
   * Type of visualizer to display
   * @default "waveform"
   */
  visualizerType?: 'waveform' | 'spectrum' | 'circular';
  
  /**
   * Whether to autoplay audio
   * @default false
   */
  autoPlay?: boolean;
  
  /**
   * Whether to loop audio
   * @default false
   */
  loop?: boolean;
  
  /**
   * Initial volume (0-1)
   * @default 0.7
   */
  initialVolume?: number;
  
  /**
   * Callback when track ends
   */
  onEnded?: () => void;
  
  /**
   * Callback for next track button
   */
  onNext?: () => void;
  
  /**
   * Callback for previous track button
   */
  onPrevious?: () => void;
}
```

## Styling

All components use Tailwind CSS for styling and follow the application's theme defined in `theme.json`. Custom styling can be applied through the `className` prop on most components.

## Feature Roadmap

### Upcoming Changes

- [ ] Add support for audio effects and processing
- [ ] Improve accessibility features
- [ ] Add support for streaming services
- [ ] Implement audio crossfading between tracks

## Maintainers

- Audio Team (@audioTeam)

## Last Updated

April 6, 2025
