/**
 * OrientationContext.tsx
 * 
 * Context provider for orientation information that integrates with orientation.css
 * to optimize UI display for both landscape and portrait orientations on mobile/tablet.
 */

import React, { createContext, useContext, useEffect } from 'react';
import { OrientationInfo, useOrientation } from '../hooks/use-orientation';
import { initOrientationDetection, cleanupOrientationDetection } from '../utils/orientationUtils';

// Create the orientation context
const OrientationContext = createContext<OrientationInfo | undefined>(undefined);

interface OrientationProviderProps {
  children: React.ReactNode;
}

/**
 * OrientationProvider component
 * Initializes orientation detection and provides orientation info to children
 */
export function OrientationProvider({ children }: OrientationProviderProps) {
  const orientation = useOrientation();
  
  useEffect(() => {
    // Initialize orientation detection on component mount
    initOrientationDetection();
    
    // Cleanup on component unmount
    return () => {
      cleanupOrientationDetection();
    };
  }, []);
  
  return (
    <OrientationContext.Provider value={orientation}>
      {children}
    </OrientationContext.Provider>
  );
}

/**
 * Hook to use orientation context
 */
export function useOrientationContext() {
  const context = useContext(OrientationContext);
  if (context === undefined) {
    throw new Error('useOrientationContext must be used within an OrientationProvider');
  }
  return context;
}

/**
 * Convenience component for conditional rendering based on orientation
 * Usage examples:
 * 
 * <OrientationView landscape>
 *   <div>This only appears in landscape mode</div>
 * </OrientationView>
 * 
 * <OrientationView portrait mobile>
 *   <div>This only appears in portrait mode on mobile devices</div>
 * </OrientationView>
 */
interface OrientationViewProps {
  children: React.ReactNode;
  landscape?: boolean;
  portrait?: boolean;
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
}

export function OrientationView({ 
  children, 
  landscape, 
  portrait, 
  mobile, 
  tablet, 
  desktop 
}: OrientationViewProps) {
  const orientation = useOrientationContext();
  
  // Check if the current orientation matches the specified condition
  const shouldRender = (
    // No orientation condition specified, or current orientation matches specified condition
    (!landscape && !portrait || 
     (landscape && orientation.isLandscape) || 
     (portrait && orientation.isPortrait)) &&
    // No device type condition specified, or current device type matches specified condition
    (!mobile && !tablet && !desktop || 
     (mobile && orientation.isMobile) || 
     (tablet && orientation.isTablet) || 
     (desktop && orientation.isDesktop))
  );
  
  return shouldRender ? <>{children}</> : null;
}

export default OrientationProvider;