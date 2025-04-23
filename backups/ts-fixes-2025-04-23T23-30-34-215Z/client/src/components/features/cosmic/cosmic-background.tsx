/**
 * cosmic-background.tsx
 * 
 * Component Type: cosmic
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */import React from "react";
import React from "react";

/**
 * cosmic-background.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { usePathname } from "next/navigation"

interface Star {
  x: number
  y: number
  z: number
  size: number
  opacity: number
  color: string
}

interface Nebula {
  x: number
  y: number
  radius: number
  color1: string
  color2: string
  opacity: number
}

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const pathname = usePathname()

  // Generate different color schemes based on the current page
  const getColorScheme = useCallback(() => {
    switch (pathname) {
      case "/":
        return {
          bgColor: "rgba(8, 3, 21, 0.8)",
          starColors: ["#ffffff", "#C4F1F9", "#9DECF9", "#76E4F7", "#38BDF8"],
          nebulaColors: [
            ["rgba(14, 165, 233, 0.03)", "rgba(2, 132, 199, 0.05)"],
            ["rgba(20, 184, 166, 0.04)", "rgba(15, 118, 110, 0.06)"],
          ],
        }
      case "/archive":
        return {
          bgColor: "rgba(5, 10, 24, 0.8)",
          starColors: ["#ffffff", "#F5D0FE", "#F0ABFC", "#E879F9", "#D946EF"],
          nebulaColors: [
            ["rgba(192, 38, 211, 0.03)", "rgba(162, 28, 175, 0.05)"],
            ["rgba(134, 25, 143, 0.04)", "rgba(112, 26, 117, 0.06)"],
          ],
        }
      case "/experience":
        return {
          bgColor: "rgba(10, 3, 15, 0.8)",
          starColors: ["#ffffff", "#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF"],
          nebulaColors: [
            ["rgba(20, 184, 166, 0.03)", "rgba(13, 148, 136, 0.05)"],
            ["rgba(15, 118, 110, 0.04)", "rgba(17, 94, 89, 0.06)"],
          ],
        }
      case "/immersive":
        return {
          bgColor: "rgba(3, 15, 15, 0.8)",
          starColors: ["#ffffff", "#C4F1F9", "#76E4F7", "#0EA5E9", "#0284C7"],
          nebulaColors: [
            ["rgba(14, 165, 233, 0.03)", "rgba(2, 132, 199, 0.05)"],
            ["rgba(3, 106, 161, 0.04)", "rgba(7, 89, 133, 0.06)"],
          ],
        }
      default:
        return {
          bgColor: "rgba(8, 3, 21, 0.8)",
          starColors: ["#ffffff", "#C4F1F9", "#9DECF9", "#76E4F7", "#38BDF8"],
          nebulaColors: [
            ["rgba(14, 165, 233, 0.03)", "rgba(2, 132, 199, 0.05)"],
            ["rgba(20, 184, 166, 0.04)", "rgba(15, 118, 110, 0.06)"],
          ],
        }
    }
  }, [pathname])

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Generate stars
    const starCount = Math.min(Math.floor((dimensions.width * dimensions.height) / 5000), 500)
    const stars: Star[] = []

    const colorScheme = getColorScheme()

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        z: Math.random() * 1000,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        color: colorScheme.starColors[Math.floor(Math.random() * colorScheme.starColors.length)],
      })
    }

    // Generate nebulae
    const nebulaCount = Math.min(Math.floor((dimensions.width * dimensions.height) / 300000), 5)
    const nebulae: Nebula[] = []

    for (let i = 0; i < nebulaCount; i++) {
      const colorPair = colorScheme.nebulaColors[Math.floor(Math.random() * colorScheme.nebulaColors.length)]
      nebulae.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        radius: Math.random() * 300 + 200,
        color1: colorPair[0],
        color2: colorPair[1],
        opacity: Math.random() * 0.3 + 0.1,
      })
    }

    // Animation loop
    const animationFrameIdRef = { current: 0 }
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

        // Apply subtle twinkling effect
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
      cancelAnimationFrame(animationFrameIdRef.current)
    }
  }, [dimensions, mousePosition, pathname, getColorScheme])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 h-full w-full" style={{ pointerEvents: "none" }} />
}



/**
 * Original CosmicBackground component merged from: client/src/components/common/cosmic-background.tsx
 * Merge date: 2025-04-05
 */
