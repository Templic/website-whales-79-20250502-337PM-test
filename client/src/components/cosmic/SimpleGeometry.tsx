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
            {heading && (
              <div className="text-center">
                {React.isValidElement(heading) && 
                 typeof heading.type === 'string' && 
                 ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                  formatHeading(heading as React.ReactElement) : heading
                }
              </div>
            )}
          </div>
          
          {/* Divider - small margin to separate from title */}
          <ShapeDivider width="30%" opacity={30} margin="0.2rem 0 0.2rem 0" />
          
          {/* Main content with triangle-shaped text layout */}
          <div className="w-[85%] flex-grow flex flex-col justify-center items-center overflow-y-auto m-0 p-0 pb-2">
            {/* Map to create triangle-shaped paragraph text */}
            {content.map((item, index) => {
              if (React.isValidElement(item) && item.type === 'p') {
                // Get the actual text content
                const textContent = (item.props as any).children || '';
                
                // Split the text into words
                const words = typeof textContent === 'string' ? textContent.split(' ') : [];
                
                // Only apply special formatting if we have enough words
                if (words.length >= 5) {
                  // Calculate a triangular distribution that gets wider at the bottom
                  const totalWords = words.length;
                  const numLines = Math.min(5, Math.ceil(totalWords / 2));
                  
                  // Calculate words per line to create a triangular shape
                  // First line has fewest words, last line has most
                  const linesDistribution = [];
                  let remainingWords = totalWords;
                  
                  // Simple algorithm for triangle shape with width expanding as we go down
                  for (let i = 0; i < numLines && remainingWords > 0; i++) {
                    // Progressive increase in words per line
                    // Earlier lines have fewer words, later lines have more
                    const ratio = (i + 1) / numLines;
                    let wordsForLine = Math.max(1, Math.ceil(ratio * totalWords / (numLines / 1.5)));
                    
                    // Make sure we don't allocate more words than we have left
                    wordsForLine = Math.min(wordsForLine, remainingWords);
                    linesDistribution.push(wordsForLine);
                    remainingWords -= wordsForLine;
                  }
                  
                  // Create the lines of text based on our distribution
                  let wordIndex = 0;
                  const lines = linesDistribution.map(wordCount => {
                    const line = words.slice(wordIndex, wordIndex + wordCount).join(' ');
                    wordIndex += wordCount;
                    return line;
                  });
                  
                  // Return triangular text with progressively wider lines
                  return (
                    <div key={`triangle-content-${index}`} className="m-0 text-center">
                      {lines.map((line, lineIndex) => (
                        <div 
                          key={`line-${lineIndex}`} 
                          className={cn(
                            fontSize.content, 
                            'leading-tight mx-auto',
                            lineIndex < lines.length - 1 ? 'mb-0' : 'mb-1'
                          )}
                          style={{
                            width: `${Math.min(100, 40 + (lineIndex * 55 / numLines))}%`, // Width increases with each line but more controlled
                            textAlign: 'center'
                          }}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  // For short paragraphs, create 2-3 line breaks for better visual appearance
                  if (typeof textContent === 'string' && textContent.length > 30) {
                    const words = textContent.split(' ');
                    const totalWords = words.length;
                    // Aim for 2-3 lines of text
                    const numLines = Math.min(3, Math.max(2, Math.ceil(totalWords / 5)));
                    const wordsPerLine = Math.ceil(totalWords / numLines);
                    
                    const lines = [];
                    for (let i = 0; i < numLines; i++) {
                      const startIdx = i * wordsPerLine;
                      const endIdx = Math.min(startIdx + wordsPerLine, totalWords);
                      if (startIdx < totalWords) {
                        lines.push(words.slice(startIdx, endIdx).join(' '));
                      }
                    }
                    
                    return (
                      <div key={`triangle-content-${index}`} className="text-center">
                        {lines.map((line, lineIndex) => (
                          <div 
                            key={`line-${lineIndex}`}
                            className={cn(
                              fontSize.content,
                              'leading-tight mx-auto',
                              lineIndex < lines.length - 1 ? 'mb-0' : 'mb-1'
                            )}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  // For very short text, use default styling
                  return React.cloneElement(item as React.ReactElement, {
                    className: cn(fontSize.content, 'my-0 leading-tight text-center', (item.props as any).className || ''),
                    key: `triangle-content-${index}`
                  });
                }
              }
              return item;
            })}
          </div>
          
          {/* Button - positioned closer to content with full visibility */}
          {button && (
            <div className="mt-0 mb-5 flex justify-center items-center w-full">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn(fontSize.button, 'text-center', (button.props as any).className || ''),
                  style: {
                    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                    padding: "0.25rem 1.5rem 0.35rem", // Further increased horizontal padding
                    background: (button.props as any).className?.includes('bg-') 
                      ? undefined 
                      : "rgba(0, 100, 255, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    width: "auto",
                    minWidth: "5.5rem", // Further increased minimum width to fit text
                    minHeight: "2.1rem", // Maintain height
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center", 
                    boxShadow: "0 0 8px rgba(0, 100, 255, 0.5)",
                    textAlign: "center",
                    lineHeight: "1",
                    fontSize: "0.8rem", // Slightly smaller font for better fit
                    transform: "translateY(-0.15rem) scale(0.95)", // Scale down slightly for better fit
                    margin: "0 auto", // Center horizontally
                    letterSpacing: "-0.01rem" // Tighten letter spacing slightly
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
        <div className="w-[75%] mt-3"> {/* Reduced width and increased top margin for better spacing */}
          {heading && (
            <div className="text-center">
              {React.isValidElement(heading) && 
               typeof heading.type === 'string' && 
               ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                React.cloneElement(heading as React.ReactElement, {
                  className: cn(fontSize.heading, 'font-medium leading-none m-0', (heading.props as any).className || ''),
                }) : heading
              }
            </div>
          )}
        </div>
        
        {/* Divider - minimal spacing */}
        <ShapeDivider width="50%" opacity={30} margin="0.5rem 0" /> {/* Reduced width and added vertical margin */}
        
        {/* Main content with inverted-triangle-shaped text layout */}
        <div className="w-[70%] flex-grow flex flex-col justify-center items-center overflow-y-auto m-0 p-0 pb-4">
          {/* Map to create inverted-triangle-shaped paragraph text */}
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              // Get the actual text content
              const textContent = (item.props as any).children || '';
              
              // Split the text into words
              const words = typeof textContent === 'string' ? textContent.split(' ') : [];
              
              // Only apply special formatting if we have enough words
              if (words.length >= 6) {
                // Calculate a triangular distribution that gets narrower at the bottom
                const totalWords = words.length;
                const numLines = Math.min(6, Math.ceil(totalWords / 2));
                
                // Calculate words per line to create an inverted triangular shape
                // First line has most words, last line has fewest
                const linesDistribution = [];
                let remainingWords = totalWords;
                
                // Simple algorithm for inverted triangle shape with width reducing as we go down
                for (let i = 0; i < numLines && remainingWords > 0; i++) {
                  // Progressive decrease in words per line
                  // Earlier lines have more words, later lines have fewer
                  const ratio = 1 - (i / numLines);
                  let wordsForLine = Math.max(1, Math.ceil(ratio * totalWords / (numLines / 1.5)));
                  
                  // Make sure we don't allocate more words than we have left
                  wordsForLine = Math.min(wordsForLine, remainingWords);
                  linesDistribution.push(wordsForLine);
                  remainingWords -= wordsForLine;
                }
                
                // Create the lines of text based on our distribution
                let wordIndex = 0;
                const lines = linesDistribution.map(wordCount => {
                  const line = words.slice(wordIndex, wordIndex + wordCount).join(' ');
                  wordIndex += wordCount;
                  return line;
                });
                
                // Return inverted triangular text with progressively narrower lines
                return (
                  <div key={`inverted-triangle-content-${index}`} className="m-0 text-center">
                    {lines.map((line, lineIndex) => (
                      <div 
                        key={`line-${lineIndex}`} 
                        className={cn(
                          fontSize.content, 
                          'leading-tight mx-auto',
                          lineIndex < lines.length - 1 ? 'mb-0' : 'mb-1'
                        )}
                        style={{
                          width: `${Math.min(100, 90 - (lineIndex * 60 / numLines))}%`, // Width decreases with each line
                          textAlign: 'center'
                        }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                );
              } else {
                // For short paragraphs, use the default styling
                return React.cloneElement(item as React.ReactElement, {
                  className: cn(fontSize.content, 'm-0 leading-tight text-center', (item.props as any).className || ''),
                  key: `inverted-triangle-content-${index}`
                });
              }
            }
            return item;
          })}
        </div>
          
        {/* Button container - positioned closer to content with better visibility */}
        <div className="w-[50%] mb-3">
          {/* Button with improved text visibility */}
          {button && (
            <div className="flex justify-center items-center w-full">
              {React.isValidElement(button) && button.type === 'button' ? 
                React.cloneElement(button as React.ReactElement, {
                  className: cn(fontSize.button, 'text-center', (button.props as any).className || ''),
                  style: {
                    clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
                    padding: "0.25rem 1.5rem 0.35rem", // Further increased horizontal padding
                    background: (button.props as any).className?.includes('bg-') 
                      ? undefined 
                      : "rgba(0, 100, 255, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    width: "auto",
                    minWidth: "5.5rem", // Further increased minimum width to fit text
                    minHeight: "2.1rem", // Maintain height
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxShadow: "0 0 8px rgba(0, 100, 255, 0.5)",
                    textAlign: "center",
                    lineHeight: "1",
                    fontSize: "0.8rem", // Slightly smaller font for better fit
                    transform: "translateY(0.15rem) scale(0.95)", // Scale down slightly for better fit
                    margin: "0 auto", // Center horizontally
                    letterSpacing: "-0.01rem" // Tighten letter spacing slightly
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
      className={cn("relative aspect-square text-white overflow-hidden cosmic-ocean-texture cosmic-shape-hover", className)}
      style={{
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
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
        <ShapeDivider width="50%" opacity={30} margin="0" />
        
        {/* Content - kept away from edges with adaptive sizing */}
        <div className="w-full max-w-[80%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center m-0 p-0">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
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
          <div className="mt-0 mb-0 flex justify-center items-center">
            {React.isValidElement(button) && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'text-center', (button.props as any).className || ''),
                style: {
                  clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                  padding: "0.2rem 0.8rem",
                  background: (button.props as any).className?.includes('bg-') 
                    ? undefined 
                    : "rgba(0, 100, 255, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minWidth: "3rem",
                  boxShadow: "0 0 8px rgba(0, 100, 255, 0.5)"
                }
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
  
  // Function to format paragraph text with line breaks for better visual appearance
  const formatParagraph = (paragraphElement: React.ReactElement) => {
    const textContent = (paragraphElement.props as any).children || '';
    
    if (typeof textContent === 'string' && textContent.length > 20) {
      const words = textContent.split(' ');
      const totalWords = words.length;
      
      // Aim for 3-4 lines of text for better visual appearance in octagon
      const numLines = Math.min(4, Math.max(2, Math.ceil(totalWords / 4)));
      const wordsPerLine = Math.ceil(totalWords / numLines);
      
      const lines = [];
      for (let i = 0; i < numLines; i++) {
        const startIdx = i * wordsPerLine;
        const endIdx = Math.min(startIdx + wordsPerLine, totalWords);
        if (startIdx < totalWords) {
          lines.push(words.slice(startIdx, endIdx).join(' '));
        }
      }
      
      return (
        <div key={`octagon-content-split`} className="text-center">
          {lines.map((line, lineIndex) => (
            <div 
              key={`line-${lineIndex}`}
              className={cn(
                fontSize.content,
                'leading-tight mx-auto',
                lineIndex < lines.length - 1 ? 'mb-0' : 'mb-1'
              )}
            >
              {line}
            </div>
          ))}
        </div>
      );
    }
    
    // For short text, return as is with proper styling
    return React.cloneElement(paragraphElement, {
      className: cn(fontSize.content, 'm-0 leading-tight text-center', (paragraphElement.props as any).className || '')
    });
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-square text-white overflow-hidden cosmic-ocean-texture cosmic-shape-hover", className)}
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
            d="M35 15 L65 15 L85 35 L85 65 L65 85 L35 85 L15 65 L15 35 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      
      {/* Content Container - ensure content stays within octagon boundaries */}
      <div className="absolute inset-[8%] flex flex-col justify-center items-center">
        {/* Title with improved formatting */}
        {heading && (
          <div className="text-center mb-1">
            {React.isValidElement(heading) && 
             typeof heading.type === 'string' && 
             ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
              formatHeading(heading as React.ReactElement) : heading
            }
          </div>
        )}
        
        {/* Divider */}
        <ShapeDivider width="60%" opacity={30} margin="0.1rem 0" />
        
        {/* Content with improved line breaking */}
        <div className="w-full max-w-[90%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center m-0 p-0">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return formatParagraph(item as React.ReactElement);
            }
            return item;
          })}
        </div>
        
        {/* Button with rounder corners to avoid clipping */}
        {button && (
          <div className="mt-1 mb-1 flex justify-center items-center">
            {React.isValidElement(button) && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'text-center', (button.props as any).className || ''),
                style: {
                  // Less aggressive clipping with more rounded corners
                  borderRadius: "0.4rem",
                  padding: "0.3rem 1rem",
                  background: (button.props as any).className?.includes('bg-') 
                    ? undefined 
                    : "rgba(0, 100, 255, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minWidth: "4rem",
                  minHeight: "1.8rem",
                  boxShadow: "0 0 8px rgba(0, 100, 255, 0.5)",
                  fontSize: "0.75rem",
                  fontWeight: "bold"
                }
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
  
  // Format heading with a line break if it's longer than 10 characters
  const formatHeading = (headingElement: React.ReactElement) => {
    const headingText = (headingElement.props as any).children || '';
    // Don't modify if it's not a string or already contains line breaks
    if (typeof headingText !== 'string' || headingText.includes('\n')) {
      return headingElement;
    }
    
    // Split heading if it's longer than 10 characters
    if (headingText.length > 10) {
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
          className: cn('text-sm font-bold leading-tight', (headingElement.props as any).className || '')
        });
      }
    }
    
    // If no changes needed, return with updated className
    return React.cloneElement(headingElement, {
      className: cn('text-sm font-bold leading-tight', (headingElement.props as any).className || '')
    });
  };
  
  // Function to split paragraph text into multiple lines for better formatting
  const formatParagraph = (paragraphElement: React.ReactElement) => {
    const textContent = (paragraphElement.props as any).children || '';
    
    if (typeof textContent === 'string' && textContent.length > 20) {
      const words = textContent.split(' ');
      const totalWords = words.length;
      
      // Aim for 3-4 lines of text for better visual appearance in star
      const numLines = Math.min(4, Math.max(2, Math.ceil(totalWords / 4)));
      const wordsPerLine = Math.ceil(totalWords / numLines);
      
      const lines = [];
      for (let i = 0; i < numLines; i++) {
        const startIdx = i * wordsPerLine;
        const endIdx = Math.min(startIdx + wordsPerLine, totalWords);
        if (startIdx < totalWords) {
          lines.push(words.slice(startIdx, endIdx).join(' '));
        }
      }
      
      return (
        <div key={`starburst-content-split`} className="text-center">
          {lines.map((line, lineIndex) => (
            <div 
              key={`line-${lineIndex}`}
              className={cn(
                fontSize.content,
                'leading-tight mx-auto',
                lineIndex < lines.length - 1 ? 'mb-0' : 'mb-1'
              )}
            >
              {line}
            </div>
          ))}
        </div>
      );
    }
    
    // For short text, return as is with proper styling
    return React.cloneElement(paragraphElement, {
      className: cn(fontSize.content, 'my-0 leading-tight text-center', (paragraphElement.props as any).className || '')
    });
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn("relative aspect-square text-white", className)}
    >
      {/* Star Background Layer - This is just a visual backdrop */}
      <div 
        className="absolute inset-0 z-0 cosmic-ocean-texture cosmic-shape-hover"
        style={{
          clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          boxShadow: `0 0 15px ${glowColor}`,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          zIndex: -1 // Ensure star shape stays behind content
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ zIndex: -2 }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="opacity-20"
          >
            <path
              d="M50 10 L55 38 L80 38 L60 53 L68 80 L50 63 L32 80 L40 53 L20 38 L45 38 Z"
              stroke="white"
              strokeWidth="0.5"
              fill="none"
            />
            <path
              d="M50 25 L52 40 L65 40 L53 48 L57 65 L50 56 L43 65 L47 48 L35 40 L48 40 Z"
              stroke="white"
              strokeWidth="0.5"
              fill="none"
            />
          </svg>
        </div>
      </div>
      
      {/* Content Container - Completely separate from the star background */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between items-center">
        {/* Content in the center without any background shape */}
        <div className="flex-grow flex items-center justify-center w-full">
          <div 
            className="flex flex-col justify-center items-center"
            style={{ 
              width: '70%', // Increased from 60% to allow more content space
              margin: '10% 0 0 0' // Push down a bit to avoid top star point
            }}
          >
            {/* Title with improved formatting */}
            {heading && (
              <div className="text-center mb-1 w-full">
                {React.isValidElement(heading) && 
                 typeof heading.type === 'string' && 
                 ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(heading.type) ? 
                  formatHeading(heading as React.ReactElement) : heading
                }
              </div>
            )}
            
            {/* Divider - shorter for star */}
            <ShapeDivider width="30%" opacity={30} margin="0.1rem 0" />
            
            {/* Content with improved line breaking */}
            <div className="w-[90%] flex-grow flex flex-col justify-center items-center overflow-y-auto text-center py-1">
              {content.map((item, index) => {
                if (React.isValidElement(item) && item.type === 'p') {
                  return formatParagraph(item as React.ReactElement);
                }
                return item;
              })}
            </div>
          </div>
        </div>
        
        {/* Button placed in a safe area with better positioning */}
        {button && (
          <div 
            className="z-20 pb-[20%]" // Reduced padding to bring button closer to content
          >
            {React.isValidElement(button) && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn('text-center', (button.props as any).className || ''),
                style: {
                  padding: "0.35rem 1.5rem",
                  background: (button.props as any).className?.includes('bg-') 
                    ? undefined 
                    : "rgba(225, 50, 50, 0.8)", // More visible red color
                  border: "1px solid rgba(255, 255, 255, 0.7)",
                  borderRadius: "9999px",
                  minWidth: "6rem",
                  minHeight: "1.8rem",
                  width: "auto",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 0 10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 0, 0, 0.4)",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  letterSpacing: "0",
                  whiteSpace: "nowrap",
                  backdropFilter: "blur(2px)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)"
                }
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
      className={cn("relative aspect-square rounded-full text-white overflow-hidden cosmic-ocean-texture cosmic-shape-hover", className)}
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
        
        {/* Divider - shorter for circle */}
        <ShapeDivider width="40%" opacity={30} margin="0" />
        
        {/* Content - adaptive sizing for circle */}
        <div className="w-full flex-grow flex flex-col justify-center items-center overflow-y-auto text-center m-0 p-0">
          {content.map((item, index) => {
            if (React.isValidElement(item) && item.type === 'p') {
              return React.cloneElement(item as React.ReactElement, {
                className: cn(fontSize.content, 'm-0 leading-tight', (item.props as any).className || ''),
                key: `circle-content-${index}`
              });
            }
            return item;
          })}
        </div>
        
        {/* Button - circle shaped to match container */}
        {button && (
          <div className="mt-0 mb-0 flex justify-center items-center">
            {React.isValidElement(button) && button.type === 'button' ? 
              React.cloneElement(button as React.ReactElement, {
                className: cn(fontSize.button, 'text-center', (button.props as any).className || ''),
                style: {
                  borderRadius: "9999px",
                  padding: "0.2rem 0.8rem",
                  background: (button.props as any).className?.includes('bg-') 
                    ? undefined 
                    : "rgba(0, 100, 255, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  minWidth: "2.5rem",
                  aspectRatio: "1/1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 8px rgba(0, 100, 255, 0.5)"
                }
              }) : button
            }
          </div>
        )}
      </div>
    </div>
  );
}