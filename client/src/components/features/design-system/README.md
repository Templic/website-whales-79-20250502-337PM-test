
# Design System Components

This directory contains our core design system components with Apple-inspired styling and interactions, providing a consistent UI framework for the entire application.

## Components

### Active Components

| Component | Description | Status |
|-----------|-------------|--------|
| `Container` | Responsive container with consistent padding | Active |
| `Grid` | Flexible grid layout system | Active |
| `Card` | Content container with various styles | Active |
| `Button` | Customizable button component | Active |
| `Input` | Text input field with validation | Active |
| `Select` | Dropdown selection component | Active |
| `Menu` | Navigation menu component | Active |
| `Breadcrumbs` | Navigation path indicator | Active |
| `Alert` | Information and error alerts | Active |
| `Toast` | Temporary notification display | Active |
| `Modal` | Dialog windows for focused interactions | Active |
| `Tabs` | Content organization with tabbed interface | Active |
| `Avatar` | User profile image component | Active |
| `Badge` | Status indicator component | Active |
| `Tooltip` | Contextual information display | Active |

## Usage

### Basic Component Usage

```tsx
import { Button, Card, Container } from '@/components/features/design-system';

export default function ExamplePage() {
  return (
    <Container>
      <h1 className="text-2xl font-bold mb-4">Example Page</h1>
      
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Card Title</h2>
        <p className="text-gray-700 mb-4">
          This is an example of using our design system components together.
        </p>
        
        <Button 
          variant="primary"
          size="md"
          onClick={() => console.log('Button clicked')}
        >
          Primary Action
        </Button>
      </Card>
    </Container>
  );
}
```

### Component Composition

```tsx
import { Modal, Button, Input } from '@/components/features/design-system';
import { useState } from 'react';

export default function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  
  return (
    <div className="p-4">
      <Button 
        variant="primary"
        onClick={() => setIsOpen(true)}
      >
        Open Modal
      </Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="User Information"
      >
        <div className="space-y-4">
          <Input
            label="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                console.log('Submitted:', name);
                setIsOpen(false);
              }}
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

## Component Relationships

```
Design System
├── Layout
│   ├── Container
│   ├── Grid
│   └── Card
├── Navigation
│   ├── Menu
│   ├── Breadcrumbs
│   └── Tabs
├── Interactive
│   ├── Button
│   ├── Input
│   └── Select
└── Feedback
    ├── Alert
    ├── Toast
    ├── Modal
    └── Tooltip
```

## Props Documentation

### Button Props

```tsx
interface ButtonProps {
  /**
   * Button style variant
   * @default "default"
   */
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  
  /**
   * Button size
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Whether the button is in loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Icon to display before the button text
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Icon to display after the button text
   */
  rightIcon?: React.ReactNode;
  
  /**
   * Button click handler
   */
  onClick?: () => void;
  
  /**
   * Custom CSS classes
   */
  className?: string;
  
  /**
   * Button children
   */
  children: React.ReactNode;
}
```

## Design Tokens

The design system uses a consistent set of design tokens for:

- Colors
- Typography
- Spacing
- Shadows
- Border radius
- Animation timings

These tokens are defined in `theme.json` and are accessible via Tailwind CSS classes.

## Theming

All components support theming via the application's theme defined in `theme.json`. The theme supports:

1. Color scheme customization (primary color)
2. Light/dark mode
3. Variable border radius
4. Several preset variants (professional, tint, vibrant)

## Accessibility

Design system components implement accessibility best practices:

1. Proper ARIA attributes
2. Keyboard navigation support
3. Focus management
4. Color contrast compliance
5. Screen reader support

## Feature Roadmap

### Upcoming Components

- [ ] Data tables with sorting and filtering
- [ ] Advanced form controls (sliders, date pickers)
- [ ] Rich text editor component
- [ ] Expandable sections (accordion)
- [ ] Drag and drop interface components

## Maintainers

- Design System Team (@designSystemTeam)

## Last Updated

April 9, 2025
