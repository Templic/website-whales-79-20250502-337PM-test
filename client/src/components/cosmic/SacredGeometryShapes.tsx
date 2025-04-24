/**
 * Sacred Geometry Shapes Library
 * 
 * A collection of optimized SVG sacred geometry shapes with
 * performance-optimized rendering for different device capabilities.
 */

import React, { useMemo } from 'react';

export interface GeometryShapeProps {
  className?: string;
  style?: React.CSSProperties;
  detail?: number; // 0-1 scale for rendering detail
  colorScheme?: string;
  width?: string | number;
  height?: string | number;
  animationDuration?: number;
  strokeWidth?: number;
  fillOpacity?: number;
  showLabels?: boolean;
}

/**
 * Flower of Life - A sacred geometry pattern consisting of
 * overlapping circles arranged in a flower-like pattern
 */
export const FlowerOfLife: React.FC<GeometryShapeProps> = ({
  className = '',
  style = {},
  detail = 1,
  colorScheme = '#8b5cf6',
  width = '100%',
  height = '100%',
  strokeWidth = 1,
  fillOpacity = 0.1,
}) => {
  // Calculate number of circles based on detail level
  const circleCount = useMemo(() => {
    const baseCount = 19; // Full detail
    return Math.max(7, Math.round(baseCount * detail));
  }, [detail]);
  
  // Generate circles for the Flower of Life pattern
  const circles = useMemo(() => {
    const elements = [];
    const radius = 50;
    const centerX = 250;
    const centerY = 250;
    
    // Add center circle
    elements.push(
      <circle
        key="center"
        cx={centerX}
        cy={centerY}
        r={radius}
        fill={colorScheme}
        fillOpacity={fillOpacity}
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
    );
    
    // Create first ring of 6 circles
    const firstRingRadius = radius * 2;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      elements.push(
        <circle
          key={`ring1-${i}`}
          cx={x}
          cy={y}
          r={radius}
          fill={colorScheme}
          fillOpacity={fillOpacity}
          stroke={colorScheme}
          strokeWidth={strokeWidth}
        />
      );
    }
    
    // If detail is high enough, add second ring
    if (circleCount >= 13) {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const x = centerX + Math.cos(angle) * firstRingRadius;
        const y = centerY + Math.sin(angle) * firstRingRadius;
        
        elements.push(
          <circle
            key={`ring2-${i}`}
            cx={x}
            cy={y}
            r={radius}
            fill={colorScheme}
            fillOpacity={fillOpacity}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
        );
      }
    }
    
    // If detail is at maximum, add third ring
    if (circleCount >= 19) {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = centerX + Math.cos(angle) * (firstRingRadius + radius);
        const y = centerY + Math.sin(angle) * (firstRingRadius + radius);
        
        elements.push(
          <circle
            key={`ring3-${i}`}
            cx={x}
            cy={y}
            r={radius}
            fill={colorScheme}
            fillOpacity={fillOpacity}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
        );
      }
    }
    
    return elements;
  }, [circleCount, colorScheme, fillOpacity, strokeWidth]);
  
  return (
    <svg
      viewBox="0 0 500 500"
      className={`flower-of-life ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    >
      {circles}
    </svg>
  );
};

/**
 * Metatron's Cube - A sacred geometry pattern derived from the Flower of Life
 * representing the underlying structure of reality
 */
export const Metatron: React.FC<GeometryShapeProps> = ({
  className = '',
  style = {},
  detail = 1,
  colorScheme = '#8b5cf6',
  width = '100%',
  height = '100%',
  strokeWidth = 1.5,
  fillOpacity = 0.1,
}) => {
  // Determine which elements to include based on detail level
  const shouldRenderExtras = detail >= 0.75;
  const shouldRenderInnerDetails = detail >= 0.5;
  const shouldRenderOuterRing = detail >= 0.35;
  
  return (
    <svg
      viewBox="0 0 500 500"
      className={`metatron ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    >
      {/* Center circle */}
      <circle
        cx="250"
        cy="250"
        r="30"
        fill={colorScheme}
        fillOpacity={fillOpacity * 1.5}
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
      
      {/* Inner hexagon */}
      <polygon
        points="250,160 330,205 330,295 250,340 170,295 170,205"
        fill={colorScheme}
        fillOpacity={fillOpacity}
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
      
      {/* Outer hexagon */}
      {shouldRenderOuterRing && (
        <polygon
          points="250,100 380,175 380,325 250,400 120,325 120,175"
          fill={colorScheme}
          fillOpacity={fillOpacity * 0.7}
          stroke={colorScheme}
          strokeWidth={strokeWidth}
        />
      )}
      
      {/* Inner star */}
      {shouldRenderInnerDetails && (
        <>
          <line x1="250" y1="160" x2="250" y2="340" stroke={colorScheme} strokeWidth={strokeWidth} />
          <line x1="170" y1="205" x2="330" y2="295" stroke={colorScheme} strokeWidth={strokeWidth} />
          <line x1="170" y1="295" x2="330" y2="205" stroke={colorScheme} strokeWidth={strokeWidth} />
        </>
      )}
      
      {/* Additional connections for high detail */}
      {shouldRenderExtras && (
        <>
          <line x1="250" y1="100" x2="250" y2="400" stroke={colorScheme} strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
          <line x1="120" y1="175" x2="380" y2="325" stroke={colorScheme} strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
          <line x1="120" y1="325" x2="380" y2="175" stroke={colorScheme} strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
          <line x1="250" y1="100" x2="120" y2="325" stroke={colorScheme} strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
          <line x1="250" y1="100" x2="380" y2="325" stroke={colorScheme} strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
          <line x1="120" y1="175" x2="250" y2="400" stroke={colorScheme} strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
          <line x1="380" y1="175" x2="250" y2="400" stroke={colorScheme} strokeWidth={strokeWidth * 0.7} strokeOpacity="0.7" />
        </>
      )}
    </svg>
  );
};

