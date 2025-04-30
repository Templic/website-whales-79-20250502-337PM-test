/**
 * SacredGeometry.tsx
 * 
 * Component Type: cosmic
 * Migrated from imported components.
 */
"use client"

import React, { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Sparkles, Flower, Hexagon, FileSymlink, Loader2, LifeBuoy, Download } from "lucide-react"

type GeometryPattern = 
  | "flowerOfLife" 
  | "sriYantra" 
  | "metatronsCube" 
  | "seedOfLife" 
  | "torus" 
  | "merkaba" 
  | "goldenSpiral" 
  | "pentagram"

interface SacredGeometryProps {
  className?: string
  defaultPattern?: GeometryPattern
  interactive?: boolean
  enableAnimation?: boolean
  enableExport?: boolean
  glowIntensity?: number
  rotationSpeed?: number
  size?: number | string
  backgroundColor?: string
  strokeColor?: string
  fillColor?: string
  glowColor?: string
}

export function SacredGeometry({
  className,
  defaultPattern = "flowerOfLife",
  interactive = true,
  enableAnimation = true,
  enableExport = true,
  glowIntensity: defaultGlowIntensity = 0.8,
  rotationSpeed: defaultRotationSpeed = 0.5,
  size = "100%",
  backgroundColor = "rgba(0, 0, 0, 0)",
  strokeColor = "rgba(255, 255, 255, 0.7)",
  fillColor = "rgba(138, 43, 226, 0.1)",
  glowColor = "rgba(138, 43, 226, 0.8)"
}: SacredGeometryProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number>(0)
  const [pattern, setPattern] = useState<GeometryPattern>(defaultPattern)
  const [animation, setAnimation] = useState(enableAnimation)
  const [rotation, setRotation] = useState(0)
  const [rotationSpeed, setRotationSpeed] = useState(defaultRotationSpeed)
  const [glowIntensity, setGlowIntensity] = useState(defaultGlowIntensity)
  const [detail, setDetail] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [tabValue, setTabValue] = useState<string>("pattern")
  const [isRendering, setIsRendering] = useState(false)
  const [hideControls, setHideControls] = useState(false)

  // Pattern names and descriptions for UI
  const patternInfo = {
    flowerOfLife: {
      name: "Flower of Life",
      description: "Ancient pattern of overlapping circles symbolizing creation and interconnectedness"
    },
    seedOfLife: {
      name: "Seed of Life", 
      description: "Seven circles forming the basis of the Flower of Life, representing the Genesis pattern"
    },
    metatronsCube: {
      name: "Metatron's Cube",
      description: "Complex sacred geometry containing all Platonic solids and symbolizing the universe"
    },
    sriYantra: {
      name: "Sri Yantra",
      description: "Ancient tantric symbol composed of nine interlocking triangles representing the cosmos"
    },
    torus: {
      name: "Torus",
      description: "Fundamental energy pattern in the universe, like a donut-shaped vortex"
    },
    merkaba: {
      name: "Merkaba",
      description: "3D Star Tetrahedron, two interlocked tetrahedra representing balanced energy fields"
    },
    goldenSpiral: {
      name: "Golden Spiral",
      description: "Logarithmic spiral based on the golden ratio found throughout nature"
    },
    pentagram: {
      name: "Pentagram",
      description: "Five-pointed star embodying the golden ratio and representing the five elements"
    }
  }

  // Draw the pattern
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear previous pattern
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw new pattern
    drawPattern(ctx, pattern, canvas.width, canvas.height)
    
  }, [pattern, glowIntensity, detail, zoom, rotation])

  // Animation loop
  useEffect(() => {
    if (!animation) {
      cancelAnimationFrame(animationRef.current)
      return
    }
    
    const animate = () => {
      setRotation(prev => (prev + rotationSpeed / 20) % 360)
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [animation, rotationSpeed])

  // Canvas setup and resize handler
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const handleResize = () => {
      const container = canvas.parentElement
      if (!container) return
      
      const { width, height } = container.getBoundingClientRect()
      canvas.width = width
      canvas.height = width // Keep aspect ratio 1:1
      
      // Redraw pattern
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawPattern(ctx, pattern, canvas.width, canvas.height)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Draw pattern function
  const drawPattern = (
    ctx: CanvasRenderingContext2D, 
    patternType: GeometryPattern, 
    width: number, 
    height: number
  ) => {
    setIsRendering(true)
    
    ctx.clearRect(0, 0, width, height)
    
    // Background
    if (backgroundColor !== "rgba(0, 0, 0, 0)") {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    }
    
    // Center of the canvas
    const centerX = width / 2
    const centerY = height / 2
    
    // Base radius 
    const radius = Math.min(width, height) / 2 * 0.8 * zoom
    
    // Shadow for glow effect
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 20 * glowIntensity
    
    // Save the canvas state
    ctx.save()
    
    // Move to center and apply rotation
    ctx.translate(centerX, centerY)
    ctx.rotate((rotation * Math.PI) / 180)
    
    // Set drawing styles
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 1.5
    ctx.fillStyle = fillColor
    
    // Draw selected pattern
    switch (patternType) {
      case "flowerOfLife":
        drawFlowerOfLife(ctx, radius, detail)
        break
      case "seedOfLife":
        drawSeedOfLife(ctx, radius)
        break
      case "metatronsCube":
        drawMetatronsCube(ctx, radius)
        break
      case "sriYantra":
        drawSriYantra(ctx, radius)
        break
      case "torus":
        drawTorus(ctx, radius)
        break
      case "merkaba":
        drawMerkaba(ctx, radius)
        break
      case "goldenSpiral":
        drawGoldenSpiral(ctx, radius)
        break
      case "pentagram":
        drawPentagram(ctx, radius)
        break
    }
    
    // Restore the canvas state
    ctx.restore()
    
    setIsRendering(false)
  }

  // Pattern drawing functions
  const drawFlowerOfLife = (ctx: CanvasRenderingContext2D, radius: number, detail: number) => {
    const iterations = Math.max(1, Math.round(6 * detail))
    
    // Draw center circle
    ctx.beginPath()
    ctx.arc(0, 0, radius / 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // Draw surrounding circles
    for (let i = 0; i < iterations; i++) {
      const angle = (i / iterations) * Math.PI * 2
      const x = Math.cos(angle) * radius / 3
      const y = Math.sin(angle) * radius / 3
      
      ctx.beginPath()
      ctx.arc(x, y, radius / 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      
      // Second layer
      if (detail >= 0.5) {
        for (let j = 0; j < 6; j++) {
          const angle2 = (j / 6) * Math.PI * 2
          const x2 = x + Math.cos(angle2) * radius / 3
          const y2 = y + Math.sin(angle2) * radius / 3
          
          ctx.beginPath()
          ctx.arc(x2, y2, radius / 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
      }
    }
    
    // Draw outer circle
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  const drawSeedOfLife = (ctx: CanvasRenderingContext2D, radius: number) => {
    // Draw center circle
    ctx.beginPath()
    ctx.arc(0, 0, radius / 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // Draw surrounding circles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const x = Math.cos(angle) * radius / 3
      const y = Math.sin(angle) * radius / 3
      
      ctx.beginPath()
      ctx.arc(x, y, radius / 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    
    // Draw outer circle
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  const drawMetatronsCube = (ctx: CanvasRenderingContext2D, radius: number) => {
    // First, draw the Flower of Life as base
    drawSeedOfLife(ctx, radius * 0.8)
    
    // Draw the connecting lines forming Metatron's Cube
    const points = []
    
    // Calculate the 13 centers of the circles
    // Center point
    points.push({ x: 0, y: 0 })
    
    // 6 surrounding points
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const x = Math.cos(angle) * radius / 3
      const y = Math.sin(angle) * radius / 3
      points.push({ x, y })
    }
    
    // 6 outer points
    for (let i = 0; i < 6; i++) {
      const angle = ((i + 0.5) / 6) * Math.PI * 2
      const x = Math.cos(angle) * radius / 1.5
      const y = Math.sin(angle) * radius / 1.5
      points.push({ x, y })
    }
    
    // Draw lines connecting all points to form the "cube"
    ctx.beginPath()
    for (let i = 1; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        ctx.moveTo(points[i].x, points[i].y)
        ctx.lineTo(points[j].x, points[j].y)
      }
    }
    ctx.stroke()
  }

  const drawSriYantra = (ctx: CanvasRenderingContext2D, radius: number) => {
    // Draw outer square
    ctx.beginPath()
    ctx.rect(-radius, -radius, radius * 2, radius * 2)
    ctx.stroke()
    
    // Draw outer circle
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
    
    // Draw triangles - simplified version
    const drawTriangle = (size: number, invert: boolean = false) => {
      const height = size * Math.sqrt(3) / 2
      
      ctx.beginPath()
      if (invert) {
        ctx.moveTo(0, -height / 2)
        ctx.lineTo(-size / 2, height / 2)
        ctx.lineTo(size / 2, height / 2)
      } else {
        ctx.moveTo(0, height / 2)
        ctx.lineTo(-size / 2, -height / 2)
        ctx.lineTo(size / 2, -height / 2)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
    
    // Draw 4 upward triangles
    for (let i = 4; i > 0; i--) {
      const size = radius * 1.8 * (i / 4)
      drawTriangle(size, false)
    }
    
    // Draw 5 downward triangles
    for (let i = 5; i > 0; i--) {
      const size = radius * 1.7 * (i / 5)
      drawTriangle(size, true)
    }
    
    // Draw central dot (bindu)
    ctx.beginPath()
    ctx.arc(0, 0, radius * 0.05, 0, Math.PI * 2)
    ctx.fillStyle = strokeColor
    ctx.fill()
  }

  const drawTorus = (ctx: CanvasRenderingContext2D, radius: number) => {
    // Simplified 2D representation of a torus
    const outerRadius = radius
    const innerRadius = radius * 0.5
    
    // Draw outer circle
    ctx.beginPath()
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2)
    ctx.stroke()
    
    // Draw inner circle
    ctx.beginPath()
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2)
    ctx.stroke()
    
    // Draw connecting spirals
    const steps = 36
    const revolutions = 3
    
    for (let i = 0; i < steps; i++) {
      const angle1 = (i / steps) * Math.PI * 2
      const angle2 = ((i + 1) / steps) * Math.PI * 2
      
      for (let j = 0; j < revolutions; j++) {
        const progressAngle1 = angle1 + j * Math.PI * 2
        const progressAngle2 = angle2 + j * Math.PI * 2
        
        const progress1 = (progressAngle1 / (revolutions * Math.PI * 2))
        const progress2 = (progressAngle2 / (revolutions * Math.PI * 2))
        
        const radius1 = innerRadius + (outerRadius - innerRadius) * progress1
        const radius2 = innerRadius + (outerRadius - innerRadius) * progress2
        
        const x1 = Math.cos(angle1) * radius1
        const y1 = Math.sin(angle1) * radius1
        const x2 = Math.cos(angle2) * radius2
        const y2 = Math.sin(angle2) * radius2
        
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    }
  }

  const drawMerkaba = (ctx: CanvasRenderingContext2D, radius: number) => {
    // Draw two tetrahedra (simplified 2D representation)
    
    // First tetrahedron (pointing up)
    ctx.beginPath()
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // Second tetrahedron (pointing down)
    ctx.beginPath()
    for (let i = 0; i < 3; i++) {
      const angle = ((i + 0.5) / 3) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // Draw star pattern
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle1 = (i / 6) * Math.PI * 2
      const angle2 = ((i + 3) / 6) * Math.PI * 2
      
      const x1 = Math.cos(angle1) * radius
      const y1 = Math.sin(angle1) * radius
      const x2 = Math.cos(angle2) * radius
      const y2 = Math.sin(angle2) * radius
      
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
    }
    ctx.stroke()
  }

  const drawGoldenSpiral = (ctx: CanvasRenderingContext2D, radius: number) => {
    const goldenRatio = 1.618033988749895
    const maxRotations = 8
    
    // Start with a small radius
    let currentRadius = radius / (Math.pow(goldenRatio, maxRotations))
    
    // Draw the spiral
    ctx.beginPath()
    
    for (let i = 0; i <= 720; i++) {
      const angle = (i / 180) * Math.PI
      const distance = currentRadius * Math.pow(goldenRatio, i / 180)
      
      if (distance > radius) break
      
      const x = Math.cos(angle) * distance
      const y = Math.sin(angle) * distance
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.stroke()
    
    // Draw golden rectangles
    let size = radius * 0.4
    ctx.save()
    
    for (let i = 0; i < 8; i++) {
      const prevSize = size
      size = size / goldenRatio
      
      ctx.beginPath()
      ctx.rect(-prevSize / 2, -prevSize / 2, prevSize, prevSize)
      ctx.stroke()
      
      ctx.rotate(Math.PI / 2)
      ctx.translate(size / 2, 0)
    }
    
    ctx.restore()
    
    // Draw outer circle
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  const drawPentagram = (ctx: CanvasRenderingContext2D, radius: number) => {
    // Draw pentagram
    ctx.beginPath()
    
    for (let i = 0; i < 5; i++) {
      const angle = ((i * 2) % 5) * (Math.PI * 2) / 5 - Math.PI / 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // Draw enclosing pentagon
    ctx.beginPath()
    
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.closePath()
    ctx.stroke()
    
    // Draw outer circle
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Export functionality
  const exportAsPNG = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const imageURL = canvas.toDataURL("image/png")
    
    const link = document.createElement("a")
    link.href = imageURL
    link.download = `sacred-geometry-${pattern}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={cn("relative", className)} style={{ zIndex: 0 }}>
      {/* Canvas */}
      <div 
        className="relative aspect-square"
        style={{ width: size }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ zIndex: -1 }}
        />
        
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        )}
      </div>
      
      {/* Controls */}
      {interactive && !hideControls && (
        <div className="mt-4 bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/20 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Sacred Geometry Controls</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setHideControls(true)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Hide Controls
            </Button>
          </div>
          
          <Tabs 
            defaultValue={tabValue} 
            onValueChange={setTabValue}
            className="w-full"
          >
            <TabsList className="bg-black/30 w-full mb-4">
              <TabsTrigger value="pattern" className="data-[state=active]:bg-purple-600 flex-1">
                <Flower className="w-4 h-4 mr-2" />
                Pattern
              </TabsTrigger>
              <TabsTrigger value="appearance" className="data-[state=active]:bg-purple-600 flex-1">
                <Sparkles className="w-4 h-4 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="animation" className="data-[state=active]:bg-purple-600 flex-1">
                <Hexagon className="w-4 h-4 mr-2" />
                Animation
              </TabsTrigger>
            </TabsList>
            
            {/* Pattern Tab */}
            <TabsContent value="pattern" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Sacred Geometry Pattern</Label>
                <Select value={pattern} onValueChange={(value) => setPattern(value as GeometryPattern)}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10">
                    {Object.entries(patternInfo).map(([key, { name }]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-white/10">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <p className="text-xs text-white/60">
                  {patternInfo[pattern]?.description}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Pattern Detail</Label>
                  <span className="text-sm text-white/70">{Math.round(detail * 100)}%</span>
                </div>
                <Slider
                  min={0.2}
                  max={1.2}
                  step={0.1}
                  value={[detail]}
                  onValueChange={(value) => setDetail(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Zoom</Label>
                  <span className="text-sm text-white/70">{Math.round(zoom * 100)}%</span>
                </div>
                <Slider
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                />
              </div>
            </TabsContent>
            
            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Glow Intensity</Label>
                  <span className="text-sm text-white/70">{Math.round(glowIntensity * 100)}%</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[glowIntensity]}
                  onValueChange={(value) => setGlowIntensity(value[0])}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Stroke Color</Label>
                  <div className="flex gap-2">
                    {["rgba(255, 255, 255, 0.7)", "rgba(138, 43, 226, 0.7)", "rgba(64, 224, 208, 0.7)", "rgba(255, 215, 0, 0.7)"].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${strokeColor === color ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          // Not implemented in this demo
                          // Would update strokeColor here
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Glow Color</Label>
                  <div className="flex gap-2">
                    {["rgba(138, 43, 226, 0.8)", "rgba(64, 224, 208, 0.8)", "rgba(255, 105, 180, 0.8)", "rgba(255, 215, 0, 0.8)"].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${glowColor === color ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          // Not implemented in this demo
                          // Would update glowColor here
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Animation Tab */}
            <TabsContent value="animation" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white cursor-pointer">Enable Animation</Label>
                  <p className="text-xs text-white/60">Automatically rotate the pattern</p>
                </div>
                <Switch
                  checked={animation}
                  onCheckedChange={setAnimation}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Rotation Speed</Label>
                  <span className="text-sm text-white/70">{Math.round(rotationSpeed * 100)}%</span>
                </div>
                <Slider
                  min={0.1}
                  max={2}
                  step={0.1}
                  value={[rotationSpeed]}
                  onValueChange={(value) => setRotationSpeed(value[0])}
                  disabled={!animation}
                />
              </div>
              
              {!animation && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Manual Rotation</Label>
                    <span className="text-sm text-white/70">{Math.round(rotation)}°</span>
                  </div>
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[rotation]}
                    onValueChange={(value) => setRotation(value[0])}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Action buttons */}
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => {
                setGlowIntensity(defaultGlowIntensity)
                setRotationSpeed(defaultRotationSpeed)
                setDetail(1)
                setZoom(1)
                setRotation(0)
              }}
            >
              <FileSymlink className="w-4 h-4 mr-2" />
              Reset
            </Button>
            
            {enableExport && (
              <Button
                variant="outline"
                className="border-purple-500/20 text-purple-400 hover:bg-purple-500/10"
                onClick={exportAsPNG}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PNG
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Show control button when hidden */}
      {interactive && hideControls && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex justify-center"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideControls(false)}
            className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
          >
            <LifeBuoy className="w-4 h-4 mr-2" />
            Show Controls
          </Button>
        </motion.div>
      )}
    </div>
  )
}

import { memo } from 'react'

export const HexagonContainer = memo(({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none">
        <path
          d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z"
          className="stroke-purple-500/20 fill-black/20"
          strokeWidth="0.5"
        />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  )
})

HexagonContainer.displayName = 'HexagonContainer'