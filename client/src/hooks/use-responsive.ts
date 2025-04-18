import { useState, useEffect } from 'react';

/**
 * Hook to determine if the current device is a mobile device
 * @returns {boolean} True if the device is a mobile device
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Call the check once to set the initial value
    checkMobile();
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Hook to determine the current breakpoint
 * @returns {string} The current breakpoint (xs, sm, md, lg, xl, 2xl)
 */
export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md');

  useEffect(() => {
    // Initial check
    const checkBreakpoint = () => {
      setBreakpoint(getBreakpointFromWidth(window.innerWidth));
    };
    
    // Add event listener
    window.addEventListener('resize', checkBreakpoint);
    
    // Call the check once to set the initial value
    checkBreakpoint();
    
    // Clean up
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
};

/**
 * Helper function to determine the breakpoint from the width
 * @param width The window width
 * @returns The breakpoint
 */
function getBreakpointFromWidth(width: number): Breakpoint {
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
}

/**
 * Hook to monitor the screen size and call a callback when it changes
 * @param callback Function to call when screen size changes
 */
export const useScreenSize = (callback: (size: { width: number; height: number }) => void): void => {
  useEffect(() => {
    const handleResize = () => {
      callback({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    // Call once on mount
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [callback]);
};

/**
 * Hook to check if a specific breakpoint is active
 * @param breakpoint The breakpoint to check
 * @returns True if the breakpoint is active
 */
export const useBreakpointMatch = (breakpoint: Breakpoint): boolean => {
  const currentBreakpoint = useBreakpoint();
  
  // Convert breakpoints to numeric values for comparison
  const breakpointValues: Record<Breakpoint, number> = {
    'xs': 1,
    'sm': 2,
    'md': 3,
    'lg': 4,
    'xl': 5,
    '2xl': 6
  };
  
  return breakpointValues[currentBreakpoint] >= breakpointValues[breakpoint];
};

/**
 * Hook to get a value based on the current breakpoint
 * @param values Object with breakpoint values
 * @returns The value for the current breakpoint
 */
export function useBreakpointValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const breakpoint = useBreakpoint();
  
  // Try to get the value for the current breakpoint
  if (values[breakpoint] !== undefined) {
    return values[breakpoint];
  }
  
  // If not found, try to find the closest smaller breakpoint
  const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpoints.indexOf(breakpoint);
  
  // Look for the closest smaller breakpoint with a value
  for (let i = currentIndex - 1; i >= 0; i--) {
    const bp = breakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  // If still not found, look for the closest larger breakpoint
  for (let i = currentIndex + 1; i < breakpoints.length; i++) {
    const bp = breakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  // If no value found, return undefined
  return undefined;
}

export default useIsMobile;