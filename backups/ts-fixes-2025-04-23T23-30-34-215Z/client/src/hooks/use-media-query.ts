import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure code only runs in browser environment
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Initial check
      setMatches(media.matches);
      
      // Add listener for changes
      const listener = (e: MediaQueryListEvent) => {
        setMatches(e.matches);
      };
      
      // Modern browsers
      media.addEventListener('change', listener);
      
      return () => {
        // Clean up listener
        media.removeEventListener('change', listener);
      };
    }
  }, [query]);

  return matches;
}