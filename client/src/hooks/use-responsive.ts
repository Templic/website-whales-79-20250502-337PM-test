/**
 * Responsive Hooks
 * 
 * This module provides hooks for responsive design and device capability detection
 * to optimize rendering based on device constraints.
 */

import { useState, useEffect, useMemo } from 'react';

// Define common breakpoints
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Device capability levels
export type DeviceCapabilityLevel = 'low' | 'medium' | 'high' | 'ultra';

// Device capability thresholds
const capabilityThresholds = {
  // CPU cores
  cpuCores: {
    low: 0,
    medium: 2,
    high: 4,
    ultra: 8,
  },
  
  // Memory (estimated from navigator.deviceMemory, in GB)
  memory: {
    low: 0,
    medium: 4,
    high: 8,
    ultra: 16,
  },
  
  // Connection speed (estimated from navigator.connection.effectiveType)
  connectionSpeed: {
    low: 0, // 2G or worse
    medium: 1, // 3G
    high: 2, // 4G
    ultra: 3, // Fast 4G or better
  },
  
  // Screen resolution
  resolution: {
    low: 0, // < 720p
    medium: 1280 * 720, // 720p
    high: 1920 * 1080, // 1080p
    ultra: 2560 * 1440, // 1440p or better
  },
};

/**
 * Hook to detect if the current viewport matches a media query
 * @param query Media query string
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Default to true on the server to avoid hydration mismatch
    if (typeof window !== 'object') {
      return;
    }
    
    // Create media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Update match state
    const updateMatch = () => {
      setMatches(mediaQueryList.matches);
    };
    
    // Set initial state
    updateMatch();
    
    // Listen for changes
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', updateMatch);
      return () => mediaQueryList.removeEventListener('change', updateMatch);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(updateMatch);
      return () => mediaQueryList.removeListener(updateMatch);
    }
  }, [query]);
  
  return matches;
}

/**
 * Hook to get the current breakpoint
 * @returns Current breakpoint key ('xs', 'sm', 'md', 'lg', 'xl', '2xl')
 */
export function useBreakpoint(): keyof typeof breakpoints {
  // Array of breakpoints in ascending order for easier comparison
  const sortedBreakpoints = useMemo(() => {
    return Object.entries(breakpoints)
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => key as keyof typeof breakpoints);
  }, []);
  
  // Generate states for each breakpoint
  const breakpointStates = {} as Record<keyof typeof breakpoints, boolean>;
  
  sortedBreakpoints.forEach(key => {
    breakpointStates[key] = useMediaQuery(`(min-width: ${breakpoints[key]}px)`);
  });
  
  // Find current breakpoint (largest one that matches)
  const currentBreakpoint = useMemo(() => {
    // Default to smallest breakpoint
    let current: keyof typeof breakpoints = sortedBreakpoints[0];
    
    // Find largest matching breakpoint
    for (let i = sortedBreakpoints.length - 1; i >= 0; i--) {
      const bp = sortedBreakpoints[i];
      if (breakpointStates[bp]) {
        current = bp;
        break;
      }
    }
    
    return current;
  }, [breakpointStates, sortedBreakpoints]);
  
  return currentBreakpoint;
}

/**
 * Hook to detect device capabilities for performance optimization
 * @returns Device capability information
 */
