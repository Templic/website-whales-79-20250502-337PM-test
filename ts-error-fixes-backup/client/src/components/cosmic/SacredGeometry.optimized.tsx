import React, { useMemo, useRef, useEffect, useState, CSSProperties, memo } from 'react';
import { measureExecutionTime, useRenderCount, throttle } from '@/lib/performance';
import { useIsMobile } from '@/hooks/use-responsive';

type GeometryType = 
  'flower-of-life' | 
  'seed-of-life' | 
  'tree-of-life' | 
  'metatron-cube' | 
  'sri-yantra' | 
  'pentagon-star' | 
  'hexagon' | 
  'heptagon' | 
  'octagon' | 
  'enneagon' | 
  'decagon' |
  'golden-spiral' |
  'fibonacci-spiral' |
  'vesica-piscis';

interface SacredGeometryProps {
  type: GeometryType;
  color?: string;
  secondaryColor?: string;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
  animate?: boolean;
  animationSpeed?: number;
  className?: string;
  style?: CSSProperties;
  opacity?: number;
  rotation?: number;
  renderingQuality?: 'low' | 'medium' | 'high';
  glowEffect?: boolean;
  glowColor?: string;
  glowIntensity?: number;
}

const SacredGeometry = memo(({
  type = 'flower-of-life',
  color = '#7c3aed',
  secondaryColor,
  size = 300,
  strokeWidth = 1,
  animate = false,
  animationSpeed = 1,
  className = '',
  style = {},
  opacity = 1,
  rotation = 0,
  renderingQuality = 'medium',
  glowEffect = false,
  glowColor,
  glowIntensity = 3,
}: SacredGeometryProps) => {
  // Performance optimization hooks
  const renderCount = useRenderCount('SacredGeometry');
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const isMobile = useIsMobile();
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Define actual size based on mobile or not
  const actualSize = useMemo(() => {
    return isMobile ? Math.min(size, window.innerWidth * 0.8) : size;
  }, [size, isMobile]);
  
  // Determine the effective glow color
  const effectiveGlowColor = useMemo(() => glowColor || color, [glowColor, color]);
  
  // Determine the secondary color if not provided
  const effectiveSecondaryColor = useMemo(() => {
    return secondaryColor || 
    (color === '#7c3aed' ? '#00ebd6' : 
     color === '#00ebd6' ? '#7c3aed' : 
     color === '#e15554' ? '#00ebd6' : 
     '#e15554');
  }, [color, secondaryColor]);
  
  // Set up intersection observer to only animate when visible
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Only create an observer if we need animations
    if (animate) {
      intersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            setIsVisible(entry.isIntersecting);
          });
        },
        { threshold: 0.1 }
      );
      
      intersectionObserverRef.current.observe(svgRef.current);
    } else {
      setIsVisible(true); // Always visible if not animating
    }
    
    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);
  
  // Calculate points based on geometry type
  const renderGeometry = useMemo(() => {
    return measureExecutionTime('calculateGeometryPoints', () => {
      // Define the quality settings based on rendering quality
      const qualitySettings = {
        low: {
          circleSegments: 20,
          spiralSegments: 100,
        },
        medium: {
          circleSegments: 40,
          spiralSegments: 200,
        },
        high: {
          circleSegments: 60,
          spiralSegments: 300,
        }
      };
      
      const quality = qualitySettings[renderingQuality];
      
      switch (type) {
        case 'flower-of-life':
          return renderFlowerOfLife(actualSize, quality.circleSegments);
        case 'seed-of-life':
          return renderSeedOfLife(actualSize);
        case 'metatron-cube':
          return renderMetatronCube(actualSize);
        case 'sri-yantra':
          return renderSriYantra(actualSize);
        case 'pentagon-star':
          return renderPentagonStar(actualSize);
        case 'hexagon':
          return renderPolygon(actualSize, 6);
        case 'heptagon':
          return renderPolygon(actualSize, 7);
        case 'octagon':
          return renderPolygon(actualSize, 8);
        case 'enneagon':
          return renderPolygon(actualSize, 9);
        case 'decagon':
          return renderPolygon(actualSize, 10);
        case 'golden-spiral':
          return renderSpiral(actualSize, 'golden', quality.spiralSegments);
        case 'fibonacci-spiral':
          return renderSpiral(actualSize, 'fibonacci', quality.spiralSegments);
        case 'vesica-piscis':
          return renderVesicaPiscis(actualSize);
        case 'tree-of-life':
        default:
          return renderTreeOfLife(actualSize);
      }
    });
  }, [type, actualSize, renderingQuality]);
  
  // Animation effect
  useEffect(() => {
    if (!animate || !isVisible) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }
    
    const animateGeometry = () => {
      setAnimationPhase(prevPhase => (prevPhase + (0.002 * animationSpeed)) % (Math.PI * 2));
      animationRef.current = requestAnimationFrame(animateGeometry);
    };
    
    animationRef.current = requestAnimationFrame(animateGeometry);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, animationSpeed, isVisible]);
  
  // Filter definition for glow effect
  const glowFilter = useMemo(() => {
    if (!glowEffect) return null;
    
    return (
      <defs>
        <filter id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={glowIntensity} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
    );
  }, [glowEffect, type, glowIntensity]);
  
  // Animation transformation
  const animationStyle = useMemo(() => {
    if (!animate) return {};
    
    return {
      transform: `rotate(${rotation + (animationPhase * (180 / Math.PI))}deg) scale(${1 + Math.sin(animationPhase) * 0.05})`,
      transition: 'transform 0.1s ease-out'
    };
  }, [animate, rotation, animationPhase]);
  
  return (
    <svg
      ref={svgRef}
      width={actualSize}
      height={actualSize}
      viewBox={`0 0 ${actualSize} ${actualSize}`}
      className={`sacred-geometry ${className}`}
      style={{
        opacity,
        ...style,
        ...animationStyle,
      }}
    >
      {glowFilter}
      <g
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        filter={glowEffect ? `url(#glow-${type})` : undefined}
      >
        {renderGeometry}
      </g>
    </svg>
  );
});

