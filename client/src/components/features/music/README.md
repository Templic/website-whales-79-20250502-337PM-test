# Music Components (Deprecated)

> **DEPRECATED**: The components in this directory are deprecated and will be removed in a future version.
> Please use the corresponding components in the `audio` feature directory instead.

## Migration Guide

### From Legacy Music Components to Audio Components

This directory contains legacy music-related components that are being phased out in favor of the new, more comprehensive audio components in the `features/audio` directory.

#### Component Mapping

| Legacy Component | Replacement Component | Notes |
|------------------|------------------------|-------|
| `MusicPlayer` | `AudioPlayer` | The new component supports more formats and has better performance |
| `PlaylistViewer` | `AudioPlaylist` | The new component has better accessibility and responsive design |
| `TrackList` | `AudioTrackList` | The new component supports drag-and-drop ordering |
| `VolumeControl` | `AudioControls` | Volume control is now part of a comprehensive controls component |
| `MusicVisualizer` | `AudioVisualizer` | The new component has more visualization options |

#### Example Migration

```diff
- import { MusicPlayer } from "@/components/features/music";
+ import { AudioPlayer } from "@/components/features/audio";

function SomePage() {
  return (
-    <MusicPlayer
-      trackUrl="/path/to/track.mp3"
-      autoPlay={false}
-      loop={true}
-    />
+    <AudioPlayer
+      src="/path/to/track.mp3"
+      autoPlay={false}
+      loop={true}
+      visualizer={true}
+    />
  );
}
```

## Legacy Components (Do Not Use for New Development)

These components are maintained only for backward compatibility with existing code:

### MusicPlayer

A basic music player for audio playback with controls.

```tsx
<MusicPlayer
  trackUrl="/path/to/track.mp3"
  autoPlay={false}
  loop={true}
/>
```

### PlaylistViewer

Displays a list of music tracks in a playlist format.

```tsx
<PlaylistViewer
  playlist={tracks}
  onTrackSelect={handleTrackSelect}
/>
```

### TrackList

Displays a simple list of tracks with basic information.

```tsx
<TrackList
  tracks={tracks}
  onTrackClick={handleTrackClick}
/>
```

### VolumeControl

A standalone volume control component.

```tsx
<VolumeControl
  initialVolume={0.5}
  onChange={handleVolumeChange}
/>
```

### MusicVisualizer

A basic audio visualization component.

```tsx
<MusicVisualizer
  audioElement={audioRef.current}
  type="waveform"
/>
```

## Removal Timeline

These components are scheduled for removal in the Q3 2025 release. All code should migrate to the `audio` components before then.

## Support Status

- No new features will be added to these components
- Only critical bug fixes will be applied
- Documentation will not be updated except for migration guidance

## Questions and Support

For questions about migrating from these deprecated components, please contact the development team.
