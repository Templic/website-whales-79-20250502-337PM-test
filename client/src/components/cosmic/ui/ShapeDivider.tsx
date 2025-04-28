/**
 * ShapeDivider.tsx
 * 
 * A reusable divider component specifically designed for geometric shape containers
 * Provides consistent styling and spacing for dividers between titles and content
 */

import React from 'react';
import { cn } from '../../../lib/utils';

interface ShapeDividerProps {
  shapeType?: 'triangle' | 'inverted-triangle' | 'starburst' | 'hexagon' | 'circle' | 'octagon';
  width?: string; // Percentage width, e.g. "60%"
  opacity?: number; // 0-100
  margin?: string; // CSS margin, e.g. "0.5rem 0"
  color?: string; // CSS color
  className?: string;
}

/**
 * ShapeDivider component
 * 
 * Used to create a subtle dividing line between title and content that respects
 * the unique geometry of each shape container
 */
export function ShapeDivider({
  shapeType = 'triangle',
  width,
  opacity = 20,
  margin = "0.5rem 0",
  color = "white",
  className
}: ShapeDividerProps) {
  // Shape-specific default widths if not explicitly provided
  const getDefaultWidth = () => {
    switch (shapeType) {
      case 'triangle':
        return '40%';
      case 'inverted-triangle':
        return '60%';
      case 'starburst':
        return '25%';
      case 'hexagon':
        return '50%';
      case 'circle':
        return '40%';
      case 'octagon':
        return '60%';
      default:
        return '50%';
    }
  };

  // Use provided width or default based on shape
  const dividerWidth = width || getDefaultWidth();
  
  return (
    <div 
      className={cn(
        'shape-divider', 
        `shape-divider-${shapeType}`,
        className
      )}
      style={{
        width: dividerWidth,
        height: '1px',
        backgroundColor: color,
        opacity: opacity / 100,
        margin: margin,
      }}
      data-divider-type={shapeType}
      aria-hidden="true"
    />
  );
}

export default ShapeDivider;