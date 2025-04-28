import React from "react"

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
        {children}
      </div>
    </div>
  )
}

export function TriangleContainer({
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
        </svg>
      </div>
      {/* Text positioning for triangles with improved responsive content */}
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
        <div 
          className={`w-[var(--max-content-width,85%)] flex flex-col items-center justify-center overflow-y-auto hide-scrollbar text-${textAlign} shape-content-center`} 
          style={{ transform: 'translateY(20%)' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function InvertedTriangleContainer({
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
        </svg>
      </div>
      {/* Text positioning for inverted triangles with improved responsive spacing */}
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
        <div 
          className={`w-[var(--max-content-width,85%)] flex flex-col items-center justify-center overflow-y-auto hide-scrollbar text-${textAlign} shape-content-center`} 
          style={{ transform: 'translateY(-15%)' }}
        >
          {children}
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
        {children}
      </div>
    </div>
  )
}

export function StarburstContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
  maxContentWidth = "55%",
  textAlign = "center",
  responsive = true
}: EnhancedGeometryContainerProps) {
  // Add responsive class if enabled
  const responsiveClassName = responsive ? "geometric-shape-container" : "";
  
  // Process children to apply triangular content styling
  const processedChildren = React.Children.map(children, (child) => {
    // If child is a string or number, wrap it
    if (typeof child === 'string' || typeof child === 'number') {
      return <p className="starburst-triangular-content">{child}</p>;
    }
    
    // If child is a React element
    if (React.isValidElement(child)) {
      // For paragraphs, add the triangular content class
      if (child.type === 'p') {
        return React.cloneElement(child, {
          className: cn('starburst-triangular-content', child.props.className)
        });
      }
      
      // For headings, keep them in the center without triangular styling
      if (typeof child.type === 'string' && 
          (child.type === 'h1' || child.type === 'h2' || 
           child.type === 'h3' || child.type === 'h4')) {
        return child;
      }
    }
    
    // Return unmodified for other elements
    return child;
  });
  
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
      {/* Center content perfectly within the pentagon center */}
      <div 
        className={`z-10 relative flex flex-col items-center justify-center overflow-y-auto hide-scrollbar text-${textAlign} starburst-content-center`}
      >
        {processedChildren}
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
        {children}
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