export function useDeviceCapabilities(): {
  overallLevel: DeviceCapabilityLevel;
  memory: DeviceCapabilityLevel;
  cpu: DeviceCapabilityLevel;
  connection: DeviceCapabilityLevel;
  resolution: DeviceCapabilityLevel;
  isReducedMotion: boolean;
  isPrefersDataSaver: boolean;
  estimatedDeviceClass: string;
  shouldEnableEffects: boolean;
} {
  const [capabilities, setCapabilities] = useState({
    overallLevel: 'medium' as DeviceCapabilityLevel,
    memory: 'medium' as DeviceCapabilityLevel,
    cpu: 'medium' as DeviceCapabilityLevel,
    connection: 'medium' as DeviceCapabilityLevel,
    resolution: 'medium' as DeviceCapabilityLevel,
    isReducedMotion: false,
    isPrefersDataSaver: false,
    estimatedDeviceClass: 'desktop',
    shouldEnableEffects: true,
  });
  
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersDataSaver = useMediaQuery('(prefers-reduced-data: reduce)');
  
  useEffect(() => {
    if (typeof window !== 'object') {
      return;
    }
    
    const detectCapabilities = () => {
      // Detect CPU capabilities
      let cpuLevel: DeviceCapabilityLevel = 'medium';
      const cpuCores = navigator.hardwareConcurrency || 4;
      
      if (cpuCores <= capabilityThresholds.cpuCores.medium) {
        cpuLevel = 'low';
      } else if (cpuCores >= capabilityThresholds.cpuCores.high && cpuCores < capabilityThresholds.cpuCores.ultra) {
        cpuLevel = 'high';
      } else if (cpuCores >= capabilityThresholds.cpuCores.ultra) {
        cpuLevel = 'ultra';
      }
      
      // Detect memory capabilities
      let memoryLevel: DeviceCapabilityLevel = 'medium';
      const deviceMemory = (navigator as unknown).deviceMemory || 4; // in GB, defaults to 4
      
      if (deviceMemory <= capabilityThresholds.memory.medium) {
        memoryLevel = 'low';
      } else if (deviceMemory >= capabilityThresholds.memory.high && deviceMemory < capabilityThresholds.memory.ultra) {
        memoryLevel = 'high';
      } else if (deviceMemory >= capabilityThresholds.memory.ultra) {
        memoryLevel = 'ultra';
      }
      
      // Detect connection capabilities
      let connectionLevel: DeviceCapabilityLevel = 'medium';
      const connection = (navigator as unknown).connection;
      let connectionScore = 1; // Default to 3G
      
      if (connection) {
        // Map connection type to score
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            connectionScore = 0;
            break;
          case '3g':
            connectionScore = 1;
            break;
          case '4g':
            connectionScore = 2;
            break;
          default:
            // If we can't determine, estimate based on downlink
            if (connection.downlink) {
              if (connection.downlink < 1) {
                connectionScore = 0;
              } else if (connection.downlink < 5) {
                connectionScore = 1;
              } else if (connection.downlink < 20) {
                connectionScore = 2;
              } else {
                connectionScore = 3;
              }
            }
        }
      }
      
      if (connectionScore <= capabilityThresholds.connectionSpeed.medium) {
        connectionLevel = 'low';
      } else if (connectionScore >= capabilityThresholds.connectionSpeed.high && connectionScore < capabilityThresholds.connectionSpeed.ultra) {
        connectionLevel = 'high';
      } else if (connectionScore >= capabilityThresholds.connectionSpeed.ultra) {
        connectionLevel = 'ultra';
      }
      
      // Detect resolution capabilities
      let resolutionLevel: DeviceCapabilityLevel = 'medium';
      const pixelCount = window.screen.width * window.screen.height;
      
      if (pixelCount <= capabilityThresholds.resolution.medium) {
        resolutionLevel = 'low';
      } else if (pixelCount >= capabilityThresholds.resolution.high && pixelCount < capabilityThresholds.resolution.ultra) {
        resolutionLevel = 'high';
      } else if (pixelCount >= capabilityThresholds.resolution.ultra) {
        resolutionLevel = 'ultra';
      }
      
      // Determine overall level (weighted towards memory and CPU)
      const levels: DeviceCapabilityLevel[] = [cpuLevel, memoryLevel, connectionLevel, resolutionLevel];
      const levelMap = {
        low: 0,
        medium: 1,
        high: 2,
        ultra: 3,
      };
      
      // Calculate weighted score
      const weights = [0.4, 0.3, 0.2, 0.1]; // CPU, memory, connection, resolution weights
      const weightedScore = levels.reduce((score, level, index) => {
        return score + levelMap[level] * weights[index];
      }, 0);
      
      let overallLevel: DeviceCapabilityLevel;
      if (weightedScore < 1) {
        overallLevel = 'low';
      } else if (weightedScore < 2) {
        overallLevel = 'medium';
      } else if (weightedScore < 3) {
        overallLevel = 'high';
      } else {
        overallLevel = 'ultra';
      }
      
      // Estimate device class
      let estimatedDeviceClass = 'desktop';
      
      const userAgent = navigator.userAgent.toLowerCase();
      if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        estimatedDeviceClass = 'mobile';
        
        if (/ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(userAgent)) {
          estimatedDeviceClass = 'tablet';
        }
      }
      
      // Determine if effects should be enabled
      const shouldEnableEffects = 
        overallLevel !== 'low' && 
        !prefersReducedMotion && 
        !prefersDataSaver;
      
      setCapabilities({
        overallLevel,
        memory: memoryLevel,
        cpu: cpuLevel,
        connection: connectionLevel,
        resolution: resolutionLevel,
        isReducedMotion: prefersReducedMotion,
        isPrefersDataSaver: prefersDataSaver,
        estimatedDeviceClass,
        shouldEnableEffects,
      });
    };
    
    // Detect capabilities immediately
    detectCapabilities();
    
    // Re-detect on resize (device orientation change might affect capabilities)
    window.addEventListener('resize', detectCapabilities);
    
    // Re-detect on connection change if available
    const connection = (navigator as unknown).connection;
    if (connection) {
      connection.addEventListener('change', detectCapabilities);
    }
    
    return () => {
      window.removeEventListener('resize', detectCapabilities);
      if (connection) {
        connection.removeEventListener('change', detectCapabilities);
      }
    };
  }, [prefersReducedMotion, prefersDataSaver]);
  
  return capabilities;
}

