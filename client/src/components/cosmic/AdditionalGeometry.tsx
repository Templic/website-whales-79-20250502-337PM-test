/**
 * AdditionalGeometry.tsx
 * 
 * Additional responsive geometric shape containers for the /responsive-demo page
 * that follow the style and functionality of the SimpleGeometry components.
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
 * SimpleRhombus Component
 * A rhombus (diamond) shape that properly contains content
 */
export function SimpleRhombus({ 
  children, 
  className, 
  glowColor = "rgba(255, 140, 0, 0.5)",
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
        clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
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
            d="M50 10 L90 50 L50 90 L10 50 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M50 30 L70 50 L50 70 L30 50 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        {/* Reduced content area to ensure text stays within rhombus shape */}
        <div className="w-[60%] h-[60%] flex flex-col justify-center items-center">
          {/* Heading */}
          {heading && (
            <div className="text-center mb-1">
              {React.isValidElement(heading) && 
               typeof heading.type === 'string' && 
               ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                React.cloneElement(heading as React.ReactElement, {
                  className: cn(fontSize.heading, 'font-medium leading-none', (heading.props as any).className || ''),
                }) : heading
              }
            </div>
          )}
          
          {/* Divider */}
          <ShapeDivider width="40%" opacity={30} margin="0.2rem 0" />
          
          {/* Main content */}
          <div className="flex-grow flex flex-col justify-center items-center overflow-y-auto px-2 text-center">
            {content.map((item, index) => {
              if (React.isValidElement(item) && item.type === 'p') {
                return React.cloneElement(item as React.ReactElement, {
                  className: cn(fontSize.content, 'my-0 leading-tight text-center', (item.props as any).className || ''),
                  key: `rhombus-content-${index}`
                });
              }
              return item;
            })}
          </div>
          
          {/* Button */}
          {button && (
            <div className="mt-1 mb-1 flex justify-center items-center w-full">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn(fontSize.button, 'text-center', (button.props as any).className || ''),
                  style: {
                    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                    padding: "0.25rem 1.5rem",
                    background: (button.props as any).className?.includes('bg-') 
                      ? undefined 
                      : "rgba(255, 140, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    width: "auto",
                    minWidth: "5rem",
                    minHeight: "2.1rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center", 
                    boxShadow: "0 0 8px rgba(255, 140, 0, 0.5)",
                    textAlign: "center",
                    lineHeight: "1",
                    fontSize: "0.8rem",
                    margin: "0 auto",
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
 * SimplePentagon Component
 * A pentagon shape that properly contains content
 */
export function SimplePentagon({ 
  children, 
  className, 
  glowColor = "rgba(180, 90, 255, 0.5)",
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
        clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
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
            d="M50 10 L90 38 L82 90 L18 90 L10 38 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M50 30 L70 48 L65 70 L35 70 L30 48 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        {/* Reduced content area to ensure text stays within pentagon shape */}
        <div className="w-[65%] h-[70%] flex flex-col justify-center items-center">
          {/* Heading */}
          {heading && (
            <div className="text-center mb-1">
              {React.isValidElement(heading) && 
               typeof heading.type === 'string' && 
               ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                React.cloneElement(heading as React.ReactElement, {
                  className: cn(fontSize.heading, 'font-medium leading-none', (heading.props as any).className || ''),
                }) : heading
              }
            </div>
          )}
          
          {/* Divider */}
          <ShapeDivider width="45%" opacity={30} margin="0.2rem 0" />
          
          {/* Main content */}
          <div className="flex-grow flex flex-col justify-center items-center overflow-y-auto px-2 text-center">
            {content.map((item, index) => {
              if (React.isValidElement(item) && item.type === 'p') {
                return React.cloneElement(item as React.ReactElement, {
                  className: cn(fontSize.content, 'my-0 leading-tight text-center', (item.props as any).className || ''),
                  key: `pentagon-content-${index}`
                });
              }
              return item;
            })}
          </div>
          
          {/* Button */}
          {button && (
            <div className="mt-1 mb-1 flex justify-center items-center w-full">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn(fontSize.button, 'text-center', (button.props as any).className || ''),
                  style: {
                    clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
                    padding: "0.25rem 1.5rem",
                    background: (button.props as any).className?.includes('bg-') 
                      ? undefined 
                      : "rgba(180, 90, 255, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    width: "auto",
                    minWidth: "5rem",
                    minHeight: "2.1rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center", 
                    boxShadow: "0 0 8px rgba(180, 90, 255, 0.5)",
                    textAlign: "center",
                    lineHeight: "1",
                    fontSize: "0.8rem",
                    margin: "0 auto",
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
 * SimpleHeptagon Component
 * A heptagon (7-sided) shape that properly contains content
 */
export function SimpleHeptagon({ 
  children, 
  className, 
  glowColor = "rgba(0, 200, 160, 0.5)",
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
        clipPath: "polygon(50% 0%, 90% 20%, 100% 60%, 75% 90%, 25% 90%, 0% 60%, 10% 20%)",
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
            d="M50 10 L90 30 L95 70 L70 90 L30 90 L5 70 L10 30 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M50 30 L70 40 L75 60 L60 70 L40 70 L25 60 L30 40 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        {/* Reduced content area to ensure text stays within heptagon shape */}
        <div className="w-[65%] h-[65%] flex flex-col justify-center items-center">
          {/* Heading */}
          {heading && (
            <div className="text-center mb-1">
              {React.isValidElement(heading) && 
               typeof heading.type === 'string' && 
               ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                React.cloneElement(heading as React.ReactElement, {
                  className: cn(fontSize.heading, 'font-medium leading-none', (heading.props as any).className || ''),
                }) : heading
              }
            </div>
          )}
          
          {/* Divider */}
          <ShapeDivider width="45%" opacity={30} margin="0.2rem 0" />
          
          {/* Main content */}
          <div className="flex-grow flex flex-col justify-center items-center overflow-y-auto px-2 text-center">
            {content.map((item, index) => {
              if (React.isValidElement(item) && item.type === 'p') {
                return React.cloneElement(item as React.ReactElement, {
                  className: cn(fontSize.content, 'my-0 leading-tight text-center', (item.props as any).className || ''),
                  key: `heptagon-content-${index}`
                });
              }
              return item;
            })}
          </div>
          
          {/* Button */}
          {button && (
            <div className="mt-1 mb-1 flex justify-center items-center w-full">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn(fontSize.button, 'text-center', (button.props as any).className || ''),
                  style: {
                    padding: "0.25rem 1.5rem",
                    background: (button.props as any).className?.includes('bg-') 
                      ? undefined 
                      : "rgba(0, 200, 160, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    width: "auto",
                    minWidth: "5rem",
                    minHeight: "2.1rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center", 
                    boxShadow: "0 0 8px rgba(0, 200, 160, 0.5)",
                    textAlign: "center",
                    lineHeight: "1",
                    fontSize: "0.8rem",
                    margin: "0 auto",
                    borderRadius: "0.25rem" // Use a standard border radius instead of a complex clip path
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