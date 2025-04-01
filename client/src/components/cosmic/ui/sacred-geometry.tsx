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
        "relative flex items-center justify-center p-6 text-white overflow-hidden",
        className
      )}
      style={{
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
        overflow: "auto"
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
      <div className="z-10 overflow-auto hide-scrollbar max-h-full">{children}</div>
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
        "relative flex items-center justify-center p-6 text-white overflow-hidden",
        className
      )}
      style={{
        clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
        overflow: "auto"
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
      <div className="z-10 overflow-auto hide-scrollbar max-h-full">{children}</div>
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
        "relative flex items-center justify-center p-6 text-white overflow-hidden rounded-full",
        className
      )}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: `0 0 15px ${glowColor}`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "250px",
        overflow: "auto"
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
      <div className="z-10 overflow-auto hide-scrollbar max-h-full">{children}</div>
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