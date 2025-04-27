/**
 * use-orientation.tsx
 * 
 * React hook for accessing and responding to device orientation changes
 * Works with the orientation.css and orientationUtils.ts to provide
 * a complete solution for orientation-responsive layouts.
 */

import { useState, useEffect } from 'react';
import { getOrientationInfo } from '../utils/orientationUtils';

// Define orientation info type
export interface OrientationInfo {
  isLandscape: boolean;
  isPortrait: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'landscape' | 'portrait';
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * React hook that provides current orientation information
 * and updates when orientation changes
 */
export function useOrientation(): OrientationInfo {
  // Initialize with current orientation
  const [orientationInfo, setOrientationInfo] = useState<OrientationInfo>(getOrientationInfo());

  useEffect(() => {
    // Function to update orientation state
    const updateOrientation = () => {
      setOrientationInfo(getOrientationInfo());
    };

    // Handler for custom orientation change events
    const handleOrientationChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setOrientationInfo({
          ...customEvent.detail,
          orientation: customEvent.detail.isLandscape ? 'landscape' as const : 'portrait' as const,
          deviceType: customEvent.detail.isMobile ? 'mobile' as const : 
                      customEvent.detail.isTablet ? 'tablet' as const : 'desktop' as const
        });
      }
    };
    
    // Initial update
    updateOrientation();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', updateOrientation);
    document.addEventListener('orientationchange', handleOrientationChange);
    
    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('orientationchange', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
      document.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientationInfo;
}

/**
 * HOC (Higher Order Component) that provides orientation props to wrapped components
 * Usage:
 * const MyComponentWithOrientation = withOrientation(MyComponent);
 */
export function withOrientation<P>(Component: React.ComponentType<P & { orientation: OrientationInfo }>) {
  return function WithOrientationComponent(props: P) {
    const orientation = useOrientation();
    return <Component {...props} orientation={orientation} />;
  };
}

export default useOrientation;