/**
 * GeometricShapeOutline.tsx
 * 
 * This component generates SVG outlines for geometric shapes to provide
 * better visual indicators of the shape's edges and boundaries.
 * These outlines help define the positive-negative space between
 * the shape and its content, improving text flow and layout.
 */

import React from 'react';

interface ShapeOutlineProps {
  shape: 'hexagon' | 'triangle' | 'inverted-triangle' | 'circle' | 'starburst' | 'octagon';
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  innerOutline?: boolean;
  className?: string;
}

// Define types for path data
type CircleElement = { cx: number; cy: number; r: number };
type LineElement = { x1: number; y1: number; x2: number; y2: number };

type PathData = {
  outer: string;
  inner: string;
};

type CirclePathData = {
  circles: CircleElement[];
  lines: LineElement[];
};

type ShapePathData = PathData | CirclePathData;

/**
 * Component to render SVG shape outlines to improve contour recognition
 */
export function GeometricShapeOutline({
  shape,
  strokeColor = 'rgba(255, 255, 255, 0.3)',
  strokeWidth = 0.8,
  opacity = 0.2,
  innerOutline = true,
  className = ''
}: ShapeOutlineProps) {
  // Get specific path data based on shape
  const getPathData = (): ShapePathData => {
    switch (shape) {
      case 'hexagon':
        return {
          outer: 'M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z',
          inner: 'M50 20 L80 35 L80 65 L50 80 L20 65 L20 35 Z'
        };
        
      case 'triangle':
        return {
          outer: 'M50 10 L90 90 L10 90 Z',
          inner: 'M50 30 L75 75 L25 75 Z'
        };
        
      case 'inverted-triangle':
        return {
          outer: 'M10 10 L90 10 L50 90 Z',
          inner: 'M30 30 L70 30 L50 70 Z'
        };
        
      case 'circle':
        return {
          // Circles use <circle> elements instead of paths
          circles: [
            { cx: 50, cy: 50, r: 45 },
            { cx: 50, cy: 50, r: 35 }, 
            { cx: 50, cy: 50, r: 25 }
          ],
          // Add cross guides for better visual indication
          lines: [
            { x1: 5, y1: 50, x2: 95, y2: 50 },
            { x1: 50, y1: 5, x2: 50, y2: 95 }
          ]
        } as CirclePathData;
        
      case 'starburst':
        return {
          outer: 'M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z',
          inner: 'M50 20 L57 42 L82 42 L62 57 L69 77 L50 63 L31 77 L38 57 L18 42 L43 42 Z'
        };
        
      case 'octagon':
        return {
          outer: 'M30 0 L70 0 L100 30 L100 70 L70 100 L30 100 L0 70 L0 30 Z',
          inner: 'M35 15 L65 15 L85 35 L85 65 L65 85 L35 85 L15 65 L15 35 Z'
        };
        
      default:
        return {
          outer: '',
          inner: ''
        };
    }
  };

  const paths = getPathData();
  
  // Render circles for circle shape
  if (shape === 'circle' && 'circles' in paths) {
    const circleData = paths.circles || [];
    const lineData = paths.lines || [];
    
    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        className={`shape-outline-svg ${className}`}
        style={{ opacity, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {circleData.map((circle, index) => (
          <circle
            key={`circle-${index}`}
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
        ))}
        {lineData.map((line, index) => (
          <line
            key={`line-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        ))}
      </svg>
    );
  }

  // Render paths for other shapes
  // Check if paths is a PathData object and not a CirclePathData
  const pathData = paths as PathData;
  
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`shape-outline-svg ${className}`}
      style={{ opacity, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {/* Outer outline */}
      <path
        d={pathData.outer}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Inner outline for better contour recognition */}
      {innerOutline && (
        <path
          d={pathData.inner}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
      )}
    </svg>
  );
}

export default GeometricShapeOutline;