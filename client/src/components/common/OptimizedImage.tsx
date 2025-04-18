/**
 * OptimizedImage Component
 * 
 * A component that optimizes image loading and rendering:
 * - Supports responsive sizing with srcSet
 * - Implements lazy loading
 * - Provides placeholder/blur-up loading
 * - Optimized for Core Web Vitals metrics
 */

import React, { useState, useEffect, useRef } from 'react';
import { getResponsiveImageProps } from '@/lib/image-optimizer';
import LazyLoad from './LazyLoad';

interface OptimizedImageProps {
  /** Source URL of the image */
  src: string;
  /** Alternative text for accessibility */
  alt: string;
  /** Width of the image in pixels */
  width?: number;
  /** Height of the image in pixels */
  height?: number;
  /** CSS class name to apply to the image */
  className?: string;
  /** Object fit style */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Object position style */
  objectPosition?: string;
  /** Whether to load immediately or lazily */
  loading?: 'eager' | 'lazy';
  /** Higher priority images load sooner */
  priority?: boolean;
  /** Whether to enable blur-up loading effect */
  blurUp?: boolean;
  /** Color to use for placeholder */
  placeholderColor?: string;
  /** CSS class to apply to the wrapper */
  wrapperClass?: string;
  /** Responsive sizes attribute */
  sizes?: string;
  /** Maximum width to load (saves bandwidth) */
  maxWidth?: number;
  /** Custom onLoad callback */
  onLoad?: () => void;
  /** Custom onError callback */
  onError?: (error: Error) => void;
}

/**
 * OptimizedImage Component
 * 
 * A component that optimizes image loading and rendering using responsive techniques
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  priority = false,
  blurUp = true,
  placeholderColor = '#f0f0f0',
  wrapperClass = '',
  sizes = '100vw',
  maxWidth,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Calculate aspect ratio for the placeholder
  const aspectRatio = height && width ? height / width : undefined;
  
  // Get responsive image properties
  const responsiveProps = width && height
    ? getResponsiveImageProps(src, {
        width,
        height,
        sizes: [{ size: sizes }],
        placeholder: blurUp,
        placeholderColor,
        priority: priority || loading === 'eager'
      })
    : { src };
  
  // Handle successful loading
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };
  
  // Handle loading errors
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const errorMessage = `Failed to load image: ${src}`;
    const error = new Error(errorMessage);
    setError(error);
    if (onError) {
      onError(error);
    }
    console.error(errorMessage);
  };
  
  // Verify image is in view
  useEffect(() => {
    if (priority && imgRef.current) {
      // For priority images, we check if they're actually loaded
      if (imgRef.current.complete) {
        handleLoad();
      }
    }
  }, [priority]);
  
  // Image styles
  const imageStyles: React.CSSProperties = {
    objectFit,
    objectPosition,
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    width: '100%',
    height: '100%',
  };
  
  // Wrapper style, maintaining aspect ratio if dimensions are provided
  const wrapperStyles: React.CSSProperties = {};
  if (aspectRatio) {
    wrapperStyles.paddingBottom = `${aspectRatio * 100}%`;
    wrapperStyles.height = 0;
    wrapperStyles.position = 'relative';
  }
  
  // Placeholder styles for blur-up effect
  const placeholderStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: placeholderColor,
    opacity: isLoaded ? 0 : 1,
    transition: 'opacity 0.2s ease-in-out',
  };
  
  // Render the image
  const renderImage = () => (
    <div
      className={`optimized-image-wrapper ${wrapperClass}`}
      style={wrapperStyles}
    >
      {/* Actual image */}
      <img
        ref={imgRef}
        src={responsiveProps.src}
        srcSet={responsiveProps.srcSet}
        sizes={sizes}
        alt={alt}
        className={`optimized-image ${className}`}
        style={imageStyles}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        data-priority={priority}
      />
      
      {/* Placeholder/blur element */}
      {blurUp && !isLoaded && !error && (
        <div 
          className="optimized-image-placeholder"
          style={placeholderStyles}
        >
          {responsiveProps.placeholder && (
            <img
              src={responsiveProps.placeholder}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                filter: 'blur(10px)',
                transform: 'scale(1.1)', // Prevent blur edges
              }}
            />
          )}
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div
          className="optimized-image-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f8d7da',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            color: '#721c24',
          }}
        >
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
  
  // For non-priority images, wrap in LazyLoad
  return priority ? (
    renderImage()
  ) : (
    <LazyLoad
      height={height}
      width={width}
      className={wrapperClass}
    >
      {renderImage()}
    </LazyLoad>
  );
};

export default OptimizedImage;