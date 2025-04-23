"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GeometryContainerProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  delay?: number
  maxLines?: number
  clipPath?: string
}

export function HexagonContainer({
  children,
  className,
  glowColor = "rgba(139, 92, 246, 0.5)",
  delay = 0,
}: GeometryContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={cn("relative", className)}
    >
      {/* Container with clip path */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          background: "rgba(0, 0, 0, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: `0 0 20px ${glowColor}`,
        }}
      />

      {/* Glow effect */}
      <div
        className="absolute inset-2 -z-10 opacity-20"
        style={{
          clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          background: `linear-gradient(45deg, ${glowColor} 0%, transparent 100%)`,
        }}
      />

      {/* Content with responsive padding */}
      <div className="p-6 md:p-8 lg:p-10">
        <div className="text-center overflow-hidden">{children}</div>
      </div>
    </motion.div>
  )
}

export function OctagonContainer({
  children,
  className,
  glowColor = "rgba(20, 184, 166, 0.5)",
  delay = 0,
}: GeometryContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={cn("relative", className)}
    >
      {/* Container with clip path */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          background: "rgba(0, 0, 0, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: `0 0 20px ${glowColor}`,
        }}
      />

      {/* Glow effect */}
      <div
        className="absolute inset-2 -z-10 opacity-20"
        style={{
          clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          background: `linear-gradient(45deg, ${glowColor} 0%, transparent 100%)`,
        }}
      />

      {/* Content with responsive padding */}
      <div className="p-6 md:p-8 lg:p-10">
        <div className="text-center overflow-hidden">{children}</div>
      </div>
    </motion.div>
  )
}

export function PentagonContainer({
  children,
  className,
  glowColor = "rgba(217, 70, 239, 0.5)",
  delay = 0,
}: GeometryContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={cn("relative", className)}
    >
      {/* Container with clip path */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
          background: "rgba(0, 0, 0, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: `0 0 20px ${glowColor}`,
        }}
      />

      {/* Glow effect */}
      <div
        className="absolute inset-2 -z-10 opacity-20"
        style={{
          clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
          background: `linear-gradient(45deg, ${glowColor} 0%, transparent 100%)`,
        }}
      />

      {/* Content with responsive padding */}
      <div className="p-6 md:p-8 lg:p-10">
        <div className="text-center overflow-hidden">{children}</div>
      </div>
    </motion.div>
  )
}

export function TriangleInterlockContainer({
  children,
  className,
  glowColor = "rgba(14, 165, 233, 0.5)",
  delay = 0,
}: GeometryContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={cn("relative", className)}
    >
      {/* First triangle */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
          background: "rgba(0, 0, 0, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: `0 0 20px ${glowColor}`,
        }}
      />

      {/* Second triangle (inverted) */}
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          clipPath: "polygon(50% 100%, 100% 0%, 0% 0%)",
          background: `linear-gradient(45deg, ${glowColor} 0%, transparent 100%)`,
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      />

      {/* Content with responsive padding */}
      <div className="p-6 md:p-8 lg:p-10">
        <div className="text-center overflow-hidden">{children}</div>
      </div>
    </motion.div>
  )
}

export function FlowerOfLifePattern({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 400
    canvas.height = 400

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set style for circles
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Calculate radius based on canvas size
    const radius = canvas.width / 10

    // Draw Flower of Life pattern
    const drawCircle = (x: number, y: number) => {
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Center circle
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Draw center circle
    drawCircle(centerX, centerY)

    // Draw first ring of 6 circles
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      drawCircle(x, y)
    }

    // Draw second ring
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI / 6) * i
      const x = centerX + radius * 2 * Math.cos(angle)
      const y = centerY + radius * 2 * Math.sin(angle)
      drawCircle(x, y)
    }
  }, [])

  return <canvas ref={canvasRef} width={400} height={400} className={cn("absolute opacity-10", className)} />
}

