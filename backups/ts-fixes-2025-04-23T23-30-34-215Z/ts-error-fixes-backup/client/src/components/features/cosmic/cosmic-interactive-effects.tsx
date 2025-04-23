/**
 * cosmic-interactive-effects.tsx
 * 
 * Component Type: cosmic
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */
/**
 * cosmic-interactive-effects.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

// Parallax effect component
export function CosmicParallax({
  children,
  speed = 0.5,
  direction = "y",
  className,
}: {
  children: React.ReactNode
  speed?: number
  direction?: "x" | "y"
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const springConfig = { stiffness: 100, damping: 30, bounce: 0 }
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]), springConfig)
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]), springConfig)

  return (
    <motion.div ref={ref} style={direction === "y" ? { y } : { x }} className={className}>
      {children}
    </motion.div>
  )
}

// Reveal on scroll component
export function CosmicReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  threshold = 0.2,
  className,
}: {
  children: React.ReactNode
  direction?: "up" | "down" | "left" | "right"
  delay?: number
  duration?: number
  threshold?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: threshold })

  const directionVariants = {
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
    left: { x: 50, opacity: 0 },
    right: { x: -50, opacity: 0 },
  }

  return (
    <motion.div
      ref={ref}
      initial={directionVariants[direction]}
      animate={isInView ? { y: 0, x: 0, opacity: 1 } : directionVariants[direction]}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Magnetic effect component
export function CosmicMagnetic({
  children,
  strength = 50,
  className,
}: {
  children: React.ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2

    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY

    x.set(distanceX / strength)
    y.set(distanceY / strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

// Text scramble effect
export function CosmicTextScramble({
  text,
  duration = 2,
  className,
}: {
  text: string
  duration?: number
  className?: string
}) {
  const [scrambledText, setScrambledText] = useState(text)
  const [isScrambling, setIsScrambling] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    setIsScrambling(true)

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/"
    const originalChars = text.split("")
    let iteration = 0
    const maxIterations = 10

    const interval = setInterval(
      () => {
        if (iteration >= maxIterations) {
          clearInterval(interval)
          setScrambledText(text)
          setIsScrambling(false)
          return
        }

        const progress = iteration / maxIterations

        setScrambledText(
          originalChars
            .map((char, index) => {
              // Spaces remain spaces
              if (char === " ") return " "

              // The more iterations we've done, the more likely we are to show the original character
              if (Math.random() < progress + index / text.length) {
                return char
              }

              return chars[Math.floor(Math.random() * chars.length)]
            })
            .join(""),
        )

        iteration++
      },
      (duration * 1000) / maxIterations,
    )

    return () => clearInterval(interval)
  }, [isInView, text, duration])

  return (
    <div ref={ref} className={cn("font-mono", isScrambling && "text-purple-400", className)}>
      {scrambledText}
    </div>
  )
}

// Cosmic cursor effect - Fixed to prevent infinite updates
export function CosmicCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isOverLink, setIsOverLink] = useState(false)

  // Use useCallback to memoize event handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY })
    setIsVisible(true)

    // Check if cursor is over a link or button
    const element = document.elementFromPoint(e.clientX, e.clientY)
    if (element) {
      const isLink =
        element.tagName === "A" || element.tagName === "BUTTON" || element.closest("a") || element.closest("button")

      // Only update state if it's changed to prevent unnecessary re-renders
      setIsOverLink((prev) => {
        if (prev !== !!isLink) return !!isLink
        return prev
      })
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false)
  }, [])

  const handleMouseDown = useCallback(() => {
    setIsClicking(true)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsClicking(false)
  }, [])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseLeave, handleMouseDown, handleMouseUp])

  // Don't render on mobile/touch devices
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null
  }

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-50 mix-blend-difference"
        style={{
          x: position.x - 16,
          y: position.y - 16,
          backgroundColor: isOverLink ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
        }}
        animate={{
          scale: isClicking ? 0.8 : isOverLink ? 1.2 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28,
        }}
      />

      <motion.div
        className="fixed top-0 left-0 w-40 h-40 rounded-full pointer-events-none z-40 mix-blend-difference"
        style={{
          x: position.x - 80,
          y: position.y - 80,
          backgroundColor: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        animate={{
          scale: isClicking ? 0.9 : 1,
          opacity: isVisible ? 0.2 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.03,
        }}
      />
    </>
  )
}

// Starfield background with parallax effect - Fixed to prevent infinite updates
export function CosmicStarfield({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const starsRef = useRef<Array<{ x: number; y: number; size: number; speed: number }>>([])
  const animationRef = useRef<number>()

  // Use useCallback to memoize event handlers
  const handleResize = useCallback(() => {
    if (typeof window !== "undefined") {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (typeof window !== "undefined") {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
    }
  }, [])

  // Initialize dimensions and event listeners
  useEffect(() => {
    handleResize()

    window.addEventListener("resize", handleResize)
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [handleResize, handleMouseMove])

  // Initialize stars when dimensions change
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return

    // Create stars only once when dimensions are set
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 200 }, () => ({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.05 + 0.02,
      }))
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Animation loop
    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Calculate parallax offset
      const offsetX = (mousePosition.x - 0.5) * 30
      const offsetY = (mousePosition.y - 0.5) * 30

      // Draw stars
      starsRef.current.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.random() * 0.5})`
        ctx.beginPath()
        ctx.arc(star.x + offsetX * star.speed, star.y + offsetY * star.speed, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, mousePosition])

  return <canvas ref={canvasRef} className={cn("absolute inset-0 -z-10", className)} />
}



/**
 * Original CosmicParallax component merged from: client/src/components/common/cosmic-interactive-effects.tsx
 * Merge date: 2025-04-05
 */
