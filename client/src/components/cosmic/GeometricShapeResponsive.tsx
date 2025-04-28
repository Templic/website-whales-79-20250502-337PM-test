/**
 * GeometricShapeResponsive.tsx
 * 
 * A responsive version of the geometric shape container that adapts
 * to different screen orientations and device types.
 */

import React from 'react';
import { OrientationContainer } from '../ui/OrientationLayout';
import { useOrientationContext } from '../../contexts/OrientationContext';

interface GeometricShapeResponsiveProps {
  shape: 'hexagon' | 'triangle' | 'pentagon' | 'diamond' | 'circle';
  children: React.ReactNode;
  className?: string;
  glowEffect?: boolean;
  pulseEffect?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

/**
 * GeometricShapeResponsive component
 * Displays content in a sacred geometry shape with orientation-specific optimizations
 */
export function GeometricShapeResponsive({
  shape,
  children,
  className = '',
  glowEffect = false,
  pulseEffect = false,
  size = 'md',
  color
}: GeometricShapeResponsiveProps) {
  const { isLandscape, isMobile, isTablet } = useOrientationContext();
  
  // Determine size based on device and orientation
  const getResponsiveSize = () => {
    // Mobile devices need more size adjustments
    if (isMobile) {
      return isLandscape ? 'sm' : 'md'; // Smaller in landscape due to height constraints
    }
    
    // Tablets need some size adjustments
    if (isTablet) {
      return isLandscape ? 'md' : 'lg';
    }
    
    // Desktop keeps the original size
    return size;
  };
  
  const responsiveSize = getResponsiveSize();
  
  // Apply appropriate classes based on shape and responsiveness
  const shapeClass = `clip-path-${shape}`;
  const sizeClass = `shape-size-${responsiveSize}`;
  const effectClasses = [
    glowEffect ? 'shape-glow' : '',
    pulseEffect ? 'shape-pulse' : ''
  ].filter(Boolean).join(' ');
  
  // Apply color style if provided
  const colorStyle = color ? { '--shape-color': color } as React.CSSProperties : {};
  
  return (
    <OrientationContainer className={`sacred-geometry-container ${className}`}>
      <div 
        className={`shape-wrapper ${shapeClass} ${sizeClass} ${effectClasses}`}
        style={colorStyle}
        data-shape={shape}
        data-orientation-optimized="true"
      >
        <div className="sacred-geometry-content">
          {children}
        </div>
      </div>
    </OrientationContainer>
  );
}

/**
 * GeometricSectionResponsive component
 * A full-width section with geometric shapes that adapts to orientation
 */
interface GeometricSectionResponsiveProps {
  children: React.ReactNode;
  className?: string;
  backgroundShape?: 'hexagon' | 'triangle' | 'pentagon' | 'diamond' | 'circle';
  alignContent?: 'left' | 'center' | 'right';
}

export function GeometricSectionResponsive({
  children,
  className = '',
  backgroundShape,
  alignContent = 'center'
}: GeometricSectionResponsiveProps) {
  const { isLandscape, isMobile, isTablet } = useOrientationContext();
  
  // Apply device and orientation-specific classes
  const deviceClass = isMobile ? 'device-mobile' : isTablet ? 'device-tablet' : 'device-desktop';
  const orientationClass = isLandscape ? 'orientation-landscape' : 'orientation-portrait';
  const combinedDeviceOrientation = `${deviceClass.replace('device-', '')}${orientationClass.replace('orientation-', '')}`;
  
  // Set alignment classes
  const alignmentClass = `text-${alignContent}`;
  
  // Add background shape if specified
  const backgroundShapeClass = backgroundShape ? `bg-shape-${backgroundShape}` : '';
  
  return (
    <OrientationContainer 
      className={`geometric-section ${deviceClass} ${orientationClass} ${combinedDeviceOrientation} ${backgroundShapeClass} ${alignmentClass} ${className}`}
    >
      <div className="geometric-container">
        {children}
      </div>
    </OrientationContainer>
  );
}

export default GeometricShapeResponsive;