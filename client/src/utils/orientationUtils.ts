/**
 * orientationUtils.ts
 * 
 * Utility functions for handling device orientation changes
 * and applying appropriate CSS classes to optimize the UI
 * for both landscape and portrait orientations on mobile and tablet devices.
 */

/**
 * Initialize orientation detection and set up event listeners
 * to update CSS classes when device orientation changes
 */
export function initOrientationDetection() {
  // Apply initial orientation class based on current orientation
  updateOrientationClass();
  
  // Set up event listener for orientation changes
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', debounce(updateOrientationClass, 250));
  
  // Log initialization
  console.log('[Orientation] Orientation detection initialized');
}

/**
 * Handle orientation change events
 */
function handleOrientationChange() {
  console.log('[Orientation] Orientation changed');
  
  // Small delay to ensure dimensions have updated after rotation
  setTimeout(updateOrientationClass, 100);
}

/**
 * Update the orientation class on the document body
 * based on the current window dimensions
 */
function updateOrientationClass() {
  const isLandscape = window.innerWidth > window.innerHeight;
  const isMobile = window.innerWidth < 768 || window.innerHeight < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  // Remove existing orientation classes
  document.body.classList.remove(
    'orientation-landscape', 
    'orientation-portrait',
    'device-mobile',
    'device-tablet',
    'device-desktop',
    'mobile-landscape',
    'mobile-portrait',
    'tablet-landscape',
    'tablet-portrait'
  );
  
  // Add appropriate orientation class
  document.body.classList.add(isLandscape ? 'orientation-landscape' : 'orientation-portrait');
  
  // Add device type class
  if (isMobile) {
    document.body.classList.add('device-mobile');
    document.body.classList.add(isLandscape ? 'mobile-landscape' : 'mobile-portrait');
  } else if (isTablet) {
    document.body.classList.add('device-tablet');
    document.body.classList.add(isLandscape ? 'tablet-landscape' : 'tablet-portrait');
  } else {
    document.body.classList.add('device-desktop');
  }
  
  // Dispatch a custom event for components that need to react to orientation changes
  document.dispatchEvent(new CustomEvent('orientationchange', { 
    detail: { 
      isLandscape,
      isPortrait: !isLandscape,
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet
    } 
  }));
}

/**
 * Simple debounce function to limit the frequency of function calls
 */
function debounce(func: Function, wait: number) {
  let timeout: number | null = null;
  
  return function executedFunction(...args: any[]) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(later, wait) as unknown as number;
  };
}

/**
 * Clean up event listeners (call when component unmounts)
 */
export function cleanupOrientationDetection() {
  window.removeEventListener('orientationchange', handleOrientationChange);
  window.removeEventListener('resize', debounce(updateOrientationClass, 250));
  
  console.log('[Orientation] Orientation detection cleaned up');
}

/**
 * Hook to easily use orientation information in React components
 * Usage example:
 * 
 * const { isLandscape, isPortrait, isMobile, isTablet } = useOrientation();
 * if (isLandscape && isMobile) {
 *   // Apply special handling for mobile landscape mode
 * }
 */
export function getOrientationInfo() {
  const isLandscape = window.innerWidth > window.innerHeight;
  const isMobile = window.innerWidth < 768 || window.innerHeight < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  return {
    isLandscape,
    isPortrait: !isLandscape,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    orientation: isLandscape ? 'landscape' as const : 'portrait' as const,
    deviceType: isMobile ? 'mobile' as const : isTablet ? 'tablet' as const : 'desktop' as const
  };
}