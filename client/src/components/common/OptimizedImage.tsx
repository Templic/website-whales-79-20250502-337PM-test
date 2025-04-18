/**
 * OptimizedImage Component
 * 
 * A wrapper component for optimizing image loading with lazy loading and responsive sizing.
 * This component helps improve performance by deferring image loading until needed
 * and using appropriate image sizes for different device sizes.
 */

import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  /**
   * Source URL of the image
   */
  src: string;
  
  /**
   * Alt text for the image (required for accessibility)
   */
  alt: string;
  
  /**
   * Width of the image in pixels
   */
  width?: number;
  
  /**
   * Height of the image in pixels
   */
  height?: number;
  
  /**
   * Additional CSS classes to apply to the image
   */
  className?: string;
  
  /**
   * Load the image in prioritized mode (for critical images above the fold)
   */
  priority?: boolean;
  
  /**
   * Sources array for responsive images
   * @example [{ srcSet: '/image-sm.jpg', media: '(max-width: 640px)' }]
   */
  sources?: Array<{
    srcSet: string;
    media?: string;
    type?: string;
  }>;
  
  /**
   * Object fit property for the image
   */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  
  /**
   * Placeholder blur hash or URL
   */
  placeholder?: string;
}

/**
 * OptimizedImage component for better image loading performance
 * 
 * @example
 * ```tsx
 * <OptimizedImage 
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width={800}
 *   height={600}
 *   className="rounded-lg"
 *   priority={true}
 *   sources={[
 *     { srcSet: '/images/hero-sm.jpg', media: '(max-width: 640px)' },
 *     { srcSet: '/images/hero-md.jpg', media: '(max-width: 1024px)' }
 *   ]}
 *   objectFit="cover"
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sources = [],
  objectFit = 'cover',
  placeholder
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (!imgRef.current || priority) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    );
    
    observer.observe(imgRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [priority]);
  
  // Support for native lazy loading
  const shouldLoad = priority || isInView;
  
  const style: React.CSSProperties = {
    objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
    backgroundColor: placeholder ? undefined : '#f0f0f0',
    backgroundImage: placeholder ? `url(${placeholder})` : undefined,
    backgroundSize: placeholder ? 'cover' : undefined,
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
  };
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
      }}
    >
      {sources.length > 0 ? (
        <picture>
          {sources.map((source, index) => (
            <source key={index} srcSet={shouldLoad ? source.srcSet : undefined} media={source.media} type={source.type} />
          ))}
          <img
            ref={imgRef}
            src={shouldLoad ? src : ''}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            className={className}
            style={style}
            onLoad={() => setIsLoaded(true)}
          />
        </picture>
      ) : (
        <img
          ref={imgRef}
          src={shouldLoad ? src : ''}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          className={className}
          style={style}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
}

export default OptimizedImage;