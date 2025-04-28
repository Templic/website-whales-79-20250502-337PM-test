/**
 * GeometricShapeResponsive.tsx
 * 
 * A responsive version of the geometric shape container that adapts
 * to different screen orientations and device types.
 */

import React from 'react';
import { OrientationContainer } from '../ui/OrientationLayout';
import { useOrientationContext } from '../../contexts/OrientationContext';
import { GeometricShapeOutline } from './ui/GeometricShapeOutline';

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
  
  // Determine device-specific content width
  const getContentMaxWidth = () => {
    if (isMobile) {
      return isLandscape ? '88%' : '95%';
    }
    if (isTablet) {
      return isLandscape ? '90%' : '92%';
    }
    return '90%';
  };

  // Set orientation-specific styles
  const orientationStyles: React.CSSProperties = {
    '--content-max-width': getContentMaxWidth(),
    ...colorStyle
  } as React.CSSProperties;

  return (
    <OrientationContainer className={`sacred-geometry-container ${className}`}>
      <div 
        className={`shape-wrapper ${shapeClass} ${sizeClass} ${effectClasses} geometric-shape-container shape-contour-active`}
        style={orientationStyles}
        data-shape={shape}
        data-orientation-optimized="true"
        data-device-type={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
        data-orientation={isLandscape ? 'landscape' : 'portrait'}
      >
        <div className="sacred-geometry-content shape-content-center">
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
  
  // Determine content width based on device and orientation
  const getContentStyle = (): React.CSSProperties => {
    // Set appropriate padding and max-width for different device/orientation combinations
    const paddings = {
      mobile: {
        portrait: '15px',
        landscape: '10px'
      },
      tablet: {
        portrait: '20px',
        landscape: '15px'
      },
      desktop: {
        portrait: '25px',
        landscape: '20px'
      }
    };
    
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
    const orientation = isLandscape ? 'landscape' : 'portrait';
    
    return {
      '--section-padding': paddings[deviceType][orientation],
      '--content-width': isMobile ? (isLandscape ? '90%' : '95%') : 
                          isTablet ? (isLandscape ? '85%' : '90%') : '80%'
    } as React.CSSProperties;
  };

  return (
    <OrientationContainer 
      className={`geometric-section ${deviceClass} ${orientationClass} ${combinedDeviceOrientation} ${backgroundShapeClass} ${alignmentClass} ${className}`}
      style={getContentStyle()}
    >
      <div className="geometric-container shape-text-container">
        {children}
      </div>
    </OrientationContainer>
  );
}

export default GeometricShapeResponsive;