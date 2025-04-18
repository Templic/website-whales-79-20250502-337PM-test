/**
 * OptimizedImage Component
 * 
 * A React component for optimized image loading with:
 * - Progressive loading (blur-up technique)
 * - Lazy loading with Intersection Observer
 * - Responsive image loading with srcSet
 * - WebP format support with fallback
 * - Image error handling
 */

import React, { useState, useEffect, useRef } from 'react';
import LazyLoad from './LazyLoad';

interface OptimizedImageProps {
  /** Main image source URL */
  src: string;
  /** Alternative text for accessibility */
  alt: string;
  /** Optional low-quality placeholder image */
  placeholderSrc?: string;
  /** Width of the image in pixels */
  width?: number;
  /** Height of the image in pixels */
  height?: number;
  /** CSS class for the image */
  className?: string;
  /** CSS class for the container */
  containerClassName?: string;
  /** Unique identifier */
  id?: string;
  /** Whether to lazy load the image */
  lazy?: boolean;
  /** Responsive srcSet attribute */
  srcSet?: string;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Callback for when image is loaded */
  onLoad?: () => void;
  /** Callback for when image fails to load */
  onError?: (error: Error) => void;
  /** Whether to use WebP format if supported */
  useWebP?: boolean;
  /** Style overrides for the image */
  style?: React.CSSProperties;
}

/**
 * OptimizedImage Component
 * 
 * Renders images with optimized loading techniques for performance.
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  placeholderSrc,
  width,
  height,
  className = '',
  containerClassName = '',
  id,
  lazy = true,
  srcSet,
  sizes,
  onLoad,
  onError,
  useWebP = true,
  style,
}) => {
  // State
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [webPSupported, setWebPSupported] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Check WebP support on mount
  useEffect(() => {
    if (useWebP) {
      const webPImage = new Image();
      webPImage.onload = () => setWebPSupported(true);
      webPImage.onerror = () => setWebPSupported(false);
      webPImage.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    }
  }, [useWebP]);
  
  // Prepare image sources
  const getImageSrc = (): string => {
    if (!useWebP || !webPSupported) return src;
    
    // Convert to WebP if supported
    if (src.match(/\.(jpg|jpeg|png)(\?.*)?$/i)) {
      return src.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, '.webp$2');
    }
    
    return src;
  };
  
  const getSrcSet = (): string | undefined => {
    if (!srcSet || !useWebP || !webPSupported) return srcSet;
    
    // Convert all srcSet entries to WebP
    return srcSet
      .split(',')
      .map((srcSetItem) => {
        const parts = srcSetItem.trim().split(' ');
        if (parts.length < 2) return srcSetItem;
        
        const url = parts[0];
        const descriptor = parts.slice(1).join(' ');
        
        if (url && url.match(/\.(jpg|jpeg|png)(\?.*)?$/i)) {
          return `${url.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, '.webp$2')} ${descriptor}`;
        }
        return srcSetItem;
      })
      .join(', ');
  };
  
  // Handle image loading
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };
  
  // Handle image error
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgError = new Error(`Failed to load image: ${src}`);
    setError(imgError);
    if (onError) onError(imgError);
    
    // If WebP failed, try falling back to original format
    if (useWebP && webPSupported && imageRef.current) {
      imageRef.current.src = src;
    }
  };
  
  // Style for progressive loading effect
  const imgStyle: React.CSSProperties = {
    transition: 'filter 0.3s ease-out, opacity 0.3s ease-out',
    filter: isLoaded ? 'blur(0)' : 'blur(10px)',
    opacity: isLoaded ? 1 : 0.6,
    width: width ? '100%' : undefined,
    height: height ? '100%' : undefined,
    objectFit: width && height ? 'cover' : undefined,
    ...style,
  };
  
  // Container style
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: width ? `${width}px` : 'auto',
    height: height ? `${height}px` : 'auto',
  };
  
  // Placeholder image if provided
  const placeholderImage = placeholderSrc ? (
    <img
      src={placeholderSrc}
      alt=""
      aria-hidden="true"
      className={`optimized-image-placeholder ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        filter: 'blur(10px)',
        opacity: isLoaded ? 0 : 0.8,
        transition: 'opacity 0.3s ease-out',
        objectFit: 'cover',
      }}
    />
  ) : null;
  
  // Image component
  const imageComponent = (
    <div
      className={`optimized-image-container ${containerClassName}`}
      style={containerStyle}
    >
      {placeholderImage}
      <img
        ref={imageRef}
        src={getImageSrc()}
        srcSet={getSrcSet()}
        sizes={sizes}
        alt={alt}
        className={`optimized-image ${className}`}
        style={imgStyle}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        id={id}
        loading="lazy" // Native lazy loading as additional fallback
      />
      
      {error && (
        <div className="optimized-image-error">
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
  
  // Wrap with LazyLoad if requested
  return lazy ? (
    <LazyLoad
      height={height}
      width={width}
      className="optimized-image-lazy-container"
    >
      {imageComponent}
    </LazyLoad>
  ) : (
    imageComponent
  );
};

export default OptimizedImage;