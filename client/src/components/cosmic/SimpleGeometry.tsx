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
      
      {/* Content Container - Arranges content in bottom-to-top order for triangles */}
      <div className="absolute inset-0 flex flex-col justify-between items-center p-4">
        {/* Content positioned to stay within shape bounds */}
        <div className="w-full max-w-[75%] mt-6">
          {/* Button at top of triangle (visually smallest part) */}
          {button && (
            <div className="flex justify-center items-center">
              {button}
            </div>
          )}
        </div>
          
        {/* Main content in middle of triangle */}
        <div className="w-full max-w-[85%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center py-2">
          {/* Map to ensure proper styling of paragraphs */}
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn('text-sm my-1', (item.props as any).className || ''),
                key: `triangle-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Divider */}
        <ShapeDivider width="40%" opacity={30} margin="0.5rem 0" />
        
        {/* Heading at bottom of triangle (visually widest part) */}
        <div className="w-full max-w-[95%] mb-4">
          {heading && (
            <div className="text-center">
              {heading}
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
      
      {/* Content Container - Arranges content in top-to-bottom order for inverted triangles */}
      <div className="absolute inset-0 flex flex-col justify-between items-center p-4">
        {/* Heading at top of inverted triangle (visually widest part) */}
        <div className="w-full max-w-[95%] mt-2">
          {heading && (
            <div className="text-center">
              {heading}
            </div>
          )}
        </div>
        
        {/* Divider */}
        <ShapeDivider width="60%" opacity={30} margin="0.5rem 0" />
        
        {/* Main content in middle of inverted triangle */}
        <div className="w-full max-w-[85%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center py-2">
          {/* Map to ensure proper styling of paragraphs */}
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn('text-sm my-1', (item.props as any).className || ''),
                key: `inverted-triangle-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Button at bottom of inverted triangle (visually smallest part) */}
        <div className="w-full max-w-[50%] mb-6">
          {button && (
            <div className="flex justify-center items-center">
              {button}
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
  
  // Extract headings
  const heading = childArray.find(child => 
    React.isValidElement(child) && 
    typeof child.type === 'string' && 
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)
  );
  
  // All other content
  const content = childArray.filter(child => child !== heading);

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
      
      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-5">
        {/* Title */}
        {heading && (
          <div className="text-center mb-2">
            {heading}
          </div>
        )}
        
        {/* Divider */}
        <ShapeDivider width="50%" opacity={30} margin="0.5rem 0" />
        
        {/* Content */}
        <div className="w-full max-w-[80%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn('text-sm my-1', (item.props as any).className || ''),
                key: `hexagon-content-${index}`
              });
            }
            return item;
          })}
        </div>
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
  
  // Extract headings
  const heading = childArray.find(child => 
    React.isValidElement(child) && 
    typeof child.type === 'string' && 
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)
  );
  
  // All other content
  const content = childArray.filter(child => child !== heading);

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
      
      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-6">
        {/* Title */}
        {heading && (
          <div className="text-center mb-2">
            {heading}
          </div>
        )}
        
        {/* Divider */}
        <ShapeDivider width="60%" opacity={30} margin="0.5rem 0" />
        
        {/* Content */}
        <div className="w-full max-w-[85%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn('text-sm my-1', (item.props as any).className || ''),
                key: `octagon-content-${index}`
              });
            }
            return item;
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * SimpleStarburst Component
 * A starburst shape that properly contains content
 */
export function SimpleStarburst({ children, className, glowColor = "rgba(0, 230, 230, 0.5)" }: GeometricShapeProps) {
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
      
      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-2">
        {/* Scale down content to fit well inside the starburst shape */}
        <div className="w-full max-w-[70%] h-[70%] flex flex-col justify-center items-center overflow-y-auto text-center">
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              // Special styles for different element types
              if (typeof child.type === 'string') {
                if (child.type === 'p') {
                  return React.cloneElement(child as React.ReactElement, {
                    className: cn('text-xs my-1', (child.props as any).className || ''),
                    key: `starburst-content-${index}`
                  });
                } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)) {
                  return React.cloneElement(child as React.ReactElement, {
                    className: cn('text-sm mb-1', (child.props as any).className || ''),
                    key: `starburst-heading-${index}`
                  });
                } else if (child.type === 'button' || (child.props && child.props.className?.includes('button'))) {
                  return React.cloneElement(child as React.ReactElement, {
                    className: cn('text-xs px-3 py-1', (child.props as any).className || ''),
                    key: `starburst-button-${index}`
                  });
                }
              }
            }
            return child;
          })}
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
  
  // Extract headings
  const heading = childArray.find(child => 
    React.isValidElement(child) && 
    typeof child.type === 'string' && 
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)
  );
  
  // All other content
  const content = childArray.filter(child => child !== heading);

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
      
      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-5">
        {/* Title */}
        {heading && (
          <div className="text-center mb-2">
            {heading}
          </div>
        )}
        
        {/* Divider - shorter for circle */}
        <ShapeDivider width="40%" opacity={30} margin="0.5rem 0" />
        
        {/* Content */}
        <div className="w-full max-w-[80%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn('text-sm my-1', (item.props as any).className || ''),
                key: `circle-content-${index}`
              });
            }
            return item;
          })}
        </div>
      </div>
    </div>
  );
}