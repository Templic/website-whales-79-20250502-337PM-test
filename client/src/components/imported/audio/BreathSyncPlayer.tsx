"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Play, Pause, Volume2, VolumeX, Wind, ArrowRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreathSyncPlayerProps {
  className?: string
}

// Breathing pattern types
type BreathPattern = {
  name: string
  inhaleTime: number
  holdInTime: number
  exhaleTime: number
  holdOutTime: number
  description: string
}

export function BreathSyncPlayer({ className }: BreathSyncPlayerProps) {
  // Audio context and oscillators
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const pannerNodeRef = useRef<StereoPannerNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)

  // Canvas ref for visualization
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)

  // State variables
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(70)
  const [isMuted, setIsMuted] = useState(false)
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold-in" | "exhale" | "hold-out">("inhale")
  const [phaseProgress, setPhaseProgress] = useState(0) // 0-100%
  const [cycleCount, setCycleCount] = useState(0)
  const [ambientSound, setAmbientSound] = useState("ocean") // ocean, forest, cosmic
  const [showGuide, setShowGuide] = useState(true)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [meditationDuration, setMeditationDuration] = useState(300) // 5 minutes in seconds
  const [elapsedTime, setElapsedTime] = useState(0)

  // Timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Selected pattern
  const [selectedPattern, setSelectedPattern] = useState("box")

  // Breathing patterns
  const breathingPatterns: Record<string, BreathPattern> = {
    box: {
      name: "Box Breathing",
      inhaleTime: 4,
      holdInTime: 4,
      exhaleTime: 4,
      holdOutTime: 4,
      description: "Equal parts inhale, hold, exhale, and hold. Calms the nervous system."
    },
    relaxing: {
      name: "Relaxation Breath",
      inhaleTime: 4,
      holdInTime: 2,
      exhaleTime: 6,
      holdOutTime: 0,
      description: "Longer exhale promotes parasympathetic response for deep relaxation."
    },
    energizing: {
      name: "Energy Breath",
      inhaleTime: 6,
      holdInTime: 2,
      exhaleTime: 4,
      holdOutTime: 0,
      description: "Deeper inhale with shorter exhale to increase energy and alertness."
    },
    healing: {
      name: "Healing Breath",
      inhaleTime: 5,
      holdInTime: 2,
      exhaleTime: 5,
      holdOutTime: 2,
      description: "Balanced breath with mild holds for focused healing meditation."
    },
    4_7_8: {
      name: "4-7-8 Technique",
      inhaleTime: 4,
      holdInTime: 7,
      exhaleTime: 8,
      holdOutTime: 0,
      description: "Dr. Andrew Weil's technique for reducing anxiety and aiding sleep."
    },
    custom: {
      name: "Custom",
      inhaleTime: 4,
      holdInTime: 4,
      exhaleTime: 4,
      holdOutTime: 2,
      description: "Your personalized breathing pattern."
    }
  }

  // Get current pattern
  const currentPattern = breathingPatterns[selectedPattern]

  // Custom pattern settings
  const [customInhale, setCustomInhale] = useState(4)
  const [customHoldIn, setCustomHoldIn] = useState(4)
  const [customExhale, setCustomExhale] = useState(4)
  const [customHoldOut, setCustomHoldOut] = useState(2)

  // Update custom pattern when sliders change
  useEffect(() => {
    if (selectedPattern === "custom") {
      breathingPatterns.custom = {
        ...breathingPatterns.custom,
        inhaleTime: customInhale,
        holdInTime: customHoldIn,
        exhaleTime: customExhale,
        holdOutTime: customHoldOut
      }
    }
  }, [customInhale, customHoldIn, customExhale, customHoldOut, selectedPattern])

  // Initialize audio
  const initializeAudio = () => {
    if (audioInitialized) return

    try {
      // Create AudioContext
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create oscillator
      oscillatorRef.current = audioContextRef.current.createOscillator()
      oscillatorRef.current.type = "sine"
      oscillatorRef.current.frequency.value = 432 // Base frequency
      
      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = 0 // Start silent
      
      // Create stereo panner
      pannerNodeRef.current = audioContextRef.current.createStereoPanner()
      
      // Create filter for sound shaping
      filterRef.current = audioContextRef.current.createBiquadFilter()
      filterRef.current.type = "lowpass"
      filterRef.current.frequency.value = 800
      filterRef.current.Q.value = 1
      
      // Connect the audio graph
      oscillatorRef.current.connect(gainNodeRef.current)
      gainNodeRef.current.connect(pannerNodeRef.current)
      pannerNodeRef.current.connect(filterRef.current)
      filterRef.current.connect(audioContextRef.current.destination)
      
      // Start the oscillator
      oscillatorRef.current.start()
      
      setAudioInitialized(true)
    } catch (error) {
      console.error("Error initializing audio:", error)
    }
  }

  // Handle play/pause
  const togglePlay = () => {
    if (!audioInitialized) {
      initializeAudio()
    }
    
    if (isPlaying) {
      pauseBreathing()
    } else {
      startBreathing()
    }
  }

  // Start breathing session
  const startBreathing = () => {
    if (!audioInitialized) return
    
    setIsPlaying(true)
    
    // Resume AudioContext if suspended
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume()
    }
    
    // Reset counters
    setElapsedTime(0)
    setCycleCount(0)
    
    // Start the breath phase cycle
    startBreathPhase("inhale")
    
    // Start the overall timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => {
        if (prev >= meditationDuration - 1) {
          pauseBreathing()
          return prev
        }
        return prev + 1
      })
    }, 1000)
    
    // Start visualization
    if (showGuide) {
      startVisualization()
    }
  }

  // Pause breathing session
  const pauseBreathing = () => {
    setIsPlaying(false)
    
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current)
      phaseTimerRef.current = null
    }
    
    // Fade out sound
    if (gainNodeRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime
      gainNodeRef.current.gain.cancelScheduledValues(now)
      gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, now)
      gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.5)
    }
    
    // Stop visualization
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  // Start a breath phase
  const startBreathPhase = (phase: "inhale" | "hold-in" | "exhale" | "hold-out") => {
    if (!audioInitialized || !gainNodeRef.current || !audioContextRef.current || !pannerNodeRef.current || !oscillatorRef.current || !filterRef.current) return
    
    setBreathPhase(phase)
    setPhaseProgress(0)
    
    // Clear any existing timer
    if (phaseTimerRef.current) {
      clearInterval(phaseTimerRef.current)
    }
    
    // Get phase duration
    let duration = 0
    switch (phase) {
      case "inhale":
        duration = currentPattern.inhaleTime
        break
      case "hold-in":
        duration = currentPattern.holdInTime
        break
      case "exhale":
        duration = currentPattern.exhaleTime
        break
      case "hold-out":
        duration = currentPattern.holdOutTime
        break
    }
    
    // Skip phases with 0 duration
    if (duration <= 0) {
      const nextPhase = getNextPhase(phase)
      startBreathPhase(nextPhase)
      return
    }
    
    // Set audio parameters based on phase
    const now = audioContextRef.current.currentTime
    
    // Reset values
    gainNodeRef.current.gain.cancelScheduledValues(now)
    oscillatorRef.current.frequency.cancelScheduledValues(now)
    pannerNodeRef.current.pan.cancelScheduledValues(now)
    filterRef.current.frequency.cancelScheduledValues(now)
    
    // Set current values
    gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, now)
    oscillatorRef.current.frequency.setValueAtTime(oscillatorRef.current.frequency.value, now)
    pannerNodeRef.current.pan.setValueAtTime(pannerNodeRef.current.pan.value, now)
    filterRef.current.frequency.setValueAtTime(filterRef.current.frequency.value, now)
    
    // Configure audio parameters based on breath phase
    switch (phase) {
      case "inhale":
        // Increasing frequency and volume during inhale
        gainNodeRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : volume / 300, now + duration * 0.5)
        oscillatorRef.current.frequency.linearRampToValueAtTime(432 + 108, now + duration)
        pannerNodeRef.current.pan.linearRampToValueAtTime(0.5, now + duration)
        filterRef.current.frequency.linearRampToValueAtTime(1200, now + duration)
        break
        
      case "hold-in":
        // Stable but slightly fluctuating during hold
        gainNodeRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : volume / 300, now + duration * 0.2)
        // Small frequency variations during hold
        oscillatorRef.current.frequency.linearRampToValueAtTime(432 + 120, now + duration * 0.5)
        oscillatorRef.current.frequency.linearRampToValueAtTime(432 + 110, now + duration)
        break
        
      case "exhale":
        // Decreasing frequency and volume during exhale
        gainNodeRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : volume / 400, now + duration)
        oscillatorRef.current.frequency.linearRampToValueAtTime(432, now + duration)
        pannerNodeRef.current.pan.linearRampToValueAtTime(-0.5, now + duration)
        filterRef.current.frequency.linearRampToValueAtTime(800, now + duration)
        break
        
      case "hold-out":
        // Almost silent during hold-out
        gainNodeRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : volume / 500, now + duration)
        // Low frequency during hold-out
        oscillatorRef.current.frequency.linearRampToValueAtTime(432 - 20, now + duration)
        break
    }
    
    // Progress timer
    const updateInterval = 50 // ms
    const steps = (duration * 1000) / updateInterval
    let step = 0
    
    phaseTimerRef.current = setInterval(() => {
      step++
      const progress = (step / steps) * 100
      setPhaseProgress(progress > 100 ? 100 : progress)
      
      if (step >= steps) {
        clearInterval(phaseTimerRef.current!)
        phaseTimerRef.current = null
        
        // Move to next phase
        const nextPhase = getNextPhase(phase)
        if (nextPhase === "inhale") {
          // Completed a full cycle
          setCycleCount(prev => prev + 1)
        }
        
        startBreathPhase(nextPhase)
      }
    }, updateInterval)
  }

  // Get the next breath phase
  const getNextPhase = (currentPhase: "inhale" | "hold-in" | "exhale" | "hold-out"): "inhale" | "hold-in" | "exhale" | "hold-out" => {
    switch (currentPhase) {
      case "inhale":
        return currentPattern.holdInTime > 0 ? "hold-in" : "exhale"
      case "hold-in":
        return "exhale"
      case "exhale":
        return currentPattern.holdOutTime > 0 ? "hold-out" : "inhale"
      case "hold-out":
        return "inhale"
    }
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Update volume when changed
  useEffect(() => {
    if (!gainNodeRef.current || !audioContextRef.current) return
    
    const currentVolume = isMuted ? 0 : volume / 100
    
    // Don't abruptly change volume - smooth transition
    const now = audioContextRef.current.currentTime
    gainNodeRef.current.gain.cancelScheduledValues(now)
    gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, now)
    gainNodeRef.current.gain.linearRampToValueAtTime(
      currentVolume * (breathPhase === "inhale" ? 0.3 : breathPhase === "exhale" ? 0.25 : 0.2),
      now + 0.2
    )
  }, [volume, isMuted])

  // Handle ambient sound change
  useEffect(() => {
    if (!filterRef.current || !oscillatorRef.current) return
    
    // Different filter and oscillator settings based on ambient sound
    switch (ambientSound) {
      case "ocean":
        oscillatorRef.current.type = "sine"
        filterRef.current.type = "lowpass"
        filterRef.current.Q.value = 1.5
        break
      case "forest":
        oscillatorRef.current.type = "triangle"
        filterRef.current.type = "bandpass"
        filterRef.current.Q.value = 2
        break
      case "cosmic":
        oscillatorRef.current.type = "sine"
        filterRef.current.type = "highpass"
        filterRef.current.Q.value = 0.8
        break
    }
  }, [ambientSound])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      pauseBreathing()
      
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
        oscillatorRef.current.disconnect()
      }
      
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect()
      }
      
      if (pannerNodeRef.current) {
        pannerNodeRef.current.disconnect()
      }
      
      if (filterRef.current) {
        filterRef.current.disconnect()
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Visualization
  const startVisualization = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.min(centerX, centerY) * 0.8
    
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw breath circle
      const radiusMultiplier = breathPhase === "inhale" || breathPhase === "hold-in" 
        ? 0.4 + (phaseProgress / 100) * 0.6 
        : 1 - (phaseProgress / 100) * 0.6
      
      const radius = maxRadius * radiusMultiplier
      
      // Outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius * 1.3)
      gradient.addColorStop(0, 'rgba(138, 43, 226, 0.6)')
      gradient.addColorStop(1, 'rgba(138, 43, 226, 0)')
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Main circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      
      // Color based on phase
      let circleColor
      switch (breathPhase) {
        case "inhale":
          circleColor = 'rgba(138, 43, 226, 0.8)' // Purple
          break
        case "hold-in":
          circleColor = 'rgba(43, 138, 226, 0.8)' // Blue
          break
        case "exhale":
          circleColor = 'rgba(43, 226, 138, 0.8)' // Teal
          break
        case "hold-out":
          circleColor = 'rgba(226, 138, 43, 0.8)' // Orange
          break
      }
      
      ctx.fillStyle = circleColor
      ctx.fill()
      
      // Text in center
      ctx.font = '20px Arial'
      ctx.fillStyle = 'white'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const phaseText = breathPhase === "inhale" ? "Breathe In" :
                        breathPhase === "hold-in" ? "Hold" :
                        breathPhase === "exhale" ? "Breathe Out" : "Hold"
      
      ctx.fillText(phaseText, centerX, centerY)
      
      // Progress arc around the circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 1.1, -Math.PI / 2, -Math.PI / 2 + (phaseProgress / 100) * Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 3
      ctx.stroke()
    }
    
    animate()
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn("p-6 rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Wind className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Breath Synchronization</h3>
            <p className="text-xs text-white/60">Guide your meditation with breath-synchronized audio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="border-white/10 text-white hover:bg-white/5"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="default"
            onClick={togglePlay}
            className={isPlaying ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? "Pause" : "Start"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column - Visualization */}
        <div className="flex-1">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-black/50 border border-white/10 backdrop-blur-sm flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
            ></canvas>
            
            {!isPlaying && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="text-center p-6">
                  <h3 className="text-xl font-semibold text-white mb-3">Breath Guide</h3>
                  <p className="text-sm text-white/80 mb-6">
                    Follow the animated circle to sync your breathing.
                    <br />Click Start to begin the session.
                  </p>
                  <Button
                    variant="default"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={togglePlay}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                </div>
              </div>
            )}

            {/* Current pattern diagram */}
            {!isPlaying && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3">
                <h4 className="text-sm font-medium text-white mb-2">Current Pattern: {currentPattern.name}</h4>
                <div className="flex items-center gap-2 text-xs">
                  <div className="bg-purple-600/70 px-2 py-1 rounded text-white">
                    Inhale {currentPattern.inhaleTime}s
                  </div>
                  <ArrowRight className="h-3 w-3 text-white/50" />
                  {currentPattern.holdInTime > 0 && (
                    <>
                      <div className="bg-blue-600/70 px-2 py-1 rounded text-white">
                        Hold {currentPattern.holdInTime}s
                      </div>
                      <ArrowRight className="h-3 w-3 text-white/50" />
                    </>
                  )}
                  <div className="bg-teal-600/70 px-2 py-1 rounded text-white">
                    Exhale {currentPattern.exhaleTime}s
                  </div>
                  <ArrowRight className="h-3 w-3 text-white/50" />
                  {currentPattern.holdOutTime > 0 && (
                    <div className="bg-orange-600/70 px-2 py-1 rounded text-white">
                      Hold {currentPattern.holdOutTime}s
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Session stats */}
            {isPlaying && (
              <div className="absolute top-3 left-3 right-3 flex justify-between">
                <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-md text-xs text-white">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {formatTime(elapsedTime)} / {formatTime(meditationDuration)}
                </div>
                <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-md text-xs text-white">
                  Cycles: {cycleCount}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Controls */}
        <div className="flex-1 space-y-6">
          <Tabs defaultValue="patterns" className="w-full">
            <TabsList className="bg-black/30 border-white/10 w-full">
              <TabsTrigger value="patterns" className="data-[state=active]:bg-purple-600 flex-1">
                Patterns
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600 flex-1">
                Settings
              </TabsTrigger>
            </TabsList>
            
            {/* Patterns Tab */}
            <TabsContent value="patterns" className="space-y-6 pt-4">
              {/* Pattern selection */}
              <div className="space-y-2">
                <Label className="text-white">Breathing Pattern</Label>
                <Select value={selectedPattern} onValueChange={setSelectedPattern}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white">
                    <SelectValue placeholder="Select a pattern" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10">
                    {Object.entries(breathingPatterns).map(([key, pattern]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-white/10">
                        {pattern.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-white/60">
                  {currentPattern.description}
                </p>
              </div>
              
              {/* Custom pattern controls */}
              {selectedPattern === "custom" && (
                <div className="space-y-4 bg-white/5 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-white">Custom Pattern</h4>
                  
                  {/* Inhale time */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/80 text-xs">Inhale Duration</Label>
                      <span className="text-sm text-white/80">{customInhale}s</span>
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[customInhale]}
                      onValueChange={(value) => setCustomInhale(value[0])}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  {/* Hold-in time */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/80 text-xs">Hold After Inhale</Label>
                      <span className="text-sm text-white/80">{customHoldIn}s</span>
                    </div>
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={[customHoldIn]}
                      onValueChange={(value) => setCustomHoldIn(value[0])}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  {/* Exhale time */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/80 text-xs">Exhale Duration</Label>
                      <span className="text-sm text-white/80">{customExhale}s</span>
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[customExhale]}
                      onValueChange={(value) => setCustomExhale(value[0])}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  {/* Hold-out time */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/80 text-xs">Hold After Exhale</Label>
                      <span className="text-sm text-white/80">{customHoldOut}s</span>
                    </div>
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={[customHoldOut]}
                      onValueChange={(value) => setCustomHoldOut(value[0])}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              )}
              
              {/* Session duration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Session Duration</Label>
                  <span className="text-sm text-white/80">{formatTime(meditationDuration)}</span>
                </div>
                <Slider
                  min={60}
                  max={1800}
                  step={60}
                  value={[meditationDuration]}
                  onValueChange={(value) => setMeditationDuration(value[0])}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>1 min</span>
                  <span>15 min</span>
                  <span>30 min</span>
                </div>
              </div>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 pt-4">
              {/* Volume control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Volume</Label>
                  <span className="text-sm text-white/80">{volume}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  className="cursor-pointer"
                />
              </div>
              
              {/* Sound palette */}
              <div className="space-y-2">
                <Label className="text-white">Sound Palette</Label>
                <Select value={ambientSound} onValueChange={setAmbientSound}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white">
                    <SelectValue placeholder="Select sound palette" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10">
                    <SelectItem value="ocean" className="text-white hover:bg-white/10">
                      Ocean Waves
                    </SelectItem>
                    <SelectItem value="forest" className="text-white hover:bg-white/10">
                      Forest Ambience
                    </SelectItem>
                    <SelectItem value="cosmic" className="text-white hover:bg-white/10">
                      Cosmic Resonance
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-white/60">
                  Choose the tonal quality of the breath guide sound
                </p>
              </div>
              
              {/* Visualization toggle */}
              <div className="space-y-4 bg-white/5 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white cursor-pointer">Visual Breath Guide</Label>
                    <p className="text-xs text-white/60">Show animated visual breathing guide</p>
                  </div>
                  <Switch
                    checked={showGuide}
                    onCheckedChange={setShowGuide}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Information */}
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Benefits of Breath Work:</h4>
            <ul className="text-xs text-white/70 space-y-1 list-disc pl-4">
              <li>Reduces stress and anxiety by activating the parasympathetic nervous system</li>
              <li>Improves focus and mental clarity through increased oxygen to the brain</li>
              <li>Helps regulate emotions and enhance mood</li>
              <li>Promotes deeper meditation states and mindfulness</li>
              <li>Supports better sleep quality and relaxation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}