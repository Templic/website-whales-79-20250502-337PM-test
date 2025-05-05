/**
 * SimpleGeometry.tsx
 * 
 * A clean implementation of geometric shape containers that properly 
 * contain content within their boundaries. These components use simple CSS
 * techniques to ensure text and other elements stay within shape boundaries.
 */

import React, { useState, useEffect, useRef } from 'react';

// Base props interface for all geometric shapes
interface GeometricShapeProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  adaptiveScaling?: boolean; // Enable responsive scaling
}

// Utility function for conditional class names
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Custom hook for responsive text sizing based on container dimensions
 * This ensures content fits within shape boundaries regardless of screen size
 */
function useResponsiveShape(adaptiveScaling = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<{ heading: string; content: string; button: string }>({
    heading: 'text-base',
    content: 'text-xs',
    button: 'text-xs'
  });
  
  useEffect(() => {
    if (!adaptiveScaling) return;
    
    function updateFontSizes() {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      
      // Adaptive font sizing based on container width
      if (containerWidth < 150) {
        setFontSize({
          heading: 'text-xs',
          content: 'text-[10px]',
          button: 'text-[9px]'
        });
      } else if (containerWidth < 250) {
        setFontSize({
          heading: 'text-sm',
          content: 'text-xs',
          button: 'text-xs'
        });
      } else if (containerWidth < 350) {
        setFontSize({
          heading: 'text-base',
          content: 'text-xs',
          button: 'text-xs'
        });
      } else {
        setFontSize({
          heading: 'text-lg',
          content: 'text-sm',
          button: 'text-xs'
        });
      }
    }
    
    // Initial sizing
    updateFontSizes();
    
    // Add resize listener
    window.addEventListener('resize', updateFontSizes);
    
    return () => {
      window.removeEventListener('resize', updateFontSizes);
    };
  }, [adaptiveScaling]);
  
  return { containerRef, fontSize };
}

/**
 * Simple Divider component for use inside shapes
 */
const ShapeDivider: React.FC<{
  width?: string;
  opacity?: number;
  margin?: string;
}> = ({ width = "50%", opacity = 30, margin = "0.75rem 0" }) => {
  return (
    <div 
      className="flex justify-center w-full"
      style={{ margin }}
    >
      <div 
        style={{ 
          width, 
          height: "1px", 
          backgroundColor: `rgba(255, 255, 255, ${opacity / 100})`,
        }} 
      />
    </div>
  );
};

/**
 * SimpleTriangle Component
 * A triangle shape that properly contains content
 */