/**
 * Hook to optimize rendering based on device capabilities
 * @param options Options for optimization
 * @returns Optimized rendering settings
 */
export function useResponsiveRendering(options?: {
  lowQualityThreshold?: DeviceCapabilityLevel;
  reducedMotion?: boolean;
  dataSaver?: boolean;
}): {
  useHighQuality: boolean;
  useAnimations: boolean;
  maxParticleCount: number;
  useWebGL: boolean;
  useShadows: boolean;
  useComplexEffects: boolean;
  useLazyLoading: boolean;
  imageDensity: number;
  renderScaleFactor: number;
} {
  const {
    lowQualityThreshold = 'low',
    reducedMotion = true,
    dataSaver = true,
  } = options || {};
  
  const capabilities = useDeviceCapabilities();
  const currentBreakpoint = useBreakpoint();
  
  // Map capability levels to numerical values
  const levelValues = {
    low: 0,
    medium: 1,
    high: 2,
    ultra: 3,
  };
  
  // Determine if high quality should be used
  const capabilityLevel = levelValues[capabilities.overallLevel];
  const threshold = levelValues[lowQualityThreshold];
  
  // Skip animations based on user preferences and device capabilities
  const skipAnimations = 
    (reducedMotion && capabilities.isReducedMotion) || 
    capabilityLevel < threshold;
  
  // Reduce data usage based on user preferences
  const reduceData = 
    (dataSaver && capabilities.isPrefersDataSaver) || 
    capabilities.connection === 'low';
  
  // Scale graphics quality based on device capabilities
  const getParticleCount = () => {
    if (capabilityLevel <= levelValues['low']) return 50;
    if (capabilityLevel <= levelValues['medium']) return 200;
    if (capabilityLevel <= levelValues['high']) return 500;
    return 1000;
  };
  
  // Determine if WebGL should be used
  const shouldUseWebGL = 
    capabilityLevel >= levelValues['medium'] && 
    capabilities.cpu !== 'low';
  
  // Determine if shadows should be rendered
  const shouldUseShadows = 
    capabilityLevel >= levelValues['high'] && 
    !reduceData;
  
  // Determine if complex effects should be used
  const shouldUseComplexEffects = 
    capabilityLevel >= levelValues['high'] && 
    !skipAnimations && 
    !reduceData;
  
  // Determine render scale factor based on device
  const getRenderScaleFactor = () => {
    if (capabilities.resolution === 'ultra') return 1.0;
    if (capabilities.resolution === 'high') return 0.85;
    if (capabilities.resolution === 'medium') return 0.7;
    return 0.5;
  };
  
  return {
    useHighQuality: capabilityLevel >= threshold,
    useAnimations: !skipAnimations,
    maxParticleCount: getParticleCount(),
    useWebGL: shouldUseWebGL,
    useShadows: shouldUseShadows,
    useComplexEffects: shouldUseComplexEffects,
    useLazyLoading: reduceData || currentBreakpoint === 'xs' || currentBreakpoint === 'sm',
    imageDensity: capabilities.connection === 'low' ? 1 : window.devicePixelRatio || 1,
    renderScaleFactor: getRenderScaleFactor(),
  };
}

