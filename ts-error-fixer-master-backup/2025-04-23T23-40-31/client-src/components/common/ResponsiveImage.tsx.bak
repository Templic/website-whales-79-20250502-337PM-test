/**
 * ResponsiveImage Component
 * 
 * A high-performance image component that:
 * - Uses modern srcset and sizes attributes for responsive loading
 * - Implements lazy loading with IntersectionObserver
 * - Provides blur-up loading effects
 * - Handles image format selection (WebP, AVIF, JPEG, PNG)
 * - Optimizes memory usage with unloading for offscreen images
 * - Supports art direction with different aspect ratios for different viewports
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';

// Image format types
export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png' | 'jpg' | 'gif';

// Size definition for responsive images
export interface ImageSize {
  /** Width of the image in pixels */
  width: number;
  /** Height of the image (optional, for maintaining aspect ratio) */
  height?: number;
  /** Media query for when this size should be used (e.g. '(max-width: 600px)') */
  media?: string;
}

// Source definition for art direction
export interface ImageSource {
  /** Source URL template with {w} and {h} placeholders (e.g. "/images/hero-{w}x{h}.jpg") */
  src: string;
  /** Array of sizes available for this source */
  sizes: ImageSize[];
  /** Media query for when this source should be used */
  media?: string;
  /** Image format for this source */
  format?: ImageFormat;
}

export interface ResponsiveImageProps {
  /** Primary image URL, can contain {w} and {h} placeholders for responsive sizing */
  src: string;
  /** Alternative text for accessibility */
  alt: string;
  /** Placeholder image URL to show during loading */
  placeholder?: string;
  /** Exact width attribute for the image */
  width?: number;
  /** Exact height attribute for the image */
  height?: number;
  /** CSS class name */
  className?: string;
  /** Array of available sizes for the image */
  availableSizes?: number[];
  /** HTML sizes attribute to help browser select correct image size */
  sizes?: string;
  /** Whether to lazy load the image */
  lazy?: boolean;
  /** Whether to unload the image when offscreen */
  unloadOffscreen?: boolean;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Whether to show a blur-up effect during loading */
  blurUp?: boolean;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Multiple image sources for art direction */
  sources?: ImageSource[];
  /** Image formats to try, in order of preference */
  formats?: ImageFormat[];
  /** Loading attribute */
  loading?: 'lazy' | 'eager' | 'auto';
  /** Decoding attribute */
  decoding?: 'async' | 'sync' | 'auto';
  /** Fetch priority */
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Whether this is a critical image that should load with high priority */
  critical?: boolean;
  /** Animation to apply when image enters viewport */
  animation?: 'fade' | 'zoom' | 'slide-up' | 'none';
  /** Callback when image is loaded */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Value for native loading attribute */
  nativeLoading?: 'lazy' | 'eager';
  /** Custom crossorigin attribute */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /** Additional HTML attributes */
  [key: string]: any;
}

