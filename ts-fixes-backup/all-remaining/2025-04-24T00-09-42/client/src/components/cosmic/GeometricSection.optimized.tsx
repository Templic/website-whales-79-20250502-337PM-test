/**
 * Optimized Geometric Section Component - Simplified Version
 * 
 * This is a simplified version of the component that retains core functionality
 * while fixing rendering issues.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { registerComponent, checkComponentLeaks, clearAllRegistrations, useMemoryLeakDetection } from "@/lib/memory-leak-detector";

// SVG Shapes
import { 
  FlowerOfLife, 
  Metatron, 
  SriYantra, 
  Torus, 
  SacredSpiral, 
  PlatonicsolidsSvg
} from './SacredGeometryShapes';

// Animation effects
import './geometricEffects.css';

export interface GeometricSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryShape?: 'flower-of-life' | 'metatron' | 'sri-yantra' | 'torus' | 'sacred-spiral' | 'platonic-solids';
  backgroundColor?: string;
  textColor?: string;
  glowColor?: string;
  glowIntensity?: number;
  rotationSpeed?: number;
  pulseSpeed?: number;
  interactivity?: 'none' | 'hover' | 'click' | 'scroll';
  className?: string;
  showLabels?: boolean;
  animate?: boolean;
  size?: number | string;
  minimalRendering?: boolean;
  complexity?: 'low' | 'medium' | 'high' | 'ultra';
  onShapeClick?: (shape: string) => void;
}

/**
 * A section displaying sacred geometry with optimized rendering
 */
