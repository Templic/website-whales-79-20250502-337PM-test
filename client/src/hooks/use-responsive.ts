import { useState, useEffect } from 'react';

/**
 * Hook to determine if the current device is a mobile device
 * @returns {boolean} True if the device is a mobile device
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', checkIfMobile);
    checkIfMobile();

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return isMobile;
};

/**
 * Hook to determine the current breakpoint
 * @returns {string} The current breakpoint (xs, sm, md, lg, xl, 2xl)
 */
export const useBreakpoint = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' => {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>(
    typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'md'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkBreakpoint = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    window.addEventListener('resize', checkBreakpoint);
    checkBreakpoint();

    return () => {
      window.removeEventListener('resize', checkBreakpoint);
    };
  }, []);

  return breakpoint;
};

/**
 * Helper function to determine the breakpoint from the width
 * @param width The window width
 * @returns The breakpoint
 */
const getBreakpoint = (width: number): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' => {
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
};