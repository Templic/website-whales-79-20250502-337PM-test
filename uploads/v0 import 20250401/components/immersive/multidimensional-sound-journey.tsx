"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { CosmicCard } from "@/components/ui/cosmic/cosmic-card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Headphones, RotateCcw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SoundEnvironment {
  id: string
  name: string
  description: string
  baseFrequency: number
  color: string
}

const soundEnvironments: SoundEnvironment[] = [
  {
    id: "cosmic-void",
    name: "Cosmic Void",
    description: "Deep space resonance with subtle quantum fluctuations",
    baseFrequency: 174,
    color: "#3F51B5",
  },
  {
    id: "crystal-cave",
    name: "Crystal Cave",
    description: "Crystalline resonances with harmonic overtones",
    baseFrequency: 285,
    color: "#9C27B0",
  },
  {
    id: "ancient-temple",
    name: "Ancient Temple",
    description: "Sacred geometry frequencies with ceremonial undertones",
    baseFrequency: 396,
    color: "#FF9800",
  },
  {
    id: "quantum-field",
    name: "Quantum Field",
    description: "Fluctuating probability waves with entangled harmonics",
    baseFrequency: 528,
    color: "#4CAF50",
  },
]

export function MultidimensionalSoundJourney() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<SoundEnvironment>(soundEnvironments[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [activeTab, setActiveTab] = useState("environment")
  const [spatialPosition, setSpatialPosition] = useState({ x: 0, y: 0 })

  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRefs = useRef<OscillatorNode[]>([])
  const gainNodeRef = useRef<GainNode | null>(null)
  const pannerNodeRef = useRef<PannerNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize audio context and nodes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

        // Create gain node
        if (audioContextRef.current) {
          gainNodeRef.current = audioContextRef.current.createGain()

          // Create panner node for spatial audio
          pannerNodeRef.current = audioContextRef.current.createPanner()
          pannerNodeRef.current.panningModel = "HRTF"
          pannerNodeRef.current.distanceModel = "inverse"
          pannerNodeRef.current.refDistance = 1
          pannerNodeRef.current.maxDistance = 10000
          pannerNodeRef.current.rolloffFactor = 1
          pannerNodeRef.current.coneInnerAngle = 360
          pannerNodeRef.current.coneOuterAngle = 360
          pannerNodeRef.current.coneOuterGain = 0

          // Connect nodes
          gainNodeRef.current.connect(pannerNodeRef.current)
          pannerNodeRef.current.connect(audioContextRef.current.destination)
        }
      } catch (error) {
        console.error("Error initializing audio context:", error)
      }
    }

    // Cleanup function
    return () => {
      stopSound()
      if (audioContextRef.current) {
        audioContextRef.current.close().catch((err) => console.error("Error closing audio context:", err))
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Update spatial position
  useEffect(() => {
    if (pannerNodeRef.current) {
      pannerNodeRef.current.setPosition(spatialPosition.x, spatialPosition.y, 1)
    }
  }, [spatialPosition])

  // Play or stop sound based on isPlaying state
  useEffect(() => {
    if (isPlaying) {
      playSound()
      startVisualization()
    } else {
      stopSound()
      stopVisualization()
    }
  }, [isPlaying, selectedEnvironment])

  // Play sound function
  const playSound = useCallback(() => {
    if (!audioContextRef.current || !gainNodeRef.current) return

    // Stop any existing oscillators
    stopSound()

    // Create oscillators for harmonic series
    const baseFreq = selectedEnvironment.baseFrequency
    const harmonics = [1, 1.5, 2, 2.5, 3]

    harmonics.forEach((harmonic, index) => {
      if (!audioContextRef.current) return

      const oscillator = audioContextRef.current.createOscillator()
      oscillator.type = index % 2 === 0 ? "sine" : "triangle"
      oscillator.frequency.value = baseFreq * harmonic

      // Create individual gain for each oscillator
      const oscGain = audioContextRef.current.createGain()
      oscGain.gain.value = 0.2 / (index + 1) // Decrease volume for higher harmonics

      oscillator.connect(oscGain)
      oscGain.connect(gainNodeRef.current!)

      // Start oscillator
      oscillator.start()
      oscillatorRefs.current.push(oscillator)
    })
  }, [selectedEnvironment])

  // Stop sound function
  const stopSound = useCallback(() => {
    oscillatorRefs.current.forEach((osc) => {
      try {
        osc.stop()
        osc.disconnect()
      } catch (error) {
        // Ignore errors from already stopped oscillators
      }
    })
    oscillatorRefs.current = []
  }, [])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  // Handle environment selection
  const handleEnvironmentSelect = useCallback((environment: SoundEnvironment) => {
    setSelectedEnvironment(environment)
    // If already playing, this will trigger the useEffect to restart with new environment
  }, [])

  // Handle volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0])
  }, [])

  // Handle spatial position change
  const handleSpatialPositionChange = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!event.currentTarget) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1

    setSpatialPosition({ x, y })
  }, [])

  // Reset spatial position
  const resetSpatialPosition = useCallback(() => {
    setSpatialPosition({ x: 0, y: 0 })
  }, [])

  // Visualization functions
  const startVisualization = useCallback(() => {
    if (!canvasRef.current || !audioContextRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Ensure canvas dimensions match its display size
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // Create analyzer node
    const analyser = audioContextRef.current.createAnalyser()
    analyser.fftSize = 256

    if (gainNodeRef.current) {
      // Insert analyzer between gain and panner
      gainNodeRef.current.disconnect()
      gainNodeRef.current.connect(analyser)
      analyser.connect(pannerNodeRef.current!)
    }

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!ctx) return

      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw circular visualization
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(centerX, centerY) * 0.8

      // Draw background circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fillStyle = `${selectedEnvironment.color}10`
      ctx.fill()

      // Draw frequency bars in circular pattern
      const barWidth = (2 * Math.PI) / bufferLength

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * radius * 0.8

        const angle = i * barWidth
        const x1 = centerX + Math.cos(angle) * (radius - barHeight)
        const y1 = centerY + Math.sin(angle) * (radius - barHeight)
        const x2 = centerX + Math.cos(angle) * radius
        const y2 = centerY + Math.sin(angle) * radius

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
        gradient.addColorStop(0, `${selectedEnvironment.color}00`)
        gradient.addColorStop(1, selectedEnvironment.color)

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw user position
      const userX = centerX + spatialPosition.x * radius * 0.5
      const userY = centerY + spatialPosition.y * radius * 0.5

      ctx.beginPath()
      ctx.arc(userX, userY, 8, 0, 2 * Math.PI)
      ctx.fillStyle = "white"
      ctx.fill()

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()
  }, [selectedEnvironment, spatialPosition])

  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <CosmicCard className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="environment">Sound Environment</TabsTrigger>
            <TabsTrigger value="spatial">Spatial Control</TabsTrigger>
          </TabsList>

          <TabsContent value="environment">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Environment Selector */}
              <div>
                <h3 className="text-white font-medium mb-4">Select Environment</h3>
                <div className="grid grid-cols-1 gap-3">
                  {soundEnvironments.map((environment) => (
                    <motion.button
                      key={environment.id}
                      onClick={() => handleEnvironmentSelect(environment)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        selectedEnvironment.id === environment.id
                          ? "bg-white/10 border border-white/20"
                          : "bg-black/20 border border-transparent hover:bg-black/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${environment.color}80, ${environment.color}20)`,
                            boxShadow:
                              selectedEnvironment.id === environment.id ? `0 0 15px ${environment.color}40` : "none",
                          }}
                        />
                        <div>
                          <div className="text-white text-sm font-medium">{environment.name}</div>
                          <div className="text-white/60 text-xs">{environment.description}</div>
                          <div className="text-white/60 text-xs mt-1">Base: {environment.baseFrequency} Hz</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Sound Player */}
              <div className="flex flex-col">
                <h3 className="text-white font-medium mb-4">Dimensional Sound Player</h3>

                <div className="flex-1 flex flex-col justify-center items-center p-6 bg-black/20 rounded-lg border border-white/10">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-48 mb-6 rounded-lg"
                    style={{ background: `${selectedEnvironment.color}10` }}
                  />

                  <div className="w-full flex flex-col gap-4">
                    <Button
                      onClick={togglePlay}
                      className={`w-full ${
                        isPlaying
                          ? "bg-white/20 hover:bg-white/30 border border-white/20"
                          : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" /> Stop
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" /> Play
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/10">
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                      <Slider
                        value={[volume]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={handleVolumeChange}
                        className="flex-1"
                      />
                    </div>

                    <div className="text-center text-white/60 text-xs flex items-center justify-center gap-1">
                      <Headphones className="h-3 w-3" /> For best experience, use headphones
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="spatial">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-white font-medium mb-2">Spatial Sound Positioning</h3>
                <p className="text-white/60 text-sm">
                  Click or tap in the area below to position yourself within the sound field.
                </p>
              </div>

              <div
                className="relative w-full h-64 rounded-lg bg-black/30 border border-white/10 cursor-pointer"
                onClick={handleSpatialPositionChange}
              >
                {/* Grid lines */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-px bg-white/10"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-px h-full bg-white/10"></div>
                </div>

                {/* Concentric circles */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-1/3 h-1/3 rounded-full border border-white/10"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-2/3 h-2/3 rounded-full border border-white/10"></div>
                </div>

                {/* User position */}
                <motion.div
                  className="absolute w-6 h-6 rounded-full bg-white/80 shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${(spatialPosition.x + 1) * 50}%`,
                    top: `${(spatialPosition.y + 1) * 50}%`,
                    boxShadow: `0 0 10px ${selectedEnvironment.color}`,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                />

                {/* Sound source indicators */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => {
                  const radians = (angle * Math.PI) / 180
                  const x = Math.cos(radians) * 0.85 + 1
                  const y = Math.sin(radians) * 0.85 + 1

                  return (
                    <motion.div
                      key={angle}
                      className="absolute w-3 h-3 rounded-full bg-purple-500/50 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        left: `${x * 50}%`,
                        top: `${y * 50}%`,
                      }}
                      animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 3,
                        delay: index * 0.3,
                      }}
                    />
                  )
                })}
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSpatialPosition}
                  className="text-white/70 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Reset Position
                </Button>
              </div>

              <div className="text-center text-white/60 text-sm">
                <p>
                  Current position: X: {spatialPosition.x.toFixed(2)}, Y: {spatialPosition.y.toFixed(2)}
                </p>
                <p className="text-xs mt-1">
                  The sound will appear to come from different directions based on your position.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CosmicCard>
    </div>
  )
}

