# Cosmic Experience Components

This directory contains components for creating immersive cosmic-themed visual experiences, animations, and interactive elements.

## Components

### Active Components

| Component | Description | Status |
|-----------|-------------|--------|
| `StarField` | Animated background with dynamic stars | Active |
| `CosmicParticles` | Interactive particle system | Active |
| `PlanetRenderer` | 3D planet visualization | Active |
| `GalaxyMap` | Interactive galaxy exploration interface | Active |
| `CosmicJourney` | Guided cosmic experience flow | Active |
| `NebulaEffect` | Colorful nebula visual effect | Active |
| `ConstellationDisplay` | Constellation patterns with information | Active |
| `AstralPortal` | Transition effect between cosmic scenes | Active |
| `CosmicZoom` | Zoom-in/out effect for cosmic scale | Active |
| `CelestialBody` | Customizable celestial body renderer | Active |

## Usage

### Star Field Background

```tsx
import { StarField } from '@/components/features/cosmic';

export default function CosmicPage() {
  return (
    <div className="relative min-h-screen">
      <StarField 
        starCount={500}
        depth={3}
        speed={0.5}
        interactive={true}
      />
      
      <div className="relative z-10 container mx-auto p-4">
        <h1 className="text-4xl font-bold text-white">Cosmic Experience</h1>
        <p className="text-xl text-white mt-4">
          Explore the wonders of the cosmos through our interactive journey.
        </p>
      </div>
    </div>
  );
}
```

### Interactive Galaxy Exploration

```tsx
import { GalaxyMap, CelestialBody } from '@/components/features/cosmic';
import { useState } from 'react';

export default function GalaxyExplorerPage() {
  const [selectedCelestialBody, setSelectedCelestialBody] = useState(null);
  
  const celestialBodies = [
    { id: 1, name: 'Andromeda Galaxy', type: 'galaxy', position: { x: 120, y: 85 } },
    { id: 2, name: 'Orion Nebula', type: 'nebula', position: { x: 250, y: 150 } },
    { id: 3, name: 'Alpha Centauri', type: 'star', position: { x: 180, y: 220 } },
  ];
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Galaxy Explorer</h1>
      
      <GalaxyMap 
        width={500}
        height={400}
        onSelectObject={(id) => {
          const selected = celestialBodies.find(body => body.id === id);
          setSelectedCelestialBody(selected);
        }}
      >
        {celestialBodies.map(body => (
          <CelestialBody
            key={body.id}
            id={body.id}
            type={body.type}
            position={body.position}
            name={body.name}
          />
        ))}
      </GalaxyMap>
      
      {selectedCelestialBody && (
        <div className="mt-4 p-4 bg-black/50 text-white rounded">
          <h2 className="text-xl">{selectedCelestialBody.name}</h2>
          <p>Type: {selectedCelestialBody.type}</p>
          {/* Additional celestial body information */}
        </div>
      )}
    </div>
  );
}
```

## Component Relationships

```
CosmicExperience
├── StarField
├── NebulaEffect
├── CosmicParticles
├── GalaxyMap
│   ├── CelestialBody
│   └── ConstellationDisplay
└── CosmicJourney
    ├── AstralPortal
    ├── CosmicZoom
    └── PlanetRenderer
```

## Props Documentation

### StarField Props

```tsx
interface StarFieldProps {
  /**
   * Number of stars to render
   * @default 300
   */
  starCount?: number;
  
  /**
   * Depth layers for parallax effect (1-5)
   * @default 3
   */
  depth?: 1 | 2 | 3 | 4 | 5;
  
  /**
   * Animation speed multiplier
   * @default 1
   */
  speed?: number;
  
  /**
   * Whether stars should respond to mouse movement
   * @default false
   */
  interactive?: boolean;
  
  /**
   * Star color palette
   * @default "cosmic" (blue/purple hues)
   */
  colorScheme?: 'cosmic' | 'warm' | 'cool' | 'monochrome';
  
  /**
   * Custom CSS classes
   */
  className?: string;
}
```

## WebGL and Performance

Many cosmic components use WebGL for rendering and can be performance-intensive. For optimal performance:

1. Use appropriate `starCount` values based on the device capabilities
2. Consider disabling interactive features on lower-end devices
3. Use `CosmicZoom` wisely as it's GPU-intensive
4. Apply the `lowPerformanceMode` prop on WebGL components when needed

## Feature Roadmap

### Upcoming Features

- [ ] Music reactivity for cosmic visualizations
- [ ] Virtual reality mode for immersive experience
- [ ] Astronomical event simulations
- [ ] Cosmic education journey with scientific information
- [ ] User-customizable cosmic environments

## Maintainers

- Cosmic Experience Team (@cosmicTeam)

## Last Updated

April 9, 2025
