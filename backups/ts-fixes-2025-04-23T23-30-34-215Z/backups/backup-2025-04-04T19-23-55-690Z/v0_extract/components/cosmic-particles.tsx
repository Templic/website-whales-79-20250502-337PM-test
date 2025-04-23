"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
  life: number
  maxLife: number
}

export function CosmicParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 })
  const [isMouseMoving, setIsMouseMoving] = useState(false)
  const pathname = usePathname()
  const particlesRef = useRef<Particle[]>([])
  const animationFrameIdRef = useRef<number>()
  const lastMousePositionRef = useRef({ x: 0, y: 0 })
  const mouseIdleTimerRef = useRef<NodeJS.Timeout>()

  // Generate different color schemes based on the current page
  const getColorScheme = () => {
    switch (pathname) {
      case "/":
        return {
          particleColors: ["#C4F1F9", "#9DECF9", "#76E4F7", "#38BDF8", "#0EA5E9"],
          glowColor: "rgba(14, 165, 233, 0.2)",
        }
      case "/archive":
        return {
          particleColors: ["#F5D0FE", "#F0ABFC", "#E879F9", "#D946EF", "#C026D3"],
          glowColor: "rgba(192, 38, 211, 0.2)",
        }
      case "/experience":
        return {
          particleColors: ["#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF", "#14B8A6"],
          glowColor: "rgba(20, 184, 166, 0.2)",
        }
      case "/immersive":
        return {
          particleColors: ["#C4F1F9", "#76E4F7", "#0EA5E9", "#0284C7", "#036AA1"],
          glowColor: "rgba(14, 165, 233, 0.2)",
        }
      default:
        return {
          particleColors: ["#C4F1F9", "#9DECF9", "#76E4F7", "#38BDF8", "#0EA5E9"],
          glowColor: "rgba(14, 165, 233, 0.2)",
        }
    }
  }

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const currentPosition = { x: e.clientX, y: e.clientY }
      const lastPosition = lastMousePositionRef.current

      // Calculate mouse velocity
      const dx = currentPosition.x - lastPosition.x
      const dy = currentPosition.y - lastPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Only update if mouse has moved significantly
      if (distance > 5) {
        setMousePosition(currentPosition)
        lastMousePositionRef.current = currentPosition
        setIsMouseMoving(true)

        // Create particles based on mouse movement
        createParticlesFromMouseMovement(currentPosition, lastPosition, distance)

        // Reset idle timer
        if (mouseIdleTimerRef.current) {
          clearTimeout(mouseIdleTimerRef.current)
        }

        mouseIdleTimerRef.current = setTimeout(() => {
          setIsMouseMoving(false)
        }, 100)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (mouseIdleTimerRef.current) {
        clearTimeout(mouseIdleTimerRef.current)
      }
    }
  }, [dimensions])

  // Create particles from mouse movement
  const createParticlesFromMouseMovement = (
    currentPos: { x: number; y: number },
    lastPos: { x: number; y: number },
    distance: number,
  ) => {
    if (!canvasRef.current) return

    const colorScheme = getColorScheme()
    const particleCount = Math.min(Math.floor(distance / 5), 3)

    for (let i = 0; i < particleCount; i++) {
      // Interpolate position between last and current
      const ratio = i / particleCount
      const x = lastPos.x + (currentPos.x - lastPos.x) * ratio
      const y = lastPos.y + (currentPos.y - lastPos.y) * ratio

      // Create particle with velocity based on mouse movement
      const particle: Particle = {
        x,
        y,
        size: Math.random() * 4 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.7 + 0.3,
        color: colorScheme.particleColors[Math.floor(Math.random() * colorScheme.particleColors.length)],
        life: 0,
        maxLife: Math.random() * 50 + 50,
      }

      particlesRef.current.push(particle)
    }
  }

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0 || dimensions.height === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    const colorScheme = getColorScheme()

    // Animation function
    const animate = () => {
      // Clear canvas with fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update particle position
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Update particle life
        particle.life++

        // Calculate opacity based on life
        const lifeRatio = particle.life / particle.maxLife
        const fadeOpacity = particle.opacity * (1 - lifeRatio)

        // Draw particle
        ctx.globalAlpha = fadeOpacity
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw glow
        if (particle.size > 2) {
          ctx.globalAlpha = fadeOpacity * 0.5
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size * 3,
          )
          gradient.addColorStop(0, particle.color)
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw mouse glow when moving
      if (isMouseMoving) {
        ctx.globalAlpha = 0.2
        const gradient = ctx.createRadialGradient(
          mousePosition.x,
          mousePosition.y,
          0,
          mousePosition.x,
          mousePosition.y,
          80,
        )
        gradient.addColorStop(0, colorScheme.glowColor)
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(mousePosition.x, mousePosition.y, 80, 0, Math.PI * 2)
        ctx.fill()
      }

      // Reset global alpha
      ctx.globalAlpha = 1

      // Remove dead particles
      particlesRef.current = particlesRef.current.filter((particle) => particle.life < particle.maxLife)

      // Request next frame
      animationFrameIdRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animationFrameIdRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [dimensions, isMouseMoving, pathname])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.8 }} />
}