SacredGeometry.displayName = 'SacredGeometry';

// Helper functions to create sacred geometry patterns
function renderFlowerOfLife(size: number, segments: number = 40) {
  const radius = size / 4;
  const center = size / 2;
  const circles = [];
  
  // Center circle
  circles.push(
    <circle
      key="center"
      cx={center}
      cy={center}
      r={radius}
    />
  );
  
  // First ring - 6 circles
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    
    circles.push(
      <circle
        key={`ring1-${i}`}
        cx={x}
        cy={y}
        r={radius}
      />
    );
  }
  
  // Second ring - 12 circles
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const x = center + 2 * radius * Math.cos(angle);
    const y = center + 2 * radius * Math.sin(angle);
    
    circles.push(
      <circle
        key={`ring2-${i}`}
        cx={x}
        cy={y}
        r={radius}
      />
    );
  }
  
  return circles;
}

function renderSeedOfLife(size: number) {
  const radius = size / 4;
  const center = size / 2;
  const circles = [];
  
  // Center circle
  circles.push(
    <circle
      key="center"
      cx={center}
      cy={center}
      r={radius}
    />
  );
  
  // Six surrounding circles
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    
    circles.push(
      <circle
        key={`seed-${i}`}
        cx={x}
        cy={y}
        r={radius}
      />
    );
  }
  
  return circles;
}

function renderTreeOfLife(size: number) {
  const unit = size / 12;
  const circles = [];
  const paths = [];
  const radius = unit * 1.2;
  
  // Define the positions of the 10 sephirot
  const positions = [
    { name: 'Keter', x: 6, y: 1 },
    { name: 'Chokmah', x: 3, y: 3 },
    { name: 'Binah', x: 9, y: 3 },
    { name: 'Chesed', x: 3, y: 5 },
    { name: 'Geburah', x: 9, y: 5 },
    { name: 'Tiferet', x: 6, y: 6 },
    { name: 'Netzach', x: 3, y: 8 },
    { name: 'Hod', x: 9, y: 8 },
    { name: 'Yesod', x: 6, y: 9 },
    { name: 'Malkuth', x: 6, y: 11 }
  ];
  
  // Add circles for each sephirot
  positions.forEach((pos, i) => {
    circles.push(
      <circle
        key={`sephirah-${i}`}
        cx={pos.x * unit}
        cy={pos.y * unit}
        r={radius}
      />
    );
  });
  
  // Add connecting paths
  // This is a simplified version with just the main paths
  const pathConnections = [
    [0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4],
    [3, 6], [4, 7], [1, 5], [2, 5], [3, 5], [4, 5],
    [5, 6], [5, 7], [5, 8], [6, 7], [6, 8], [7, 8], [8, 9]
  ];
  
  pathConnections.forEach((conn, i) => {
    const start = positions[conn[0]];
    const end = positions[conn[1]];
    
    paths.push(
      <line
        key={`path-${i}`}
        x1={start.x * unit}
        y1={start.y * unit}
        x2={end.x * unit}
        y2={end.y * unit}
      />
    );
  });
  
  return [...circles, ...paths];
}

