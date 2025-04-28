/**
 * SimpleGeometry.tsx
 * 
 * A clean implementation of geometric shape containers that properly 
 * contain content within their boundaries. These components use simple CSS
 * techniques to ensure text and other elements stay within shape boundaries.
 */

import React from 'react';

// Base props interface for all geometric shapes
interface GeometricShapeProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

// Utility function for conditional class names
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

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
export function SimpleTriangle({ children, className, glowColor = "rgba(0, 230, 230, 0.5)" }: GeometricShapeProps) {
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
      {/* The container takes a triangle shape into account - wider at bottom, narrower at top */}
      <div className="absolute inset-x-0 bottom-0 top-[15%] flex flex-col justify-between items-center">
        {/* Button container - positioned at top 20% of visible area (narrow part) */}
        <div className="w-[40%] mb-3">
          {/* Button at top of triangle (visually smallest part) */}
          {button && (
            <div className="flex justify-center items-center scale-90">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn('text-xs py-1 px-3', (button.props as any).className || ''),
                }) : button
              }
            </div>
          )}
        </div>
          
        {/* Main content in middle of triangle - width increases as we move down */}
        <div className="w-[65%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center mb-2">
          {/* Map to ensure proper styling of paragraphs - smaller text to fit the shape */}
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn('text-xs my-1 leading-snug', (item.props as any).className || ''),
                key: `triangle-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Divider - placed near bottom */}
        <ShapeDivider width="50%" opacity={30} margin="0 0 0.5rem 0" />
        
        {/* Heading at bottom of triangle (visually widest part) */}
        <div className="w-[80%] mb-6">
          {heading && (
            <div className="text-center">
              {React.isValidElement(heading) && 
               typeof heading.type === 'string' && 
               ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                React.cloneElement(heading as React.ReactElement, {
                  className: cn('text-base font-medium', (heading.props as any).className || ''),
                }) : heading
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
export function SimpleInvertedTriangle({ children, className, glowColor = "rgba(0, 230, 230, 0.5)" }: GeometricShapeProps) {
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
        <div className="w-[85%] mt-3">
          {heading && (
            <div className="text-center">
              {React.isValidElement(heading) && 
               typeof heading.type === 'string' && 
               ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                React.cloneElement(heading as React.ReactElement, {
                  className: cn('text-base font-medium', (heading.props as any).className || ''),
                }) : heading
              }
            </div>
          )}
        </div>
        
        {/* Divider - placed near top */}
        <ShapeDivider width="60%" opacity={30} margin="0.5rem 0" />
        
        {/* Main content in middle of inverted triangle - width decreases as we move down */}
        <div className="w-[70%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center mt-1">
          {/* Map to ensure proper styling of paragraphs - smaller text to fit the shape */}
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn('text-xs my-1 leading-snug', (item.props as any).className || ''),
                key: `inverted-triangle-content-${index}`
              });
            }
            return item;
          })}
        </div>
          
        {/* Button container - positioned at bottom of visible area (narrow part) */}
        <div className="w-[40%] mb-3">
          {/* Button at bottom of inverted triangle (visually smallest part) */}
          {button && (
            <div className="flex justify-center items-center scale-90">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn('text-xs py-1 px-3', (button.props as any).className || ''),
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
export function SimpleHexagon({ children, className, glowColor = "rgba(0, 230, 230, 0.5)" }: GeometricShapeProps) {
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
        {/* Title - reduced size to fit */}
        {heading && (
          <div className="text-center mb-2">
            {React.isValidElement(heading) && 
             typeof heading.type === 'string' && 
             ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
              React.cloneElement(heading as React.ReactElement, {
                className: cn('text-base font-medium mb-1', (heading.props as any).className || ''),
              }) : heading
            }
          </div>
        )}
        
        {/* Divider */}
        <ShapeDivider width="50%" opacity={30} margin="0.25rem 0" />
        
        {/* Content - kept away from edges */}
        <div className="w-full max-w-[80%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center pt-1 pb-2">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn('text-xs my-1 leading-snug', (item.props as any).className || ''),
                key: `hexagon-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Button - smaller button that fits within shape */}
        {button && (
          <div className="mt-1 mb-1 flex justify-center items-center">
            {React.isValidElement(button) && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn('text-xs py-1 px-3 scale-90', (button.props as any).className || ''),
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
export function SimpleOctagon({ children, className, glowColor = "rgba(0, 230, 230, 0.5)" }: GeometricShapeProps) {
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
        {/* Title - reduced size to fit */}
        {heading && (
          <div className="text-center mb-2">
            {React.isValidElement(heading) && 
             typeof heading.type === 'string' && 
             ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
              React.cloneElement(heading as React.ReactElement, {
                className: cn('text-base font-medium mb-1', (heading.props as any).className || ''),
              }) : heading
            }
          </div>
        )}
        
        {/* Divider */}
        <ShapeDivider width="60%" opacity={30} margin="0.25rem 0" />
        
        {/* Content - kept away from edges */}
        <div className="w-full max-w-[85%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center py-1">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn('text-xs my-1 leading-snug', (item.props as any).className || ''),
                key: `octagon-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Button - smaller button that fits within shape */}
        {button && (
          <div className="mt-1 mb-1 flex justify-center items-center">
            {React.isValidElement(button) && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn('text-xs py-1 px-3 scale-90', (button.props as any).className || ''),
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
export function SimpleStarburst({ children, className, glowColor = "rgba(0, 230, 230, 0.5)" }: GeometricShapeProps) {
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
        {/* Use a much smaller inner container for the star shape */}
        <div className="w-[60%] h-[60%] flex flex-col justify-center items-center overflow-hidden">
          {/* Title at top - very small to fit in star */}
          {heading && (
            <div className="text-center mb-1">
              {React.isValidElement(heading) && 
               typeof heading.type === 'string' && 
               ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                React.cloneElement(heading as React.ReactElement, {
                  className: cn('text-xs font-medium', (heading.props as any).className || ''),
                }) : heading
              }
            </div>
          )}
          
          {/* Divider - very small for star */}
          <ShapeDivider width="50%" opacity={30} margin="0.1rem 0" />
          
          {/* Content - extremely compact */}
          <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center">
            {content.map((item, index) => {
              if (React.isValidElement(item) && item.type === 'p') {
                return React.cloneElement(item as React.ReactElement, {
                  className: cn('text-[10px] my-0.5 leading-tight', (item.props as any).className || ''),
                  key: `starburst-content-${index}`
                });
              }
              return item;
            })}
          </div>
          
          {/* Button - tiny size for star */}
          {button && (
            <div className="mt-1 flex justify-center items-center scale-75">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn('text-[10px] py-0.5 px-2', (button.props as any).className || ''),
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
export function SimpleCircle({ children, className, glowColor = "rgba(0, 230, 230, 0.5)" }: GeometricShapeProps) {
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
      <div className="absolute inset-[15%] flex flex-col justify-center items-center">
        {/* Title - proper sizing for circle */}
        {heading && (
          <div className="text-center mb-1">
            {React.isValidElement(heading) && 
             typeof heading.type === 'string' && 
             ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
              React.cloneElement(heading as React.ReactElement, {
                className: cn('text-sm font-medium', (heading.props as any).className || ''),
              }) : heading
            }
          </div>
        )}
        
        {/* Divider - shorter for circle */}
        <ShapeDivider width="40%" opacity={30} margin="0.25rem 0" />
        
        {/* Content - more compact for circle */}
        <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn('text-xs my-1 leading-snug', (item.props as any).className || ''),
                key: `circle-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Button - sized to fit in circle */}
        {button && (
          <div className="mt-1 mb-1 flex justify-center items-center">
            {React.isValidElement(button) && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn('text-xs py-1 px-3 scale-90', (button.props as any).className || ''),
              }) : button
            }
          </div>
        )}
      </div>
    </div>
  );
}