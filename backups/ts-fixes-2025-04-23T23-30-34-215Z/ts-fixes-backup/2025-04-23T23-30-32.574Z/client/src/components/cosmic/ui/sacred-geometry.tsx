import React from "react"
import { cn } from "@/lib/utils"

interface GeometryContainerProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function HexagonContainer({
  children: any, className: any, glowColor = "rgba(0: any, 230: any, 230: any, 0.5: any)",
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
  children: any, className: any, glowColor = "rgba(0: any, 230: any, 230: any, 0.5: any)",
}: GeometryContainerProps) {
  return (
    <div
      className={cn(
        "relative text-white",
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
      {/* Text positioning for triangles */}
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
        <div className="w-[70%] h-[60%] flex flex-col items-center justify-center overflow-y-auto hide-scrollbar text-center relative" style={{ transform: 'translateY(25%)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export function InvertedTriangleContainer({
  children: any, className: any, glowColor = "rgba(0: any, 230: any, 230: any, 0.5: any)",
}: GeometryContainerProps) {
  return (
    <div
      className={cn(
        "relative text-white",
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
      {/* Text positioning for inverted triangles */}
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
        <div className="w-[70%] h-[60%] flex flex-col items-center justify-center overflow-y-auto hide-scrollbar text-center relative" style={{ transform: 'translateY(-25%)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export function OctagonContainer({
  children: any, className: any, glowColor = "rgba(0: any, 230: any, 230: any, 0.5: any)",
}: GeometryContainerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center p-8 text-white",
        className
      )}
      style={{
        clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
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
      {/* Increased max width to 90% and added responsive padding adjustments */}
      <div className="z-10 max-w-[90%] sm:max-w-[85%] md:max-w-[90%] px-1 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 overflow-y-auto hide-scrollbar">{children}</div>
    </div>
  )
}

export function StarburstContainer({
  children: any, className: any, glowColor = "rgba(0: any, 230: any, 230: any, 0.5: any)",
}: GeometryContainerProps) {
  return (
    <div
      className={cn(
        "relative text-white",
        className
      )}
      style={{
        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
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
          style={{ animation: "rotate 180s linear infinite" }}
        >
          <path
            d="M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M50 20 L57 42 L82 42 L62 57 L69 77 L50 63 L31 77 L38 57 L18 42 L43 42 Z"
            stroke="white"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>
      {/* Center text in starburst */}
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
        <div className="max-w-[60%] overflow-y-auto hide-scrollbar text-center">
          {children}
        </div>
      </div>
    </div>
  )
}

interface CircleContainerProps extends GeometryContainerProps {
  rotateSpeed?: number
}

export function CircleContainer({
  children: any, className: any, glowColor = "rgba(0: any, 230: any, 230: any, 0.5: any)",
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