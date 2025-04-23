# Immersive Experience Components

This directory contains components for creating deeply immersive interactive experiences, including 3D environments, interactive visualizations, and multi-sensory content.

## Components

### Active Components

| Component | Description | Status |
|-----------|-------------|--------|
| `ImmersiveViewer` | Main container for immersive experiences | Active |
| `InteractiveScene` | 3D scene with user interaction | Active |
| `SpatialAudio` | 3D audio environment system | Active |
| `VRController` | Virtual reality interface controls | Active |
| `GestureRecognizer` | Motion and gesture recognition | Active |
| `ImmersiveStory` | Interactive narrative experiences | Active |
| `EnvironmentSwitcher` | Dynamic environment changing system | Active |
| `DepthMapper` | Depth-based interaction system | Active |
| `ImmersiveOverlay` | Information overlay for immersive content | Active |
| `VoiceInteraction` | Voice-controlled immersive interface | Active |

## Usage

### Basic Immersive Scene

```tsx
import { ImmersiveViewer, InteractiveScene } from '@/components/features/immersive';

export default function ImmersiveExperiencePage() {
  return (
    <div className="h-screen">
      <ImmersiveViewer
        fullscreen={true}
        controlType="orbital"
        initialEnvironment="cosmic"
      >
        <InteractiveScene 
          modelSrc="/models/cosmic-environment.glb"
          lightIntensity={1.5}
          ambientColor="#1a1a2e"
          interactiveObjects={[
            { id: 'planet-1', position: [0, 0, -5], onClick: () => handlePlanetClick(1) },
            { id: 'star-cluster', position: [3, 2, -8], onClick: () => handleStarClusterClick() },
          ]}
        />
      </ImmersiveViewer>
    </div>
  );
}
```

### Immersive Story Experience

```tsx
import { ImmersiveStory, SpatialAudio } from '@/components/features/immersive';
import { useState } from 'react';

export default function StoryExperiencePage() {
  const [currentChapter, setCurrentChapter] = useState(1);
  
  const chapters = [
    { id: 1, title: 'The Beginning', scene: 'cosmic-origin', narration: '/audio/chapter-1.mp3' },
    { id: 2, title: 'Stellar Formation', scene: 'star-birth', narration: '/audio/chapter-2.mp3' },
    { id: 3, title: 'Planetary Evolution', scene: 'planet-formation', narration: '/audio/chapter-3.mp3' },
  ];
  
  const currentChapterData = chapters.find(chapter => chapter.id === currentChapter);
  
  return (
    <div className="h-screen">
      <ImmersiveStory
        chapters={chapters}
        currentChapter={currentChapter}
        onChapterChange={setCurrentChapter}
        autoProgress={false}
        allowSkip={true}
      >
        <SpatialAudio
          sources={[
            { id: 'narration', url: currentChapterData.narration, position: [0, 0, 0], autoplay: true },
            { id: 'ambient', url: '/audio/cosmic-ambient.mp3', position: [0, 0, 0], loop: true },
          ]}
          listenerPosition={[0, 0, 0]}
        />
      </ImmersiveStory>
    </div>
  );
}
```

## Component Relationships

```
ImmersiveExperience
├── ImmersiveViewer
│   ├── InteractiveScene
│   │   └── InteractiveObjects
│   ├── SpatialAudio
│   │   └── AudioSources
│   └── ImmersiveOverlay
│       └── OverlayContent
├── VRController
│   ├── GestureRecognizer
│   └── VoiceInteraction
└── ImmersiveStory
    ├── StoryChapters
    └── EnvironmentSwitcher
```

## Props Documentation

### ImmersiveViewer Props

```tsx
interface ImmersiveViewerProps {
  /**
   * Whether to display in fullscreen mode
   * @default false
   */
  fullscreen?: boolean;
  
  /**
   * Type of camera control to use
   * @default "orbital"
   */
  controlType?: 'orbital' | 'first-person' | 'guided' | 'vr';
  
  /**
   * Initial environment to display
   * @default "neutral"
   */
  initialEnvironment?: 'cosmic' | 'forest' | 'ocean' | 'desert' | 'mountains' | 'neutral';
  
  /**
   * Whether to enable VR mode if available
   * @default false
   */
  enableVR?: boolean;
  
  /**
   * Level of detail to render (affects performance)
   * @default "medium"
   */
  qualityLevel?: 'low' | 'medium' | 'high' | 'ultra';
  
  /**
   * Whether to show performance stats
   * @default false
   */
  showStats?: boolean;
  
  /**
   * Custom CSS classes
   */
  className?: string;
  
  /**
   * Child elements to render within the immersive viewer
   */
  children?: React.ReactNode;
}
```

## Performance Considerations

Immersive components are resource-intensive. Some guidelines for optimal performance:

1. **Quality Levels**: Use the `qualityLevel` prop to adjust detail based on device capabilities
2. **Asset Loading**: Pre-load 3D models and textures using the `preloadAssets` utility
3. **Progressive Enhancement**: Implement fallbacks for devices that don't support WebGL or VR
4. **Lazy Initialization**: Use the `lazyInit` prop on components that don't need immediate rendering
5. **Memory Management**: Call `scene.dispose()` when removing components to prevent memory leaks

## Accessibility Features

Immersive components include alternative interaction methods for accessibility:

1. **Screen Reader Support**: All interactive objects have proper ARIA labels
2. **Keyboard Navigation**: All interactions are available via keyboard shortcuts
3. **Motion Sensitivity**: Option to reduce motion effects for users with vestibular disorders
4. **Alternative Content**: Text descriptions for visual elements
5. **Color Blind Modes**: Alternative color schemes for different types of color blindness

## Feature Roadmap

### Upcoming Features

- [ ] Augmented Reality (AR) support
- [ ] Multi-user immersive experiences
- [ ] Haptic feedback integration
- [ ] Advanced physics interactions
- [ ] AI-guided immersive tours
- [ ] Hand tracking for natural interactions

## Maintainers

- Immersive Experience Team (@immersiveTeam)

## Last Updated

April 9, 2025