function CosmicParallaxOriginal({
  children,
  speed = 0.5,
  direction = "y",
  className,
}: {
  children: React.ReactNode
  speed?: number
  direction?: "x" | "y"
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const springConfig = { stiffness: 100, damping: 30, bounce: 0 }
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]), springConfig)
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]), springConfig)

  return (
    <motion.div ref={ref} style={direction === "y" ? { y } : { x }} className={className}>
      {children}
    </motion.div>
  )
}

// Reveal on scroll component
export function CosmicReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  threshold = 0.2,
  className,
}: {
  children: React.ReactNode
  direction?: "up" | "down" | "left" | "right"
  delay?: number
  duration?: number
  threshold?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: threshold })

  const directionVariants = {
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
    left: { x: 50, opacity: 0 },
    right: { x: -50, opacity: 0 },
  }

  return (
    <motion.div
      ref={ref}
      initial={directionVariants[direction]}
      animate={isInView ? { y: 0, x: 0, opacity: 1 } : directionVariants[direction]}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Magnetic effect component
export function CosmicMagnetic({
  children,
  strength = 50,
  className,
}: {
  children: React.ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2

    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY

    x.set(distanceX / strength)
    y.set(distanceY / strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

// Text scramble effect
export function CosmicTextScramble({
  text,
  duration = 2,
  className,
}: {
  text: string
  duration?: number
  className?: string
}) {
  const [scrambledText, setScrambledText] = useState(text)
  const [isScrambling, setIsScrambling] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    setIsScrambling(true)

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/"
    const originalChars = text.split("")
    let iteration = 0
    const maxIterations = 10

    const interval = setInterval(
      () => {
        if (iteration >= maxIterations) {
          clearInterval(interval)
          setScrambledText(text)
          setIsScrambling(false)
          return
        }

        const progress = iteration / maxIterations

        setScrambledText(
          originalChars
            .map((char, index) => {
              // Spaces remain spaces
              if (char === " ") return " "

              // The more iterations we've done, the more likely we are to show the original character
              if (Math.random() < progress + index / text.length) {
                return char
              }

              return chars[Math.floor(Math.random() * chars.length)]
            })
            .join(""),
        )

        iteration++
      },
      (duration * 1000) / maxIterations,
    )

    return () => clearInterval(interval)
  }, [isInView, text, duration])

  return (
    <div ref={ref} className={cn("font-mono", isScrambling && "text-purple-400", className)}>
      {scrambledText}
    </div>
  )
}

// Cosmic cursor effect - Fixed to prevent infinite updates
export function CosmicCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isOverLink, setIsOverLink] = useState(false)

  // Use useCallback to memoize event handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY })
    setIsVisible(true)

    // Check if cursor is over a link or button
    const element = document.elementFromPoint(e.clientX, e.clientY)
    if (element) {
      const isLink =
        element.tagName === "A" || element.tagName === "BUTTON" || element.closest("a") || element.closest("button")

      // Only update state if it's changed to prevent unnecessary re-renders
      setIsOverLink((prev) => {
        if (prev !== !!isLink) return !!isLink
        return prev
      })
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false)
  }, [])

  const handleMouseDown = useCallback(() => {
    setIsClicking(true)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsClicking(false)
  }, [])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseLeave, handleMouseDown, handleMouseUp])

  // Don't render on mobile/touch devices
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null
  }

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-50 mix-blend-difference"
        style={{
          x: position.x - 16,
          y: position.y - 16,
          backgroundColor: isOverLink ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
        }}
        animate={{
          scale: isClicking ? 0.8 : isOverLink ? 1.2 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28,
        }}
      />

      <motion.div
        className="fixed top-0 left-0 w-40 h-40 rounded-full pointer-events-none z-40 mix-blend-difference"
        style={{
          x: position.x - 80,
          y: position.y - 80,
          backgroundColor: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        animate={{
          scale: isClicking ? 0.9 : 1,
          opacity: isVisible ? 0.2 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.03,
        }}
      />
    </>
  )
}