/**
 * Hook to decide whether to render a component based on device capabilities
 * @param minCapabilityRequired Minimum capability level required to render
 * @returns Whether to render the component
 */
export function useShouldRender(minCapabilityRequired: DeviceCapabilityLevel = 'low'): boolean {
  const capabilities = useDeviceCapabilities();
  
  // Map capability levels to numerical values
  const levelValues = {
    low: 0,
    medium: 1,
    high: 2,
    ultra: 3,
  };
  
  const requiredLevel = levelValues[minCapabilityRequired];
  const actualLevel = levelValues[capabilities.overallLevel];
  
  return actualLevel >= requiredLevel;
}

/**
 * Hook to get optimal image size based on device capabilities and container size
 * @param containerWidth Container width in pixels
 * @param containerHeight Container height in pixels
 * @returns Optimal image dimensions and loading strategy
 */
export function useOptimalImageSize(
  containerWidth: number,
  containerHeight: number
): {
  width: number;
  height: number;
  quality: number;
  priority: boolean;
  loading: 'lazy' | 'eager';
} {
  const capabilities = useDeviceCapabilities();
  const { connection, resolution } = capabilities;
  
  // Default to container dimensions
  let width = containerWidth;
  let height = containerHeight;
  
  // Scale based on device pixel ratio, but limit based on connection
  const pixelRatio = window.devicePixelRatio || 1;
  
  let scaleFactor: number;
  if (connection === 'low') {
    scaleFactor = 1; // Don't scale up on slow connections
  } else if (connection === 'medium') {
    scaleFactor = Math.min(pixelRatio, 1.5);
  } else {
    scaleFactor = pixelRatio;
  }
  
  width = Math.round(width * scaleFactor);
  height = Math.round(height * scaleFactor);
  
  // Determine image quality
  let quality: number;
  if (connection === 'low') {
    quality = 60;
  } else if (connection === 'medium') {
    quality = 75;
  } else if (connection === 'high') {
    quality = 85;
  } else {
    quality = 90;
  }
  
  // Determine loading strategy
  const priority = 
    containerWidth > window.innerWidth * 0.5 && // Image takes up significant portion of viewport
    containerHeight > window.innerHeight * 0.3 && // Image takes up significant portion of viewport
    connection !== 'low'; // Not on a slow connection
  
  const loading = priority ? 'eager' : 'lazy';
  
  return {
    width,
    height,
    quality,
    priority,
    loading,
  };
}

/**
 * Hook to measure available CPU budget for intensive operations
 * @returns CPU budget information
 */
