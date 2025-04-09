# Features Components

This directory contains feature-specific components organized by functional domain.

## Feature Directories

| Directory | Description | Status |
|-----------|-------------|--------|
| [`admin/`](./admin/) | Administrative interface components | Active |
| [`audio/`](./audio/) | Audio playback and visualization | Active |
| [`community/`](./community/) | Community and social interaction | Active |
| [`cosmic/`](./cosmic/) | Cosmic experience and visualization | Active |
| [`design-system/`](./design-system/) | Core design system components | Active |
| [`immersive/`](./immersive/) | Immersive interactive experiences | Active |
| [`music/`](./music/) | Legacy music components (deprecated) | Deprecated |
| [`shop/`](./shop/) | E-commerce and shopping functionality | Active |

## Organization Principles

The features directory follows these organization principles:

1. **Domain-Driven Organization**: Components are grouped by functional domain rather than technical type.
2. **Encapsulation**: Each feature directory contains all components relevant to that feature.
3. **Clear Interfaces**: Components expose clear APIs for interaction with other features.
4. **Documentation**: Each feature directory contains its own README with usage examples.
5. **Deprecation Path**: Deprecated features are clearly marked and have migration guidance.

## Component Usage Guidelines

### Importing Components

Import components directly from their feature directory:

```tsx
// Preferred approach - import from feature directory
import { ProductCard } from '@/components/features/shop';
import { AdminDashboard } from '@/components/features/admin';
import { AudioPlayer } from '@/components/features/audio';

// Avoid importing from specific files within features
// import ProductCard from '@/components/features/shop/ProductCard';
```

### Cross-Feature Interactions

When components from different features need to interact:

1. Use clearly defined props interfaces
2. Consider using context providers for shared state
3. Use event-based communication for loose coupling
4. Document cross-feature dependencies

Example:

```tsx
// Audio components responding to shop interactions
import { AudioPlayer } from '@/components/features/audio';
import { ProductView } from '@/components/features/shop';

function ProductDetailPage() {
  const [productAudio, setProductAudio] = useState(null);
  
  return (
    <div>
      <ProductView 
        productId="123"
        onPreviewAudio={(audioUrl) => setProductAudio(audioUrl)}
      />
      
      {productAudio && (
        <AudioPlayer 
          src={productAudio}
          autoPlay={true}
          visualizer={true}
        />
      )}
    </div>
  );
}
```

## Feature Directory Structure

Each feature directory follows this recommended structure:

```
feature-name/
├── index.ts                 # Exports all components
├── README.md                # Feature documentation
├── ComponentName.tsx        # Individual components
├── ComponentName.test.tsx   # Component tests
├── types.ts                 # Feature-specific types
└── utils/                   # Feature-specific utilities
```

## Adding New Features

When adding a new feature:

1. Create a new directory in `features/`
2. Create a comprehensive README following the documentation standard
3. Export all components through an `index.ts` file
4. Document cross-feature dependencies
5. Add the feature to this main README

## Dependency Guidelines

To maintain a clean architecture:

1. Common dependencies (UI components, utilities) should be imported from `@/components/common`
2. Feature-specific components should not depend on other features when possible
3. When cross-feature dependencies are necessary, they should be explicitly documented
4. Circular dependencies between features should be avoided

## Maintainers

- Architecture Team (@architectureTeam)

## Last Updated

April 9, 2025
