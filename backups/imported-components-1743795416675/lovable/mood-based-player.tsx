/**
 * mood-based-player.tsx
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
} from "lucide-react"
import { cn } from "@/lib/utils"

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
}

export function MoodBasedPlayer({
  tracks = [
    {
      id: 1,
      title: "Root Chakra Alignment",
      artist: "ASTRA",
      duration: "6:32",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      moods: ["grounding", "stability", "calm"],
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
      moods: ["creative", "emotional", "flowing"],
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
      moods: ["energizing", "confidence", "power"],
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
      moods: ["love", "compassion", "healing"],
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
      moods: ["expression", "communication", "clarity"],
      chakra: "Throat",
      frequency: 741,
    },
    {
      id: 6,
      title: "Third Eye Vision",
      artist: "ASTRA",
      duration: "9:17",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      moods: ["intuition", "insight", "vision"],
      chakra: "Third Eye",
      frequency: 852,
    },
    {
      id: 7,
      title: "Crown Connection",
      artist: "ASTRA",
      duration: "10:33",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      moods: ["spiritual", "transcendent", "cosmic"],
      chakra: "Crown",
      frequency: 963,
    },
  ],
  defaultVolume = 80,
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

  // Environment sounds state
  const [environmentSounds, setEnvironmentSounds] = useState({
    rain: { active: false, volume: 50, audio: null as HTMLAudioElement | null },
    waves: { active: false, volume: 50, audio: null as HTMLAudioElement | null },
    wind: { active: false, volume: 50, audio: null as HTMLAudioElement | null },
  })

  // Time-based adaptation
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "day" | "evening" | "night">("day")
  const [useAdaptiveMode, setUseAdaptiveMode] = useState(false)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Current track
  const currentTrack = filteredTracks[currentTrackIndex] || tracks[0]

  // All available moods
  const allMoods = Array.from(new Set(tracks.flatMap((track) => track.moods)))

  // Initialize environment sounds
  useEffect(() => {
    // Create audio elements for environment sounds
    const rainAudio = new Audio("/placeholder.mp3") // Would be rain.mp3 in production
    rainAudio.loop = true
    rainAudio.volume = environmentSounds.rain.volume / 100

    const wavesAudio = new Audio("/placeholder.mp3") // Would be waves.mp3 in production
    wavesAudio.loop = true
    wavesAudio.volume = environmentSounds.waves.volume / 100

    const windAudio = new Audio("/placeholder.mp3") // Would be wind.mp3 in production
    windAudio.loop = true
    windAudio.volume = environmentSounds.wind.volume / 100

    // Update state with audio elements
    setEnvironmentSounds((prev) => ({
      rain: { ...prev.rain, audio: rainAudio },
      waves: { ...prev.waves, audio: wavesAudio },
      wind: { ...prev.wind, audio: windAudio },
    }))

    // Clean up on unmount
    return () => {
      rainAudio.pause()
      wavesAudio.pause()
      windAudio.pause()
    }
  }, [])

  // Handle environment sound toggling
  useEffect(() => {
    if (environmentSounds.rain.audio) {
      if (environmentSounds.rain.active) {
        environmentSounds.rain.audio.play().catch((e) => console.error("Error playing rain sound:", e))
      } else {
        environmentSounds.rain.audio.pause()
      }
      environmentSounds.rain.audio.volume = environmentSounds.rain.volume / 100
    }

    if (environmentSounds.waves.audio) {
      if (environmentSounds.waves.active) {
        environmentSounds.waves.audio.play().catch((e) => console.error("Error playing waves sound:", e))
      } else {
        environmentSounds.waves.audio.pause()
      }
      environmentSounds.waves.audio.volume = environmentSounds.waves.volume / 100
    }

    if (environmentSounds.wind.audio) {
      if (environmentSounds.wind.active) {
        environmentSounds.wind.audio.play().catch((e) => console.error("Error playing wind sound:", e))
      } else {
        environmentSounds.wind.audio.pause()
      }
      environmentSounds.wind.audio.volume = environmentSounds.wind.volume / 100
    }
  }, [environmentSounds])

  // Filter tracks based on selected moods
  useEffect(() => {
    if (selectedMoods.length === 0) {
      setFilteredTracks(tracks)
    } else {
      const filtered = tracks.filter((track) => selectedMoods.some((mood) => track.moods.includes(mood)))
      setFilteredTracks(filtered.length > 0 ? filtered : tracks)
    }
  }, [selectedMoods, tracks])

  // Detect time of day
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) {
        setTimeOfDay("morning")
      } else if (hour >= 12 && hour < 17) {
        setTimeOfDay("day")
      } else if (hour >= 17 && hour < 21) {
        setTimeOfDay("evening")
      } else {
        setTimeOfDay("night")
      }
    }

    updateTimeOfDay()
    const interval = setInterval(updateTimeOfDay, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  // Apply time-based adaptations
  useEffect(() => {
    if (!useAdaptiveMode) return

    // Adjust volume based on time of day
    if (timeOfDay === "morning") {
      setVolume((prev) => Math.min(prev, 70)) // Gentler in the morning
    } else if (timeOfDay === "night") {
      setVolume((prev) => Math.min(prev, 60)) // Quieter at night
    }

    // Filter tracks based on time of day
    if (timeOfDay === "morning") {
      setSelectedMoods(["energizing", "clarity"])
    } else if (timeOfDay === "day") {
      setSelectedMoods(["confidence", "power", "creative"])
    } else if (timeOfDay === "evening") {
      setSelectedMoods(["calm", "healing", "love"])
    } else if (timeOfDay === "night") {
      setSelectedMoods(["spiritual", "transcendent", "grounding"])
    }
  }, [timeOfDay, useAdaptiveMode])

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

  // Toggle environment sound
  const toggleEnvironmentSound = (sound: "rain" | "waves" | "wind") => {
    setEnvironmentSounds((prev) => ({
      ...prev,
      [sound]: {
        ...prev[sound],
        active: !prev[sound].active,
      },
    }))
  }

  // Update environment sound volume
  const updateEnvironmentVolume = (sound: "rain" | "waves" | "wind", value: number[]) => {
    setEnvironmentSounds((prev) => ({
      ...prev,
      [sound]: {
        ...prev[sound],
        volume: value[0],
      },
    }))
  }

  // Toggle adaptive mode
  const toggleAdaptiveMode = () => {
    setUseAdaptiveMode(!useAdaptiveMode)
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

  // Get time of day icon
  const getTimeOfDayIcon = () => {
    switch (timeOfDay) {
      case "morning":
        return <Sun className="h-5 w-5 text-yellow-400" />
      case "day":
        return <Sun className="h-5 w-5 text-yellow-500" />
      case "evening":
        return <Sun className="h-5 w-5 text-orange-500" />
      case "night":
        return <Moon className="h-5 w-5 text-indigo-400" />
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
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Mood-Based Player</h2>
            <p className="text-xs text-white/60">
              {selectedMoods.length > 0 ? `${selectedMoods.join(", ")}` : "Select moods to customize your experience"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-xs",
              useAdaptiveMode
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "bg-white/5 text-white/60 hover:bg-white/10",
            )}
            onClick={toggleAdaptiveMode}
          >
            {getTimeOfDayIcon()}
            <span>{timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Mode</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-6 border-r border-white/10">
          <div className="space-y-6">
            {/* Album Art & Player */}
            <div className="aspect-square relative rounded-lg overflow-hidden bg-black/40">
              <Image
                src={currentTrack.coverArt || "/placeholder.svg"}
                alt={currentTrack.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-end p-4">
                <h3 className="text-xl font-bold text-white text-center">{currentTrack.title}</h3>
                <p className="text-white/70">{currentTrack.artist}</p>
                {currentTrack.frequency && <p className="text-white/60 text-sm">{currentTrack.frequency} Hz</p>}
              </div>
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
                  <SkipBack className="h-5 w-5" />
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
                  <SkipForward className="h-5 w-5" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
              <div className="w-[88px]"></div> {/* Spacer to balance layout */}
            </div>

            <audio ref={audioRef} src={currentTrack.audioSrc} onLoadedMetadata={onLoadedMetadata} onEnded={nextTrack} />

            {/* Current Moods */}
            {currentTrack.moods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentTrack.moods.map((mood) => (
                  <div
                    key={mood}
                    className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-xs text-white/80"
                  >
                    {getMoodIcon(mood)}
                    <span>{mood}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1">
              <TabsTrigger value="moods" className="data-[state=active]:bg-purple-900/50">
                Mood Selection
              </TabsTrigger>
              <TabsTrigger value="environment" className="data-[state=active]:bg-purple-900/50">
                Environment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="moods" className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {allMoods.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => toggleMood(mood)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors",
                      selectedMoods.includes(mood)
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-white/5 text-white/60 hover:bg-white/10",
                    )}
                  >
                    {getMoodIcon(mood)}
                    <span>{mood}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-lg bg-black/40 p-4">
                <h3 className="font-medium text-white mb-3">Filtered Tracks</h3>
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
                  {filteredTracks.length > 0 ? (
                    filteredTracks.map((track, index) => (
                      <div
                        key={track.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer",
                          currentTrackIndex === index && filteredTracks === tracks
                            ? "bg-purple-900/30 border border-purple-500/30"
                            : "hover:bg-white/5",
                        )}
                        onClick={() => {
                          setCurrentTrackIndex(index)
                          setIsPlaying(true)
                        }}
                      >
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: getChakraColor(track.chakra) }}
                        >
                          {track.chakra && (
                            <span className="text-xs font-bold text-white">{track.chakra.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{track.title}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-white/60 truncate">{track.duration}</p>
                            {track.frequency && (
                              <>
                                <span className="text-white/40">•</span>
                                <p className="text-xs text-white/60 truncate">{track.frequency} Hz</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/60 text-center py-4">No tracks match the selected moods</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4">
                <h3 className="font-medium text-white mb-2">Mood Recommendations</h3>
                <p className="text-sm text-white/80">
                  {timeOfDay === "morning" &&
                    "Morning is perfect for energizing and clarity frequencies to start your day with focus and intention."}
                  {timeOfDay === "day" &&
                    "During the day, confidence and creative frequencies can enhance productivity and inspiration."}
                  {timeOfDay === "evening" &&
                    "Evening is ideal for calm and healing frequencies to wind down and process the day's experiences."}
                  {timeOfDay === "night" &&
                    "Night time resonates with spiritual and grounding frequencies to prepare for deep rest and dream states."}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="environment" className="mt-4 space-y-4">
              <div className="rounded-lg bg-black/40 p-4 space-y-4">
                <h3 className="font-medium text-white mb-3">Environment Sounds</h3>

                {/* Rain Sound Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CloudRain className="h-5 w-5 text-blue-400" />
                      <span className="text-white">Rain</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleEnvironmentSound("rain")}
                      className={cn(
                        "h-8 border-white/10 text-white hover:bg-white/5",
                        environmentSounds.rain.active && "bg-blue-500/20 border-blue-500/30 text-blue-300",
                      )}
                    >
                      {environmentSounds.rain.active ? "On" : "Off"}
                    </Button>
                  </div>
                  {environmentSounds.rain.active && (
                    <Slider
                      value={[environmentSounds.rain.volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => updateEnvironmentVolume("rain", value)}
                    />
                  )}
                </div>

                {/* Waves Sound Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Waves className="h-5 w-5 text-cyan-400" />
                      <span className="text-white">Ocean Waves</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleEnvironmentSound("waves")}
                      className={cn(
                        "h-8 border-white/10 text-white hover:bg-white/5",
                        environmentSounds.waves.active && "bg-cyan-500/20 border-cyan-500/30 text-cyan-300",
                      )}
                    >
                      {environmentSounds.waves.active ? "On" : "Off"}
                    </Button>
                  </div>
                  {environmentSounds.waves.active && (
                    <Slider
                      value={[environmentSounds.waves.volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => updateEnvironmentVolume("waves", value)}
                    />
                  )}
                </div>

                {/* Wind Sound Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="h-5 w-5 text-gray-400" />
                      <span className="text-white">Gentle Wind</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleEnvironmentSound("wind")}
                      className={cn(
                        "h-8 border-white/10 text-white hover:bg-white/5",
                        environmentSounds.wind.active && "bg-gray-500/20 border-gray-500/30 text-gray-300",
                      )}
                    >
                      {environmentSounds.wind.active ? "On" : "Off"}
                    </Button>
                  </div>
                  {environmentSounds.wind.active && (
                    <Slider
                      value={[environmentSounds.wind.volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => updateEnvironmentVolume("wind", value)}
                    />
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-black/40 p-4">
                <h3 className="font-medium text-white mb-3">Adaptive Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTimeOfDayIcon()}
                      <div>
                        <span className="text-white">
                          {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Mode
                        </span>
                        <p className="text-xs text-white/60">Adapts music to the time of day</p>
                      </div>
                    </div>
                    <Button
                      variant={useAdaptiveMode ? "default" : "outline"}
                      size="sm"
                      onClick={toggleAdaptiveMode}
                      className={cn(
                        useAdaptiveMode
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "border-white/10 text-white hover:bg-white/5",
                      )}
                    >
                      {useAdaptiveMode ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  {useAdaptiveMode && (
                    <div className="rounded-lg bg-purple-900/20 border border-purple-500/30 p-3">
                      <p className="text-sm text-white/80">
                        Adaptive mode is currently recommending {selectedMoods.join(", ")} frequencies for {timeOfDay}{" "}
                        time.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4">
                <h3 className="font-medium text-white mb-2">Environment Tips</h3>
                <p className="text-sm text-white/80">
                  Combining gentle rain with meditation frequencies can enhance focus, while ocean waves complement
                  grounding and stability frequencies. Experiment with different combinations to find your perfect sonic
                  environment.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

