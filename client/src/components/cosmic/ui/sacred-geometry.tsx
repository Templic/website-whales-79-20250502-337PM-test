import React from "react"
import { ShapeDivider } from "./ShapeDivider";

// Utility function to conditionally join class names
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
}

interface GeometryContainerProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

interface EnhancedGeometryContainerProps extends GeometryContainerProps {
  maxContentWidth?: string;
  textAlign?: 'left' | 'center' | 'right';
  responsive?: boolean;
}

export function HexagonContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
  maxContentWidth = "90%",
  textAlign = "center",
  responsive = true
}: EnhancedGeometryContainerProps) {
  // Add responsive class if enabled
  const responsiveClassName = responsive ? "geometric-shape-container" : "";
  
  return (
    <div
      className={cn(
        "relative flex items-center justify-center p-6 text-white",
        responsiveClassName,
        "shape-contour-active",
        className
      )}
      style={{
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
        "--max-content-width": maxContentWidth
      } as React.CSSProperties}
      data-shape="hexagon"
    >
      <div className="absolute inset-0 opacity-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
        >
          <path
            d="M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M50 20 L80 35 L80 65 L50 80 L20 65 L20 35 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      <div 
        className={`z-10 max-w-[var(--max-content-width,90%)] overflow-y-auto hide-scrollbar text-${textAlign} shape-content-center`}
      >
        {React.Children.map(children, (child, index) => {
          // Add divider after heading elements
          if (React.isValidElement(child) && typeof child.type === 'string' && 
              (child.type === 'h1' || child.type === 'h2' || child.type === 'h3')) {
            return (
              <>
                {child}
                <ShapeDivider shapeType="hexagon" width="50%" margin="0.5rem 0" opacity={25} />
              </>
            );
          }
          return child;
        })}
      </div>
    </div>
  )
}

export function TriangleContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
  maxContentWidth = "70%",
  textAlign = "center",
  responsive = true
}: EnhancedGeometryContainerProps) {
  // Add responsive class if enabled
  const responsiveClassName = responsive ? "geometric-shape-container" : "";
  
  // Process children to properly position title at bottom and button at top
  const processedChildren = React.Children.toArray(children);
  
  // Separate headings, buttons, and other content
  const headings: React.ReactNode[] = [];
  const buttons: React.ReactNode[] = [];
  const otherContent: React.ReactNode[] = [];
  
  processedChildren.forEach(child => {
    if (React.isValidElement(child)) {
      if (typeof child.type === 'string' && 
          (child.type === 'h1' || child.type === 'h2' || 
           child.type === 'h3' || child.type === 'h4')) {
        headings.push(child);
      } else if (typeof child.type === 'string' && child.type === 'button' ||
                (child.props && (child.props.className || '').includes('button'))) {
        buttons.push(child);
      } else {
        otherContent.push(child);
      }
    } else {
      otherContent.push(child);
    }
  });
  
  // Sample text if no other content is provided
  if (otherContent.length === 0) {
    otherContent.push(
      <p key="sample-text" className="triangle-content text-sm">
        This triangle represents growth and ascension. This responsive container adjusts content to fit.
      </p>
    );
  }
  
  return (
    <div
      className={cn(
        "relative text-white",
        responsiveClassName,
        "shape-contour-active",
        className
      )}
      style={{
        clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
        "--max-content-width": maxContentWidth
      } as React.CSSProperties}
      data-shape="triangle"
    >
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
          {/* Additional guides for text contour */}
          <path
            d="M50 10 L50 90"
            stroke="white"
            strokeWidth="0.2"
            strokeDasharray="2,2"
            fill="none"
          />
          <path
            d="M30 50 L70 50"
            stroke="white"
            strokeWidth="0.2"
            strokeDasharray="2,2"
            fill="none"
          />
        </svg>
      </div>
      {/* Text positioning for triangles with inverted order: title at bottom, button at top */}
      <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-between z-10 py-4">
        {/* Button at top */}
        <div className="w-[var(--max-content-width,60%)] flex flex-col items-center justify-center mt-6 mb-0 triangle-button-container">
          {buttons}
        </div>
        
        {/* Content in middle, with shape contour awareness */}
        <div 
          className={`w-full max-w-[var(--max-content-width,65%)] px-3 flex flex-col items-center text-sm overflow-y-auto hide-scrollbar text-${textAlign} triangle-content-container`}
          data-shape-content="triangle"
          style={{ marginTop: "0", marginBottom: "0" }}
        >
          {otherContent.map((content, index) => {
            if (React.isValidElement(content) && content.type === 'p') {
              return React.cloneElement(content as React.ReactElement<any>, {
                className: cn('triangle-content text-sm', (content.props as any).className || ''),
                key: `triangle-content-${index}`
              });
            }
            return content;
          })}
        </div>
        
        {/* Soft divider line between content and title */}
        <ShapeDivider shapeType="triangle" width="40%" margin="0.5rem 0" opacity={25} />
        
        {/* Title at bottom */}
        <div className="w-[var(--max-content-width,70%)] flex flex-col items-center justify-center mb-4 mt-0 triangle-title-container">
          {headings}
        </div>
      </div>
    </div>
  )
}

