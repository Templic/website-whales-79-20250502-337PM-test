"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { usePathname } from "next/navigation"

// Deterministic random function to ensure consistent values between server and client
const deterministicRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const pathname = usePathname()
  const animationFrameIdRef = useRef<number | null>(null)
  const seedRef = useRef(Date.now()) // Use a consistent seed for the session

  // Generate different color schemes based on the current page
  const getColorScheme = useCallback(() => {
    switch (pathname) {
      case "/":
        return {
          bgColor: "rgba(8, 3, 21, 0.8)",
          starColors: ["#ffffff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8"],
          nebulaColors: [
            ["rgba(139, 92, 246, 0.03)", "rgba(67, 56, 202, 0.05)"],
            ["rgba(168, 85, 247, 0.04)", "rgba(109, 40, 217, 0.06)"],
          ],
        }
      case "/archive":
        return {
          bgColor: "rgba(5, 10, 24, 0.8)",
          starColors: ["#ffffff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa"],
          nebulaColors: [
            ["rgba(59, 130, 246, 0.03)", "rgba(29, 78, 216, 0.05)"],
            ["rgba(96, 165, 250, 0.04)", "rgba(37, 99, 235, 0.06)"],
          ],
        }
      case "/experience":
        return {
          bgColor: "rgba(10, 3, 15, 0.8)",
          starColors: ["#ffffff", "#fae8ff", "#f5d0fe", "#f0abfc", "#e879f9"],
          nebulaColors: [
            ["rgba(217, 70, 239, 0.03)", "rgba(192, 38, 211, 0.05)"],
            ["rgba(232, 121, 249, 0.04)", "rgba(168, 85, 247, 0.06)"],
          ],
        }
      case "/immersive":
        return {
          bgColor: "rgba(3, 15, 15, 0.8)",
          starColors: ["#ffffff", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399"],
          nebulaColors: [
            ["rgba(16, 185, 129, 0.03)", "rgba(5, 150, 105, 0.05)"],
            ["rgba(52, 211, 153, 0.04)", "rgba(16, 185, 129, 0.06)"],
          ],
        }
      default:
        return {
          bgColor: "rgba(8, 3, 21, 0.8)",
          starColors: ["#ffffff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8"],
          nebulaColors: [
            ["rgba(139, 92, 246, 0.03)", "rgba(67, 56, 202, 0.05)"],
            ["rgba(168, 85, 247, 0.04)", "rgba(109, 40, 217, 0.06)"],
          ],
        }
    }
  }, [pathname])

  // Initialize dimensions and event listeners
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      })
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("mousemove", handleMouseMove)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Animation setup
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Generate stars with deterministic random values
    const starCount = Math.min(Math.floor((dimensions.width * dimensions.height) / 5000), 500)
    const stars = []
    const colorScheme = getColorScheme()

    for (let i = 0; i < starCount; i++) {
      const seed = seedRef.current + i
      stars.push({
        x: deterministicRandom(seed) * dimensions.width,
        y: deterministicRandom(seed + 1) * dimensions.height,
        z: deterministicRandom(seed + 2) * 1000,
        size: deterministicRandom(seed + 3) * 1.5 + 0.5,
        opacity: deterministicRandom(seed + 4) * 0.8 + 0.2,
        color: colorScheme.starColors[Math.floor(deterministicRandom(seed + 5) * colorScheme.starColors.length)],
      })
    }

    // Generate nebulae
    const nebulaCount = Math.min(Math.floor((dimensions.width * dimensions.height) / 300000), 5)
    const nebulae = []

    for (let i = 0; i < nebulaCount; i++) {
      const seed = seedRef.current + i * 100
      const colorPair =
        colorScheme.nebulaColors[Math.floor(deterministicRandom(seed) * colorScheme.nebulaColors.length)]
      nebulae.push({
        x: deterministicRandom(seed + 1) * dimensions.width,
        y: deterministicRandom(seed + 2) * dimensions.height,
        radius: deterministicRandom(seed + 3) * 300 + 200,
        color1: colorPair[0],
        color2: colorPair[1],
        opacity: deterministicRandom(seed + 4) * 0.3 + 0.1,
      })
    }

    // Animation loop
    let lastTime = 0

    const render = (time: number) => {
      const deltaTime = time - lastTime
      lastTime = time

      // Clear canvas
      ctx.fillStyle = colorScheme.bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw nebulae
      nebulae.forEach((nebula) => {
        const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius)
        gradient.addColorStop(0, nebula.color1)
        gradient.addColorStop(1, nebula.color2)

        ctx.globalAlpha = nebula.opacity
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Reset global alpha
      ctx.globalAlpha = 1

      // Calculate mouse influence (parallax effect)
      const mouseXRatio = mousePosition.x / dimensions.width
      const mouseYRatio = mousePosition.y / dimensions.height
      const offsetX = (mouseXRatio - 0.5) * 20
      const offsetY = (mouseYRatio - 0.5) * 20

      // Draw stars with parallax effect
      stars.forEach((star) => {
        // Update star position based on z-depth (parallax)
        const parallaxFactor = star.z / 1000
        const parallaxX = offsetX * parallaxFactor
        const parallaxY = offsetY * parallaxFactor

        // Apply subtle twinkling effect using deterministic values
        const twinkle = Math.sin(time * 0.001 + star.z) * 0.1 + 0.9

        ctx.fillStyle = star.color
        ctx.globalAlpha = star.opacity * twinkle
        ctx.beginPath()
        ctx.arc(star.x + parallaxX, star.y + parallaxY, star.size, 0, Math.PI * 2)
        ctx.fill()

        // Add subtle glow to some stars
        if (star.size > 1.2) {
          ctx.globalAlpha = star.opacity * 0.4 * twinkle
          ctx.beginPath()
          ctx.arc(star.x + parallaxX, star.y + parallaxY, star.size * 2, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Reset global alpha
      ctx.globalAlpha = 1

      // Only request next frame if component is still mounted
      if (canvas.isConnected) {
        animationFrameIdRef.current = requestAnimationFrame(render)
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(render)

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [dimensions, getColorScheme, mousePosition])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  )
}

export default CosmicBackground

