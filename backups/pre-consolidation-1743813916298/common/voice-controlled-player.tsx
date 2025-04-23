/**
 * voice-controlled-player.tsx
 * 
 * Component Type: common
 * Migrated from imported components.
 */
/**
 * voice-controlled-player.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  HelpCircle,
  Info,
  List,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Track {
  id: number
  title: string
  artist: string
  duration: string
  audioSrc: string
  coverArt: string
}

interface VoiceControlledPlayerProps {
  tracks?: Track[]
  defaultVolume?: number
}

export function VoiceControlledPlayer({
  tracks = [
    {
      id: 1,
      title: "Root Chakra Alignment",
      artist: "ASTRA",
      duration: "6:32",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 2,
      title: "Sacral Awakening",
      artist: "ASTRA",
      duration: "7:14",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 3,
      title: "Solar Plexus Activation",
      artist: "ASTRA",
      duration: "5:48",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 4,
      title: "Heart Resonance",
      artist: "ASTRA",
      duration: "8:21",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 5,
      title: "Throat Gateway",
      artist: "ASTRA",
      duration: "6:05",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
    },
  ],
  defaultVolume = 80,
}: VoiceControlledPlayerProps) {
  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Voice control state
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [lastCommand, setLastCommand] = useState("")
  const [showCommands, setShowCommands] = useState(false)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Current track
  const currentTrack = tracks[currentTrackIndex]

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event$2 => {
        const result = event.results[event.results.length - 1]
        const transcript = result[0].transcript.toLowerCase().trim()

        setTranscript(transcript)

        // Only process commands if final result
        if (result.isFinal) {
          processVoiceCommand(transcript)
        }
      }

      recognitionRef.current.onend = () => {
        // Restart if still supposed to be listening
        if (isListening) {
          recognitionRef.current.start()
        } else {
          setIsListening(false)
        }
      }

      recognitionRef.current.onerror = (event$2 => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
      }
    } else {
      console.warn("Speech recognition not supported in this browser")
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Toggle voice recognition
  useEffect(() => {
    if (voiceEnabled) {
      startListening()
    } else {
      stopListening()
    }
  }, [voiceEnabled])

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

  // Voice control functions
  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error("Error starting speech recognition", error)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const processVoiceCommand = (command: string) => {
    // Simple command processing
    if (command.includes("play") || command.includes("start")) {
      setIsPlaying(true)
      setLastCommand("Playing music")
    } else if (command.includes("pause") || command.includes("stop")) {
      setIsPlaying(false)
      setLastCommand("Pausing music")
    } else if (command.includes("next") || command.includes("skip")) {
      nextTrack()
      setLastCommand("Playing next track")
    } else if (command.includes("previous") || command.includes("back")) {
      prevTrack()
      setLastCommand("Playing previous track")
    } else if (command.includes("volume up") || command.includes("louder")) {
      setVolume((prev) => Math.min(prev + 10, 100))
      setIsMuted(false)
      setLastCommand("Increasing volume")
    } else if (command.includes("volume down") || command.includes("quieter")) {
      setVolume((prev) => Math.max(prev - 10, 0))
      setLastCommand("Decreasing volume")
    } else if (command.includes("mute")) {
      setIsMuted(true)
      setLastCommand("Muting audio")
    } else if (command.includes("unmute")) {
      setIsMuted(false)
      setLastCommand("Unmuting audio")
    }
    // Play specific track by number
    else if (command.match(/play track (\d+)/)) {
      const match = command.match(/play track (\d+)/)
      if (match && match[1]) {
        const trackNum = Number.parseInt(match[1])
        if (trackNum > 0 && trackNum <= tracks.length) {
          setCurrentTrackIndex(trackNum - 1)
          setIsPlaying(true)
          setLastCommand(`Playing track ${trackNum}`)
        }
      }
    }
    // Play specific track by name
    else if (command.includes("play") && tracks.some((track) => command.includes(track.title.toLowerCase()))) {
      const trackToPlay = tracks.find((track) => command.includes(track.title.toLowerCase()))
      if (trackToPlay) {
        const index = tracks.findIndex((t) => t.id === trackToPlay.id)
        setCurrentTrackIndex(index)
        setIsPlaying(true)
        setLastCommand(`Playing ${trackToPlay.title}`)
      }
    } else {
      // No recognized command
      setLastCommand("Command not recognized")
    }
  }

  // Voice commands list
  const voiceCommands = [
    { command: "Play", description: "Start playback" },
    { command: "Pause / Stop", description: "Pause playback" },
    { command: "Next / Skip", description: "Play next track" },
    { command: "Previous / Back", description: "Play previous track" },
    { command: "Volume up / Louder", description: "Increase volume" },
    { command: "Volume down / Quieter", description: "Decrease volume" },
    { command: "Mute", description: "Mute audio" },
    { command: "Unmute", description: "Unmute audio" },
    { command: "Play track [number]", description: "Play specific track by number" },
    { command: "Play [track name]", description: "Play specific track by name" },
  ]

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Mic className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Voice-Controlled Player</h2>
            <p className="text-xs text-white/60">Control music with your voice</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCommands(!showCommands)}
            className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Show Commands</span>
          </Button>
          <div className="flex items-center gap-2">
            <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
            <span className="text-sm text-white/60">{voiceEnabled ? "Voice On" : "Voice Off"}</span>
          </div>
        </div>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-6">
        {/* Player Section */}
        <div className="space-y-6">
          <div className="aspect-square relative rounded-lg overflow-hidden bg-black/40">
            <img
              src={currentTrack.coverArt || "/placeholder.svg"}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-end p-4">
              <h3 className="text-xl font-bold text-white text-center">{currentTrack.title}</h3>
              <p className="text-white/70">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">{formatTime(currentTime)}</span>
              <span className="text-white/60">{currentTrack.duration}</span>
            </div>
            <Slider value={[progress]} min={0} max={100} step={0.1} onValueChange={onProgressChange} />
          </div>

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
        </div>

        {/* Voice Control Section */}
        <div className="space-y-6">
          {/* Voice Status */}
          <div className="rounded-lg bg-black/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">Voice Control</h3>
              <div
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  isListening ? "bg-green-500/20 text-green-500" : "bg-white/10 text-white/60",
                )}
              >
                {isListening ? "Listening..." : "Inactive"}
              </div>
            </div>

            {voiceEnabled && (
              <div className="space-y-3">
                <div className="relative h-16 rounded-lg bg-black/40 flex items-center justify-center overflow-hidden">
                  {isListening ? (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="w-1 bg-purple-500 rounded-full animate-pulse"
                              style={{
                                height: `${20 + Math.random() * 30}px`,
                                animationDelay: `${i * 0.1}s`,
                              }}
                            ></div>
                          ))}
                        </div>
                      </div>
                      <p className="text-white/80 text-sm absolute bottom-2 w-full text-center truncate px-4">
                        {transcript || "Listening..."}
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center">
                      <MicOff className="h-6 w-6 text-white/40 mr-2" />
                      <span className="text-white/60">Voice control is disabled</span>
                    </div>
                  )}
                </div>

                {lastCommand && (
                  <div className="rounded-lg bg-purple-900/20 border border-purple-500/30 p-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-purple-400" />
                      <p className="text-sm text-white/80">
                        Last command: <span className="text-white font-medium">{lastCommand}</span>
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full border-white/10 text-white hover:bg-white/5"
                  onClick={() => setShowCommands(true)}
                >
                  <List className="mr-2 h-4 w-4" />
                  View Available Commands
                </Button>
              </div>
            )}

            {!voiceEnabled && (
              <div className="text-center py-6">
                <Mic className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 mb-4">Enable voice control to manage playback with your voice</p>
                <Button
                  onClick={() => setVoiceEnabled(true)}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Enable Voice Control
                </Button>
              </div>
            )}
          </div>

          {/* Track List */}
          <div className="rounded-lg bg-black/40 p-4 space-y-3">
            <h3 className="font-medium text-white mb-2">Available Tracks</h3>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer",
                    currentTrackIndex === index ? "bg-purple-900/30 border border-purple-500/30" : "hover:bg-white/5",
                  )}
                  onClick={() => {
                    setCurrentTrackIndex(index)
                    setIsPlaying(true)
                  }}
                >
                  <div className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={track.coverArt || "/placeholder.svg"}
                      alt={track.title}
                      className="h-full w-full object-cover"
                    />
                    {currentTrackIndex === index && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="h-4 w-4 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{track.title}</p>
                    <p className="text-xs text-white/60 truncate">
                      {track.artist} • {track.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Voice Commands Modal */}
      {showCommands && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-purple-500/20 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Voice Commands</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCommands(false)}
                className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {voiceCommands.map((cmd, index) => (
                <div key={index} className="rounded-lg bg-black/40 p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-purple-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <Mic className="h-3 w-3 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{cmd.command}</p>
                      <p className="text-sm text-white/70">{cmd.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                Speak clearly and use natural commands. For best results, enable voice control in a quiet environment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