export function InvertedTriangleContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
  maxContentWidth = "75%",
  textAlign = "center",
  responsive = true
}: EnhancedGeometryContainerProps) {
  // Add responsive class if enabled
  const responsiveClassName = responsive ? "geometric-shape-container" : "";
  
  // Process children to properly position title at top and button at bottom
  const processedChildren = React.Children.toArray(children);
  
  // Separate headings, buttons, and other content
  const headings: React.ReactNode[] = [];
  const buttons: React.ReactNode[] = [];
  const otherContent: React.ReactNode[] = [];
  
  processedChildren.forEach(child => {
    if (React.isValidElement(child)) {
      if (typeof child.type === 'string' && 
          (child.type === 'h1' || child.type === 'h2' || 
           child.type === 'h3' || child.type === 'h4')) {
        headings.push(child);
      } else if (typeof child.type === 'string' && child.type === 'button' ||
                (child.props && (child.props.className || '').includes('button'))) {
        buttons.push(child);
      } else {
        otherContent.push(child);
      }
    } else {
      otherContent.push(child);
    }
  });
  
  // Sample text if no other content is provided
  if (otherContent.length === 0) {
    otherContent.push(
      <p key="sample-text" className="inverted-triangle-content text-sm">
        The inverted triangle symbolizes water and feminine energy. Adaptive container for precise content.
      </p>
    );
  }
  
  // Calculate line height shift (approximately 1.5 times line height)
  const lineHeightShift = "1.5rem"; // ~1.5 times a standard line height
  
  return (
    <div
      className={cn(
        "relative text-white",
        responsiveClassName,
        "shape-contour-active",
        className
      )}
      style={{
        clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
        "--max-content-width": maxContentWidth
      } as React.CSSProperties}
      data-shape="inverted-triangle"
    >
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
          {/* Additional guides for text contour */}
          <path
            d="M50 10 L50 90"
            stroke="white"
            strokeWidth="0.2"
            strokeDasharray="2,2"
            fill="none"
          />
          <path
            d="M30 50 L70 50"
            stroke="white"
            strokeWidth="0.2"
            strokeDasharray="2,2"
            fill="none"
          />
        </svg>
      </div>
      {/* Text positioning for inverted triangles: title at top, button at bottom */}
      <div 
        className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-between z-10 py-4"
        style={{ transform: `translateY(-${lineHeightShift})` }} // Shift everything up by 1.5 line heights
      >
        {/* Title at top */}
        <div className="w-[var(--max-content-width,80%)] flex flex-col items-center justify-center mt-1 mb-1 inverted-triangle-title-container">
          {headings}
        </div>
        
        {/* Soft divider line between title and content */}
        <ShapeDivider shapeType="inverted-triangle" width="60%" margin="0.5rem 0" opacity={25} />
        
        {/* Content in middle with shape contour awareness */}
        <div 
          className={`w-full max-w-[var(--max-content-width,75%)] px-3 flex flex-col items-center text-sm overflow-y-auto hide-scrollbar text-${textAlign} inverted-triangle-content-container`}
          data-shape-content="inverted-triangle"
          style={{ marginTop: "0", marginBottom: "auto" }}
        >
          {otherContent.map((content, index) => {
            if (React.isValidElement(content) && content.type === 'p') {
              return React.cloneElement(content as React.ReactElement<any>, {
                className: cn('inverted-triangle-content text-sm', (content.props as any).className || ''),
                key: `inverted-triangle-content-${index}`
              });
            }
            return content;
          })}
        </div>
        
        {/* Button at bottom - smaller width near the point of the triangle */}
        <div className="w-[var(--max-content-width,45%)] flex flex-col items-center justify-center mb-5 mt-auto inverted-triangle-button-container">
          {buttons}
        </div>
      </div>
    </div>
  )
}

