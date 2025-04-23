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
  Timer,
  Leaf as Lungs, // Use Leaf icon instead of Lungs (which doesn't exist)
  Info,
  Music,
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
  tracks = [],
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
  const [breathCount, setBreathCount] = useState(0)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const breathIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Current track - with safety check
  const currentTrack = tracks.length > 0 
    ? tracks[currentTrackIndex] 
    : {
        id: 0,
        title: "No Track Available",
        artist: "Please upload music",
        duration: "0:00",
        audioSrc: "",
        coverArt: "",
      }

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
      color: "#00e6e6", // Cyan color to match our theme
    },
    {
      id: 2,
      name: "4-7-8 Breathing",
      description: "Relaxing breath for stress reduction and sleep",
      inhale: 4,
      hold1: 7,
      exhale: 8,
      hold2: 0,
      color: "#0ea5e9",
    },
    {
      id: 3,
      name: "Energizing Breath",
      description: "Quick inhales and long exhales for energy",
      inhale: 2,
      hold1: 0,
      exhale: 4,
      hold2: 0,
      color: "#06b6d4",
    },
    {
      id: 4,
      name: "Deep Relaxation",
      description: "Long, deep breaths for deep relaxation",
      inhale: 6,
      hold1: 2,
      exhale: 8,
      hold2: 0,
      color: "#14b8a6",
    },
  ]

  // Current breath pattern
  const currentPattern = breathPatterns[currentPatternIndex]

  // Total breath cycle duration in seconds
  const breathCycleDuration =
    currentPattern.inhale + currentPattern.hold1 + currentPattern.exhale + currentPattern.hold2

  // Initialize audio playback
  useEffect(() => {
    // Only attempt audio playback if we have tracks
    if (audioRef.current && tracks.length > 0) {
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
  }, [isPlaying, currentTrackIndex, tracks.length])

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
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1))
    setProgress(0)
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const nextTrack = () => {
    if (tracks.length === 0) return;
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
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-cyan-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#00e6e6" }}
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
                ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                : "border-white/10 text-white hover:bg-white/5",
            )}
          >
            {isBreathSyncActive ? "Sync Active" : "Start Sync"}
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* Breath Visualization */}
          <div
            className="relative aspect-square rounded-lg overflow-hidden bg-black/40 flex items-center justify-center mb-6"
          >
            <div
              className="absolute w-full h-full flex items-center justify-center transition-all duration-300"
              style={{ transform: `scale(${getCircleSize() / 100})` }}
            >
              <div
                className="rounded-full animate-pulse transition-colors"
                style={{
                  width: "180px",
                  height: "180px",
                  backgroundColor: `${currentPattern.color}30`,
                  boxShadow: `0 0 40px ${currentPattern.color}30`,
                }}
              ></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-medium">
              {getBreathInstruction()}
            </div>
            <div className="absolute bottom-4 left-4 text-white text-xs opacity-60">
              Breaths: {breathCount}
            </div>
          </div>

          {/* Breath Pattern Selection */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-medium">Breath Pattern</h3>
            <div className="grid grid-cols-2 gap-2">
              {breathPatterns.map((pattern, index) => (
                <button
                  key={pattern.id}
                  onClick={() => selectBreathPattern(index)}
                  className={cn(
                    "text-left p-3 rounded-lg text-sm transition",
                    currentPatternIndex === index
                      ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30"
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  )}
                >
                  <div className="font-medium text-white">{pattern.name}</div>
                  <div className="text-white/60 text-xs mt-1 line-clamp-2">{pattern.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Player Controls */}
          {tracks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <button onClick={prevTrack} className="text-white/70 hover:text-white">
                  <SkipBack className="h-5 w-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-3"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button onClick={nextTrack} className="text-white/70 hover:text-white">
                  <SkipForward className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-2 ml-auto">
                  <button onClick={toggleMute} className="text-white/70 hover:text-white">
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <Slider
                    value={[volume]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={onVolumeChange}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Slider
                  value={[progress]}
                  min={0}
                  max={100}
                  step={0.1}
                  onValueChange={onProgressChange}
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <img
                  src={currentTrack.coverArt || "/placeholder.svg"}
                  alt={currentTrack.title}
                  className="h-12 w-12 rounded-md object-cover"
                />
                <div>
                  <div className="text-sm text-white font-medium">{currentTrack.title}</div>
                  <div className="text-xs text-white/60">{currentTrack.artist}</div>
                </div>
              </div>

              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={currentTrack.audioSrc}
                onLoadedMetadata={onLoadedMetadata}
                preload="metadata"
              />
            </div>
          ) : (
            <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/30 mt-6">
              <div className="flex flex-col items-center text-center">
                <Music className="h-10 w-10 text-cyan-500 mb-2" />
                <h3 className="text-white font-medium mb-1">Music tracks coming soon</h3>
                <p className="text-white/70 text-sm">
                  Focus on the breath synchronization for now. Music tracks will be added in a future update.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}