/**
 * Responsive Image Component
 * 
 * Renders an optimized responsive image with modern browser features
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  placeholder,
  width,
  height,
  className = '',
  availableSizes = [640, 750, 828, 1080, 1200, 1920, 2048],
  sizes = '100vw',
  lazy = true,
  unloadOffscreen = false,
  rootMargin = '200px 0px',
  blurUp = true,
  style,
  sources = [],
  formats = ['webp', 'avif', 'jpg'],
  loading,
  decoding = 'async',
  fetchPriority,
  critical = false,
  animation = 'fade',
  onLoad,
  onError,
  nativeLoading,
  crossOrigin,
  ...rest
}) => {
  // State for image loading
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Determine loading strategy (critical images load immediately)
  const shouldLazyLoad = lazy && !critical;
  
  // Use intersection observer for lazy loading
  const { ref: inViewRef, inView } = useInView({
    rootMargin,
    triggerOnce: !unloadOffscreen,
  });
  
  // Combine refs
  const setRefs = (element: HTMLImageElement | null) => {
    imgRef.current = element;
    inViewRef(element);
  };
  
  // Track if component is mounted
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Handle image load event
  const handleLoad = () => {
    if (isMounted.current) {
      setIsLoaded(true);
      onLoad?.();
    }
  };
  
  // Handle image error event
  const handleError = () => {
    if (isMounted.current) {
      setIsError(true);
      onError?.();
    }
  };
  
  // Create srcset based on available sizes
  const generateSrcSet = (imageSrc: string, format?: ImageFormat): string => {
    // If src already contains a full URL without placeholders, return it as is
    if (!imageSrc.includes('{w}') && !imageSrc.includes('{h}')) {
      return imageSrc;
    }
    
    return availableSizes
      .map((size) => {
        let url = imageSrc.replace('{w}', size.toString());
        if (imageSrc.includes('{h}') && height && width) {
          const calculatedHeight = Math.round((height / width) * size);
          url = url.replace('{h}', calculatedHeight.toString());
        }
        
        // Add format extension if provided
        if (format && !url.endsWith(`.${format}`)) {
          url = url.replace(/\.[^/.]+$/, `.${format}`);
        }
        
        return `${url} ${size}w`;
      })
      .join(', ');
  };
  
  // Process sources to use optimized formats when available
  const processedSources = useMemo(() => {
    // If no sources defined but formats are, create sources from src and formats
    if (sources.length === 0 && formats.length > 0) {
      return formats.map((format) => ({
        src,
        sizes: [{ width: width || 0 }],
        format,
      }));
    }
    
    // Otherwise, use the provided sources
    return sources;
  }, [src, sources, formats, width]);
  
  // Determine if we should show the image
  const shouldShowImage = !shouldLazyLoad || inView;
  
  // Animation class
  const animationClass = useMemo(() => {
    if (!animation || animation === 'none') return '';
    
    switch (animation) {
      case 'fade':
        return 'animate-fadeIn';
      case 'zoom':
        return 'animate-zoomIn';
      case 'slide-up':
        return 'animate-slideUp';
      default:
        return '';
    }
  }, [animation]);
  
  // Combine classes
  const combinedClassNames = [
    className,
    'responsive-image',
    isLoaded ? 'loaded' : 'loading',
    isError ? 'error' : '',
    blurUp && !isLoaded ? 'blur-up' : '',
    animationClass,
  ]
    .filter(Boolean)
    .join(' ');
  
  // Combine styles
  const combinedStyles: React.CSSProperties = {
    ...style,
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.5s ease-in-out',
  };
  
  // If we have a placeholder and blurUp enabled, add background image
  if (placeholder && blurUp && !isLoaded) {
    combinedStyles.backgroundImage = `url(${placeholder})`;
    combinedStyles.backgroundSize = 'cover';
    combinedStyles.backgroundPosition = 'center';
    combinedStyles.filter = 'blur(20px)';
  }

  // If no width/height specified and it's an empty placeholder, add default styles
  if (!width && !height && !isLoaded && !placeholder) {
    combinedStyles.backgroundColor = '#f0f0f0';
  }

  return (
    <picture>
      {/* Render image format sources */}
      {shouldShowImage && processedSources.map((source, index) => (
        <source
          key={`source-${index}`}
          srcSet={generateSrcSet(source.src, source.format)}
          type={source.format ? `image/${source.format}` : undefined}
          media={source.media}
          sizes={sizes}
        />
      ))}
      
      {/* Main image element */}
      <img
        ref={setRefs}
        src={shouldShowImage ? src : placeholder || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='}
        alt={alt}
        width={width}
        height={height}
        className={combinedClassNames}
        style={combinedStyles}
        onLoad={handleLoad}
        onError={handleError}
        loading={nativeLoading || (shouldLazyLoad ? 'lazy' : 'eager')}
        decoding={decoding}
        fetchPriority={fetchPriority || (critical ? 'high' : 'auto')}
        crossOrigin={crossOrigin}
        {...rest}
      />
    </picture>
  );
};

export default ResponsiveImage;