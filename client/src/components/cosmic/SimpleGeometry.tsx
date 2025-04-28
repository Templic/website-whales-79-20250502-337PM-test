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

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-[1/1.1] text-white overflow-hidden", className)}
      style={{
        clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
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
      <div className="absolute inset-x-0 bottom-0 top-[15%] flex flex-col justify-center items-center">
        {/* Use a smaller central content area */}
        <div className="w-[80%] h-[75%] flex flex-col justify-center items-center">
        
          {/* Heading at top - in a triangle, place heading in wider part (bottom) */}
          <div className="w-full text-center mb-0">
            {heading && (
              <div className="text-center">
                {React.isValidElement(heading) && 
                 typeof heading.type === 'string' && 
                 ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                  React.cloneElement(heading as React.ReactElement, {
                    className: cn(fontSize.heading, 'font-medium', (heading.props as any).className || ''),
                  }) : heading
                }
              </div>
            )}
          </div>
          
          {/* Divider - minimal margin */}
          <ShapeDivider width="40%" opacity={30} margin="0 0" />
          
          {/* Main content in center - compact */}
          <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center mt-0 mb-0">
            {/* Map to ensure proper styling of paragraphs with adaptive sizing */}
            {content.map((item, index) => {
              if (React.isValidElement(item) && item.type === 'p') {
                return React.cloneElement(item as React.ReactElement, {
                  className: cn(fontSize.content, 'my-0 leading-tight', (item.props as any).className || ''),
                  key: `triangle-content-${index}`
                });
              }
              return item;
            })}
          </div>
          
          {/* Button - triangle-shaped to match container */}
          {button && (
            <div className="mt-0 flex justify-center items-center w-full">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn(fontSize.button, 'text-center', (button.props as any).className || ''),
                  style: {
                    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                    padding: "0.15rem 0.8rem 0.3rem",
                    background: (button.props as any).className?.includes('bg-') 
                      ? undefined 
                      : "rgba(0, 100, 255, 0.6)",
                    border: "none"
                  }
                }) : button
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * SimpleInvertedTriangle Component
 * An inverted triangle that properly contains content
 */
export function SimpleInvertedTriangle({ 
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

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-[1/1.1] text-white overflow-hidden", className)}
      style={{
        clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
        >
          <path
            d="M10 10 L90 10 L50 90 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M30 30 L70 30 L50 70 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container with calculated spacing based on inverted triangle geometry */}
      {/* The container takes an inverted triangle shape into account - wider at top, narrower at bottom */}
      <div className="absolute inset-x-0 top-0 bottom-[15%] flex flex-col justify-between items-center">
        {/* Heading at top of inverted triangle (visually widest part) */}
        <div className="w-[85%] mt-1.5">
          {heading && (
            <div className="text-center">
              {React.isValidElement(heading) && 
               typeof heading.type === 'string' && 
               ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                React.cloneElement(heading as React.ReactElement, {
                  className: cn(fontSize.heading, 'font-medium', (heading.props as any).className || ''),
                }) : heading
              }
            </div>
          )}
        </div>
        
        {/* Divider - placed near top */}
        <ShapeDivider width="60%" opacity={30} margin="0.1rem 0" />
        
        {/* Main content in middle of inverted triangle - width decreases as we move down */}
        <div className="w-[70%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center mt-0.5">
          {/* Map to ensure proper styling of paragraphs with adaptive sizing */}
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn(fontSize.content, 'my-0.5 leading-tight', (item.props as any).className || ''),
                key: `inverted-triangle-content-${index}`
              });
            }
            return item;
          })}
        </div>
          
        {/* Button container - positioned at bottom of visible area (narrow part) */}
        <div className="w-[40%] mb-1">
          {/* Button at bottom of inverted triangle (visually smallest part) */}
          {button && (
            <div className="flex justify-center items-center scale-90">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn(fontSize.button, 'py-0.5 px-3', (button.props as any).className || ''),
                }) : button
              }
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

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-square text-white overflow-hidden", className)}
      style={{
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
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
          <div className="text-center mb-0.5">
            {React.isValidElement(heading) && 
             typeof heading.type === 'string' && 
             ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
              React.cloneElement(heading as React.ReactElement, {
                className: cn(fontSize.heading, 'font-medium mb-0', (heading.props as any).className || ''),
              }) : heading
            }
          </div>
        )}
        
        {/* Divider */}
        <ShapeDivider width="50%" opacity={30} margin="0.1rem 0" />
        
        {/* Content - kept away from edges with adaptive sizing */}
        <div className="w-full max-w-[80%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center pt-0.5 pb-0.5">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn(fontSize.content, 'my-0.5 leading-tight', (item.props as any).className || ''),
                key: `hexagon-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Button - adaptive sizing for button */}
        {button && (
          <div className="mt-0.5 mb-0.5 flex justify-center items-center">
            {React.isValidElement(button) && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'py-0.5 px-3 scale-90', (button.props as any).className || ''),
              }) : button
            }
          </div>
        )}
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

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-square text-white overflow-hidden", className)}
      style={{
        clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
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
            d="M35 15 L65 15 L85 35 L85 65 L65 85 L35 85 L15 65 L15 35 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container - ensure content stays within octagon boundaries */}
      <div className="absolute inset-[10%] flex flex-col justify-center items-center">
        {/* Title - adaptive sizing */}
        {heading && (
          <div className="text-center mb-0.5">
            {React.isValidElement(heading) && 
             typeof heading.type === 'string' && 
             ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
              React.cloneElement(heading as React.ReactElement, {
                className: cn(fontSize.heading, 'font-medium mb-0', (heading.props as any).className || ''),
              }) : heading
            }
          </div>
        )}
        
        {/* Divider */}
        <ShapeDivider width="60%" opacity={30} margin="0.1rem 0" />
        
        {/* Content - kept away from edges with adaptive sizing */}
        <div className="w-full max-w-[85%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center pt-0.5 pb-0.5">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn(fontSize.content, 'my-0.5 leading-tight', (item.props as any).className || ''),
                key: `octagon-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Button - adaptive sizing for button */}
        {button && (
          <div className="mt-0.5 mb-0.5 flex justify-center items-center">
            {React.isValidElement(button) && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'py-0.5 px-3 scale-90', (button.props as any).className || ''),
              }) : button
            }
          </div>
        )}
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
  
  // Scale factors - starburst needs more aggressive scaling due to its intricate shape
  const getStarburstScaleFactors = () => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      
      // Smaller scales for smaller sizes to ensure content fits in star points
      if (width < 150) {
        return {
          containerWidth: '50%', // Even smaller container for tiny stars
          containerHeight: '50%',
          headingClass: 'text-[9px]',
          contentClass: 'text-[8px]',
          buttonClass: 'text-[8px] scale-75'
        };
      } else if (width < 250) {
        return {
          containerWidth: '55%',
          containerHeight: '55%',
          headingClass: 'text-[10px]',
          contentClass: 'text-[9px]',
          buttonClass: 'text-[9px] scale-80'
        };
      } else if (width < 350) {
        return {
          containerWidth: '60%',
          containerHeight: '60%',
          headingClass: 'text-xs',
          contentClass: 'text-[10px]',
          buttonClass: 'text-[10px] scale-90'
        };
      } else {
        return {
          containerWidth: '65%',
          containerHeight: '65%',
          headingClass: 'text-sm',
          contentClass: 'text-xs',
          buttonClass: 'text-xs'
        };
      }
    }
    
    // Default scales
    return {
      containerWidth: '60%',
      containerHeight: '60%',
      headingClass: 'text-xs',
      contentClass: 'text-[10px]',
      buttonClass: 'text-[10px] scale-90'
    };
  };
  
  const scales = getStarburstScaleFactors();
  
  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-square text-white overflow-hidden", className)}
      style={{
        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
        >
          <path
            d="M50 10 L55 40 L85 40 L60 55 L70 85 L50 65 L30 85 L40 55 L15 40 L45 40 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M50 20 L53 40 L73 40 L55 50 L63 75 L50 60 L37 75 L45 50 L27 40 L47 40 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container - extreme limitations on content size to stay within the star shape */}
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        {/* Use a dynamically sized inner container for the star shape */}
        <div 
          className="flex flex-col justify-center items-center overflow-hidden"
          style={{ 
            width: scales.containerWidth, 
            height: scales.containerHeight 
          }}
        >
          {/* Title at top - adaptive sizing for star */}
          {heading && (
            <div className="text-center mb-0">
              {React.isValidElement(heading) && 
               typeof heading.type === 'string' && 
               ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                React.cloneElement(heading as React.ReactElement, {
                  className: cn(scales.headingClass, 'font-medium', (heading.props as any).className || ''),
                }) : heading
              }
            </div>
          )}
          
          {/* Divider - very small for star */}
          <ShapeDivider width="50%" opacity={30} margin="0 0" />
          
          {/* Content - extremely compact with adaptive sizing */}
          <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center">
            {content.map((item, index) => {
              if (React.isValidElement(item) && item.type === 'p') {
                return React.cloneElement(item as React.ReactElement, {
                  className: cn(scales.contentClass, 'my-0 leading-tight', (item.props as any).className || ''),
                  key: `starburst-content-${index}`
                });
              }
              return item;
            })}
          </div>
          
          {/* Button - adaptive sizing for star */}
          {button && (
            <div className="mt-0 flex justify-center items-center">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn(scales.buttonClass, 'py-0 px-2', (button.props as any).className || ''),
                }) : button
              }
            </div>
          )}
        </div>
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
  
  // Get appropriate padding for circle based on container size
  const getCircleInset = () => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      
      // Smaller circles need relatively more padding to keep content within the visible area
      if (width < 150) {
        return "inset-[20%]"; // More padding for tiny circles
      } else if (width < 250) {
        return "inset-[18%]";
      } else if (width < 350) {
        return "inset-[15%]";
      } else {
        return "inset-[13%]"; // Less padding needed for larger circles
      }
    }
    
    return "inset-[15%]"; // Default
  };
  
  const insetClass = getCircleInset();

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-square rounded-full text-white overflow-hidden", className)}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
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
            r="45"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="30"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container - circle content needs to be kept far from edges */}
      <div className={cn("absolute flex flex-col justify-center items-center", insetClass)}>
        {/* Title - adaptive sizing for circle */}
        {heading && (
          <div className="text-center mb-0.5">
            {React.isValidElement(heading) && 
             typeof heading.type === 'string' && 
             ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
              React.cloneElement(heading as React.ReactElement, {
                className: cn(fontSize.heading, 'font-medium mb-0', (heading.props as any).className || ''),
              }) : heading
            }
          </div>
        )}
        
        {/* Divider - shorter for circle */}
        <ShapeDivider width="40%" opacity={30} margin="0.1rem 0" />
        
        {/* Content - adaptive sizing for circle */}
        <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center pt-0.5 pb-0.5">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn(fontSize.content, 'my-0.5 leading-tight', (item.props as any).className || ''),
                key: `circle-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Button - adaptive sizing for circle */}
        {button && (
          <div className="mt-0.5 mb-0.5 flex justify-center items-center">
            {React.isValidElement(button) && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'py-0.5 px-3', (button.props as any).className || ''),
              }) : button
            }
          </div>
        )}
      </div>
    </div>
  );
}