function CosmicBackgroundOriginal() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const pathname = usePathname()

  // Generate different color schemes based on the current page
  const getColorScheme = useCallback(() => {
    switch (pathname) {
      case "/":
        return {
          bgColor: "rgba(8, 3, 21, 0.8)",
          starColors: ["#ffffff", "#C4F1F9", "#9DECF9", "#76E4F7", "#38BDF8"],
          nebulaColors: [
            ["rgba(14, 165, 233, 0.03)", "rgba(2, 132, 199, 0.05)"],
            ["rgba(20, 184, 166, 0.04)", "rgba(15, 118, 110, 0.06)"],
          ],
        }
      case "/archive":
        return {
          bgColor: "rgba(5, 10, 24, 0.8)",
          starColors: ["#ffffff", "#F5D0FE", "#F0ABFC", "#E879F9", "#D946EF"],
          nebulaColors: [
            ["rgba(192, 38, 211, 0.03)", "rgba(162, 28, 175, 0.05)"],
            ["rgba(134, 25, 143, 0.04)", "rgba(112, 26, 117, 0.06)"],
          ],
        }
      case "/experience":
        return {
          bgColor: "rgba(10, 3, 15, 0.8)",
          starColors: ["#ffffff", "#CCFBF1", "#99F6E4", "#5EEAD4", "#2DD4BF"],
          nebulaColors: [
            ["rgba(20, 184, 166, 0.03)", "rgba(13, 148, 136, 0.05)"],
            ["rgba(15, 118, 110, 0.04)", "rgba(17, 94, 89, 0.06)"],
          ],
        }
      case "/immersive":
        return {
          bgColor: "rgba(3, 15, 15, 0.8)",
          starColors: ["#ffffff", "#C4F1F9", "#76E4F7", "#0EA5E9", "#0284C7"],
          nebulaColors: [
            ["rgba(14, 165, 233, 0.03)", "rgba(2, 132, 199, 0.05)"],
            ["rgba(3, 106, 161, 0.04)", "rgba(7, 89, 133, 0.06)"],
          ],
        }
      default:
        return {
          bgColor: "rgba(8, 3, 21, 0.8)",
          starColors: ["#ffffff", "#C4F1F9", "#9DECF9", "#76E4F7", "#38BDF8"],
          nebulaColors: [
            ["rgba(14, 165, 233, 0.03)", "rgba(2, 132, 199, 0.05)"],
            ["rgba(20, 184, 166, 0.04)", "rgba(15, 118, 110, 0.06)"],
          ],
        }
    }
  }, [pathname])

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Generate stars
    const starCount = Math.min(Math.floor((dimensions.width * dimensions.height) / 5000), 500)
    const stars: Star[] = []

    const colorScheme = getColorScheme()

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        z: Math.random() * 1000,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        color: colorScheme.starColors[Math.floor(Math.random() * colorScheme.starColors.length)],
      })
    }

    // Generate nebulae
    const nebulaCount = Math.min(Math.floor((dimensions.width * dimensions.height) / 300000), 5)
    const nebulae: Nebula[] = []

    for (let i = 0; i < nebulaCount; i++) {
      const colorPair = colorScheme.nebulaColors[Math.floor(Math.random() * colorScheme.nebulaColors.length)]
      nebulae.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        radius: Math.random() * 300 + 200,
        color1: colorPair[0],
        color2: colorPair[1],
        opacity: Math.random() * 0.3 + 0.1,
      })
    }

    // Animation loop
    const animationFrameIdRef = { current: 0 }
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

        // Apply subtle twinkling effect
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
      cancelAnimationFrame(animationFrameIdRef.current)
    }
  }, [dimensions, mousePosition, pathname, getColorScheme])

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 h-full w-full" style={{ pointerEvents: "none" }} />
}

