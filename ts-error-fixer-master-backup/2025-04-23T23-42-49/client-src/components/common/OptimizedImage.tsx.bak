import React, { useState, useEffect, useRef, CSSProperties, memo } from 'react';
import { useMemoryLeakDetection } from '@/lib/memory-leak-detector';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  placeholderColor?: string;
  blurHash?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  fadeIn?: boolean;
  decode?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackComponent?: React.ReactNode;
  sizes?: string;
  srcSet?: string;
  objectFit?: CSSProperties['objectFit'];
  objectPosition?: CSSProperties['objectPosition'];
  draggable?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

/**
 * Optimized image component with lazy loading, blur hash placeholder, and performance optimizations
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  placeholderColor = '#e2e8f0',
  blurHash,
  priority = false,
  loading = 'lazy',
  fadeIn = true,
  decode = true,
  fallbackSrc,
  onLoad,
  onError,
  fallbackComponent,
  sizes,
  srcSet,
  objectFit,
  objectPosition,
  draggable,
  crossOrigin,
  referrerPolicy,
}) => {
  // Track this component for memory leak detection
  useMemoryLeakDetection('OptimizedImage');
  
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [isVisible, setIsVisible] = useState(priority);
  
  // Generate a blurred placeholder from the blur hash if provided
  useEffect(() => {
    if (blurHash) {
      // This would normally use a library like blurhash-wasm or blurhash to decode
      // For this implementation, we'll just simulate it with a placeholder color
      // in a production application you would use:
      // import { decode } from 'blurhash';
      // 
      // const pixels = decode(blurHash, 32, 32);
      // const canvas = document.createElement('canvas');
      // canvas.width = 32;
      // canvas.height = 32;
      // const ctx = canvas.getContext('2d');
      // const imageData = ctx.createImageData(32, 32);
      // imageData.data.set(pixels);
      // ctx.putImageData(imageData, 0, 0);
      // setBlurDataUrl(canvas.toDataURL());
      
      setBlurDataUrl(`${placeholderColor}`);
    }
  }, [blurHash, placeholderColor]);
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsVisible(true);
      return;
    }
    
    if (loading === 'eager') {
      setIsVisible(true);
      return;
    }
    
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          if (observer.current && imgRef.current) {
            observer.current.unobserve(imgRef.current);
            observer.current.disconnect();
            observer.current = null;
          }
        }
      });
    };
    
    if (imgRef.current && !isVisible) {
      observer.current = new IntersectionObserver(handleIntersection, {
        rootMargin: '200px', // Load images 200px before they come into view
        threshold: 0.01,
      });
      
      observer.current.observe(imgRef.current);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }
    };
  }, [priority, loading, isVisible]);
  
  // Handle image load
  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };
  
  // Handle image error
  const handleError = () => {
    setError(true);
    onError?.();
  };
  
  // When image becomes visible, decode it if supported
  useEffect(() => {
    if (isVisible && imgRef.current && !loaded && decode) {
      const image = imgRef.current;
      
      if (image.complete) {
        handleLoad();
        return;
      }
      
      // Use the decode API if available to prevent jank when image is displayed
      if (image.decode) {
        image.decode()
          .then(handleLoad)
          .catch(() => {
            // If decode fails, still try to load the image normally
            // We don't call handleError here because the image might still load
          });
      }
    }
  }, [isVisible, loaded, decode]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }
    };
  }, []);
  
  // If there's an error and we have a fallback, show it
  if (error) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          style={{ 
            objectFit,
            objectPosition,
            ...style,
           }}
          draggable={draggable}
          crossOrigin={crossOrigin}
          referrerPolicy={referrerPolicy}
        />
      );
    }
  }
  
  // Determine final image src
  const imageSrc = isVisible ? src : '';
  
  // Base styles
  const imageStyles: CSSProperties = {
    objectFit,
    objectPosition,
    backgroundColor: !loaded && placeholderColor ? placeholderColor : undefined,
    transition: fadeIn ? 'opacity 0.5s ease-in-out' : undefined,
    opacity: loaded ? 1 : 0,
    ...style,
  };
  
  // If we have a blur hash and the image isn't loaded, show a placeholder
  const placeholderStyles: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    backgroundColor: placeholderColor,
    backgroundImage: blurDataUrl ? `url(${blurDataUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: loaded ? 0 : 1,
    transition: 'opacity 0.5s ease-in-out',
  };
  
  return (
    <div
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        width,
        height,
        display: 'inline-block',
       }}
      className={className}
    >
      {(blurDataUrl || placeholderColor) && (
        <div style={placeholderStyles} aria-hidden="true" />
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        srcSet={isVisible ? srcSet : undefined}
        sizes={isVisible ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : loading}
        style={imageStyles}
        draggable={draggable}
        crossOrigin={crossOrigin}
        referrerPolicy={referrerPolicy}
      />
    </div>
  );
};

export default memo(OptimizedImage);