const GeometricSection: React.FC<GeometricSectionProps> = ({
  title = 'Sacred Geometry',
  subtitle = 'Ancient Wisdom',
  description = 'Explore the fundamental patterns of creation and consciousness.',
  primaryShape = 'flower-of-life',
  backgroundColor = '#111827',
  textColor = '#f3f4f6',
  glowColor = '#8b5cf6',
  glowIntensity = 5,
  rotationSpeed = 1,
  pulseSpeed = 1,
  interactivity = 'hover',
  className = '',
  showLabels = false,
  animate = true,
  size = '80%',
  minimalRendering = false,
  complexity = 'medium',
  onShapeClick,
}) => {
  // Track this component for memory leak detection
  useMemoryLeakDetection('GeometricSection');
  
  // Get device capabilities for adaptive rendering
  const capabilities = useDeviceCapabilities();
  const renderSettings = useResponsiveRendering();
  const cpuBudget = useCPUBudget();
  
  // Container refs for measurements and interactions
  const containerRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  
  // Only calculate visibility if rendering is expensive (e.g., for complex shapes)
  const { isVisible, ref: visibilityRef } = useSkipRenderIfInvisible(
    '150px', // Start loading when within 150px of viewport
    0.1      // 10% visibility threshold
  );
  
  // State for animations and interactions
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [clickEffect, setClickEffect] = useState(false);
  
  // Optimize shape complexity based on device capabilities
  const optimizedComplexity = useMemo(() => {
    // If minimal rendering is forced, use low complexity
    if (minimalRendering) return 'low';
    
    // Map user-selected complexity to device capability level
    const complexityMap = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      ultra: 'ultra'
    };
    
    const desiredComplexity = complexityMap[complexity];
    const deviceLevel = capabilities.overallLevel;
    
    // If device capability is lower than desired complexity, reduce it
    const levelValues = {
      low: 0,
      medium: 1,
      high: 2,
      ultra: 3
    };
    
    if (levelValues[deviceLevel] < levelValues[desiredComplexity]) {
      return deviceLevel;
    }
    
    return desiredComplexity;
  }, [complexity, capabilities.overallLevel, minimalRendering]);
  
  // Determine shape detail level based on optimized complexity
  const getShapeDetail = () => {
    switch (optimizedComplexity) {
      case 'low':
        return 0.25; // 25% of full detail
      case 'medium':
        return 0.5;  // 50% of full detail  
      case 'high':
        return 0.75; // 75% of full detail
      case 'ultra':
        return 1;    // 100% of full detail
      default:
        return 0.5;  // Default to medium
    }
  };
  
  // Animation settings based on device capabilities and user preferences
  const getAnimationSettings = () => {
    const baseSpeed = renderSettings.useAnimations ? 1 : 0;
    const effectsMultiplier = renderSettings.useComplexEffects ? 1 : 0.5;
    
    return {
      rotationEnabled: animate && baseSpeed > 0,
      rotationSpeed: rotationSpeed * baseSpeed * (isHovered ? 1.5 : 1),
      pulseEnabled: animate && baseSpeed > 0 && effectsMultiplier > 0,
      pulseSpeed: pulseSpeed * baseSpeed * effectsMultiplier,
      glowEnabled: renderSettings.useComplexEffects,
      glowIntensity: glowIntensity * effectsMultiplier * (isHovered ? 1.2 : 1),
    };
  };
  
  // Optimize animation timing based on CPU budget
  const animationSettings = getAnimationSettings();
  const animationFrameSkip = useMemo(() => {
    if (cpuBudget.isOverBudget) {
      return Math.floor(3 / cpuBudget.throttleFactor);
    }
    return 1;
  }, [cpuBudget.isOverBudget, cpuBudget.throttleFactor]);
  
  // Frame counter to skip frames when necessary
  const frameCounter = useRef(0);
  
  // Update rotation with throttling for performance
  const updateRotation = useAnimationFrameThrottled(() => {
    if (!animationSettings.rotationEnabled || !isVisible) return;
    
    // Skip frames if needed
    frameCounter.current += 1;
    if (frameCounter.current % animationFrameSkip !== 0) return;
    
    setRotation(prev => (prev + animationSettings.rotationSpeed * 0.2) % 360);
  });
  
  // Update scale with throttling for performance
  const updateScale = useAnimationFrameThrottled(() => {
    if (!animationSettings.pulseEnabled || !isVisible) return;
    
    // Skip frames if needed
    if (frameCounter.current % animationFrameSkip !== 0) return;
    
    const time = performance.now() * 0.001 * animationSettings.pulseSpeed;
    const newScale = 1 + Math.sin(time) * 0.03;
    setScale(newScale);
  });
  
  // Handle animation updates
  useEffect(() => {
    if (!isVisible) return;
    
    const animateFrame = () => {
      updateRotation();
      updateScale();
    };
    
    const intervalId = setInterval(animateFrame, 16.667); // Target 60fps
    
    return () => {
      clearInterval(intervalId);
    };
  }, [
    updateRotation, 
    updateScale, 
    isVisible, 
    animationSettings.rotationEnabled, 
    animationSettings.pulseEnabled
  ]);
  
  // Optimized event handlers
  const handleMouseEnter = () => {
    if (interactivity === 'none') return;
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    if (interactivity === 'none') return;
    setIsHovered(false);
  };
  
  const handleClick = () => {
    if (interactivity === 'none') return;
    
    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 500);
    
    if (onShapeClick) {
      onShapeClick(primaryShape);
    }
  };
  
  // Debounced scroll handler for scroll-based interactivity
  const handleScroll = debounce(() => {
    if (interactivity !== 'scroll' || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate how far the element is through the viewport (0 to 1)
    const progress = 1 - (rect.bottom / (viewportHeight + rect.height));
    
    if (progress >= 0 && progress <= 1) {
      setRotation(progress * 360);
      setScale(1 + progress * 0.2);
    }
  }, 100);
  
  // Add scroll listener if needed
  useEffect(() => {
    if (interactivity === 'scroll') {
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [interactivity, handleScroll]);
  
  // Calculate shape glow effect
  const glowEffect = useMemo(() => {
    if (!animationSettings.glowEnabled) return '';
    
    const intensity = animationSettings.glowIntensity;
    return `0 0 ${intensity * 5}px ${intensity}px ${glowColor}`;
  }, [animationSettings.glowEnabled, animationSettings.glowIntensity, glowColor]);
  
  // Render the selected shape based on primaryShape prop
  const renderShape = () => {
    // If not visible and we're using visibility-based rendering, render a placeholder
    if (!isVisible && minimalRendering) {
      return <div className="geometric-placeholder" style={{  width: size, height: size  }} />;
    }
    
    // Measure shape rendering time
    return measureExecutionTime('renderGeometricShape', () => {
      const detail = getShapeDetail();
      const commonProps = {
        className: `sacred-geometry-shape ${clickEffect ? 'click-effect' : ''}`,
        style: {
          transform: `rotate(${rotation}deg) scale(${scale})`,
          width: 100,
          height: 100,
          boxShadow: glowEffect,
          transition: clickEffect ? 'transform 0.3s ease-out' : undefined,
        }
      };
      
      switch (primaryShape) {
        case 'flower-of-life':
          return <FlowerOfLife {...commonProps} detail={detail} colorScheme={glowColor} />;
        case 'metatron':
          return <Metatron {...commonProps} detail={detail} colorScheme={glowColor} />;
        case 'sri-yantra':
          return <SriYantra {...commonProps} detail={detail} colorScheme={glowColor} />;
        case 'torus':
          return <Torus {...commonProps} detail={detail} colorScheme={glowColor} />;
        case 'sacred-spiral':
          return <SacredSpiral {...commonProps} detail={detail} colorScheme={glowColor} />;
        case 'platonic-solids':
          return <PlatonicsolidsSvg {...commonProps} detail={detail} colorScheme={glowColor} />;
        default:
          return <FlowerOfLife {...commonProps} detail={detail} colorScheme={glowColor} />;
      }
    });
  };
  
  // Render the component
  return (
    <div 
      ref={(element) => {
        // Attach to both refs
        if (element) {
          containerRef.current = element;
          visibilityRef.current = element;
        }
      }}
      className={`geometric-section ${className} ${isHovered ? 'hovered' : ''}`}
      style={{  
        backgroundColor,
        color: textColor,
        padding: '4rem 2rem',
        position: 'relative',
        overflow: 'hidden',
       }}
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Text content */}
          <div className="text-content order-2 md:order-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            <h3 className="text-xl md:text-2xl mb-4 opacity-80">{subtitle}</h3>
            <p className="text-base md:text-lg opacity-70 max-w-prose">
              {description}
            </p>
          </div>
          
          {/* Sacred geometry */}
          <div 
            className="geometric-container order-1 md:order-2 flex items-center justify-center p-6"
          >
            <div
              ref={shapeRef}
              className="shape-wrapper relative"
              style={{  
                width: size, 
                height: size, 
                maxWidth: '100%',
                cursor: interactivity !== 'none' ? 'pointer' : 'default',
               }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            >
              {renderShape()}
              
              {showLabels && (
                <div className="shape-label absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2 text-center">
                  {primaryShape.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary renders
export default React.memo(GeometricSection);