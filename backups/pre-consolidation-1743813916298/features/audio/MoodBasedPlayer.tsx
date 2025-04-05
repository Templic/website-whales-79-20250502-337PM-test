/**
 * MoodBasedPlayer.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 * Enhanced with mood filtering, chakra info, and tabbed interface.
 */
"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Waves,
  Heart,
  Brain,
  Sparkles,
  Zap,
  Flame,
  Droplets,
  Info,
} from "lucide-react"
import { cn } from '@/lib/utils'

interface Track {
  id: number
  title: string
  artist: string
  duration: string
  audioSrc: string
  coverArt: string
  moods: string[]
  chakra?: string
  frequency?: number
}

interface MoodBasedPlayerProps {
  tracks?: Track[]
  defaultVolume?: number
  className?: string
}

export function MoodBasedPlayer({
  tracks = [
    {
      id: 1,
      title: "Root Chakra Alignment",
      artist: "ASTRA",
      duration: "6:32",
      audioSrc: "/audio/meditation-alpha.mp3",  // Using available audio
      coverArt: "/placeholder.svg",
      moods: ["grounding", "stability", "calm"],
      chakra: "Root",
      frequency: 396,
    },
    {
      id: 2,
      title: "Sacral Awakening",
      artist: "ASTRA",
      duration: "7:14",
      audioSrc: "/audio/theta-waves.mp3", // Using available audio
      coverArt: "/placeholder.svg",
      moods: ["creative", "emotional", "flowing"],
      chakra: "Sacral",
      frequency: 417,
    },
    {
      id: 3,
      title: "Solar Plexus Activation",
      artist: "ASTRA",
      duration: "5:48",
      audioSrc: "/audio/delta-waves.mp3", // Using available audio
      coverArt: "/placeholder.svg",
      moods: ["energizing", "confidence", "power"],
      chakra: "Solar Plexus",
      frequency: 528,
    },
    {
      id: 4,
      title: "Heart Resonance",
      artist: "ASTRA",
      duration: "8:21",
      audioSrc: "/audio/alpha-focus.mp3", // Using available audio
      coverArt: "/placeholder.svg",
      moods: ["love", "compassion", "healing"],
      chakra: "Heart",
      frequency: 639,
    },
    {
      id: 5,
      title: "Throat Gateway",
      artist: "ASTRA",
      duration: "6:05",
      audioSrc: "/audio/meditation-alpha.mp3", // Using available audio
      coverArt: "/placeholder.svg",
      moods: ["expression", "communication", "clarity"],
      chakra: "Throat",
      frequency: 741,
    },
    {
      id: 6,
      title: "Third Eye Vision",
      artist: "ASTRA",
      duration: "9:17",
      audioSrc: "/audio/theta-waves.mp3", // Using available audio
      coverArt: "/placeholder.svg",
      moods: ["intuition", "insight", "vision"],
      chakra: "Third Eye",
      frequency: 852,
    },
    {
      id: 7,
      title: "Crown Connection",
      artist: "ASTRA",
      duration: "10:33",
      audioSrc: "/audio/delta-waves.mp3", // Using available audio
      coverArt: "/placeholder.svg",
      moods: ["spiritual", "transcendent", "cosmic"],
      chakra: "Crown",
      frequency: 963,
    },
  ],
  defaultVolume = 80,
  className,
}: MoodBasedPlayerProps) {
  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Mood selection state
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [filteredTracks, setFilteredTracks] = useState<Track[]>(tracks)
  const [activeTab, setActiveTab] = useState("moods")

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Current track
  const currentTrack = filteredTracks[currentTrackIndex] || tracks[0]

  // All available moods
  const allMoods = Array.from(new Set(tracks.flatMap((track) => track.moods)))

  // Filter tracks based on selected moods
  useEffect(() => {
    if (selectedMoods.length === 0) {
      setFilteredTracks(tracks)
    } else {
      const filtered = tracks.filter((track) => selectedMoods.some((mood) => track.moods.includes(mood)))
      setFilteredTracks(filtered.length > 0 ? filtered : tracks)
    }
  }, [selectedMoods, tracks])

  // Handle audio playback
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
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, currentTrackIndex, filteredTracks])

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

  // Start progress timer
  const startProgressTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
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
    setCurrentTrackIndex((prev) => {
      if (prev === 0) {
        return filteredTracks.length - 1
      }
      return prev - 1
    })
    setProgress(0)
    setCurrentTime(0)
    setIsPlaying(true)
  }

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => {
      if (prev === filteredTracks.length - 1) {
        return 0
      }
      return prev + 1
    })
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

  // Toggle mood selection
  const toggleMood = (mood: string) => {
    setSelectedMoods((prev) => {
      if (prev.includes(mood)) {
        return prev.filter((m) => m !== mood)
      } else {
        return [...prev, mood]
      }
    })
  }

  // Get mood icon
  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "grounding":
        return <Droplets className="h-4 w-4" />
      case "stability":
        return <Zap className="h-4 w-4" />
      case "calm":
        return <Moon className="h-4 w-4" />
      case "creative":
        return <Sparkles className="h-4 w-4" />
      case "emotional":
        return <Heart className="h-4 w-4" />
      case "flowing":
        return <Waves className="h-4 w-4" />
      case "energizing":
        return <Sun className="h-4 w-4" />
      case "confidence":
        return <Flame className="h-4 w-4" />
      case "power":
        return <Zap className="h-4 w-4" />
      case "love":
        return <Heart className="h-4 w-4" />
      case "compassion":
        return <Heart className="h-4 w-4" />
      case "healing":
        return <Sparkles className="h-4 w-4" />
      case "expression":
        return <Waves className="h-4 w-4" />
      case "communication":
        return <Waves className="h-4 w-4" />
      case "clarity":
        return <Sun className="h-4 w-4" />
      case "intuition":
        return <Brain className="h-4 w-4" />
      case "insight":
        return <Brain className="h-4 w-4" />
      case "vision":
        return <Brain className="h-4 w-4" />
      case "spiritual":
        return <Sparkles className="h-4 w-4" />
      case "transcendent":
        return <Sparkles className="h-4 w-4" />
      case "cosmic":
        return <Sparkles className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
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

  return (
    <div className={cn("rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden", className)}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: getChakraColor(currentTrack.chakra) }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Mood-Based Player</h2>
            <p className="text-xs text-white/60">
              {selectedMoods.length > 0 ? `${selectedMoods.join(", ")}` : "Select moods to customize your experience"}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4">
        {/* Audio element */}
        <audio
          ref={audioRef}
          src={currentTrack.audioSrc}
          onLoadedMetadata={onLoadedMetadata}
          loop={false}
        />

        {/* Current track info */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-1/3 rounded-lg overflow-hidden aspect-square bg-black/30">
            {/* Cover art placeholder - use a chakra-colored gradient if no image */}
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${getChakraColor(currentTrack.chakra)}80, black)`,
              }}
            >
              <Sparkles className="h-16 w-16 text-white/80" />
            </div>
          </div>

          <div className="w-full md:w-2/3 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{currentTrack.title}</h3>
              <p className="text-sm text-white/70 mb-4">{currentTrack.artist}</p>

              {/* Chakra and frequency info */}
              <div className="flex items-center gap-3 mb-4">
                {currentTrack.chakra && (
                  <Badge 
                    className="px-2 py-1 flex items-center gap-1"
                    style={{ backgroundColor: `${getChakraColor(currentTrack.chakra)}40`, borderColor: `${getChakraColor(currentTrack.chakra)}80` }}
                  >
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getChakraColor(currentTrack.chakra) }}></div>
                    <span>{currentTrack.chakra} Chakra</span>
                  </Badge>
                )}
                
                {currentTrack.frequency && (
                  <Badge className="px-2 py-1 flex items-center gap-1 bg-purple-500/20 border-purple-500/40">
                    <Zap className="h-3 w-3" />
                    <span>{currentTrack.frequency} Hz</span>
                  </Badge>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <Slider
                  value={[progress]}
                  max={100}
                  step={0.1}
                  onValueChange={onProgressChange}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-white/10 text-white hover:bg-white/5"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  max={100}
                  onValueChange={onVolumeChange}
                  className="w-24 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-white/10 text-white hover:bg-white/5"
                  onClick={prevTrack}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                  )}
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full border-white/10 text-white hover:bg-white/5"
                  onClick={nextTrack}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="w-[88px]"></div> {/* Spacer to balance layout */}
            </div>
          </div>
        </div>

        {/* Tabs for mood selection and info */}
        <Tabs defaultValue="moods" className="mt-6">
          <TabsList className="w-full bg-black/40">
            <TabsTrigger value="moods" className="flex-1">Moods</TabsTrigger>
            <TabsTrigger value="info" className="flex-1">Chakra & Frequency</TabsTrigger>
          </TabsList>
          
          <TabsContent value="moods" className="pt-4">
            <div className="flex flex-wrap gap-2">
              {allMoods.map((mood) => (
                <Button
                  key={mood}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-white/10 text-white hover:bg-white/5 flex items-center gap-1",
                    selectedMoods.includes(mood) && "bg-purple-500/20 border-purple-500/30"
                  )}
                  onClick={() => toggleMood(mood)}
                >
                  {getMoodIcon(mood)}
                  <span className="capitalize">{mood}</span>
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="info" className="pt-4">
            <div className="space-y-4">
              <div className="bg-black/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: getChakraColor(currentTrack.chakra) }}
                  ></div>
                  <h4 className="font-semibold text-white">{currentTrack.chakra} Chakra</h4>
                </div>
                <p className="text-sm text-white/70">
                  {getChakraDescription(currentTrack.chakra)}
                </p>
              </div>
              
              {currentTrack.frequency && (
                <div className="bg-black/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <h4 className="font-semibold text-white">Frequency: {currentTrack.frequency} Hz</h4>
                  </div>
                  <p className="text-sm text-white/70">
                    This frequency is associated with {getFrequencyDescription(currentTrack.frequency)}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Helper function to get chakra descriptions
function getChakraDescription(chakra?: string): string {
  switch (chakra) {
    case "Root":
      return "Connected to feelings of safety and security. Located at the base of spine, it grounds you to the earth and provides stability."
    case "Sacral":
      return "Associated with creativity, pleasure, and emotion. Located in the lower abdomen, it governs your creative and sexual energy."
    case "Solar Plexus":
      return "Related to personal power, confidence, and self-esteem. Located in the upper abdomen, it helps you feel in control of your life."
    case "Heart":
      return "Center of love, compassion, and harmony. Located in the chest, it connects the physical and spiritual aspects of yourself."
    case "Throat":
      return "Governs communication, self-expression, and speaking your truth. Located in the throat, it helps you communicate effectively."
    case "Third Eye":
      return "Associated with intuition, imagination, and wisdom. Located between the eyebrows, it helps you see beyond ordinary perception."
    case "Crown":
      return "Connected to higher consciousness and spiritual connection. Located at the top of the head, it represents your highest potential."
    default:
      return "This energy center helps balance your physical and spiritual energies, promoting harmony."
  }
}

// Helper function to get frequency descriptions
function getFrequencyDescription(frequency: number): string {
  if (frequency >= 396 && frequency < 417) {
    return "liberating guilt and fear, connected to the Root Chakra."
  } else if (frequency >= 417 && frequency < 528) {
    return "facilitating change, connected to the Sacral Chakra."
  } else if (frequency >= 528 && frequency < 639) {
    return "transformation and miracles, connected to the Solar Plexus Chakra."
  } else if (frequency >= 639 && frequency < 741) {
    return "connecting and relationships, associated with the Heart Chakra."
  } else if (frequency >= 741 && frequency < 852) {
    return "expression and solutions, related to the Throat Chakra."
  } else if (frequency >= 852 && frequency < 963) {
    return "returning to spiritual order, connected to the Third Eye Chakra."
  } else if (frequency >= 963) {
    return "awakening intuition and connecting to the cosmic, associated with the Crown Chakra."
  } else {
    return "balancing energy and promoting harmony."
  }
}
