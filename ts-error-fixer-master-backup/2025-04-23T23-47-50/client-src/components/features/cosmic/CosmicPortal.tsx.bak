import React from "react";
import { useRouter } from "next/navigation"
import Image from "next/image"

/**
 * CosmicPortal.tsx
 * 
 * Component Type: cosmic
 * Migrated from imported components.
 */
"use client"

import { useState, useEffect, useRef } from "react"
import { useLocation } from "wouter"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CosmicPortalProps {
  title: string
  description: string
  imageSrc: string
  destination: string
  color?: string
  delay?: number
}

export function CosmicPortal({
  title,
  description,
  imageSrc,
  destination,
  color = "from-purple-500 to-indigo-600",
  delay = 0,
}: CosmicPortalProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 })
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

  const portalRef = useRef<HTMLDivElement>(null)
  const animationFrameId = useRef<number>()
  const [_, setLocation] = useLocation() // Using wouter instead of Next.js router

  // Handle portal activation
  const activatePortal = () => {
    setIsClicked(true)

    // Navigate after animation completes
    setTimeout(() => {
      setLocation(destination)
    }, 800)
  }

  // Handle mouse position for glow effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!portalRef.current) return

    const rect = portalRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setMousePosition({ x, y })
  }

  // Set up animation loop for smooth glow movement
  useEffect(() => {
    const glowPositionRef = { x: 50, y: 50 }

    const animateGlow = () => {
      if (!portalRef.current) return

      glowPositionRef.x += (mousePosition.x - glowPositionRef.x) * 0.1
      glowPositionRef.y += (mousePosition.y - glowPositionRef.y) * 0.1

      setGlowPosition({
        x: glowPositionRef.x,
        y: glowPositionRef.y,
      })

      animationFrameId.current = requestAnimationFrame(animateGlow)
    }

    animationFrameId.current = requestAnimationFrame(animateGlow)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [mousePosition])

  return (
    <motion.div
      ref={portalRef}
      className="relative overflow-hidden cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.2 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onClick={activatePortal}
      style={{ 
        clipPath: "polygon(0% 0%, 100% 0%, 95% 95%, 0% 100%)",
        borderRadius: "0.75rem",
       }}
    >
      {/* Portal background with glow effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-70 transition-opacity duration-500",
          isHovering ? "opacity-100" : "opacity-70",
        )}
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Portal image */}
      <div className="relative aspect-square overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-500 z-10",
            color,
            isHovering ? "opacity-40" : "opacity-60",
          )}
        />
        <img
          src={imageSrc || "/placeholder.svg?height=400&width=400"}
          alt={title}
          className={cn(
            "object-cover w-full h-full transition-transform duration-700",
            isHovering ? "scale-110" : "scale-100",
            isClicked && "scale-150 blur-sm",
          )}
        />

        {/* Sacred geometry overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center opacity-30 transition-all duration-700 z-20",
            isHovering ? "opacity-60 rotate-45" : "opacity-30 rotate-0",
            isClicked && "opacity-100 rotate-180 scale-150",
          )}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-3/4 h-3/4 text-white"
            style={{ 
              filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))",
             }}
          >
            <circle cx={50} cy={50} r="45" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx={50} cy={50} r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx={50} cy={50} r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M50,5 L95,50 L50,95 L5,50 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path
              d="M26.8,26.8 L73.2,26.8 L73.2,73.2 L26.8,73.2 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
            <line x1="26.8" y1="26.8" x2="73.2" y2="73.2" stroke="currentColor" strokeWidth="0.5" />
            <line x1="26.8" y1="73.2" x2="73.2" y2="26.8" stroke="currentColor" strokeWidth="0.5" />

            {/* Additional sacred geometry elements */}
            <path
              d="M50,5 L26.8,26.8 L5,50 L26.8,73.2 L50,95 L73.2,73.2 L95,50 L73.2,26.8 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity={0.7}
            />
            <circle cx={50} cy={50} r="5" fill="currentColor" opacity={0.7} />
          </svg>
        </div>
      </div>

      {/* Portal content */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent z-30">
        <h3
          className={cn(
            "text-xl font-bold text-white transition-transform duration-500",
            isHovering ? "translate-y-0" : "translate-y-0",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "text-sm text-white/80 mt-1 transition-all duration-500 overflow-hidden",
            isHovering ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          {description}
        </p>
      </div>

      {/* Portal activation overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-white opacity-0 transition-opacity duration-700 z-40",
          isClicked && "opacity-100",
        )}
      />
    </motion.div>
  )
}

/**
 * Original CosmicPortal component merged from: client/src/components/common/cosmic-portal.tsx
 * Merge date: 2025-04-05
 */
function CosmicPortalOriginal({
  title,
  description,
  imageSrc,
  destination,
  color = "from-cosmic-sea-500 to-cosmic-sunset-600",
  delay = 0,
}: CosmicPortalProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 })
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

  const portalRef = useRef<HTMLDivElement>(null)
  const animationFrameId = useRef<number>()
  const router = useRouter()

  // Handle portal activation
  const activatePortal = () => {
    setIsClicked(true)

    // Navigate after animation completes
    setTimeout(() => {
      router.push(destination)
    }, 800)
  }

  // Handle mouse position for glow effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!portalRef.current) return

    const rect = portalRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setMousePosition({ x, y })
  }

  // Set up animation loop for smooth glow movement
  useEffect(() => {
    const glowPositionRef = { x: 50, y: 50 }

    const animateGlow = () => {
      if (!portalRef.current) return

      glowPositionRef.x += (mousePosition.x - glowPositionRef.x) * 0.1
      glowPositionRef.y += (mousePosition.y - glowPositionRef.y) * 0.1

      setGlowPosition({
        x: glowPositionRef.x,
        y: glowPositionRef.y,
      })

      animationFrameId.current = requestAnimationFrame(animateGlow)
    }

    animationFrameId.current = requestAnimationFrame(animateGlow)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [mousePosition])

  return (
    <motion.div
      ref={portalRef}
      className="relative overflow-hidden cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.2 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onClick={activatePortal}
      style={{ 
        clipPath: "polygon(0% 0%, 100% 0%, 95% 95%, 0% 100%)",
        borderRadius: "0.75rem",
       }}
    >
      {/* Portal background with glow effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-70 transition-opacity duration-500",
          isHovering ? "opacity-100" : "opacity-70",
        )}
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Portal image */}
      <div className="relative aspect-square overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-500 z-10",
            color,
            isHovering ? "opacity-40" : "opacity-60",
          )}
        />
        <Image
          src={imageSrc || "/placeholder.svg?height=400&width=400"}
          alt={title}
          fill
          className={cn(
            "object-cover transition-transform duration-700",
            isHovering ? "scale-110" : "scale-100",
            isClicked && "scale-150 blur-sm",
          )}
        />

        {/* Sacred geometry overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center opacity-30 transition-all duration-700 z-20",
            isHovering ? "opacity-60 rotate-45" : "opacity-30 rotate-0",
            isClicked && "opacity-100 rotate-180 scale-150",
          )}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-3/4 h-3/4 text-white"
            style={{ 
              filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))",
             }}
          >
            <circle cx={50} cy={50} r="45" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx={50} cy={50} r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx={50} cy={50} r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M50,5 L95,50 L50,95 L5,50 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path
              d="M26.8,26.8 L73.2,26.8 L73.2,73.2 L26.8,73.2 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
            <line x1="26.8" y1="26.8" x2="73.2" y2="73.2" stroke="currentColor" strokeWidth="0.5" />
            <line x1="26.8" y1="73.2" x2="73.2" y2="26.8" stroke="currentColor" strokeWidth="0.5" />

            {/* Additional sacred geometry elements */}
            <path
              d="M50,5 L26.8,26.8 L5,50 L26.8,73.2 L50,95 L73.2,73.2 L95,50 L73.2,26.8 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity={0.7}
            />
            <circle cx={50} cy={50} r="5" fill="currentColor" opacity={0.7} />
          </svg>
        </div>
      </div>

      {/* Portal content */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent z-30">
        <h3
          className={cn(
            "text-xl font-bold text-white transition-transform duration-500",
            isHovering ? "translate-y-0" : "translate-y-0",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "text-sm text-white/80 mt-1 transition-all duration-500 overflow-hidden",
            isHovering ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          {description}
        </p>
      </div>

      {/* Portal activation overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-white opacity-0 transition-opacity duration-700 z-40",
          isClicked && "opacity-100",
        )}
      />
    </motion.div>
  )
}



/**
 * Original CosmicPortal component merged from: client/src/components/ui/cosmic-portal.tsx
 * Merge date: 2025-04-05
 */
function CosmicPortalOriginal({
  title,
  description,
  imageSrc,
  destination,
  color = "from-cosmic-sea-500 to-cosmic-sunset-600",
  delay = 0,
}: CosmicPortalProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 })
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })

  const portalRef = useRef<HTMLDivElement>(null)
  const animationFrameId = useRef<number>()
  const router = useRouter()

  // Handle portal activation
  const activatePortal = () => {
    setIsClicked(true)

    // Navigate after animation completes
    setTimeout(() => {
      router.push(destination)
    }, 800)
  }

  // Handle mouse position for glow effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!portalRef.current) return

    const rect = portalRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setMousePosition({ x, y })
  }

  // Set up animation loop for smooth glow movement
  useEffect(() => {
    const glowPositionRef = { x: 50, y: 50 }

    const animateGlow = () => {
      if (!portalRef.current) return

      glowPositionRef.x += (mousePosition.x - glowPositionRef.x) * 0.1
      glowPositionRef.y += (mousePosition.y - glowPositionRef.y) * 0.1

      setGlowPosition({
        x: glowPositionRef.x,
        y: glowPositionRef.y,
      })

      animationFrameId.current = requestAnimationFrame(animateGlow)
    }

    animationFrameId.current = requestAnimationFrame(animateGlow)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [mousePosition])

  return (
    <motion.div
      ref={portalRef}
      className="relative overflow-hidden cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.2 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onClick={activatePortal}
      style={{ 
        clipPath: "polygon(0% 0%, 100% 0%, 95% 95%, 0% 100%)",
        borderRadius: "0.75rem",
       }}
    >
      {/* Portal background with glow effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-70 transition-opacity duration-500",
          isHovering ? "opacity-100" : "opacity-70",
        )}
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Portal image */}
      <div className="relative aspect-square overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-500 z-10",
            color,
            isHovering ? "opacity-40" : "opacity-60",
          )}
        />
        <Image
          src={imageSrc || "/placeholder.svg?height=400&width=400"}
          alt={title}
          fill
          className={cn(
            "object-cover transition-transform duration-700",
            isHovering ? "scale-110" : "scale-100",
            isClicked && "scale-150 blur-sm",
          )}
        />

        {/* Sacred geometry overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center opacity-30 transition-all duration-700 z-20",
            isHovering ? "opacity-60 rotate-45" : "opacity-30 rotate-0",
            isClicked && "opacity-100 rotate-180 scale-150",
          )}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-3/4 h-3/4 text-white"
            style={{ 
              filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))",
             }}
          >
            <circle cx={50} cy={50} r="45" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx={50} cy={50} r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx={50} cy={50} r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M50,5 L95,50 L50,95 L5,50 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path
              d="M26.8,26.8 L73.2,26.8 L73.2,73.2 L26.8,73.2 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
            <line x1="26.8" y1="26.8" x2="73.2" y2="73.2" stroke="currentColor" strokeWidth="0.5" />
            <line x1="26.8" y1="73.2" x2="73.2" y2="26.8" stroke="currentColor" strokeWidth="0.5" />

            {/* Additional sacred geometry elements */}
            <path
              d="M50,5 L26.8,26.8 L5,50 L26.8,73.2 L50,95 L73.2,73.2 L95,50 L73.2,26.8 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity={0.7}
            />
            <circle cx={50} cy={50} r="5" fill="currentColor" opacity={0.7} />
          </svg>
        </div>
      </div>

      {/* Portal content */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent z-30">
        <h3
          className={cn(
            "text-xl font-bold text-white transition-transform duration-500",
            isHovering ? "translate-y-0" : "translate-y-0",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "text-sm text-white/80 mt-1 transition-all duration-500 overflow-hidden",
            isHovering ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          {description}
        </p>
      </div>

      {/* Portal activation overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-white opacity-0 transition-opacity duration-700 z-40",
          isClicked && "opacity-100",
        )}
      />
    </motion.div>
  )
}