export function MetatronsCube({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 -z-10 opacity-10", className)}>
      <svg viewBox="0 0 500 500" className="w-full h-full">
        {/* Circles */}
        <circle cx="250" cy="250" r="50" stroke="rgba(255,255,255,0.3)" fill="none" />
        <circle cx="250" cy="150" r="50" stroke="rgba(255,255,255,0.3)" fill="none" />
        <circle cx="250" cy="350" r="50" stroke="rgba(255,255,255,0.3)" fill="none" />
        <circle cx="150" cy="200" r="50" stroke="rgba(255,255,255,0.3)" fill="none" />
        <circle cx="150" cy="300" r="50" stroke="rgba(255,255,255,0.3)" fill="none" />
        <circle cx="350" cy="200" r="50" stroke="rgba(255,255,255,0.3)" fill="none" />
        <circle cx="350" cy="300" r="50" stroke="rgba(255,255,255,0.3)" fill="none" />

        {/* Lines connecting centers */}
        <line x1="250" y1="250" x2="250" y2="150" stroke="rgba(255,255,255,0.3)" />
        <line x1="250" y1="250" x2="250" y2="350" stroke="rgba(255,255,255,0.3)" />
        <line x1="250" y1="250" x2="150" y2="200" stroke="rgba(255,255,255,0.3)" />
        <line x1="250" y1="250" x2="150" y2="300" stroke="rgba(255,255,255,0.3)" />
        <line x1="250" y1="250" x2="350" y2="200" stroke="rgba(255,255,255,0.3)" />
        <line x1="250" y1="250" x2="350" y2="300" stroke="rgba(255,255,255,0.3)" />

        {/* Outer connections */}
        <line x1="250" y1="150" x2="150" y2="200" stroke="rgba(255,255,255,0.3)" />
        <line x1="250" y1="150" x2="350" y2="200" stroke="rgba(255,255,255,0.3)" />
        <line x1="150" y1="200" x2="150" y2="300" stroke="rgba(255,255,255,0.3)" />
        <line x1="350" y1="200" x2="350" y2="300" stroke="rgba(255,255,255,0.3)" />
        <line x1="150" y1="300" x2="250" y2="350" stroke="rgba(255,255,255,0.3)" />
        <line x1="350" y1="300" x2="250" y2="350" stroke="rgba(255,255,255,0.3)" />
      </svg>
    </div>
  )
}

export function SacredGeometryBackground() {
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.1) % 360)
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 -z-20 opacity-20 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "center",
        }}
      >
        <svg viewBox="0 0 1000 1000" className="w-full h-full opacity-30">
          {/* Sri Yantra */}
          <g stroke="rgba(255,255,255,0.3)" fill="none" strokeWidth="1">
            {/* Outer triangles */}
            <polygon points="500,100 900,700 100,700" />
            <polygon points="500,900 900,300 100,300" />

            {/* Inner triangles */}
            <polygon points="500,200 800,600 200,600" />
            <polygon points="500,800 800,400 200,400" />

            {/* Center triangles */}
            <polygon points="500,300 700,500 300,500" />
            <polygon points="500,700 700,500 300,500" />

            {/* Center */}
            <circle cx="500" cy="500" r="50" />
          </g>
        </svg>
      </div>
    </div>
  )
}

// Simple text-fitting container for any sacred geometry shape
export function AdaptiveTextContainer({
  children,
  className,
  clipPath = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
  glowColor = "rgba(139, 92, 246, 0.5)",
  delay = 0,
  maxLines = 4,
}: GeometryContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={cn("relative", className)}
    >
      {/* Container with clip path */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          clipPath,
          background: "rgba(0, 0, 0, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: `0 0 20px ${glowColor}`,
        }}
      />

      {/* Glow effect */}
      <div
        className="absolute inset-2 -z-10 opacity-20"
        style={{
          clipPath,
          background: `linear-gradient(45deg, ${glowColor} 0%, transparent 100%)`,
        }}
      />

      {/* Content with responsive padding and text constraints */}
      <div className="p-6 md:p-8 lg:p-10">
        <div
          className="text-center overflow-hidden"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
            wordWrap: "break-word",
          }}
        >
          {children}
        </div>
      </div>
    </motion.div>
  )
}

