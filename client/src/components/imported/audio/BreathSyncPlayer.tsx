"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  TreePine as Lungs,
  Timer,
  Info,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Maximize,
  Minimize,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Track {
  id: number
  title: string
  artist: string
  duration: string
  audioSrc: string
  coverArt: string
  chakra?: string
  frequency?: number
}

interface BreathPattern {
  id: number
  name: string
  description: string
  inhale: number // seconds
  hold1: number // seconds
  exhale: number // seconds
  hold2: number // seconds
  color: string
}

interface BreathSyncPlayerProps {
  tracks?: Track[]
  defaultVolume?: number
}

export function BreathSyncPlayer({
  tracks = [
    {
      id: 1,
      title: "Root Chakra Alignment",
      artist: "ASTRA",
      duration: "6:32",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Root",
      frequency: 396,
    },
    {
      id: 2,
      title: "Sacral Awakening",
      artist: "ASTRA",
      duration: "7:14",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Sacral",
      frequency: 417,
    },
    {
      id: 3,
      title: "Solar Plexus Activation",
      artist: "ASTRA",
      duration: "5:48",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Solar Plexus",
      frequency: 528,
    },
    {
      id: 4,
      title: "Heart Resonance",
      artist: "ASTRA",
      duration: "8:21",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Heart",
      frequency: 639,
    },
    {
      id: 5,
      title: "Throat Gateway",
      artist: "ASTRA",
      duration: "6:05",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Throat",
      frequency: 741,
    },
  ],
  defaultVolume = 80,
}: BreathSyncPlayerProps) {
  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Breath sync state
  const [isBreathSyncActive, setIsBreathSyncActive] = useState(false)
  const [currentBreathPhase, setCurrentBreathPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale")
  const [breathProgress, setBreathProgress] = useState(0)
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [customPattern, setCustomPattern] = useState<BreathPattern>({
    id: 0,
    name: "Custom",
    description: "Your custom breathing pattern",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 0,
    color: "#9333ea",
  })

  // Session state
  const [sessionDuration, setSessionDuration] = useState(5) // minutes
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(5 * 60) // seconds
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [breathCount, setBreathCount] = useState(0)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const breathIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Current track
  const currentTrack = tracks[currentTrackIndex]

  // Breath patterns
  const breathPatterns: BreathPattern[] = [
    {
      id: 1,
      name: "Box Breathing",
      description: "Equal inhale, hold, exhale, hold for calm and focus",
      inhale: 4,
      hold1: 4,
      exhale: 4,
      hold2: 4,
      color: "#9333ea",
    },
    {
      id: 2,
      name: "4-7-8 Breathing",
      description: "Relaxing breath for stress reduction and sleep",
      inhale: 4,
      hold1: 7,
      exhale: 8,
      hold2: 0,
      color: "#3b82f6",
    },
    {
      id: 3,
      name: "Energizing Breath",
      description: "Quick inhales and long exhales for energy",
      inhale: 2,
      hold1: 0,
      exhale: 4,
      hold2: 0,
      color: "#f59e0b",
    },
    {
      id: 4,
      name: "Deep Relaxation",
      description: "Long, deep breaths for deep relaxation",
      inhale: 6,
      hold1: 2,
      exhale: 8,
      hold2: 0,
      color: "#10b981",
    },
    {
      id: 5,
      name: "Custom",
      description: "Your custom breathing pattern",
      inhale: customPattern.inhale,
      hold1: customPattern.hold1,
      exhale: customPattern.exhale,
      hold2: customPattern.hold2,
      color: customPattern.color,
    },
  ]

  // Current breath pattern
  const currentPattern = currentPatternIndex === 4 ? { ...customPattern } : breathPatterns[currentPatternIndex]

  // Total breath cycle duration in seconds
  const breathCycleDuration =
    currentPattern.inhale + currentPattern.hold1 + currentPattern.exhale + currentPattern.hold2

  // Initialize audio playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Audio playback failed:", error)
          setIsPlaying(false)
        })
        startProgressTimer()
      } else {
        audioRef.current.pause()
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isPlaying, currentTrackIndex])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // Handle mute toggle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
    }
  }, [isMuted])

  // Handle breath sync
  useEffect(() => {
    if (isBreathSyncActive) {
      startBreathSync()
    } else {
      stopBreathSync()
    }

    return () => {
      stopBreathSync()
    }
  }, [isBreathSyncActive, currentPattern])

  // Handle session timer
  useEffect(() => {
    if (isSessionActive && isBreathSyncActive) {
      startSessionTimer()
    } else {
      stopSessionTimer()
    }

    return () => {
      stopSessionTimer()
    }
  }, [isSessionActive, isBreathSyncActive])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Update custom pattern in patterns array
  useEffect(() => {
    breathPatterns[4] = { ...customPattern }
  }, [customPattern])

  // Start progress timer for audio
  const startProgressTimer = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        if (audioRef.current.ended) {
          nextTrack()
        } else {
          setCurrentTime(audioRef.current.currentTime)
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
        }
      }
    }, 1000)
  }

  // Start breath synchronization
  const startBreathSync = () => {
    if (breathIntervalRef.current) {
      clearInterval(breathIntervalRef.current)
    }

    // Start with inhale phase
    setCurrentBreathPhase("inhale")
    setBreathProgress(0)

    // Update every 100ms for smooth animation
    breathIntervalRef.current = setInterval(() => {
      setBreathProgress((prev) => {
        // Calculate new progress
        const increment = (0.1 / getCurrentPhaseSeconds()) * 100
        const newProgress = prev + increment

        // If current phase is complete, move to next phase
        if (newProgress >= 100) {
          moveToNextBreathPhase()
          return 0 // Reset progress for new phase
        }

        return newProgress
      })
    }, 100)
  }

  // Stop breath synchronization
  const stopBreathSync = () => {
    if (breathIntervalRef.current) {
      clearInterval(breathIntervalRef.current)
      breathIntervalRef.current = null
    }
  }

  // Start session timer
  const startSessionTimer = () => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
    }

    setSessionTimeRemaining(sessionDuration * 60)

    sessionIntervalRef.current = setInterval(() => {
      setSessionTimeRemaining((prev) => {
        if (prev <= 1) {
          // Session complete
          setIsSessionActive(false)
          setIsBreathSyncActive(false)
          clearInterval(sessionIntervalRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Stop session timer
  const stopSessionTimer = () => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
      sessionIntervalRef.current = null
    }
  }

  // Get current phase duration in seconds
  const getCurrentPhaseSeconds = () => {
    switch (currentBreathPhase) {
      case "inhale":
        return currentPattern.inhale
      case "hold1":
        return currentPattern.hold1
      case "exhale":
        return currentPattern.exhale
      case "hold2":
        return currentPattern.hold2
      default:
        return 1
    }
  }

  // Move to next breath phase
  const moveToNextBreathPhase = () => {
    switch (currentBreathPhase) {
      case "inhale":
        if (currentPattern.hold1 > 0) {
          setCurrentBreathPhase("hold1")
        } else {
          setCurrentBreathPhase("exhale")
        }
        break
      case "hold1":
        setCurrentBreathPhase("exhale")
        break
      case "exhale":
        if (currentPattern.hold2 > 0) {
          setCurrentBreathPhase("hold2")
        } else {
          setCurrentBreathPhase("inhale")
          // Completed one full breath cycle
          setBreathCount((prev) => prev + 1)
        }
        break
      case "hold2":
        setCurrentBreathPhase("inhale")
        // Completed one full breath cycle
        setBreathCount((prev) => prev + 1)
        break
    }
  }

  // Format time for display
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Handle metadata loaded
  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  // Player controls
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1))
    setProgress(0)
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev === tracks.length - 1 ? 0 : prev + 1))
    setProgress(0)
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const onProgressChange = (value: number[]) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * audioRef.current.duration
      audioRef.current.currentTime = newTime
      setProgress(value[0])
      setCurrentTime(newTime)
    }
  }

  const onVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (value[0] === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  // Breath sync controls
  const toggleBreathSync = () => {
    setIsBreathSyncActive(!isBreathSyncActive)
  }

  const selectBreathPattern = (index: number) => {
    setCurrentPatternIndex(index)
  }

  const toggleSession = () => {
    setIsSessionActive(!isSessionActive)
    if (!isSessionActive) {
      setBreathCount(0)
    }
  }

  // Update custom pattern
  const updateCustomPattern = (field: keyof BreathPattern, value: number) => {
    setCustomPattern((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  // Get chakra color
  const getChakraColor = (chakra?: string) => {
    switch (chakra) {
      case "Root":
        return "#ff0000"
      case "Sacral":
        return "#ff8c00"
      case "Solar Plexus":
        return "#ffff00"
      case "Heart":
        return "#00ff00"
      case "Throat":
        return "#00bfff"
      case "Third Eye":
        return "#0000ff"
      case "Crown":
        return "#9400d3"
      default:
        return "#9333ea"
    }
  }

  // Get breath phase instruction
  const getBreathInstruction = () => {
    switch (currentBreathPhase) {
      case "inhale":
        return "Inhale"
      case "hold1":
        return "Hold"
      case "exhale":
        return "Exhale"
      case "hold2":
        return "Hold"
    }
  }

  // Calculate circle size based on breath phase
  const getCircleSize = () => {
    if (currentBreathPhase === "inhale") {
      return 50 + (breathProgress / 100) * 50 // 50% to 100%
    } else if (currentBreathPhase === "exhale") {
      return 100 - (breathProgress / 100) * 50 // 100% to 50%
    } else {
      return 100 // Hold phases maintain full size
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: getChakraColor(currentTrack.chakra) }}
          >
            <Lungs className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Breath-Synchronized Player</h2>
            <p className="text-xs text-white/60">
              {isBreathSyncActive
                ? `${currentPattern.name} • ${getBreathInstruction()}`
                : "Synchronize music with your breath"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isBreathSyncActive ? "default" : "outline"}
            size="sm"
            onClick={toggleBreathSync}
            className={cn(
              isBreathSyncActive
                ? "bg-purple-500 hover:bg-purple-600 text-white"
                : "border-white/10 text-white hover:bg-white/5",
            )}
          >
            {isBreathSyncActive ? "Sync Active" : "Start Sync"}
          </Button>
        </div>
      </div>

      <div ref={containerRef} className={cn(isFullscreen ? "h-screen" : "")}>
        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-6 border-r border-white/10">
            <div className="space-y-6">
              {/* Breath Visualization */}
              <div
                className="relative aspect-square rounded-lg overflow-hidden bg-black/40 flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle at center, ${currentPattern.color}20 0%, rgba(0,0,0,0.6) 70%)`,
                }}
              >
                {/* Breath circle */}
                <div
                  className="relative flex items-center justify-center transition-all duration-300"
                  style={{
                    width: `${getCircleSize()}%`,
                    height: `${getCircleSize()}%`,
                    maxWidth: "80%",
                    maxHeight: "80%",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full animate-pulse-glow"
                    style={{
                      background: `radial-gradient(circle at center, ${currentPattern.color}30 0%, transparent 70%)`,
                      border: `2px solid ${currentPattern.color}40`,
                    }}
                  ></div>

                  {/* Inner circles */}
                  <div
                    className="absolute rounded-full w-3/4 h-3/4"
                    style={{
                      background: `radial-gradient(circle at center, ${currentPattern.color}20 0%, transparent 70%)`,
                      border: `1px solid ${currentPattern.color}20`,
                    }}
                  ></div>

                  <div
                    className="absolute rounded-full w-1/2 h-1/2"
                    style={{
                      background: `radial-gradient(circle at center, ${currentPattern.color}10 0%, transparent 70%)`,
                      border: `1px solid ${currentPattern.color}10`,
                    }}
                  ></div>

                  {/* Breath instruction */}
                  <div className="text-center z-10">
                    <div className="text-2xl md:text-4xl font-bold text-white">
                      {isBreathSyncActive ? getBreathInstruction() : "Start"}
                    </div>
                    {isSessionActive && isBreathSyncActive && (
                      <div className="mt-2 text-white/80 text-sm">
                        {breathCount} breaths completed
                      </div>
                    )}
                  </div>
                </div>

                {/* Session timer (if active) */}
                {isSessionActive && isBreathSyncActive && (
                  <div className="absolute top-3 right-3 bg-black/40 px-3 py-1 rounded-full flex items-center text-white/90 text-sm">
                    <Timer className="h-4 w-4 mr-1" />
                    {formatTime(sessionTimeRemaining)}
                  </div>
                )}

                {/* Fullscreen button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="absolute bottom-3 right-3 text-white/60 hover:text-white hover:bg-black/20"
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Breath patterns */}
              <Tabs defaultValue="patterns" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="patterns">Breath Patterns</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="patterns" className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    {breathPatterns.slice(0, 4).map((pattern, index) => (
                      <div
                        key={pattern.id}
                        className={cn(
                          "relative p-3 rounded-lg cursor-pointer transition-all",
                          currentPatternIndex === index
                            ? "bg-black/40 border border-white/10"
                            : "bg-black/20 hover:bg-black/30"
                        )}
                        onClick={() => selectBreathPattern(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${pattern.color}20` }}
                          >
                            <div
                              className="h-6 w-6 rounded-full"
                              style={{ backgroundColor: pattern.color }}
                            ></div>
                          </div>
                          <div>
                            <div className="font-medium text-white">{pattern.name}</div>
                            <div className="text-xs text-white/60">{pattern.description}</div>
                          </div>
                          {currentPatternIndex === index && (
                            <div
                              className="absolute top-0 right-0 h-full w-1 rounded-r-lg"
                              style={{ backgroundColor: pattern.color }}
                            ></div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Custom pattern option */}
                    <div
                      className={cn(
                        "relative p-3 rounded-lg cursor-pointer transition-all",
                        currentPatternIndex === 4
                          ? "bg-black/40 border border-white/10"
                          : "bg-black/20 hover:bg-black/30"
                      )}
                      onClick={() => selectBreathPattern(4)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${customPattern.color}20` }}
                        >
                          <div
                            className="h-6 w-6 rounded-full"
                            style={{ backgroundColor: customPattern.color }}
                          ></div>
                        </div>
                        <div>
                          <div className="font-medium text-white">Custom Pattern</div>
                          <div className="text-xs text-white/60">
                            In: {customPattern.inhale}s, Hold: {customPattern.hold1}s, Out:{" "}
                            {customPattern.exhale}s
                            {customPattern.hold2 > 0 ? `, Hold: ${customPattern.hold2}s` : ""}
                          </div>
                        </div>
                        {currentPatternIndex === 4 && (
                          <div
                            className="absolute top-0 right-0 h-full w-1 rounded-r-lg"
                            style={{ backgroundColor: customPattern.color }}
                          ></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custom pattern controls (if selected) */}
                  {currentPatternIndex === 4 && (
                    <div className="mt-4 p-3 rounded-lg bg-black/20 space-y-3">
                      <h3 className="text-white font-medium">Custom Pattern Settings</h3>

                      {/* Inhale */}
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-white/80 text-sm">Inhale:</label>
                        <Slider
                          value={[customPattern.inhale]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={(value) => updateCustomPattern("inhale", value[0])}
                          className="col-span-1"
                        />
                        <span className="text-white text-right">{customPattern.inhale}s</span>
                      </div>

                      {/* Hold 1 */}
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-white/80 text-sm">Hold:</label>
                        <Slider
                          value={[customPattern.hold1]}
                          min={0}
                          max={10}
                          step={1}
                          onValueChange={(value) => updateCustomPattern("hold1", value[0])}
                          className="col-span-1"
                        />
                        <span className="text-white text-right">{customPattern.hold1}s</span>
                      </div>

                      {/* Exhale */}
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-white/80 text-sm">Exhale:</label>
                        <Slider
                          value={[customPattern.exhale]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={(value) => updateCustomPattern("exhale", value[0])}
                          className="col-span-1"
                        />
                        <span className="text-white text-right">{customPattern.exhale}s</span>
                      </div>

                      {/* Hold 2 */}
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-white/80 text-sm">Final Hold:</label>
                        <Slider
                          value={[customPattern.hold2]}
                          min={0}
                          max={10}
                          step={1}
                          onValueChange={(value) => updateCustomPattern("hold2", value[0])}
                          className="col-span-1"
                        />
                        <span className="text-white text-right">{customPattern.hold2}s</span>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  {/* Session settings */}
                  <div className="p-3 rounded-lg bg-black/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium">Timed Session</h3>
                      <Switch
                        checked={isSessionActive}
                        onCheckedChange={toggleSession}
                        disabled={!isBreathSyncActive}
                      />
                    </div>

                    {isSessionActive && (
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map((mins) => (
                          <Button
                            key={mins}
                            variant={sessionDuration === mins ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSessionDuration(mins)}
                            className={cn(
                              "text-sm",
                              sessionDuration === mins
                                ? "bg-blue-500 hover:bg-blue-600 text-white"
                                : "border-white/10 text-white hover:bg-white/5"
                            )}
                          >
                            {mins} min
                          </Button>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-white/60">
                      Track your breath count and set a timer for your practice.
                    </div>
                  </div>

                  {/* Information */}
                  <div className="p-3 rounded-lg bg-black/20 space-y-3">
                    <h3 className="text-white font-medium flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-400" />
                      Benefits of Breath Synchronization
                    </h3>
                    <ul className="text-white/80 text-sm space-y-1 list-disc pl-5">
                      <li>Enhances focus and presence during sound healing</li>
                      <li>Deepens meditative state and relaxation</li>
                      <li>Promotes coherence between body, breath, and sound</li>
                      <li>Increases oxygen and energy flow throughout the body</li>
                      <li>Reduces stress and anxiety more effectively</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* Track info & Cover */}
              <div className="aspect-square relative overflow-hidden rounded-lg bg-black/40">
                <img
                  src={currentTrack.coverArt}
                  alt={`Cover art for ${currentTrack.title}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 w-full">
                  <h2 className="text-xl font-bold text-white mb-1">{currentTrack.title}</h2>
                  <p className="text-white/70">{currentTrack.artist}</p>
                  {currentTrack.chakra && (
                    <div
                      className="mt-2 inline-block px-2 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: `${getChakraColor(currentTrack.chakra)}30`,
                        color: "white",
                      }}
                    >
                      {currentTrack.chakra} Chakra • {currentTrack.frequency} Hz
                    </div>
                  )}
                </div>
              </div>

              {/* Playback controls */}
              <div className="space-y-3">
                {/* Progress */}
                <div className="space-y-1">
                  <Slider value={[progress]} min={0} max={100} step={0.1} onValueChange={onProgressChange} />
                  <div className="flex justify-between text-xs text-white/60">
                    <span>{formatTime(currentTime)}</span>
                    <span>{currentTrack.duration}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className={isMuted ? "text-white/50" : "text-white"}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <Slider
                      value={[volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={onVolumeChange}
                      className="w-24"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={prevTrack} className="text-white">
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={togglePlay}
                      className="h-12 w-12 rounded-full bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={nextTrack} className="text-white">
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="w-24"></div> {/* Spacer to balance layout */}
                </div>
              </div>

              {/* Playlist */}
              <div className="space-y-3">
                <h3 className="text-white font-medium">Sacred Frequencies</h3>
                <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2">
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className={cn(
                        "flex items-center p-2 rounded-lg cursor-pointer",
                        currentTrackIndex === index
                          ? "bg-purple-500/20 border border-purple-500/30"
                          : "hover:bg-white/5"
                      )}
                      onClick={() => {
                        setCurrentTrackIndex(index)
                        setIsPlaying(true)
                      }}
                    >
                      <div
                        className="h-8 w-8 rounded-full mr-3 flex-shrink-0 flex items-center justify-center"
                        style={{
                          backgroundColor: `${getChakraColor(track.chakra)}30`,
                        }}
                      >
                        {currentTrackIndex === index && isPlaying ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{track.title}</div>
                        <div className="text-white/60 text-xs truncate">{track.artist}</div>
                      </div>
                      <div className="text-white/60 text-xs">{track.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.audioSrc}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        loop={false}
      />
    </div>
  )
}