/**
 * Sri Yantra - A sacred geometry pattern representing the cosmos
 * and the human body in a state of meditation
 */
export const SriYantra: React.FC<GeometryShapeProps> = ({
  className = '',
  style = {},
  detail = 1,
  colorScheme = '#8b5cf6',
  width = '100%',
  height = '100%',
  strokeWidth = 1.5,
  fillOpacity = 0.1,
}) => {
  // Calculate triangle count based on detail level
  const triangleCount = useMemo(() => {
    const baseCount = 9; // Full detail
    return Math.max(3, Math.round(baseCount * detail));
  }, [detail]);
  
  return (
    <svg
      viewBox="0 0 500 500"
      className={`sri-yantra ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    >
      {/* Outer circle */}
      <circle
        cx="250"
        cy="250"
        r="200"
        fill="none"
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
      
      {/* Lotus petals (simplified) */}
      <circle
        cx="250"
        cy="250"
        r="180"
        fill="none"
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
      
      {/* Primary triangles */}
      <polygon
        points="250,70 430,340 70,340"
        fill={colorScheme}
        fillOpacity={fillOpacity}
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
      
      <polygon
        points="250,430 430,160 70,160"
        fill={colorScheme}
        fillOpacity={fillOpacity}
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
      
      {/* Additional triangles based on detail level */}
      {triangleCount >= 5 && (
        <>
          <polygon
            points="250,130 350,340 150,340"
            fill={colorScheme}
            fillOpacity={fillOpacity * 1.2}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
          
          <polygon
            points="250,370 350,160 150,160"
            fill={colorScheme}
            fillOpacity={fillOpacity * 1.2}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
        </>
      )}
      
      {triangleCount >= 7 && (
        <>
          <polygon
            points="250,190 320,310 180,310"
            fill={colorScheme}
            fillOpacity={fillOpacity * 1.4}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
          
          <polygon
            points="250,310 320,190 180,190"
            fill={colorScheme}
            fillOpacity={fillOpacity * 1.4}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
        </>
      )}
      
      {triangleCount >= 9 && (
        <>
          <polygon
            points="250,220 290,280 210,280"
            fill={colorScheme}
            fillOpacity={fillOpacity * 1.6}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
          
          <polygon
            points="250,280 290,220 210,220"
            fill={colorScheme}
            fillOpacity={fillOpacity * 1.6}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
          
          {/* Center dot (bindu) */}
          <circle
            cx="250"
            cy="250"
            r="10"
            fill={colorScheme}
            stroke="none"
          />
        </>
      )}
    </svg>
  );
};

/**
 * Torus - A sacred geometry 3D shape representing
 * the energy field around all living beings
 */
export const Torus: React.FC<GeometryShapeProps> = ({
  className = '',
  style = {},
  detail = 1,
  colorScheme = '#8b5cf6',
  width = '100%',
  height = '100%',
  strokeWidth = 1.5,
  fillOpacity = 0.1,
}) => {
  // Calculate ring count based on detail level
  const ringCount = useMemo(() => {
    const baseCount = 8; // Full detail
    return Math.max(3, Math.round(baseCount * detail));
  }, [detail]);
  
  // Generate concentric ellipses to represent the torus
  const rings = useMemo(() => {
    const elements = [];
    const maxRingWidth = 160;
    const maxRingHeight = 50;
    
    for (let i = 0; i < ringCount; i++) {
      const ratio = i / (ringCount - 1);
      const ringWidth = 40 + ratio * maxRingWidth;
      const ringHeight = 10 + ratio * maxRingHeight;
      
      elements.push(
        <ellipse
          key={`ring-${i}`}
          cx="250"
          cy="250"
          rx={ringWidth}
          ry={ringHeight}
          fill="none"
          stroke={colorScheme}
          strokeWidth={strokeWidth}
          opacity={0.7 + (0.3 * ratio)}
        />
      );
    }
    
    return elements;
  }, [ringCount, colorScheme, strokeWidth]);
  
  // Generate crossing vertical ellipses
  const verticalRings = useMemo(() => {
    if (detail < 0.5) return null; // Only show for medium detail and above
    
    const elements = [];
    const verticalRingCount = Math.max(2, Math.floor(ringCount / 2));
    
    for (let i = 0; i < verticalRingCount; i++) {
      const angle = (Math.PI * i) / ringCount;
      const transform = `rotate(${angle * (180 / Math.PI)}, 250, 250)`;
      
      elements.push(
        <ellipse
          key={`vring-${i}`}
          cx="250"
          cy="250"
          rx="50"
          ry="160"
          fill="none"
          stroke={colorScheme}
          strokeWidth={strokeWidth}
          opacity="0.4"
          transform={transform}
        />
      );
    }
    
    return elements;
  }, [detail, ringCount, colorScheme, strokeWidth]);
  
  return (
    <svg
      viewBox="0 0 500 500"
      className={`torus ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    >
      {/* Main torus rings */}
      {rings}
      
      {/* Vertical crossing rings */}
      {verticalRings}
      
      {/* Center circle */}
      <circle
        cx="250"
        cy="250"
        r="20"
        fill={colorScheme}
        fillOpacity={fillOpacity * 2}
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

/**
 * Sacred Spiral - A representation of the golden ratio spiral
 * found throughout nature and the cosmos
 */
export const SacredSpiral: React.FC<GeometryShapeProps> = ({
  className = '',
  style = {},
  detail = 1,
  colorScheme = '#8b5cf6',
  width = '100%',
  height = '100%',
  strokeWidth = 2,
  fillOpacity = 0.1,
}) => {
  // Calculate segments based on detail level
  const segments = useMemo(() => {
    const baseSegments = 24; // Full detail
    return Math.max(8, Math.round(baseSegments * detail));
  }, [detail]);
  
  // Generate the spiral path
  const spiralPath = useMemo(() => {
    const points = [];
    const centerX = 250;
    const centerY = 250;
    const maxRadius = 200;
    
    // Generate points along a logarithmic spiral
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * 6 * Math.PI; // 3 full rotations
      const radius = maxRadius * Math.pow(0.8, t); // Logarithmic spiral
      const x = centerX + radius * Math.cos(t);
      const y = centerY + radius * Math.sin(t);
      
      points.push(`${x},${y}`);
    }
    
    return points.join(' ');
  }, [segments]);
  
  // Create golden rectangles if detail is high enough
  const goldenRectangles = useMemo(() => {
    if (detail < 0.7) return null;
    
    const elements = [];
    const centerX = 250;
    const centerY = 250;
    const initialSize = 200;
    const phi = 1.618; // Golden ratio
    
    let size = initialSize;
    let x = centerX - size/2;
    let y = centerY - size/2;
    
    for (let i = 0; i < 5; i++) {
      elements.push(
        <rect
          key={`rect-${i}`}
          x={x}
          y={y}
          width={size}
          height={size}
          fill="none"
          stroke={colorScheme}
          strokeWidth={strokeWidth * 0.5}
          opacity="0.3"
        />
      );
      
      // Calculate next rectangle position and size
      const newSize = size / phi;
      if (i % 4 === 0) {
        x = x + size - newSize;
      } else if (i % 4 === 1) {
        y = y + size - newSize;
      } else if (i % 4 === 2) {
        x = x;
      } else {
        y = y;
      }
      size = newSize;
    }
    
    return elements;
  }, [detail, colorScheme, strokeWidth]);
  
  return (
    <svg
      viewBox="0 0 500 500"
      className={`sacred-spiral ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    >
      {/* Golden rectangles */}
      {goldenRectangles}
      
      {/* Main spiral */}
      <polyline
        points={spiralPath}
        fill="none"
        stroke={colorScheme}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      
      {/* Center dot */}
      <circle
        cx="250"
        cy="250"
        r="5"
        fill={colorScheme}
        stroke="none"
      />
    </svg>
  );
};

/**
 * Platonic Solids - Sacred 3D forms associated with
 * the elements and the building blocks of the universe
 */
export const PlatonicsolidsSvg: React.FC<GeometryShapeProps> = ({
  className = '',
  style = {},
  detail = 1,
  colorScheme = '#8b5cf6',
  width = '100%',
  height = '100%',
  strokeWidth = 1.5,
  fillOpacity = 0.1,
}) => {
  // Determine which platonic solids to render based on detail
  const solidCount = useMemo(() => {
    if (detail < 0.3) return 1; // Just tetrahedron
    if (detail < 0.6) return 3; // Tetrahedron, cube, octahedron
    return 5; // All five platonic solids
  }, [detail]);
  
  return (
    <svg
      viewBox="0 0 500 500"
      className={`platonic-solids ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
    >
      {/* Container circle */}
      <circle
        cx="250"
        cy="250"
        r="200"
        fill="none"
        stroke={colorScheme}
        strokeWidth={strokeWidth * 0.5}
        strokeOpacity="0.5"
      />
      
      {/* Tetrahedron (Fire) - always rendered */}
      <polygon
        points="250,100 350,350 150,350"
        fill={colorScheme}
        fillOpacity={fillOpacity}
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
      <polygon
        points="250,100 350,350 250,200"
        fill={colorScheme}
        fillOpacity={fillOpacity}
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
      <polygon
        points="250,100 150,350 250,200"
        fill={colorScheme}
        fillOpacity={fillOpacity}
        stroke={colorScheme}
        strokeWidth={strokeWidth}
      />
      
      {/* Cube (Earth) */}
      {solidCount >= 2 && (
        <>
          <rect
            x="175"
            y="175"
            width="150"
            height="150"
            fill={colorScheme}
            fillOpacity={fillOpacity}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
          <line x1="175" y1="175" x2="145" y2="145" stroke={colorScheme} strokeWidth={strokeWidth} />
          <line x1="325" y1="175" x2="355" y2="145" stroke={colorScheme} strokeWidth={strokeWidth} />
          <line x1="175" y1="325" x2="145" y2="355" stroke={colorScheme} strokeWidth={strokeWidth} />
          <line x1="325" y1="325" x2="355" y2="355" stroke={colorScheme} strokeWidth={strokeWidth} />
          <polygon
            points="145,145 355,145 355,355 145,355"
            fill="none"
            stroke={colorScheme}
            strokeWidth={strokeWidth}
            strokeOpacity="0.5"
          />
        </>
      )}
      
      {/* Octahedron (Air) */}
      {solidCount >= 3 && (
        <>
          <polygon
            points="250,130 370,250 250,370 130,250"
            fill={colorScheme}
            fillOpacity={fillOpacity}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
          <line x1="250" y1="130" x2="250" y2="370" stroke={colorScheme} strokeWidth={strokeWidth} />
          <line x1="130" y1="250" x2="370" y2="250" stroke={colorScheme} strokeWidth={strokeWidth} />
        </>
      )}
      
      {/* Icosahedron (Water) */}
      {solidCount >= 4 && (
        <>
          <polygon
            points="250,100 310,200 190,200"
            fill={colorScheme}
            fillOpacity={fillOpacity}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
          <polygon
            points="190,200 250,300 310,200"
            fill={colorScheme}
            fillOpacity={fillOpacity}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
          <polygon
            points="250,100 190,200 160,150"
            fill={colorScheme}
            fillOpacity={fillOpacity * 0.8}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
          <polygon
            points="250,100 340,150 310,200"
            fill={colorScheme}
            fillOpacity={fillOpacity * 0.8}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
        </>
      )}
      
      {/* Dodecahedron (Ether/Spirit) */}
      {solidCount >= 5 && (
        <>
          <polygon
            points="200,170 300,170 320,250 250,300 180,250"
            fill={colorScheme}
            fillOpacity={fillOpacity}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
          <polygon
            points="180,250 220,350 280,350 320,250 250,300"
            fill={colorScheme}
            fillOpacity={fillOpacity * 0.7}
            stroke={colorScheme}
            strokeWidth={strokeWidth}
          />
        </>
      )}
      
      {/* Center circle */}
      <circle
        cx="250"
        cy="250"
        r="10"
        fill={colorScheme}
        fillOpacity="0.8"
        stroke="none"
      />
    </svg>
  );
};

// Export all shapes as a collection
export const SacredGeometryShapes = {
  FlowerOfLife,
  Metatron,
  SriYantra,
  Torus,
  SacredSpiral,
  PlatonicsolidsSvg
};