// Starfield background with parallax effect - Fixed to prevent infinite updates
export function CosmicStarfield({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const starsRef = useRef<Array<{ x: number; y: number; size: number; speed: number }>>([])
  const animationRef = useRef<number>()

  // Use useCallback to memoize event handlers
  const handleResize = useCallback(() => {
    if (typeof window !== "undefined") {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (typeof window !== "undefined") {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
    }
  }, [])

  // Initialize dimensions and event listeners
  useEffect(() => {
    handleResize()

    window.addEventListener("resize", handleResize)
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [handleResize, handleMouseMove])

  // Initialize stars when dimensions change
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return

    // Create stars only once when dimensions are set
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 200 }, () => ({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.05 + 0.02,
      }))
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Animation loop
    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Calculate parallax offset
      const offsetX = (mousePosition.x - 0.5) * 30
      const offsetY = (mousePosition.y - 0.5) * 30

      // Draw stars
      starsRef.current.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.random() * 0.5})`
        ctx.beginPath()
        ctx.arc(star.x + offsetX * star.speed, star.y + offsetY * star.speed, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, mousePosition])

  return <canvas ref={canvasRef} className={cn("absolute inset-0 -z-10", className)} />
}



/**
 * Original CosmicParallax component merged from: client/src/components/features/cosmic/CosmicInteractiveEffects.tsx
 * Merge date: 2025-04-05
 */
function CosmicParallaxOriginal({
  children,
  speed = 0.5,
  direction = "y",
  className,
}: {
  children: React.ReactNode
  speed?: number
  direction?: "x" | "y"
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const springConfig = { stiffness: 100, damping: 30, bounce: 0 }
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]), springConfig)
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]), springConfig)

  return (
    <motion.div ref={ref} style={direction === "y" ? { y } : { x }} className={className}>
      {children}
    </motion.div>
  )
}

// Reveal on scroll component
export function CosmicReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  threshold = 0.2,
  className,
}: {
  children: React.ReactNode
  direction?: "up" | "down" | "left" | "right"
  delay?: number
  duration?: number
  threshold?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: threshold })

  const directionVariants = {
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
    left: { x: 50, opacity: 0 },
    right: { x: -50, opacity: 0 },
  }

  return (
    <motion.div
      ref={ref}
      initial={directionVariants[direction]}
      animate={isInView ? { y: 0, x: 0, opacity: 1 } : directionVariants[direction]}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Magnetic effect component
export function CosmicMagnetic({
  children,
  strength = 50,
  className,
}: {
  children: React.ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2

    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY

    x.set(distanceX / strength)
    y.set(distanceY / strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

// Text scramble effect
export function CosmicTextScramble({
  text,
  duration = 2,
  className,
}: {
  text: string
  duration?: number
  className?: string
}) {
  const [scrambledText, setScrambledText] = useState(text)
  const [isScrambling, setIsScrambling] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    setIsScrambling(true)

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/"
    const originalChars = text.split("")
    let iteration = 0
    const maxIterations = 10

    const interval = setInterval(
      () => {
        if (iteration >= maxIterations) {
          clearInterval(interval)
          setScrambledText(text)
          setIsScrambling(false)
          return
        }

        const progress = iteration / maxIterations

        setScrambledText(
          originalChars
            .map((char, index) => {
              // Spaces remain spaces
              if (char === " ") return " "

              // The more iterations we've done, the more likely we are to show the original character
              if (Math.random() < progress + index / text.length) {
                return char
              }

              return chars[Math.floor(Math.random() * chars.length)]
            })
            .join(""),
        )

        iteration++
      },
      (duration * 1000) / maxIterations,
    )

    return () => clearInterval(interval)
  }, [isInView, text, duration])

  return (
    <div ref={ref} className={cn("font-mono", isScrambling && "text-purple-400", className)}>
      {scrambledText}
    </div>
  )
}

// Cosmic cursor effect - Fixed to prevent infinite updates
export function CosmicCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isOverLink, setIsOverLink] = useState(false)

  // Use useCallback to memoize event handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY })
    setIsVisible(true)

    // Check if cursor is over a link or button
    const element = document.elementFromPoint(e.clientX, e.clientY)
    if (element) {
      const isLink =
        element.tagName === "A" || element.tagName === "BUTTON" || element.closest("a") || element.closest("button")

      // Only update state if it's changed to prevent unnecessary re-renders
      setIsOverLink((prev) => {
        if (prev !== !!isLink) return !!isLink
        return prev
      })
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false)
  }, [])

  const handleMouseDown = useCallback(() => {
    setIsClicking(true)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsClicking(false)
  }, [])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseLeave, handleMouseDown, handleMouseUp])

  // Don't render on mobile/touch devices
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null
  }

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-50 mix-blend-difference"
        style={{
          x: position.x - 16,
          y: position.y - 16,
          backgroundColor: isOverLink ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
        }}
        animate={{
          scale: isClicking ? 0.8 : isOverLink ? 1.2 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28,
        }}
      />

      <motion.div
        className="fixed top-0 left-0 w-40 h-40 rounded-full pointer-events-none z-40 mix-blend-difference"
        style={{
          x: position.x - 80,
          y: position.y - 80,
          backgroundColor: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        animate={{
          scale: isClicking ? 0.9 : 1,
          opacity: isVisible ? 0.2 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.03,
        }}
      />
    </>
  )
}

// Starfield background with parallax effect - Fixed to prevent infinite updates
export function CosmicStarfield({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const starsRef = useRef<Array<{ x: number; y: number; size: number; speed: number }>>([])
  const animationRef = useRef<number>()

  // Use useCallback to memoize event handlers
  const handleResize = useCallback(() => {
    if (typeof window !== "undefined") {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (typeof window !== "undefined") {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
    }
  }, [])

  // Initialize dimensions and event listeners
  useEffect(() => {
    handleResize()

    window.addEventListener("resize", handleResize)
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [handleResize, handleMouseMove])

  // Initialize stars when dimensions change
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return

    // Create stars only once when dimensions are set
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 200 }, () => ({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.05 + 0.02,
      }))
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Animation loop
    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Calculate parallax offset
      const offsetX = (mousePosition.x - 0.5) * 30
      const offsetY = (mousePosition.y - 0.5) * 30

      // Draw stars
      starsRef.current.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.random() * 0.5})`
        ctx.beginPath()
        ctx.arc(star.x + offsetX * star.speed, star.y + offsetY * star.speed, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, mousePosition])

  return <canvas ref={canvasRef} className={cn("absolute inset-0 -z-10", className)} />
}