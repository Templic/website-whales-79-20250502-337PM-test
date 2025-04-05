/**
 * CosmicShapesFixed.tsx
 * 
 * Component Type: cosmic
 * Migrated from: v0 components
 * Migration Date: 2025-04-05
 */

import React from 'react';
import { cn } from '@/lib/utils';

type ShapeType = 'circle' | 'polygon' | 'ellipse' | 'starburst';

// Shape position defines where the shape is positioned
interface ShapePosition {
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
}

// Common shape properties
interface BaseShapeProps {
  type: ShapeType;
  size: number;
  color: string;
  glowColor?: string;
  fillOpacity?: number;
  animate?: boolean;
  animationDuration?: number;
  position?: ShapePosition;
}

// Properties specific to polygon shapes
interface PolygonShapeProps extends BaseShapeProps {
  type: 'polygon';
  sides: number;
  rotation?: number;
}

// Properties specific to starburst shapes
interface StarburstShapeProps extends BaseShapeProps {
  type: 'starburst';
  points: number;
  innerRadius?: number;
}

// Properties specific to ellipse shapes
interface EllipseShapeProps extends BaseShapeProps {
  type: 'ellipse';
  verticalRadius?: number;
}

// Properties specific to circle shapes (just using base)
interface CircleShapeProps extends BaseShapeProps {
  type: 'circle';
}

// Union type for all possible shape properties
type ShapeProps = PolygonShapeProps | StarburstShapeProps | EllipseShapeProps | CircleShapeProps;

interface CosmicShapeProps {
  shape: ShapeProps;
  className?: string;
  style?: React.CSSProperties;
}

// Single shape component
const CosmicShape: React.FC<CosmicShapeProps> = ({ shape, className, style }) => {
  // Generate SVG path for a polygon
  const generatePolygonPath = (sides: number, size: number, rotation = 0) => {
    const radius = size / 2;
    const angleStep = (Math.PI * 2) / sides;
    const points: [number, number][] = [];

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep + (rotation * Math.PI) / 180;
      const x = radius + radius * Math.cos(angle);
      const y = radius + radius * Math.sin(angle);
      points.push([x, y]);
    }

    return points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`).join(' ') + ' Z';
  };

  // Generate SVG path for a starburst (star)
  const generateStarburstPath = (points: number, outerRadius: number, innerRadius = outerRadius * 0.4) => {
    const angleStep = (Math.PI * 2) / (points * 2);
    const center = outerRadius;
    const svgPoints: [number, number][] = [];

    for (let i = 0; i < points * 2; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      svgPoints.push([x, y]);
    }

    return svgPoints.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`).join(' ') + ' Z';
  };

  // Render the shape based on its type
  const renderShape = () => {
    const { size, color, glowColor, fillOpacity = 0.1, animate = false, animationDuration = 20 } = shape;
    const svgSize = size;
    const viewBoxSize = size;

    const animationClasses = animate
      ? shape.type === 'starburst'
        ? 'cosmic-sparkle'
        : 'cosmic-pulse'
      : '';

    const animationStyle = animate
      ? {
          animationDuration: `${animationDuration}s`,
        }
      : {};

    const shapeFill = {
      fill: color,
      fillOpacity,
      filter: glowColor ? `drop-shadow(0 0 ${size / 20}px ${glowColor})` : undefined,
    };

    const positionStyle = shape.position
      ? {
          position: 'absolute' as const,
          ...shape.position,
        }
      : {};

    switch (shape.type) {
      case 'circle':
        return (
          <div
            className={cn('cosmic-shape', animationClasses, className)}
            style={{
              width: svgSize,
              height: svgSize,
              ...positionStyle,
              ...style,
              ...animationStyle,
            }}
          >
            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
              <circle
                cx={viewBoxSize / 2}
                cy={viewBoxSize / 2}
                r={viewBoxSize / 2 - 2}
                stroke={color}
                strokeWidth="1"
                {...shapeFill}
              />
            </svg>
          </div>
        );

      case 'ellipse':
        const verticalRadius = shape.verticalRadius || size * 0.6;
        return (
          <div
            className={cn('cosmic-shape', animationClasses, className)}
            style={{
              width: svgSize,
              height: svgSize,
              ...positionStyle,
              ...style,
              ...animationStyle,
            }}
          >
            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
              <ellipse
                cx={viewBoxSize / 2}
                cy={viewBoxSize / 2}
                rx={viewBoxSize / 2 - 2}
                ry={verticalRadius / 2}
                stroke={color}
                strokeWidth="1"
                {...shapeFill}
              />
            </svg>
          </div>
        );

      case 'polygon':
        const path = generatePolygonPath(shape.sides, viewBoxSize, shape.rotation);
        return (
          <div
            className={cn('cosmic-shape', animationClasses, className)}
            style={{
              width: svgSize,
              height: svgSize,
              ...positionStyle,
              ...style,
              ...animationStyle,
            }}
          >
            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
              <path d={path} stroke={color} strokeWidth="1" strokeLinejoin="round" {...shapeFill} />
            </svg>
          </div>
        );

      case 'starburst':
        const starPath = generateStarburstPath(shape.points, viewBoxSize / 2, shape.innerRadius);
        return (
          <div
            className={cn('cosmic-shape', animationClasses, className)}
            style={{
              width: svgSize,
              height: svgSize,
              ...positionStyle,
              ...style,
              ...animationStyle,
            }}
          >
            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
              <path d={starPath} stroke={color} strokeWidth="1" strokeLinejoin="round" {...shapeFill} />
            </svg>
          </div>
        );

      default:
        return null;
    }
  };

  return renderShape();
};

// Component for a group of shapes
interface CosmicShapeGroupProps {
  shapes: ShapeProps[];
  className?: string;
  style?: React.CSSProperties;
}

export const CosmicShapeGroup: React.FC<CosmicShapeGroupProps> = ({ shapes, className, style }) => {
  return (
    <div className={cn('relative', className)} style={style}>
      {shapes.map((shape, index) => (
        <CosmicShape key={`cosmic-shape-${index}`} shape={shape} />
      ))}
    </div>
  );
};

export default CosmicShape;