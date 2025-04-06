# Documented Component Example

This example demonstrates the proper documentation format for active components in the Cosmic Community Connect project.

## Example Implementation

```tsx
/**
 * @file CosmicButton.tsx
 * @description A button component with cosmic styling and animation effects
 * @author Development Team
 * @created 2025-03-15
 * @updated 2025-04-06
 * @status Active
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

/**
 * Button variant types
 */
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost';

/**
 * Button size options
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props for the CosmicButton component
 */
interface CosmicButtonProps {
  /**
   * Button content
   * @required
   */
  children: React.ReactNode;
  
  /**
   * Style variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;
  
  /**
   * Size variant of the button
   * @default 'md'
   */
  size?: ButtonSize;
  
  /**
   * Optional icon to display before the button text
   */
  icon?: LucideIcon;
  
  /**
   * Whether the button is in a disabled state
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Whether to show the cosmic pulse animation effect
   * @default true
   */
  animated?: boolean;
  
  /**
   * Additional CSS classes to apply to the button
   */
  className?: string;
  
  /**
   * Function called when the button is clicked
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /**
   * Optional type attribute for the button element
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * CosmicButton
 * 
 * A customizable button component with cosmic styling, featuring multiple
 * variants, sizes, and optional animation effects. Fully accessible with
 * proper ARIA attributes and keyboard interaction.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <CosmicButton onClick={() => console.log('Clicked!')}>
 *   Click Me
 * </CosmicButton>
 * 
 * // With icon and variant
 * <CosmicButton 
 *   icon={Star} 
 *   variant="secondary" 
 *   size="lg"
 * >
 *   Explore Stars
 * </CosmicButton>
 * 
 * // Disabled state
 * <CosmicButton disabled>
 *   Unavailable
 * </CosmicButton>
 * ```
 * 
 * @see CosmicButtonGroup - For grouping multiple buttons
 * @see CosmicIconButton - For icon-only buttons
 */
const CosmicButton: React.FC<CosmicButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  animated = true,
  className,
  onClick,
  type = 'button',
  ...props
}) => {
  // Get the appropriate styles based on variant and size
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/20',
    secondary: 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary/20',
    tertiary: 'bg-accent text-white hover:bg-accent/90 focus:ring-accent/20',
    ghost: 'bg-transparent hover:bg-primary/10 text-primary focus:ring-primary/10'
  };
  
  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };
  
  const animationClass = animated && !disabled ? 'cosmic-pulse' : '';
  
  return (
    <button
      type={type}
      className={cn(
        'cosmic-button inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        sizeStyles[size],
        variantStyles[variant],
        animationClass,
        className
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && (
        <Icon 
          className={cn(
            'mr-2',
            size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
          )} 
        />
      )}
      {children}
    </button>
  );
};

export default CosmicButton;
```

## Documentation Breakdown

### File Header

The file header provides essential metadata about the component:

```tsx
/**
 * @file CosmicButton.tsx
 * @description A button component with cosmic styling and animation effects
 * @author Development Team
 * @created 2025-03-15
 * @updated 2025-04-06
 * @status Active
 */
```

This includes:
- **File name**: The name of the file
- **Description**: Brief purpose of the component
- **Author**: Who created the component
- **Created**: When the component was first created
- **Updated**: When the component was last updated
- **Status**: Current status (Active, Deprecated, Experimental)

### Type Definitions

Clear type definitions with descriptive names:

```tsx
/**
 * Button variant types
 */
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost';

/**
 * Button size options
 */
type ButtonSize = 'sm' | 'md' | 'lg';
```

### Props Interface

Comprehensive props interface with detailed JSDoc for each prop:

```tsx
/**
 * Props for the CosmicButton component
 */
interface CosmicButtonProps {
  /**
   * Button content
   * @required
   */
  children: React.ReactNode;
  
  /**
   * Style variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;
  
  // Additional props...
}
```

For each prop, document:
- Purpose of the prop
- Whether it's required
- Default value if applicable
- Any constraints or relationships with other props

### Component JSDoc

Detailed component description with examples and related components:

```tsx
/**
 * CosmicButton
 * 
 * A customizable button component with cosmic styling, featuring multiple
 * variants, sizes, and optional animation effects. Fully accessible with
 * proper ARIA attributes and keyboard interaction.
 * 
 * @example
 * // Usage examples...
 * 
 * @see CosmicButtonGroup - For grouping multiple buttons
 * @see CosmicIconButton - For icon-only buttons
 */
```

Include:
- Detailed description of the component's purpose and features
- Usage examples showing different configurations
- References to related components
- Any significant implementation details or constraints

## Best Practices

1. **Be Comprehensive**: Document all props, even if they seem obvious
2. **Include Examples**: Provide usage examples covering common use cases
3. **Mention Defaults**: Always specify default values for optional props
4. **Cross-Reference**: Link to related components and utilities
5. **Update Regularly**: Keep the documentation up-to-date with the code

## Additional Notes

- Use proper TypeScript types rather than generic `any` types
- Document accessibility features and considerations
- Include any performance optimization details
- Note any browser compatibility issues
