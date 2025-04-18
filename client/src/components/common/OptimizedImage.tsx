/**
 * OptimizedImage Component
 * 
 * A highly optimized image component with features for improved performance:
 * - Responsive images with srcSet
 * - Automatic WebP format conversion
 * - Lazy loading with blur-up effect
 * - Error handling with fallbacks
 * - Aspect ratio preservation
 */

import React, { useState, useRef, useEffect } from 'react';
import { checkWebPSupport, convertToWebP } from '../../lib/image-optimizer';
import LazyLoad from './LazyLoad';

interface OptimizedImageProps {
  /** Source URL of the image */
  src: string;
  /** Alternative text for accessibility */
  alt: string;
  /** Optional responsive srcSet */
  srcSet?: string;
  /** Optional sizes attribute for responsive images */
  sizes?: string;
  /** Fixed width in pixels */
  width?: number;
  /** Fixed height in pixels */
  height?: number;
  /** Custom CSS class */
  className?: string;
  /** Custom container CSS class */
  containerClassName?: string;
  /** Custom CSS style */
  style?: React.CSSProperties;
  /** Low-quality placeholder image to show while loading */
  placeholderSrc?: string;
  /** Enable lazy loading */
  lazy?: boolean;
  /** Function called when image loads */
  onLoad?: () => void;
  /** Function called when image fails to load */
  onError?: (error: Error) => void;
  /** Use WebP format if supported by the browser */
  useWebP?: boolean;
  /** HTML ID attribute */
  id?: string;
}

/**
 * OptimizedImage Component with advanced performance features
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  srcSet,
  sizes,
  width,
  height,
  className = '',
  containerClassName = '',
  style = {},
  placeholderSrc,
  lazy = true,
  onLoad,
  onError,
  useWebP = true,
  id,
}) => {
  // State
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [webPSupported, setWebPSupported] = useState(false);
  
  // Reference to the image element
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Check WebP support on mount
  useEffect(() => {
    if (!useWebP) return;
    
    const checkSupport = async () => {
      try {
        const supported = await checkWebPSupport();
        setWebPSupported(supported);
      } catch (e) {
        console.warn('WebP support check failed:', e);
        setWebPSupported(false);
      }
    };
    
    checkSupport();
  }, [useWebP]);
  
  // Get optimized image source with WebP if supported
  const getImageSrc = (): string => {
    if (!useWebP || !webPSupported) {
      return src;
    }
    
    return convertToWebP(src, webPSupported);
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