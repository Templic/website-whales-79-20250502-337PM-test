/**
 * spatial-audio-experience.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Headphones,
  Maximize,
  Minimize,
  Settings,
  RotateCw,
  Compass,
  Sparkles,
  Sliders,
  Info,
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
  description?: string
}

interface SpatialAudioExperienceProps {
  tracks?: Track[]
  defaultVolume?: number
}

export function SpatialAudioExperience({
  tracks = [
    {
      id: 1,
      title: "Cosmic Temple",
      artist: "ASTRA",
      duration: "8:24",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Crown",
      frequency: 963,
      description: "A spatial journey through an ancient temple with sounds moving around you",
    },
    {
      id: 2,
      title: "Forest Meditation",
      artist: "ASTRA",
      duration: "12:15",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Heart",
      frequency: 639,
      description: "Immerse yourself in a 3D forest soundscape with birds and streams flowing around you",
    },
    {
      id: 3,
      title: "Crystal Cave",
      artist: "ASTRA",
      duration: "10:33",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Third Eye",
      frequency: 852,
      description: "Experience resonant tones that appear to bounce off crystal walls surrounding you",
    },
    {
      id: 4,
      title: "Ocean Depths",
      artist: "ASTRA",
      duration: "9:47",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Throat",
      frequency: 741,
      description: "Dive into underwater soundscapes with whale songs that move through the 3D space",
    },
  ],
  defaultVolume = 80,
}: SpatialAudioExperienceProps) {
  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Spatial audio state
  const [isSpatialEnabled, setIsSpatialEnabled] = useState(true)
  const [spatialIntensity, setSpatialIntensity] = useState(80)
  const [headTracking, setHeadTracking] = useState(false)
  const [roomSize, setRoomSize] = useState(70)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [rotationSpeed, setRotationSpeed] = useState(10)
  const [currentRotation, setCurrentRotation] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const [showHeadphoneWarning, setShowHeadphoneWarning] = useState(true)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const pannerNodeRef = useRef<PannerNode | null>(null)
  const convolverNodeRef = useRef<ConvolverNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Current track
  const currentTrack = tracks[currentTrackIndex]

  // Initialize audio context and spatial audio
  useEffect(() => {
    // Create audio context on first play to avoid autoplay restrictions
    const setupAudio = () => {
      if (!audioContextRef.current && audioRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioContext()

        // Create source node from audio element
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)

        // Create panner node for spatial positioning
        pannerNodeRef.current = audioContextRef.current.createPanner()
        pannerNodeRef.current.panningModel = "HRTF" // Head-related transfer function for 3D audio
        pannerNodeRef.current.distanceModel = "inverse"
        pannerNodeRef.current.refDistance = 1
        pannerNodeRef.current.maxDistance = 10000
        pannerNodeRef.current.rolloffFactor = 1
        pannerNodeRef.current.coneInnerAngle = 360
        pannerNodeRef.current.coneOuterAngle = 360
        pannerNodeRef.current.coneOuterGain = 0

        // Position listener at center
        const listener = audioContextRef.current.listener
        if (listener.positionX) {
          listener.positionX.value = 0
          listener.positionY.value = 0
          listener.positionZ.value = 0
        } else {
          // Fallback for older browsers
          listener.setPosition(0, 0, 0)
        }

        // Create gain node for volume control
        gainNodeRef.current = audioContextRef.current.createGain()

        // Create convolver node for room effects
        convolverNodeRef.current = audioContextRef.current.createConvolver()

        // Connect nodes
        if (isSpatialEnabled) {
          sourceNodeRef.current.connect(pannerNodeRef.current)
          pannerNodeRef.current.connect(gainNodeRef.current)
        } else {
          sourceNodeRef.current.connect(gainNodeRef.current)
        }

        gainNodeRef.current.connect(audioContextRef.current.destination)

        // Set initial volume
        gainNodeRef.current.gain.value = volume / 100
      }
    }

    // Clean up on unmount
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect()
      }
      if (pannerNodeRef.current) {
        pannerNodeRef.current.disconnect()
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect()
      }
      if (convolverNodeRef.current) {
        convolverNodeRef.current.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // Set up audio context if not already created
        if (!audioContextRef.current) {
          setupAudio()
        }

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

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Handle mute toggle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100
    }
  }, [isMuted])

  // Handle spatial audio toggle
  useEffect(() => {
    if (!sourceNodeRef.current || !pannerNodeRef.current || !gainNodeRef.current) return

    // Reconnect nodes based on spatial setting
    sourceNodeRef.current.disconnect()

    if (isSpatialEnabled) {
      sourceNodeRef.current.connect(pannerNodeRef.current)
      pannerNodeRef.current.connect(gainNodeRef.current)
    } else {
      sourceNodeRef.current.connect(gainNodeRef.current)
    }
  }, [isSpatialEnabled])

  // Handle spatial intensity changes
  useEffect(() => {
    if (!pannerNodeRef.current) return

    // Adjust spatial parameters based on intensity
    const intensity = spatialIntensity / 100

    if (pannerNodeRef.current.refDistance) {
      pannerNodeRef.current.refDistance = 1 + (1 - intensity) * 5
    }

    if (pannerNodeRef.current.rolloffFactor) {
      pannerNodeRef.current.rolloffFactor = intensity * 2
    }
  }, [spatialIntensity])

  // Handle room size changes
  useEffect(() => {
    if (!convolverNodeRef.current || !audioContextRef.current) return

    // In a real implementation, we would load different impulse responses
    // based on room size to simulate different acoustic environments
    const size = roomSize / 100

    // This is a simplified version - in a real app, you would load actual
    // impulse response files for different room sizes
    const sampleRate = audioContextRef.current.sampleRate
    const length = Math.floor(size * 2 * sampleRate)
    const impulseResponse = audioContextRef.current.createBuffer(2, length, sampleRate)

    convolverNodeRef.current.buffer = impulseResponse
  }, [roomSize])

  // Handle auto rotation
  useEffect(() => {
    if (isAutoRotating) {
      startAutoRotation()
    } else {
      stopAutoRotation()
    }

    return () => {
      stopAutoRotation()
    }
  }, [isAutoRotating, rotationSpeed])

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

  // Update sound position based on rotation
  useEffect(() => {
    if (!pannerNodeRef.current) return

    // Convert rotation from degrees to radians
    const radians = (currentRotation * Math.PI) / 180

    // Calculate position on a circle around the listener
    const distance = 3 // Distance from listener
    const x = Math.sin(radians) * distance
    const z = Math.cos(radians) * distance

    // Update panner position
    if (pannerNodeRef.current.positionX) {
      pannerNodeRef.current.positionX.value = x
      pannerNodeRef.current.positionY.value = 0
      pannerNodeRef.current.positionZ.value = z
    } else {
      // Fallback for older browsers
      pannerNodeRef.current.setPosition(x, 0, z)
    }
  }, [currentRotation])

  // Set up audio
  const setupAudio = () => {
    if (!audioContextRef.current && audioRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContext()

      // Create source node from audio element
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)

      // Create panner node for spatial positioning
      pannerNodeRef.current = audioContextRef.current.createPanner()
      pannerNodeRef.current.panningModel = "HRTF" // Head-related transfer function for 3D audio
      pannerNodeRef.current.distanceModel = "inverse"
      pannerNodeRef.current.refDistance = 1
      pannerNodeRef.current.maxDistance = 10000
      pannerNodeRef.current.rolloffFactor = 1
      pannerNodeRef.current.coneInnerAngle = 360
      pannerNodeRef.current.coneOuterAngle = 360
      pannerNodeRef.current.coneOuterGain = 0

      // Position listener at center
      const listener = audioContextRef.current.listener
      if (listener.positionX) {
        listener.positionX.value = 0
        listener.positionY.value = 0
        listener.positionZ.value = 0
      } else {
        // Fallback for older browsers
        listener.setPosition(0, 0, 0)
      }

      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain()

      // Create convolver node for room effects
      convolverNodeRef.current = audioContextRef.current.createConvolver()

      // Connect nodes
      if (isSpatialEnabled) {
        sourceNodeRef.current.connect(pannerNodeRef.current)
        pannerNodeRef.current.connect(gainNodeRef.current)
      } else {
        sourceNodeRef.current.connect(gainNodeRef.current)
      }

      gainNodeRef.current.connect(audioContextRef.current.destination)

      // Set initial volume
      gainNodeRef.current.gain.value = volume / 100
    }
  }

  // Start progress timer
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

  // Start auto rotation
  const startAutoRotation = () => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current)
    }

    rotationIntervalRef.current = setInterval(
      () => {
        setCurrentRotation((prev) => (prev + 1) % 360)
      },
      1000 / (rotationSpeed / 10),
    )
  }

  // Stop auto rotation
  const stopAutoRotation = () => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current)
      rotationIntervalRef.current = null
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

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev === tracks.length - 1 ? 0 : prev + 1))
    setProgress(0)
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1))
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

  // Toggle spatial audio
  const toggleSpatialAudio = () => {
    setIsSpatialEnabled(!isSpatialEnabled)
  }

  // Toggle auto rotation
  const toggleAutoRotation = () => {
    setIsAutoRotating(!isAutoRotating)
  }

  // Dismiss headphone warning
  const dismissHeadphoneWarning = () => {
    setShowHeadphoneWarning(false)
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

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: getChakraColor(currentTrack.chakra) }}
          >
            <Headphones className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Spatial Audio Experience</h2>
            <p className="text-xs text-white/60">{isSpatialEnabled ? "3D audio enabled" : "Standard stereo"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isSpatialEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleSpatialAudio}
            className={cn(
              isSpatialEnabled
                ? "bg-purple-500 hover:bg-purple-600 text-white"
                : "border-white/10 text-white hover:bg-white/5",
            )}
          >
            {isSpatialEnabled ? "3D Audio On" : "3D Audio Off"}
          </Button>
        </div>
      </div>

      <div ref={containerRef} className={cn(isFullscreen ? "h-screen" : "")}>
        {/* Headphone Warning */}
        {showHeadphoneWarning && (
          <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="max-w-md bg-black/80 border border-purple-500/30 rounded-xl p-6 text-center">
              <Headphones className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">For Best Experience</h3>
              <p className="text-white/80 mb-6">
                This spatial audio experience is designed to be heard with headphones. For the full immersive effect,
                please put on headphones before continuing.
              </p>
              <Button
                onClick={dismissHeadphoneWarning}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
              >
                I'm Wearing Headphones
              </Button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-0">
          <div className="p-6 border-r border-white/10">
            <div className="space-y-6">
              {/* Spatial Visualization */}
              <div
                className="relative aspect-square rounded-lg overflow-hidden bg-black/40 flex items-center justify-center"
                style={{ backgroundColor: `${getChakraColor(currentTrack.chakra)}10` }}
              >
                {/* 3D Spatial Visualization */}
                <div className="relative w-full h-full">
                  {/* Listener (center) */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                      <Headphones className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Sound source (rotating) */}
                  <div
                    className="absolute h-12 w-12 rounded-full flex items-center justify-center"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: `rotate(${currentRotation}deg) translate(${roomSize}px) rotate(-${currentRotation}deg) translate(-50%, -50%)`,
                      backgroundColor: getChakraColor(currentTrack.chakra),
                      transition: isAutoRotating ? "none" : "transform 0.3s ease-out",
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>

                  {/* Room boundary */}
                  <div
                    className="absolute top-1/2 left-1/2 rounded-full border-2 border-dashed"
                    style={{
                      width: `${roomSize * 2 + 50}px`,
                      height: `${roomSize * 2 + 50}px`,
                      transform: "translate(-50%, -50%)",
                      borderColor: `${getChakraColor(currentTrack.chakra)}40`,
                    }}
                  ></div>

                  {/* Rotation indicator */}
                  <div
                    className="absolute top-1/2 left-1/2 h-1 bg-white/30"
                    style={{
                      width: `${roomSize}px`,
                      transformOrigin: "left center",
                      transform: `translateY(-50%) rotate(${currentRotation}deg)`,
                    }}
                  >
                    <div
                      className="absolute right-0 h-2 w-2 rounded-full"
                      style={{ backgroundColor: getChakraColor(currentTrack.chakra) }}
                    ></div>
                  </div>

                  {/* Compass directions */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-white/60">N</div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-white/60">S</div>
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xs text-white/60">W</div>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-white/60">E</div>
                </div>

                {/* Controls overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleAutoRotation}
                    className={cn(
                      "h-8 w-8 rounded-full",
                      isAutoRotating
                        ? "bg-purple-500/70 text-white hover:bg-purple-600/70"
                        : "bg-black/40 text-white hover:bg-black/60",
                    )}
                  >
                    <RotateCw className="h-4 w-4" />
                    <span className="sr-only">{isAutoRotating ? "Stop Rotation" : "Auto Rotate"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    <span className="sr-only">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                  </Button>
                </div>
              </div>

              {/* Track Info */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-white/60">{currentTrack.artist}</p>
                  {currentTrack.frequency && (
                    <>
                      <span className="text-white/40">•</span>
                      <p className="text-sm text-white/60">{currentTrack.frequency} Hz</p>
                    </>
                  )}
                </div>
                <p className="text-sm text-white/70">{currentTrack.description}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{formatTime(currentTime)}</span>
                  <span className="text-white/60">{currentTrack.duration}</span>
                </div>
                <Slider value={[progress]} min={0} max={100} step={0.1} onValueChange={onProgressChange} />
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/10">
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
                  </Button>
                  <Slider value={[volume]} min={0} max={100} step={1} onValueChange={onVolumeChange} className="w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={prevTrack} className="text-white hover:bg-white/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <polygon points="19 20 9 12 19 4 19 20"></polygon>
                      <line x1="5" y1="19" x2="5" y2="5"></line>
                    </svg>
                    <span className="sr-only">Previous</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextTrack} className="text-white hover:bg-white/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <polygon points="5 4 15 12 5 20 5 4"></polygon>
                      <line x1="19" y1="5" x2="19" y2="19"></line>
                    </svg>
                    <span className="sr-only">Next</span>
                  </Button>
                </div>
                <div className="w-[88px]"></div> {/* Spacer to balance layout */}
              </div>

              <audio
                ref={audioRef}
                src={currentTrack.audioSrc}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={nextTrack}
              />
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="spatial" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1">
                <TabsTrigger value="spatial" className="data-[state=active]:bg-purple-900/50">
                  Spatial Settings
                </TabsTrigger>
                <TabsTrigger value="tracks" className="data-[state=active]:bg-purple-900/50">
                  Available Experiences
                </TabsTrigger>
              </TabsList>

              <TabsContent value="spatial" className="mt-4 space-y-4">
                <div className="rounded-lg bg-black/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="h-5 w-5 text-purple-400" />
                      <h3 className="font-medium text-white">Spatial Audio</h3>
                    </div>
                    <Switch checked={isSpatialEnabled} onCheckedChange={toggleSpatialAudio} />
                  </div>

                  {isSpatialEnabled && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-white/70">Spatial Intensity</label>
                          <span className="text-sm text-white/70">{spatialIntensity}%</span>
                        </div>
                        <Slider
                          value={[spatialIntensity]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => setSpatialIntensity(value[0])}
                          disabled={!isSpatialEnabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-white/70">Room Size</label>
                          <span className="text-sm text-white/70">{roomSize}%</span>
                        </div>
                        <Slider
                          value={[roomSize]}
                          min={30}
                          max={100}
                          step={1}
                          onValueChange={(value) => setRoomSize(value[0])}
                          disabled={!isSpatialEnabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-white/70">Rotation Speed</label>
                          <span className="text-sm text-white/70">{rotationSpeed}</span>
                        </div>
                        <Slider
                          value={[rotationSpeed]}
                          min={1}
                          max={30}
                          step={1}
                          onValueChange={(value) => setRotationSpeed(value[0])}
                          disabled={!isSpatialEnabled || !isAutoRotating}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RotateCw className="h-4 w-4 text-purple-400" />
                          <span className="text-sm text-white/70">Auto Rotation</span>
                        </div>
                        <Switch
                          checked={isAutoRotating}
                          onCheckedChange={toggleAutoRotation}
                          disabled={!isSpatialEnabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-purple-400" />
                          <span className="text-sm text-white/70">Head Tracking</span>
                        </div>
                        <Switch checked={headTracking} onCheckedChange={setHeadTracking} disabled={!isSpatialEnabled} />
                      </div>

                      {headTracking && (
                        <div className="rounded-lg bg-purple-900/20 border border-purple-500/30 p-3">
                          <p className="text-sm text-white/80">
                            Head tracking requires device motion permissions. Please allow motion access when prompted.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-purple-400" />
                    <h3 className="font-medium text-white">About Spatial Audio</h3>
                  </div>
                  <p className="text-sm text-white/80">
                    Spatial audio creates an immersive 3D sound experience that surrounds you. As sounds move around you
                    in virtual space, your brain receives directional cues that enhance the meditative experience and
                    deepen your connection to the frequencies.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="tracks" className="mt-4 space-y-4">
                <div className="rounded-lg bg-black/40 p-4 space-y-3">
                  <h3 className="font-medium text-white mb-2">Spatial Experiences</h3>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
                    {tracks.map((track, index) => (
                      <div
                        key={track.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                          currentTrackIndex === index
                            ? "bg-purple-900/30 border border-purple-500/30"
                            : "hover:bg-white/5",
                        )}
                        onClick={() => {
                          setCurrentTrackIndex(index)
                          setIsPlaying(true)
                        }}
                      >
                        <div
                          className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0"
                          style={{ backgroundColor: `${getChakraColor(track.chakra)}20` }}
                        >
                          <Image
                            src={track.coverArt || "/placeholder.svg"}
                            alt={track.title}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{track.title}</h4>
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-white/60 truncate">{track.artist}</p>
                            <span className="text-white/40">•</span>
                            <p className="text-xs text-white/60 truncate">{track.duration}</p>
                          </div>
                          <p className="text-xs text-white/60 truncate">{track.description}</p>
                        </div>
                        {currentTrackIndex === index && isPlaying && (
                          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-black/40 p-4">
                  <h3 className="font-medium text-white mb-3">Recommended Settings</h3>
                  <div className="space-y-2">
                    <div
                      className="p-3 rounded-lg cursor-pointer hover:bg-white/5"
                      onClick={() => {
                        setSpatialIntensity(80)
                        setRoomSize(70)
                        setRotationSpeed(10)
                        setIsAutoRotating(true)
                        setIsSpatialEnabled(true)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-purple-400" />
                        <h4 className="font-medium text-white">Meditation Preset</h4>
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        Gentle rotation with medium room size for a calming experience
                      </p>
                    </div>

                    <div
                      className="p-3 rounded-lg cursor-pointer hover:bg-white/5"
                      onClick={() => {
                        setSpatialIntensity(100)
                        setRoomSize(100)
                        setRotationSpeed(5)
                        setIsAutoRotating(true)
                        setIsSpatialEnabled(true)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-purple-400" />
                        <h4 className="font-medium text-white">Immersive Preset</h4>
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        Maximum spatial effect with slow rotation for deep immersion
                      </p>
                    </div>

                    <div
                      className="p-3 rounded-lg cursor-pointer hover:bg-white/5"
                      onClick={() => {
                        setSpatialIntensity(60)
                        setRoomSize(50)
                        setRotationSpeed(20)
                        setIsAutoRotating(true)
                        setIsSpatialEnabled(true)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-purple-400" />
                        <h4 className="font-medium text-white">Dynamic Preset</h4>
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        Faster rotation with moderate spatial effect for an energizing experience
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