export function OctagonContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
  maxContentWidth = "92%",
  textAlign = "center",
  responsive = true
}: EnhancedGeometryContainerProps) {
  // Add responsive class if enabled
  const responsiveClassName = responsive ? "geometric-shape-container" : "";
  
  return (
    <div
      className={cn(
        "relative flex items-center justify-center p-8 text-white",
        responsiveClassName,
        "shape-contour-active",
        className
      )}
      style={{
        clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
        "--max-content-width": maxContentWidth
      } as React.CSSProperties}
      data-shape="octagon"
    >
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
      <div 
        className={`z-10 max-w-[var(--max-content-width,92%)] px-2 py-2 overflow-y-auto hide-scrollbar text-${textAlign} shape-content-center`}
      >
        {React.Children.map(children, (child, index) => {
          // Add divider after heading elements
          if (React.isValidElement(child) && typeof child.type === 'string' && 
              (child.type === 'h1' || child.type === 'h2' || child.type === 'h3')) {
            return (
              <>
                {child}
                <ShapeDivider shapeType="octagon" width="60%" margin="0.5rem 0" opacity={25} />
              </>
            );
          }
          return child;
        })}
      </div>
    </div>
  )
}

export function StarburstContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
  maxContentWidth = "35%",
  textAlign = "center",
  responsive = true
}: EnhancedGeometryContainerProps) {
  // Add responsive class if enabled
  const responsiveClassName = responsive ? "geometric-shape-container" : "";
  
  // Process children to properly position in order: text, title, button
  const processedChildren = React.Children.toArray(children);
  
  // Separate headings, buttons, and other content
  const headings: React.ReactNode[] = [];
  const buttons: React.ReactNode[] = [];
  const otherContent: React.ReactNode[] = [];
  
  processedChildren.forEach(child => {
    if (React.isValidElement(child)) {
      if (typeof child.type === 'string' && 
          (child.type === 'h1' || child.type === 'h2' || 
           child.type === 'h3' || child.type === 'h4')) {
        headings.push(child);
      } else if (typeof child.type === 'string' && child.type === 'button' ||
                (child.props && (child.props.className || '').includes('button'))) {
        buttons.push(child);
      } else {
        otherContent.push(child);
      }
    } else {
      otherContent.push(child);
    }
  });
  
  // Sample text if no other content is provided
  if (otherContent.length === 0) {
    otherContent.push(
      <p key="sample-text" className="starburst-triangular-content text-xs">
        Symbolizes expansion and radiant energy. Fits content precisely.
      </p>
    );
  }
  
  // Process paragraph content to apply triangular content styling
  const styledOtherContent = otherContent.map((content, index) => {
    if (typeof content === 'string' || typeof content === 'number') {
      return <p key={`starburst-content-${index}`} className="starburst-triangular-content text-xs">{content}</p>;
    }
    
    if (React.isValidElement(content) && content.type === 'p') {
      return React.cloneElement(content as React.ReactElement<any>, {
        className: cn('starburst-triangular-content text-xs', (content.props as any).className || ''),
        key: `starburst-content-${index}`
      });
    }
    
    return content;
  });
  
  // Calculate line height shift (approximately 0.5 times line height - less than triangles)
  const lineHeightShift = "0.5rem"; 
  
  return (
    <div
      className={cn(
        "relative flex items-center justify-center text-white",
        responsiveClassName,
        "shape-contour-active",
        className
      )}
      style={{
        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
        "--max-content-width": maxContentWidth
      } as React.CSSProperties}
      data-shape="starburst"
    >
      {/* Pentagon and triangular spikes visualization */}
      <div className="absolute inset-0 opacity-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
          style={{ animation: "rotate 180s linear infinite" }}
        >
          {/* Outer starburst shape */}
          <path
            d="M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          {/* Inner pentagon shape */}
          <path
            d="M50 20 L57 42 L82 42 L62 57 L69 77 L50 63 L31 77 L38 57 L18 42 L43 42 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          {/* Additional guide for the five triangular sections */}
          <path
            d="M50 0 L50 20"
            stroke="white"
            strokeWidth="0.2"
            strokeDasharray="2,2"
            fill="none"
          />
          <path
            d="M98 35 L82 42"
            stroke="white"
            strokeWidth="0.2"
            strokeDasharray="2,2"
            fill="none"
          />
          <path
            d="M79 91 L69 77"
            stroke="white"
            strokeWidth="0.2"
            strokeDasharray="2,2"
            fill="none"
          />
          <path
            d="M21 91 L31 77"
            stroke="white"
            strokeWidth="0.2"
            strokeDasharray="2,2"
            fill="none"
          />
          <path
            d="M2 35 L18 42"
            stroke="white"
            strokeWidth="0.2"
            strokeDasharray="2,2"
            fill="none"
          />
        </svg>
      </div>
      {/* Content organized in flow: text, title, button */}
      <div 
        className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-between z-10 py-1"
        style={{ transform: `translateY(-${lineHeightShift})` }} // Shift everything up slightly
      >
        {/* Text content at top */}
        <div 
          className={`w-full max-w-[var(--max-content-width,35%)] px-1 flex flex-col items-center text-xs overflow-y-auto hide-scrollbar text-${textAlign} starburst-text-container mt-6 mb-0`}
          data-shape-content="starburst"
        >
          {styledOtherContent}
        </div>
        
        {/* Soft divider line between text and title */}
        <ShapeDivider shapeType="starburst" width="25%" margin="0.35rem 0" opacity={30} />
        
        {/* Title in middle-bottom */}
        <div className="w-[var(--max-content-width,40%)] flex flex-col items-center justify-center mt-0 mb-1 starburst-title-container">
          {headings}
        </div>
        
        {/* Button at bottom */}
        <div className="w-[var(--max-content-width,35%)] flex flex-col items-center justify-center mb-6 starburst-button-container">
          {buttons}
        </div>
      </div>
    </div>
  )
}

