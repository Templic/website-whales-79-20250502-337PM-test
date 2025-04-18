/**
 * Image Optimization Utilities
 * 
 * Provides utilities for optimizing image loading and rendering.
 */

/**
 * Calculate the srcSet attribute for responsive images
 * 
 * @param basePath Base path to the image
 * @param extension Image file extension (e.g., 'jpg', 'png')
 * @param widths Array of image widths to include in the srcSet
 * @returns Properly formatted srcSet string
 */
export function generateSrcSet(
  basePath: string,
  extension: string,
  widths: number[] = [640, 768, 1024, 1280, 1536, 1920]
): string {
  const basePathWithoutExtension = basePath.replace(new RegExp(`\\.${extension}$`), '');
  
  return widths
    .map(width => {
      const responsiveImagePath = `${basePathWithoutExtension}-${width}w.${extension}`;
      return `${responsiveImagePath} ${width}w`;
    })
    .join(', ');
}

/**
 * Calculate the appropriate sizes attribute for a responsive image
 * 
 * @param sizes Array of media query configurations
 * @returns Formatted sizes attribute string
 */
export function generateSizes(
  sizes: Array<{ mediaQuery?: string; size: string }>
): string {
  return sizes
    .map(({ mediaQuery, size }) => {
      if (mediaQuery) {
        return `${mediaQuery} ${size}`;
      }
      return size;
    })
    .join(', ');
}

/**
 * Generate a placeholder blur data URL for an image
 * 
 * @param width Width of the placeholder
 * @param height Height of the placeholder
 * @param color Background color (hex)
 * @returns Data URL for the placeholder
 */
export function generatePlaceholder(
  width: number,
  height: number,
  color: string = '#f0f0f0'
): string {
  // Create a small SVG to use as a placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${color}" />
    </svg>
  `;
  
  // Convert the SVG to a base64 data URL
  const svgBase64 = btoa(svg.trim());
  return `data:image/svg+xml;base64,${svgBase64}`;
}

/**
 * Get responsive image props for an image
 * 
 * @param src Image source path
 * @param options Configuration options
 * @returns Object with responsive image attributes
 */
export function getResponsiveImageProps(
  src: string,
  options: {
    width?: number;
    height?: number;
    sizes?: Array<{ mediaQuery?: string; size: string }>;
    widths?: number[];
    placeholder?: boolean;
    placeholderColor?: string;
    priority?: boolean;
  } = {}
): {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
} {
  // Extract options with defaults
  const {
    width,
    height,
    sizes = [{ size: '100vw' }],
    widths = [640, 768, 1024, 1280, 1536, 1920],
    placeholder = true,
    placeholderColor = '#f0f0f0',
    priority = false
  } = options;
  
  // Basic properties
  const props: any = {
    src,
    loading: priority ? 'eager' : 'lazy',
  };
  
  // Add dimensions if provided
  if (width) props.width = width;
  if (height) props.height = height;
  
  // Extract file extension from src
  const extension = src.split('.').pop() || 'jpg';
  
  // Generate srcSet for responsive images
  props.srcSet = generateSrcSet(src, extension, widths);
  
  // Generate sizes attribute
  props.sizes = generateSizes(sizes);
  
  // Generate placeholder if requested and dimensions are available
  if (placeholder && width && height) {
    props.placeholder = generatePlaceholder(width, height, placeholderColor);
  }
  
  return props;
}

/**
 * Calculate the best image size for the current viewport and device pixel ratio
 * 
 * @param availableWidths Available image width options
 * @param containerWidth Width of the container element
 * @returns The optimal image width to load
 */
export function getOptimalImageWidth(
  availableWidths: number[],
  containerWidth: number
): number {
  if (!availableWidths.length) return containerWidth;
  
  // Get device pixel ratio
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Calculate the optimal width (container width * pixel ratio)
  const optimalWidth = containerWidth * pixelRatio;
  
  // Find the smallest width that is larger than the optimal width
  // or the largest available width if none are large enough
  const sorted = [...availableWidths].sort((a, b) => a - b);
  const bestWidth = sorted.find(width => width >= optimalWidth) || sorted[sorted.length - 1];
  
  return bestWidth;
}