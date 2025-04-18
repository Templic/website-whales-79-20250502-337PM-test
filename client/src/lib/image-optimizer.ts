/**
 * Image Optimization Utilities
 * 
 * Provides utilities for optimizing images for web display using
 * responsive techniques, lazy loading, and optimal formats.
 */

// Types for image optimization
export interface ResponsiveSize {
  size: string; // CSS size value like "800px" or "100vw"
  maxWidth?: number; // Max width in pixels for this size
}

export interface ResponsiveImageOptions {
  width: number;
  height: number;
  sizes: ResponsiveSize[];
  placeholder?: boolean;
  placeholderColor?: string;
  priority?: boolean;
}

export interface ResponsiveImageProps {
  src: string;
  srcSet?: string;
  placeholder?: string;
}

/**
 * Generate a responsive srcSet for an image
 * 
 * @param src Original image source URL
 * @param options Options for generating responsive images
 * @returns Object with src, srcSet, and placeholder properties
 */
export function getResponsiveImageProps(
  src: string,
  options: ResponsiveImageOptions
): ResponsiveImageProps {
  // Default widths for responsive images (can be customized)
  const defaultWidths = [320, 640, 960, 1280, 1920];
  
  // Get widths based on original image size and responsive needs
  const widths = getOptimalWidths(options.width, defaultWidths, options.sizes);
  
  // Generate srcSet with optimal widths
  const srcSet = generateSrcSet(src, widths);
  
  // Generate placeholder if needed
  const placeholder = options.placeholder ? generatePlaceholder(src, options) : undefined;
  
  return {
    src,
    srcSet,
    placeholder
  };
}

/**
 * Calculate optimal widths for responsive images
 * 
 * @param originalWidth Original image width
 * @param defaultWidths Default widths to use
 * @param sizes Responsive sizes configuration
 * @returns Array of optimal widths
 */
function getOptimalWidths(
  originalWidth: number,
  defaultWidths: number[],
  sizes: ResponsiveSize[]
): number[] {
  // Filter out widths larger than original to avoid upscaling
  const filteredWidths = defaultWidths.filter(width => width <= originalWidth);
  
  // Always include the original width
  if (!filteredWidths.includes(originalWidth)) {
    filteredWidths.push(originalWidth);
  }
  
  // Add any maxWidth from sizes if specified
  sizes.forEach(size => {
    if (size.maxWidth && size.maxWidth <= originalWidth && !filteredWidths.includes(size.maxWidth)) {
      filteredWidths.push(size.maxWidth);
    }
  });
  
  // Sort widths in ascending order
  return filteredWidths.sort((a, b) => a - b);
}

/**
 * Generate srcSet attribute for responsive images
 * 
 * @param src Original image source
 * @param widths Array of widths to generate srcSet for
 * @returns srcSet string
 */
function generateSrcSet(src: string, widths: number[]): string {
  return widths
    .map(width => {
      // Generate optimized URL for this width
      const optimizedUrl = getOptimizedImageUrl(src, width);
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate a placeholder image for blur-up loading
 * 
 * @param src Original image source
 * @param options Optimization options
 * @returns Placeholder image URL
 */
function generatePlaceholder(src: string, options: ResponsiveImageOptions): string {
  // In a production environment, you would generate a tiny placeholder
  // For this implementation, we'll just use a small version of the image
  return getOptimizedImageUrl(src, 20); // Tiny 20px wide version
}

/**
 * Get an optimized image URL for a specific width
 * 
 * @param src Original image source
 * @param width Target width
 * @returns Optimized image URL
 */
function getOptimizedImageUrl(src: string, width: number): string {
  // In a production environment, you would transform the URL to point to
  // an image optimization service like Cloudinary, Imgix, or a custom endpoint
  
  // For this implementation, we'll just add a width parameter to the URL
  // This assumes the server can handle width parameters
  
  // Check if URL already has query parameters
  const hasQuery = src.includes('?');
  const separator = hasQuery ? '&' : '?';
  
  return `${src}${separator}w=${width}`;
}

/**
 * Calculate aspect ratio for an image
 * 
 * @param width Image width
 * @param height Image height
 * @returns Aspect ratio (height / width)
 */
export function calculateAspectRatio(width: number, height: number): number {
  return height / width;
}

/**
 * Preload critical images for faster rendering
 * 
 * @param urls Array of image URLs to preload
 */
export function preloadCriticalImages(urls: string[]): void {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Determine if WebP format is supported by the browser
 * 
 * @returns Promise that resolves to true if WebP is supported
 */
export async function supportsWebP(): Promise<boolean> {
  if (!self.createImageBitmap) return false;
  
  const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  const blob = await fetch(webpData).then(r => r.blob());
  
  return createImageBitmap(blob).then(() => true, () => false);
}

/**
 * Get the best image format supported by the browser
 * 
 * @returns Promise that resolves to the best format ('webp', 'avif', or 'jpg')
 */
export async function getBestImageFormat(): Promise<'webp' | 'avif' | 'jpg'> {
  // Check for AVIF support
  try {
    if (await supportsFormat('avif')) {
      return 'avif';
    }
  } catch (e) {
    console.warn('Error checking AVIF support:', e);
  }
  
  // Check for WebP support
  try {
    if (await supportsWebP()) {
      return 'webp';
    }
  } catch (e) {
    console.warn('Error checking WebP support:', e);
  }
  
  // Fallback to JPG
  return 'jpg';
}

/**
 * Test if a specific image format is supported
 * 
 * @param format Image format to test
 * @returns Promise that resolves to true if format is supported
 */
async function supportsFormat(format: string): Promise<boolean> {
  if (!self.createImageBitmap) return false;
  
  let testData = '';
  
  switch (format.toLowerCase()) {
    case 'webp':
      testData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
      break;
    case 'avif':
      testData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
      break;
    default:
      return false;
  }
  
  try {
    const blob = await fetch(testData).then(r => r.blob());
    return createImageBitmap(blob).then(() => true, () => false);
  } catch (e) {
    return false;
  }
}