export function SimpleTriangle({ 
  children, 
  className, 
  glowColor = "rgba(0, 230, 230, 0.5)",
  adaptiveScaling = true 
}: GeometricShapeProps) {
  // Use the responsive hook to get font sizes based on container width
  const { containerRef, fontSize } = useResponsiveShape(adaptiveScaling);
  
  // Process children to organize content
  const childArray = React.Children.toArray(children);
  
  // Extract headings, content and buttons
  const heading = childArray.find(child => 
    React.isValidElement(child) && 
    typeof child.type === 'string' && 
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)
  );
  
  const button = childArray.find(child => 
    React.isValidElement(child) && 
    ((typeof child.type === 'string' && child.type === 'button') || 
     (React.isValidElement(child) && child.props?.className?.includes('button')))
  );
  
  // All other content
  const content = childArray.filter(child => 
    child !== heading && child !== button
  );

  // Format heading with a line break if it's longer than 10 characters
  const formatHeading = (headingElement: React.ReactElement) => {
    const headingText = (headingElement.props as any).children || '';
    // Don't modify if it's not a string or already contains line breaks
    if (typeof headingText !== 'string' || headingText.includes('\n')) {
      return headingElement;
    }
    
    // If heading is longer than 10 characters, add a line break at a good position
    if (headingText.length > 10) {
      // Find a good split point (space around the middle)
      const words = headingText.split(' ');
      if (words.length > 1) {
        // For 2-3 words, put the last word on a new line
        // For more words, try to balance the lines
        const splitIndex = words.length <= 3 ? words.length - 1 : Math.ceil(words.length / 2);
        
        const firstLine = words.slice(0, splitIndex).join(' ');
        const secondLine = words.slice(splitIndex).join(' ');
        
        // Create new element with the line-broken text
        return React.cloneElement(headingElement, {
          children: (
            <>
              <span className="block">{firstLine}</span>
              <span className="block">{secondLine}</span>
            </>
          ),
          className: cn(fontSize.heading, 'font-medium leading-tight', (headingElement.props as any).className || '')
        });
      }
    }
    
    // If no changes needed, return with updated className
    return React.cloneElement(headingElement, {
      className: cn(fontSize.heading, 'font-medium leading-tight', (headingElement.props as any).className || '')
    });
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-[1/1.1] text-white overflow-hidden cosmic-ocean-texture cosmic-shape-hover", className)}
      style={{
        clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 1 // Ensure base container has explicit z-index
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ zIndex: -1 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
        >
          <path
            d="M50 10 L90 90 L10 90 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M50 30 L70 70 L30 70 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container with calculated spacing based on triangle geometry */}
      {/* Move all content closer to center, away from corners */}
      <div className="absolute inset-x-0 bottom-0 top-[12%] flex flex-col justify-center items-center">
        {/* Further reduced content area to ensure text stays within triangle shape */}
        <div className="w-[55%] h-[70%] flex flex-col justify-center items-center">
        
          {/* Heading at top with improved formatting and positioning */}
          <div className="w-full text-center mb-0 mt-2">
            {heading && React.isValidElement(heading) && formatHeading(heading as React.ReactElement)}
          </div>
          
          {/* Divider if needed */}
          {heading && <ShapeDivider width="40%" opacity={20} margin="0.5rem 0" />}
          
          {/* Content with improved positioning and spacing */}
          <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center px-1">
            {content.map((item, index) => {
              if (React.isValidElement(item) && typeof item.type === 'string' && item.type === 'p') {
                return React.cloneElement(item as React.ReactElement, {
                  className: cn(fontSize.content, 'leading-tight mb-1', (item.props as any).className || ''),
                  key: `triangle-content-${index}`
                });
              }
              return item;
            })}
          </div>
          
          {/* Button with improved positioning */}
          {button && (
            <div className="w-full mt-1 mb-3 flex justify-center items-center">
              {React.isValidElement(button) && React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'px-2 py-1 flex justify-center items-center', (button.props as any).className || '')
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * SimpleHexagon Component
 * A hexagon shape that properly contains content
 */
export function SimpleHexagon({ 
  children, 
  className, 
  glowColor = "rgba(111, 76, 255, 0.5)",
  adaptiveScaling = true 
}: GeometricShapeProps) {
  // Use the responsive hook to get font sizes based on container width
  const { containerRef, fontSize } = useResponsiveShape(adaptiveScaling);
  
  // Process children to organize content
  const childArray = React.Children.toArray(children);
  
  // Extract headings, content and buttons
  const heading = childArray.find(child => 
    React.isValidElement(child) && 
    typeof child.type === 'string' && 
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)
  );
  
  const button = childArray.find(child => 
    React.isValidElement(child) && 
    ((typeof child.type === 'string' && child.type === 'button') || 
     (React.isValidElement(child) && (child.props as any)?.className?.includes('button')))
  );
  
  // All other content
  const content = childArray.filter(child => 
    child !== heading && child !== button
  );

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-square text-white overflow-hidden cosmic-ocean-texture cosmic-shape-hover", className)}
      style={{
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 1
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ zIndex: -1 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
        >
          <path
            d="M25 0 L75 0 L100 50 L75 100 L25 100 L0 50 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M35 20 L65 20 L80 50 L65 80 L35 80 L20 50 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>

      {/* Content Container - ensure content stays within hexagon boundaries */}
      <div className="absolute inset-[8%] flex flex-col justify-center items-center">
        {/* Title - adaptive sizing */}
        {heading && (
          <div className="text-center mb-0">
            {React.isValidElement(heading) && 
              typeof heading.type === 'string' && 
              ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
              React.cloneElement(heading as React.ReactElement, {
                className: cn(fontSize.heading, 'font-medium leading-none m-0', (heading.props as any).className || ''),
              }) : heading
            }
          </div>
        )}
        
        {/* Divider */}
        {heading && <ShapeDivider width="50%" opacity={30} margin="0.5rem 0" />}
        
        {/* Content - kept away from edges with adaptive sizing */}
        <div className="w-full max-w-[80%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center m-0 p-0">
          {content.map((item, index) => {
            if (React.isValidElement(item) && typeof item.type === 'string' && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn(fontSize.content, 'm-0 leading-tight', (item.props as any).className || ''),
                key: `hexagon-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Button - hexagon shaped to match container */}
        {button && (
          <div className="mt-1 mb-0 flex justify-center items-center">
            {React.isValidElement(button) && typeof button.type === 'string' && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'text-center', (button.props as any).className || ''),
              }) : button
            }
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SimpleCircle Component
 * A circle shape that properly contains content
 */
export function SimpleCircle({ 
  children, 
  className, 
  glowColor = "rgba(0, 162, 255, 0.5)",
  adaptiveScaling = true
}: GeometricShapeProps) {
  // Use the responsive hook to get font sizes based on container width
  const { containerRef, fontSize } = useResponsiveShape(adaptiveScaling);
  
  // Process children to organize content
  const childArray = React.Children.toArray(children);
  
  // Extract headings, content and buttons
  const heading = childArray.find(child => 
    React.isValidElement(child) && 
    typeof child.type === 'string' && 
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)
  );
  
  const button = childArray.find(child => 
    React.isValidElement(child) && 
    ((typeof child.type === 'string' && child.type === 'button') || 
     (React.isValidElement(child) && (child.props as any)?.className?.includes('button')))
  );
  
  // All other content
  const content = childArray.filter(child => 
    child !== heading && child !== button
  );

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-square rounded-full text-white overflow-hidden cosmic-ocean-texture cosmic-shape-hover", className)}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 1
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ zIndex: -1 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="25"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>

      {/* Content Container */}
      <div className="absolute inset-[12%] flex flex-col justify-center items-center">
        {/* Title */}
        {heading && (
          <div className="text-center mb-1">
            {React.isValidElement(heading) && 
              typeof heading.type === 'string' && 
              ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
              React.cloneElement(heading as React.ReactElement, {
                className: cn(fontSize.heading, 'font-medium m-0', (heading.props as any).className || ''),
              }) : heading
            }
          </div>
        )}
        
        {/* Divider */}
        {heading && <ShapeDivider width="40%" opacity={20} margin="0.25rem 0 0.5rem" />}
        
        {/* Content */}
        <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center px-2">
          {content.map((item, index) => {
            if (React.isValidElement(item) && typeof item.type === 'string' && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn(fontSize.content, 'mb-1 leading-tight', (item.props as any).className || ''),
                key: `circle-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Button */}
        {button && (
          <div className="mt-1 flex justify-center items-center">
            {React.isValidElement(button) && 
              typeof button.type === 'string' && 
              button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'text-center rounded-full', (button.props as any).className || ''),
              }) : button
            }
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SimpleInvertedTriangle Component
 * An inverted triangle shape that properly contains content
 */
export function SimpleInvertedTriangle({ 
  children, 
  className, 
  glowColor = "rgba(138, 75, 255, 0.5)",
  adaptiveScaling = true 
}: GeometricShapeProps) {
  // Use the responsive hook to get font sizes based on container width
  const { containerRef, fontSize } = useResponsiveShape(adaptiveScaling);
  
  // Process children to organize content
  const childArray = React.Children.toArray(children);
  
  // Extract headings, content and buttons
  const heading = childArray.find(child => 
    React.isValidElement(child) && 
    typeof child.type === 'string' && 
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)
  );
  
  const button = childArray.find(child => 
    React.isValidElement(child) && 
    ((typeof child.type === 'string' && child.type === 'button') || 
     (React.isValidElement(child) && child.props?.className?.includes('button')))
  );
  
  // All other content
  const content = childArray.filter(child => 
    child !== heading && child !== button
  );

  // Format heading with a line break if it's longer than 10 characters
  const formatHeading = (headingElement: React.ReactElement) => {
    const headingText = (headingElement.props as any).children || '';
    // Don't modify if it's not a string or already contains line breaks
    if (typeof headingText !== 'string' || headingText.includes('\n')) {
      return headingElement;
    }
    
    // If heading is longer than 10 characters, add a line break at a good position
    if (headingText.length > 10) {
      // Find a good split point (space around the middle)
      const words = headingText.split(' ');
      if (words.length > 1) {
        // For 2-3 words, put the last word on a new line
        // For more words, try to balance the lines
        const splitIndex = words.length <= 3 ? words.length - 1 : Math.ceil(words.length / 2);
        
        const firstLine = words.slice(0, splitIndex).join(' ');
        const secondLine = words.slice(splitIndex).join(' ');
        
        // Create new element with the line-broken text
        return React.cloneElement(headingElement, {
          children: (
            <>
              <span className="block">{firstLine}</span>
              <span className="block">{secondLine}</span>
            </>
          ),
          className: cn(fontSize.heading, 'font-medium leading-tight', (headingElement.props as any).className || '')
        });
      }
    }
    
    // If no changes needed, return with updated className
    return React.cloneElement(headingElement, {
      className: cn(fontSize.heading, 'font-medium leading-tight', (headingElement.props as any).className || '')
    });
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-[1/1.1] text-white overflow-hidden cosmic-ocean-texture cosmic-shape-hover", className)}
      style={{
        clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 1 // Ensure base container has explicit z-index
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ zIndex: -1 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
        >
          <path
            d="M0 0 L100 0 L50 100 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M20 20 L80 20 L50 80 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container with calculated spacing based on triangle geometry */}
      {/* Move all content closer to center, away from corners */}
      <div className="absolute inset-x-0 top-[5%] bottom-0 flex flex-col justify-center items-center">
        {/* Further reduced content area to ensure text stays within triangle shape */}
        <div className="w-[70%] h-[75%] flex flex-col justify-center items-center">
        
          {/* Heading at top with improved formatting and positioning */}
          <div className="w-full text-center mb-0 mt-2">
            {heading && React.isValidElement(heading) && formatHeading(heading as React.ReactElement)}
          </div>
          
          {/* Divider if needed */}
          {heading && <ShapeDivider width="40%" opacity={20} margin="0.5rem 0" />}
          
          {/* Content with improved positioning and spacing */}
          <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center px-1">
            {content.map((item, index) => {
              if (React.isValidElement(item) && typeof item.type === 'string' && item.type === 'p') {
                return React.cloneElement(item as React.ReactElement, {
                  className: cn(fontSize.content, 'leading-tight mb-1', (item.props as any).className || ''),
                  key: `triangle-content-${index}`
                });
              }
              return item;
            })}
          </div>
          
          {/* Button with improved positioning */}
          {button && (
            <div className="w-full mt-1 mb-3 flex justify-center items-center">
              {React.isValidElement(button) && React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'px-2 py-1 flex justify-center items-center', (button.props as any).className || '')
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * SimpleOctagon Component
 * An octagon shape that properly contains content
 */
export function SimpleOctagon({ 
  children, 
  className, 
  glowColor = "rgba(138, 75, 255, 0.5)",
  adaptiveScaling = true 
}: GeometricShapeProps) {
  // Use the responsive hook to get font sizes based on container width
  const { containerRef, fontSize } = useResponsiveShape(adaptiveScaling);
  
  // Process children to organize content
  const childArray = React.Children.toArray(children);
  
  // Extract headings, content and buttons
  const heading = childArray.find(child => 
    React.isValidElement(child) && 
    typeof child.type === 'string' && 
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)
  );
  
  const button = childArray.find(child => 
    React.isValidElement(child) && 
    ((typeof child.type === 'string' && child.type === 'button') || 
     (React.isValidElement(child) && child.props?.className?.includes('button')))
  );
  
  // All other content
  const content = childArray.filter(child => 
    child !== heading && child !== button
  );

  // Format heading with a line break if it's longer than 10 characters
  const formatHeading = (headingElement: React.ReactElement) => {
    const headingText = (headingElement.props as any).children || '';
    // Don't modify if it's not a string or already contains line breaks
    if (typeof headingText !== 'string' || headingText.includes('\n')) {
      return headingElement;
    }
    
    // If heading is longer than 10 characters, add a line break at a good position
    if (headingText.length > 10) {
      // Find a good split point (space around the middle)
      const words = headingText.split(' ');
      if (words.length > 1) {
        // For 2-3 words, put the last word on a new line
        // For more words, try to balance the lines
        const splitIndex = words.length <= 3 ? words.length - 1 : Math.ceil(words.length / 2);
        
        const firstLine = words.slice(0, splitIndex).join(' ');
        const secondLine = words.slice(splitIndex).join(' ');
        
        // Create new element with the line-broken text
        return React.cloneElement(headingElement, {
          children: (
            <>
              <span className="block">{firstLine}</span>
              <span className="block">{secondLine}</span>
            </>
          ),
          className: cn(fontSize.heading, 'font-medium leading-tight', (headingElement.props as any).className || '')
        });
      }
    }
    
    // If no changes needed, return with updated className
    return React.cloneElement(headingElement, {
      className: cn(fontSize.heading, 'font-medium leading-tight', (headingElement.props as any).className || '')
    });
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-[1/1] text-white overflow-hidden cosmic-ocean-texture cosmic-shape-hover", className)}
      style={{
        clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 1 // Ensure base container has explicit z-index
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ zIndex: -1 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
        >
          <path
            d="M30 0 L70 0 L100 30 L100 70 L70 100 L30 100 L0 70 L0 30 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M40 20 L60 20 L80 40 L80 60 L60 80 L40 80 L20 60 L20 40 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-4">
        <div className="w-[80%] h-[80%] flex flex-col justify-center items-center">
        
          {/* Heading at top with improved formatting and positioning */}
          <div className="w-full text-center mb-1">
            {heading && React.isValidElement(heading) && formatHeading(heading as React.ReactElement)}
          </div>
          
          {/* Divider if needed */}
          {heading && <ShapeDivider width="40%" opacity={20} margin="0.5rem 0" />}
          
          {/* Content with improved positioning and spacing */}
          <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center px-1">
            {content.map((item, index) => {
              if (React.isValidElement(item) && typeof item.type === 'string' && item.type === 'p') {
                return React.cloneElement(item as React.ReactElement, {
                  className: cn(fontSize.content, 'leading-tight mb-1', (item.props as any).className || ''),
                  key: `octagon-content-${index}`
                });
              }
              return item;
            })}
          </div>
          
          {/* Button with improved positioning */}
          {button && (
            <div className="w-full mt-2 mb-2 flex justify-center items-center">
              {React.isValidElement(button) && React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'px-2 py-1 flex justify-center items-center', (button.props as any).className || '')
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * SimpleStarburst Component
 * A starburst shape that properly contains content
 */
export function SimpleStarburst({ 
  children, 
  className, 
  glowColor = "rgba(0, 180, 216, 0.5)",
  adaptiveScaling = true 
}: GeometricShapeProps) {
  // Use the responsive hook to get font sizes based on container width
  const { containerRef, fontSize } = useResponsiveShape(adaptiveScaling);
  
  // Process children to organize content
  const childArray = React.Children.toArray(children);
  
  // Extract headings, content and buttons
  const heading = childArray.find(child => 
    React.isValidElement(child) && 
    typeof child.type === 'string' && 
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)
  );
  
  const button = childArray.find(child => 
    React.isValidElement(child) && 
    ((typeof child.type === 'string' && child.type === 'button') || 
     (React.isValidElement(child) && child.props?.className?.includes('button')))
  );
  
  // All other content
  const content = childArray.filter(child => 
    child !== heading && child !== button
  );

  // Format heading with a line break if it's longer than 10 characters
  const formatHeading = (headingElement: React.ReactElement) => {
    const headingText = (headingElement.props as any).children || '';
    // Don't modify if it's not a string or already contains line breaks
    if (typeof headingText !== 'string' || headingText.includes('\n')) {
      return headingElement;
    }
    
    // If heading is longer than 10 characters, add a line break at a good position
    if (headingText.length > 10) {
      // Find a good split point (space around the middle)
      const words = headingText.split(' ');
      if (words.length > 1) {
        // For 2-3 words, put the last word on a new line
        // For more words, try to balance the lines
        const splitIndex = words.length <= 3 ? words.length - 1 : Math.ceil(words.length / 2);
        
        const firstLine = words.slice(0, splitIndex).join(' ');
        const secondLine = words.slice(splitIndex).join(' ');
        
        // Create new element with the line-broken text
        return React.cloneElement(headingElement, {
          children: (
            <>
              <span className="block">{firstLine}</span>
              <span className="block">{secondLine}</span>
            </>
          ),
          className: cn(fontSize.heading, 'font-medium leading-tight', (headingElement.props as any).className || '')
        });
      }
    }
    
    // If no changes needed, return with updated className
    return React.cloneElement(headingElement, {
      className: cn(fontSize.heading, 'font-medium leading-tight', (headingElement.props as any).className || '')
    });
  };

  // Create starburst clips (8-pointed star)
  const clipPath = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
  
  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-[1/1] text-white overflow-hidden cosmic-ocean-texture cosmic-shape-hover", className)}
      style={{
        clipPath: clipPath,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 1 // Ensure base container has explicit z-index
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ zIndex: -1 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
        >
          <path
            d="M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M50 15 L58 40 L85 40 L63 55 L70 80 L50 65 L30 80 L37 55 L15 40 L42 40 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-4">
        <div className="w-[80%] h-[80%] flex flex-col justify-center items-center">
        
          {/* Heading at top with improved formatting and positioning */}
          <div className="w-full text-center mb-1">
            {heading && React.isValidElement(heading) && formatHeading(heading as React.ReactElement)}
          </div>
          
          {/* Divider if needed */}
          {heading && <ShapeDivider width="40%" opacity={20} margin="0.5rem 0" />}
          
          {/* Content with improved positioning and spacing */}
          <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center px-1">
            {content.map((item, index) => {
              if (React.isValidElement(item) && typeof item.type === 'string' && item.type === 'p') {
                return React.cloneElement(item as React.ReactElement, {
                  className: cn(fontSize.content, 'leading-tight mb-1', (item.props as any).className || ''),
                  key: `starburst-content-${index}`
                });
              }
              return item;
            })}
          </div>
          
          {/* Button with improved positioning */}
          {button && (
            <div className="w-full mt-2 mb-2 flex justify-center items-center">
              {React.isValidElement(button) && React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'px-2 py-1 flex justify-center items-center', (button.props as any).className || '')
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default {
  SimpleTriangle,
  SimpleHexagon,
  SimpleCircle,
  SimpleInvertedTriangle,
  SimpleOctagon,
  SimpleStarburst
};