function renderMetatronCube(size: number) {
  const center = size / 2;
  const radius = size / 3;
  const elements = [];
  
  // Create the 13 circles
  const circlePositions = [
    { x: center, y: center }, // Center circle
  ];
  
  // Add the 12 circles around
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    circlePositions.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }
  
  // Draw circles
  circlePositions.forEach((pos, i) => {
    elements.push(
      <circle
        key={`metatron-circle-${i}`}
        cx={pos.x}
        cy={pos.y}
        r={size / 20}
      />
    );
  });
  
  // Connect lines
  for (let i = 1; i < circlePositions.length; i++) {
    for (let j = i + 1; j < circlePositions.length; j++) {
      elements.push(
        <line
          key={`metatron-line-${i}-${j}`}
          x1={circlePositions[i].x}
          y1={circlePositions[i].y}
          x2={circlePositions[j].x}
          y2={circlePositions[j].y}
        />
      );
    }
  }
  
  return elements;
}

function renderSriYantra(size: number) {
  const center = size / 2;
  const radius = size / 2.5;
  const elements = [];
  
  // Draw outer circle
  elements.push(
    <circle
      key="sri-outer-circle"
      cx={center}
      cy={center}
      r={radius}
    />
  );
  
  // Draw triangles
  const triangles = [
    // Upward triangle
    `${center},${center - radius * 0.9} ${center - radius * 0.8},${center + radius * 0.5} ${center + radius * 0.8},${center + radius * 0.5}`,
    // Downward triangle
    `${center},${center + radius * 0.9} ${center - radius * 0.8},${center - radius * 0.5} ${center + radius * 0.8},${center - radius * 0.5}`,
    // Four smaller triangles
    `${center},${center - radius * 0.6} ${center - radius * 0.5},${center + radius * 0.3} ${center + radius * 0.5},${center + radius * 0.3}`,
    `${center},${center + radius * 0.6} ${center - radius * 0.5},${center - radius * 0.3} ${center + radius * 0.5},${center - radius * 0.3}`,
    `${center - radius * 0.3},${center} ${center},${center + radius * 0.3} ${center},${center - radius * 0.3}`,
    `${center + radius * 0.3},${center} ${center},${center + radius * 0.3} ${center},${center - radius * 0.3}`,
  ];
  
  triangles.forEach((points, i) => {
    elements.push(
      <polygon
        key={`sri-triangle-${i}`}
        points={points}
      />
    );
  });
  
  // Add center dot
  elements.push(
    <circle
      key="sri-bindu"
      cx={center}
      cy={center}
      r={radius * 0.05}
      fill="#fff"
    />
  );
  
  return elements;
}

function renderPentagonStar(size: number) {
  const center = size / 2;
  const outerRadius = size / 2.2;
  const innerRadius = outerRadius * 0.382; // Golden ratio
  const elements = [];
  
  // Calculate points for the star
  let points = '';
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    
    const outerX = center + outerRadius * Math.cos(outerAngle);
    const outerY = center + outerRadius * Math.sin(outerAngle);
    const innerX = center + innerRadius * Math.cos(innerAngle);
    const innerY = center + innerRadius * Math.sin(innerAngle);
    
    points += `${outerX},${outerY} ${innerX},${innerY} `;
  }
  
  elements.push(
    <polygon
      key="pentagon-star"
      points={points}
    />
  );
  
  return elements;
}

function renderPolygon(size: number, sides: number) {
  const center = size / 2;
  const radius = size / 2.2;
  let points = '';
  
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2; // Start at top
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points += `${x},${y} `;
  }
  
  return (
    <polygon
      key={`polygon-${sides}`}
      points={points}
    />
  );
}

function renderSpiral(size: number, type: 'golden' | 'fibonacci', segments: number) {
  const center = size / 2;
  const maxRadius = size / 2.2;
  let points = '';
  
  const a = type === 'golden' ? 0.1 : 0.2;
  const b = type === 'golden' ? 0.1 : 0.2;
  
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 8; // 4 full turns
    
    let radius;
    if (type === 'golden') {
      // Golden spiral based on logarithmic spiral
      radius = maxRadius * Math.exp(b * t) / Math.exp(b * Math.PI * 8);
    } else {
      // Fibonacci based on arithmetic growth
      radius = maxRadius * (t / (Math.PI * 8));
    }
    
    const x = center + radius * Math.cos(t);
    const y = center + radius * Math.sin(t);
    
    if (i === 0) {
      points += `M ${x},${y} `;
    } else {
      points += `L ${x},${y} `;
    }
  }
  
  return (
    <path
      key={`spiral-${type}`}
      d={points}
    />
  );
}

function renderVesicaPiscis(size: number) {
  const center = size / 2;
  const radius = size / 3;
  const offset = radius / 2;
  const elements = [];
  
  // Left circle
  elements.push(
    <circle
      key="vesica-left"
      cx={center - offset}
      cy={center}
      r={radius}
    />
  );
  
  // Right circle
  elements.push(
    <circle
      key="vesica-right"
      cx={center + offset}
      cy={center}
      r={radius}
    />
  );
  
  return elements;
}

export default SacredGeometry;