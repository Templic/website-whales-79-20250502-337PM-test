import React from "react"
import { cn } from "@/lib/utils"

interface GeometryContainerProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function HexagonContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
}: GeometryContainerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center p-6 text-white",
        className
      )}
      style={{
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
      }}
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
      <div className="z-10 max-w-[85%] overflow-y-auto hide-scrollbar text-center">{children}</div>
    </div>
  )
}

export function TriangleContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
}: GeometryContainerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center p-6 text-white",
        className
      )}
      style={{
        clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
      }}
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
      <div className="z-10 max-w-[70%] max-h-[70%] overflow-y-auto hide-scrollbar text-center">{children}</div>
    </div>
  )
}

export function InvertedTriangleContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
}: GeometryContainerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center p-6 text-white",
        className
      )}
      style={{
        clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
      }}
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
      <div className="z-10 max-w-[70%] max-h-[70%] overflow-y-auto hide-scrollbar text-center">{children}</div>
    </div>
  )
}

export function StarOfDavidContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
}: GeometryContainerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center p-6 text-white",
        className
      )}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="opacity-20"
        >
          {/* Static outer frame */}
          <g>
            {/* Upward triangle */}
            <path
              d="M50 10 L90 70 L10 70 Z"
              stroke="white"
              strokeWidth="0.5"
              fill="none"
            />
            {/* Downward triangle */}
            <path
              d="M50 90 L10 30 L90 30 Z"
              stroke="white"
              strokeWidth="0.5"
              fill="none"
            />
          </g>
          
          {/* Rotating inner elements */}
          <g style={{ animation: "rotate 120s linear infinite" }}>
            {/* Inner hexagon */}
            <path
              d="M50 30 L70 40 L70 60 L50 70 L30 60 L30 40 Z"
              stroke="white"
              strokeWidth="0.5"
              fill="none"
            />
            {/* Inner lines */}
            <line
              x1="30"
              y1="40"
              x2="70"
              y2="60"
              stroke="white"
              strokeWidth="0.25"
            />
            <line
              x1="30"
              y1="60"
              x2="70"
              y2="40"
              stroke="white"
              strokeWidth="0.25"
            />
          </g>
        </svg>
      </div>
      <div className="z-10 max-w-[60%] overflow-y-auto hide-scrollbar text-center">{children}</div>
    </div>
  )
}

interface CircleContainerProps extends GeometryContainerProps {
  rotateSpeed?: number
}

export function CircleContainer({
  children,
  className,
  glowColor = "rgba(0, 230, 230, 0.5)",
  rotateSpeed = 60,
}: CircleContainerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center p-6 text-white rounded-full",
        className
      )}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
      }}
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
      <div className="z-10 max-w-[65%] overflow-y-auto hide-scrollbar text-center">{children}</div>
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