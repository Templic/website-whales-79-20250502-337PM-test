/**
 * OrientationLayout.tsx
 * 
 * A component that adapts its layout based on the current device orientation
 * (landscape or portrait) and device type (mobile, tablet, or desktop).
 */

import { useState, useEffect } from 'react';
import { useOrientation } from '../../hooks/use-orientation';
import { OrientationView } from '../../contexts/OrientationContext';

interface OrientationLayoutProps {
  children: React.ReactNode;
  landscapeContent?: React.ReactNode;
  portraitContent?: React.ReactNode;
  className?: string;
}

/**
 * OrientationLayout component
 * Adapts its layout based on current orientation
 */
export function OrientationLayout({
  children,
  landscapeContent,
  portraitContent,
  className = ''
}: OrientationLayoutProps) {
  const { isLandscape, isPortrait, isMobile, isTablet, deviceType, orientation } = useOrientation();
  const [key, setKey] = useState(Date.now());
  
  // Re-render when orientation changes to ensure proper layout
  useEffect(() => {
    setKey(Date.now());
  }, [orientation, deviceType]);
  
  // Apply orientation-specific classes
  const orientationClass = `orientation-${orientation} device-${deviceType}`;
  
  return (
    <div 
      key={key}
      className={`orientation-layout ${orientationClass} ${className}`}
      data-orientation={orientation}
      data-device={deviceType}
    >
      {/* Common content for both orientations */}
      <div className="orientation-layout-common">
        {children}
      </div>
      
      {/* Orientation-specific content */}
      {(landscapeContent || portraitContent) && (
        <>
          <OrientationView landscape>
            <div className="orientation-layout-landscape">
              {landscapeContent}
            </div>
          </OrientationView>
          
          <OrientationView portrait>
            <div className="orientation-layout-portrait">
              {portraitContent}
            </div>
          </OrientationView>
        </>
      )}
      
      {/* Mobile-specific optimizations warning (portrait) */}
      {isMobile && isLandscape && (
        <div className="landscape-notice mobile-landscape-only">
          <p className="landscape-notice-text">
            For best experience, consider rotating your device to portrait orientation.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * OrientationContainer component
 * A simple container that applies orientation-specific classes
 */
interface OrientationContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function OrientationContainer({
  children,
  className = '',
  style = {}
}: OrientationContainerProps) {
  const { orientation, deviceType } = useOrientation();
  
  return (
    <div 
      className={`orientation-container ${deviceType}-${orientation} ${className}`}
      data-orientation={orientation}
      data-device={deviceType}
      style={style}
    >
      {children}
    </div>
  );
}

export default OrientationLayout;