interface CircleContainerProps extends EnhancedGeometryContainerProps {
  rotateSpeed?: number
}

export function CircleContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
  rotateSpeed = 60,
  maxContentWidth = "85%",
  textAlign = "center",
  responsive = true
}: CircleContainerProps) {
  // Add responsive class if enabled
  const responsiveClassName = responsive ? "geometric-shape-container" : "";
  
  return (
    <div
      className={cn(
        "relative flex items-center justify-center p-6 text-white rounded-full",
        responsiveClassName,
        "shape-contour-active",
        className
      )}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
        "--max-content-width": maxContentWidth
      } as React.CSSProperties}
      data-shape="circle"
    >
      <div className="absolute inset-0 opacity-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          className="opacity-20"
          style={{
            animation: `rotate ${rotateSpeed}s linear infinite`,
          }}
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
            r="35"
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
          <line
            x1="5"
            y1="50"
            x2="95"
            y2="50"
            stroke="white"
            strokeWidth="0.5"
          />
          <line
            x1="50"
            y1="5"
            x2="50"
            y2="95"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      </div>
      <div 
        className={`z-10 max-w-[var(--max-content-width,85%)] overflow-y-auto hide-scrollbar text-${textAlign} shape-content-center`}
      >
        {React.Children.map(children, (child, index) => {
          // Add divider after heading elements
          if (React.isValidElement(child) && typeof child.type === 'string' && 
              (child.type === 'h1' || child.type === 'h2' || child.type === 'h3')) {
            return (
              <>
                {child}
                <ShapeDivider shapeType="circle" width="40%" margin="0.5rem 0" opacity={25} />
              </>
            );
          }
          return child;
        })}
      </div>
    </div>
  )
}

// CSS for the component
const styles = `
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

export function SacredGeometryCss() {
  return <style>{styles}</style>
}