export function useCPUBudget(): {
  availableBudget: number;
  isOverBudget: boolean;
  throttleFactor: number;
} {
  const capabilities = useDeviceCapabilities();
  const [measurements, setMeasurements] = useState({
    frameTime: 16.7, // Default to 60fps
    idleTime: 5, // Default to 5ms idle time
    lastUpdated: Date.now(),
  });
  const [budget, setBudget] = useState({
    availableBudget: 10, // Default to 10ms
    isOverBudget: false,
    throttleFactor: 1,
  });
  
  useEffect(() => {
    if (typeof window !== 'object') {
      return;
    }
    
    let lastTimestamp = performance.now();
    let frameCount = 0;
    let totalFrameTime = 0;
    
    const measureFrame = (timestamp: number) => {
      // Calculate frame time
      const frameTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Update running average (last 10 frames)
      totalFrameTime += frameTime;
      frameCount++;
      
      if (frameCount > 10) {
        totalFrameTime -= measurements.frameTime;
        frameCount--;
      }
      
      const avgFrameTime = totalFrameTime / frameCount;
      
      // Estimate idle time based on frame time
      // If we're running at 60fps (16.7ms per frame), and avgFrameTime is 12ms
      // then we have ~4.7ms of idle time per frame
      const targetFrameTime = 16.7; // Target 60fps
      const estimatedIdleTime = Math.max(0, targetFrameTime - avgFrameTime);
      
      // Update measurements
      setMeasurements({
        frameTime: avgFrameTime,
        idleTime: estimatedIdleTime,
        lastUpdated: Date.now(),
      });
      
      // Calculate CPU budget
      const availableBudget = Math.max(0, estimatedIdleTime * 0.8); // Leave 20% margin
      const isOverBudget = avgFrameTime > targetFrameTime;
      
      // Calculate throttle factor for adaptive throttling
      // If we're over budget, throttle more aggressively
      let throttleFactor = 1;
      if (isOverBudget) {
        throttleFactor = targetFrameTime / (avgFrameTime * 1.2); // Add 20% margin
      }
      
      // Update budget
      setBudget({
        availableBudget,
        isOverBudget,
        throttleFactor,
      });
      
      // Request next frame
      requestAnimationFrame(measureFrame);
    };
    
    // Start measuring
    const rafId = requestAnimationFrame(measureFrame);
    
    // Clean up
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [measurements.frameTime]);
  
  return budget;
}

/**
 * Hook to optimize state updates based on device capabilities and performance
 * @param updateFn Function to update state
 * @param interval Minimum time between updates in ms
 * @returns Optimized update function
 */
export function useOptimizedStateUpdates<T>(
  updateFn: (value: T) => void,
  interval: number = 100
): (value: T) => void {
  const cpuBudget = useCPUBudget();
  const capabilities = useDeviceCapabilities();
  
  // Adjust interval based on CPU budget and device capabilities
  const adjustedInterval = useMemo(() => {
    let baseInterval = interval;
    
    // If we're over budget, increase the interval
    if (cpuBudget.isOverBudget) {
      baseInterval *= (2 - cpuBudget.throttleFactor);
    }
    
    // Adjust for device capability
    switch (capabilities.overallLevel) {
      case 'low':
        baseInterval *= 3;
        break;
      case 'medium':
        baseInterval *= 1.5;
        break;
      case 'high':
        baseInterval *= 1;
        break;
      case 'ultra':
        baseInterval *= 0.75;
        break;
    }
    
    return Math.max(50, Math.round(baseInterval));
  }, [interval, cpuBudget.isOverBudget, cpuBudget.throttleFactor, capabilities.overallLevel]);
  
  // Use useRef to store the latest value without triggering rerenders
  const valueRef = useRef<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  // Return a throttled update function
  return useMemo(() => {
    return (value: T) => {
      // Store the latest value
      valueRef.current = value;
      
      // Check if we need to schedule an update
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      
      if (timeSinceLastUpdate >= adjustedInterval) {
        // Update immediately if enough time has passed
        updateFn(value);
        lastUpdateRef.current = now;
        
        // Clear any pending timeouts
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else if (timeoutRef.current === null) {
        // Schedule an update
        const delay = adjustedInterval - timeSinceLastUpdate;
        
        timeoutRef.current = setTimeout(() => {
          if (valueRef.current !== null) {
            updateFn(valueRef.current);
            lastUpdateRef.current = Date.now();
          }
          timeoutRef.current = null;
        }, delay);
      }
    };
  }, [updateFn, adjustedInterval]);
}