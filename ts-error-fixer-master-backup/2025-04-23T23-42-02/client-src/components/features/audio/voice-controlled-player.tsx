import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Label } from "@/components/ui/label"
import { CircularProgress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * voice-controlled-player.tsx
 * 
 * Component Type: audio
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
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

      recognitionRef.current.onresult = (event) => {
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

      recognitionRef.current.onerror = (event) => {
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
      } catch (error: unknown) {
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



/**
 * Original VoiceControlledPlayer component merged from: client/src/components/audio/VoiceControlledPlayer.tsx
 * Merge date: 2025-04-05
 */
function VoiceControlledPlayerOriginal({
  audioTracks = [
    { name: "Meditation Alpha", url: "/audio/meditation-alpha.mp3" },
    { name: "Cosmic Resonance", url: "/audio/cosmic-resonance.mp3" },
    { name: "Healing Frequency", url: "/audio/healing-frequency.mp3" },
    { name: "Theta Waves", url: "/audio/theta-waves.mp3" },
  ],
  defaultVolume = 80,
}: VoiceControlledPlayerProps) {
  // State for audio control
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<number>(0)
  const [volume, setVolume] = useState<number>(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [recognitionActive, setRecognitionActive] = useState(false)
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState<string | null>(null)
  const [commandConfidence, setCommandConfidence] = useState(0)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const animationRef = useRef<number>(0)
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(audioTracks[currentTrack].url)
    audioRef.current.volume = volume / 100

    // Set up event listeners
    const onLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration)
      }
    }

    const onEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      
      // Optionally auto-play next track
      if (currentTrack < audioTracks.length - 1) {
        setCurrentTrack(currentTrack + 1)
        setTimeout(() => {
          setIsPlaying(true)
        }, 500)
      }
    }

    audioRef.current.addEventListener("loadedmetadata", onLoadedMetadata)
    audioRef.current.addEventListener("ended", onEnded)

    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("loadedmetadata", onLoadedMetadata)
        audioRef.current.removeEventListener("ended", onEnded)
        audioRef.current.pause()
      }
      cancelAnimationFrame(animationRef.current)
    }
  }, [currentTrack, audioTracks])

  // Initialize speech recognition
  useEffect(() => {
    try {
      // Check for browser support
      // TypeScript doesn't know about SpeechRecognition API yet, so we need to use type assertion
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition || 
        null
      
      if (!SpeechRecognition) {
        setShowError(true)
        setErrorMessage("Speech recognition is not supported in your browser.")
        return
      }

      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      // Set up event listeners
      recognitionRef.current.onstart = () => {
        setRecognitionActive(true)
      }

      recognitionRef.current.onend = () => {
        setRecognitionActive(false)
        // Restart if still listening
        if (isListening) {
          try {
            recognitionRef.current.start()
          } catch (error: unknown) {
            console.error("Error restarting speech recognition:", error)
          }
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        if (event.error === "not-allowed") {
          setShowError(true)
          setErrorMessage("Microphone access denied. Please allow microphone access to use voice controls.")
          setIsListening(false)
        }
      }

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("")
          .toLowerCase()
          .trim()

        // Only process if we have a final result
        if (event.results[event.results.length - 1].isFinal) {
          processVoiceCommand(transcript, event.results[0][0].confidence)
        }
      }
    } catch (error: unknown) {
      console.error("Error initializing speech recognition:", error)
      setShowError(true)
      setErrorMessage("Failed to initialize voice controls. Your browser might not support this feature.")
    }
  }, [isListening])

  // Handle play/pause effect
  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      // AudioContext needs user interaction to start in most browsers
      // Use a Promise to handle the play() operation since it returns a promise
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error)
        setIsPlaying(false)
        
        // Check if this is an autoplay restriction
        if (error.name === 'NotAllowedError') {
          setShowError(true)
          setErrorMessage("Autoplay blocked by browser. Please click the play button to start audio.")
        } else {
          setShowError(true)
          setErrorMessage("Error playing audio. The file might be missing or in an unsupported format.")
        }
      })
      updateProgress()
    } else {
      audioRef.current.pause()
      cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying])

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume / 100
  }, [volume, isMuted])

  // Handle track changes
  useEffect(() => {
    if (!audioRef.current) return

    // Save current playing state
    const wasPlaying = !audioRef.current.paused

    // Update source
    audioRef.current.src = audioTracks[currentTrack].url
    audioRef.current.load()

    // Restore playing state
    if (wasPlaying) {
      audioRef.current.play().catch(console.error)
    }

    setProgress(0)
  }, [currentTrack, audioTracks])

  // Clean up voice command feedback
  useEffect(() => {
    if (voiceCommandFeedback) {
      commandTimeoutRef.current = setTimeout(() => {
        setVoiceCommandFeedback(null)
        setCommandConfidence(0)
      },
      3000)
    }

    return () => {
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current)
      }
    }
  }, [voiceCommandFeedback])

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Start listening
  const startListening = () => {
    setIsListening(true)
    try {
      recognitionRef.current?.start()
    } catch (error: unknown) {
      console.error("Error starting speech recognition:", error)
    }
  }

  // Stop listening
  const stopListening = () => {
    setIsListening(false)
    try {
      recognitionRef.current?.stop()
    } catch (error: unknown) {
      console.error("Error stopping speech recognition:", error)
    }
  }

  // Update progress
  const updateProgress = () => {
    if (!audioRef.current) return
    
    setProgress(audioRef.current.currentTime)
    animationRef.current = requestAnimationFrame(updateProgress)
  }

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Change track
  const changeTrack = (index: number) => {
    if (index >= 0 && index < audioTracks.length) {
      setCurrentTrack(index)
    }
  }

  // Next track
  const nextTrack = () => {
    changeTrack((currentTrack + 1) % audioTracks.length)
  }

  // Previous track
  const prevTrack = () => {
    changeTrack(currentTrack > 0 ? currentTrack - 1 : audioTracks.length - 1)
  }

  // Process voice commands
  const processVoiceCommand = (command: string, confidence: number) => {
    console.log(`Voice command: "${command}" (confidence: ${(confidence * 100).toFixed(0)}%)`)
    setCommandConfidence(confidence * 100)

    // Play/pause commands
    if (command.includes("play") || command.includes("start")) {
      setIsPlaying(true)
      setVoiceCommandFeedback("Playing music")
      return
    }

    if (command.includes("pause") || command.includes("stop")) {
      setIsPlaying(false)
      setVoiceCommandFeedback("Pausing music")
      return
    }

    // Volume commands
    if (command.includes("volume up") || command.includes("louder")) {
      setVolume(prev => Math.min(prev + 10, 100))
      setVoiceCommandFeedback("Increasing volume")
      return
    }

    if (command.includes("volume down") || command.includes("quieter")) {
      setVolume(prev => Math.max(prev - 10, 0))
      setVoiceCommandFeedback("Decreasing volume")
      return
    }

    if (command.includes("mute")) {
      setIsMuted(true)
      setVoiceCommandFeedback("Muting audio")
      return
    }

    if (command.includes("unmute")) {
      setIsMuted(false)
      setVoiceCommandFeedback("Unmuting audio")
      return
    }

    // Track navigation commands
    if (command.includes("next") || command.includes("skip")) {
      nextTrack()
      setVoiceCommandFeedback("Playing next track")
      return
    }

    if (command.includes("previous") || command.includes("back")) {
      prevTrack()
      setVoiceCommandFeedback("Playing previous track")
      return
    }

    // Track selection by name
    for (let i = 0; i < audioTracks.length; i++) {
      const trackName = audioTracks[i].name.toLowerCase()
      if (command.includes(trackName)) {
        changeTrack(i)
        setVoiceCommandFeedback(`Playing "${audioTracks[i].name}"`)
        return
      }
    }

    // If no command matched
    setVoiceCommandFeedback("Command not recognized")
  }

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Headphones className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Voice Controlled Player</h2>
            <p className="text-xs text-white/60">
              Use voice commands to control playback
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Button
            size="sm"
            variant={isListening ? "default" : "outline"}
            onClick={toggleListening}
            className={cn(
              "gap-2 transition-all",
              isListening
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "border-white/10 text-white hover:bg-white/5"
            )}
          >
            {isListening ? (
              <>
                <Mic className="h-4 w-4 animate-pulse" />
                <span>Listening</span>
              </>
            ) : (
              <>
                <MicOff className="h-4 w-4" />
                <span>Enable Voice</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Error messages */}
          {showError && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Voice command feedback */}
          {voiceCommandFeedback && (
            <div className="relative bg-purple-500/10 rounded-lg p-4 flex items-center">
              <div className="flex-1 pr-16">
                <p className="text-white font-medium">{voiceCommandFeedback}</p>
                <p className="text-xs text-white/60">
                  Try commands like "play", "pause", "next track", "volume up"
                </p>
              </div>
              {commandConfidence > 0 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <CircularProgress 
                    value={commandConfidence} 
                    size="sm" 
                    indicatorColor={
                      commandConfidence > 80 
                        ? "bg-green-500" 
                        : commandConfidence > 50 
                          ? "bg-yellow-500" 
                          : "bg-red-500"
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Currently playing */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Music className="h-8 w-8 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-white truncate">{audioTracks[currentTrack].name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-white/60">{formatTime(progress)}</span>
                  <div className="flex-1">
                    <Slider
                      value={[progress]}
                      max={duration}
                      step={0.1}
                      className="cursor-pointer"
                      onValueChange={(value) => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = value[0]
                          setProgress(value[0])
                        }
                      }}
                    />
                  </div>
                  <span className="text-xs text-white/60">{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-white/10 text-white hover:bg-white/5"
                onClick={prevTrack}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </Button>

              <Button
                variant="default"
                size="icon"
                className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-white/10 text-white hover:bg-white/5"
                onClick={nextTrack}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
                </svg>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/5"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                className="w-24"
                onValueChange={(value) => setVolume(value[0])}
              />
            </div>
          </div>

          {/* Track list */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-white">Available Tracks</h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="autoNext" className="text-xs text-white/60">Voice control</Label>
                <Switch
                  id="autoNext"
                  checked={isListening}
                  onCheckedChange={toggleListening}
                />
              </div>
            </div>
            <div className="space-y-1">
              {audioTracks.map((track, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md transition-colors",
                    currentTrack === index
                      ? "bg-purple-500/20 text-white"
                      : "text-white/70 hover:bg-white/5"
                  )}
                  onClick={() => changeTrack(index)}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-xs opacity-60">{index + 1}</span>
                    <span>{track.name}</span>
                    {currentTrack === index && isPlaying && (
                      <span className="ml-2 flex space-x-1">
                        <span className="w-1 h-3 bg-purple-400 animate-pulse-fast rounded-full" />
                        <span className="w-1 h-3 bg-purple-400 animate-pulse-fast animation-delay-200 rounded-full" />
                        <span className="w-1 h-3 bg-purple-400 animate-pulse-fast animation-delay-500 rounded-full" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Command help */}
          <div className="text-xs text-white/60 bg-white/5 rounded-lg p-3">
            <h4 className="font-medium mb-1 flex items-center gap-1">
              <Settings className="h-3 w-3" /> 
              Available Voice Commands
            </h4>
            <ul className="list-disc list-inside space-y-0.5">
              <li>"Play" or "Start" - Begins playback</li>
              <li>"Pause" or "Stop" - Pauses playback</li>
              <li>"Next" or "Skip" - Plays the next track</li>
              <li>"Previous" or "Back" - Plays the previous track</li>
              <li>"Volume up/down" - Adjusts volume</li>
              <li>"Mute/Unmute" - Toggles audio</li>
              <li>Say track name to play it directly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Original VoiceControlledPlayer component merged from: client/src/components/common/voice-controlled-player.tsx
 * Merge date: 2025-04-05
 */
function VoiceControlledPlayerOriginal({
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

      recognitionRef.current.onresult = (event) => {
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

      recognitionRef.current.onerror = (event) => {
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
      } catch (error: unknown) {
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



/**
 * Original VoiceControlledPlayer component merged from: client/src/components/features/audio/VoiceControlledPlayer.tsx
 * Merge date: 2025-04-05
 */
function VoiceControlledPlayerOriginal({
  audioTracks = [
    { 
      id: 1,
      name: "Meditation Alpha", 
      url: "/audio/meditation-alpha.mp3",
      chakraAssociation: "thirdEye",
      frequency: "8-13 Hz",
      description: "Alpha waves for deep relaxation and meditation"
    },
    { 
      id: 2,
      name: "Cosmic Resonance", 
      url: "/audio/cosmic-resonance.mp3",
      chakraAssociation: "crown",
      frequency: "7-8 Hz",
      description: "Connect with cosmic consciousness" 
    },
    { 
      id: 3,
      name: "Healing Frequency", 
      url: "/audio/healing-frequency.mp3",
      chakraAssociation: "heart",
      frequency: "528 Hz",
      description: "Heart chakra healing and DNA repair frequency"
    },
    { 
      id: 4,
      name: "Theta Waves", 
      url: "/audio/theta-waves.mp3",
      chakraAssociation: "thirdEye",
      frequency: "4-7 Hz",
      description: "Deep meditation and dream state enhancement"
    },
  ],
  defaultVolume = 80,
  enableVisualizer = true,
}: VoiceControlledPlayerProps) {
  // State for audio control
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<number>(0)
  const [volume, setVolume] = useState<number>(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [recognitionActive, setRecognitionActive] = useState(false)
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState<string | null>(null)
  const [commandConfidence, setCommandConfidence] = useState(0)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showVisualizer, setShowVisualizer] = useState(enableVisualizer)
  const [visualizerIntensity, setVisualizerIntensity] = useState(50)
  const [expandedTrackInfo, setExpandedTrackInfo] = useState(false)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const animationRef = useRef<number>(0)
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(audioTracks[currentTrack].url)
    audioRef.current.volume = volume / 100

    // Set up event listeners
    const onLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration)
      }
    }

    const onEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      
      // Optionally auto-play next track
      if (currentTrack < audioTracks.length - 1) {
        setCurrentTrack(currentTrack + 1)
        setTimeout(() => {
          setIsPlaying(true)
        }, 500)
      }
    }

    audioRef.current.addEventListener("loadedmetadata", onLoadedMetadata)
    audioRef.current.addEventListener("ended", onEnded)

    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("loadedmetadata", onLoadedMetadata)
        audioRef.current.removeEventListener("ended", onEnded)
        audioRef.current.pause()
      }
      cancelAnimationFrame(animationRef.current)
    }
  }, [currentTrack, audioTracks])

  // Initialize speech recognition
  useEffect(() => {
    try {
      // Check for browser support
      // TypeScript doesn't know about SpeechRecognition API yet, so we need to use type assertion
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition || 
        null
      
      if (!SpeechRecognition) {
        setShowError(true)
        setErrorMessage("Speech recognition is not supported in your browser.")
        return
      }

      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      // Set up event listeners
      recognitionRef.current.onstart = () => {
        setRecognitionActive(true)
      }

      recognitionRef.current.onend = () => {
        setRecognitionActive(false)
        // Restart if still listening
        if (isListening) {
          try {
            recognitionRef.current.start()
          } catch (error: unknown) {
            console.error("Error restarting speech recognition:", error)
          }
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        if (event.error === "not-allowed") {
          setShowError(true)
          setErrorMessage("Microphone access denied. Please allow microphone access to use voice controls.")
          setIsListening(false)
        }
      }

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("")
          .toLowerCase()
          .trim()

        // Only process if we have a final result
        if (event.results[event.results.length - 1].isFinal) {
          processEnhancedVoiceCommand(transcript, event.results[0][0].confidence)
        }
      }
    } catch (error: unknown) {
      console.error("Error initializing speech recognition:", error)
      setShowError(true)
      setErrorMessage("Failed to initialize voice controls. Your browser might not support this feature.")
    }
  }, [isListening])

  // Initialize audio visualizer
  useEffect(() => {
    if (!showVisualizer || !audioRef.current) return;

    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Create analyzer node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Connect audio element to analyzer
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Start visualization if playing
      if (isPlaying && canvasRef.current) {
        drawVisualizer();
      }
    } catch (error: unknown) {
      console.error("Error initializing audio visualizer:", error);
      // Fall back to normal audio playback without visualization
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      setShowVisualizer(false);
    }

    return () => {
      // Clean up audio context and connections
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [showVisualizer]);

  // Draw audio visualizer
  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isPlaying) return;
      
      requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Get chakra color
      const chakra = audioTracks[currentTrack].chakraAssociation || 'cosmic';
      const chakraColor = CHAKRA_COLORS[chakra];
      
      // Calculate bar width and spacing
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      
      // Intensity factor (0.5 - 2.0)
      const intensityFactor = visualizerIntensity / 50;
      
      // Draw bars
      for (let i = 0; i < bufferLength; i++) {
        // Apply intensity factor to bar height
        const barHeight = (dataArray[i] / 255) * height * intensityFactor;
        
        // Gradient based on frequency and chakra color
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, chakraColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        // Add glowing effect
        ctx.beginPath();
        ctx.arc(x + barWidth / 2, height - barHeight, barWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${parseInt(chakraColor.slice(1, 3), 16)}, ${parseInt(chakraColor.slice(3, 5), 16)}, ${parseInt(chakraColor.slice(5, 7), 16)}, 0.1)`;
        ctx.fill();
        
        x += barWidth + 1;
      }
    };
    
    draw();
  };

  // Handle play/pause effect
  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      // AudioContext needs user interaction to start in most browsers
      // Use a Promise to handle the play() operation since it returns a promise
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error)
        setIsPlaying(false)
        
        // Check if this is an autoplay restriction
        if (error.name === 'NotAllowedError') {
          setShowError(true)
          setErrorMessage("Autoplay blocked by browser. Please click the play button to start audio.")
        } else {
          setShowError(true)
          setErrorMessage("Error playing audio. The file might be missing or in an unsupported format.")
        }
      })
      updateProgress()
      
      // Start visualizer if enabled
      if (showVisualizer && canvasRef.current) {
        drawVisualizer();
      }
    } else {
      audioRef.current.pause()
      cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, showVisualizer])

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume / 100
  }, [volume, isMuted])

  // Handle track changes
  useEffect(() => {
    if (!audioRef.current) return

    // Save current playing state
    const wasPlaying = !audioRef.current.paused

    // Update source
    audioRef.current.src = audioTracks[currentTrack].url
    audioRef.current.load()

    // Restore playing state
    if (wasPlaying) {
      audioRef.current.play().catch(console.error)
    }

    setProgress(0)
  }, [currentTrack, audioTracks])

  // Clean up voice command feedback
  useEffect(() => {
    if (voiceCommandFeedback) {
      commandTimeoutRef.current = setTimeout(() => {
        setVoiceCommandFeedback(null)
        setCommandConfidence(0)
      },
      3000)
    }

    return () => {
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current)
      }
    }
  }, [voiceCommandFeedback])

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Start listening
  const startListening = () => {
    setIsListening(true)
    try {
      recognitionRef.current?.start()
    } catch (error: unknown) {
      console.error("Error starting speech recognition:", error)
    }
  }

  // Stop listening
  const stopListening = () => {
    setIsListening(false)
    try {
      recognitionRef.current?.stop()
    } catch (error: unknown) {
      console.error("Error stopping speech recognition:", error)
    }
  }

  // Update progress
  const updateProgress = () => {
    if (!audioRef.current) return
    
    setProgress(audioRef.current.currentTime)
    animationRef.current = requestAnimationFrame(updateProgress)
  }

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Change track
  const changeTrack = (index: number) => {
    if (index >= 0 && index < audioTracks.length) {
      setCurrentTrack(index)
    }
  }

  // Next track
  const nextTrack = () => {
    changeTrack((currentTrack + 1) % audioTracks.length)
  }

  // Previous track
  const prevTrack = () => {
    changeTrack(currentTrack > 0 ? currentTrack - 1 : audioTracks.length - 1)
  }



  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Toggle track info
  const toggleTrackInfo = () => {
    setExpandedTrackInfo(!expandedTrackInfo);
  };

  // Toggle visualizer
  const toggleVisualizer = () => {
    setShowVisualizer(!showVisualizer);
  };

  // Enhanced voice command processing
  const processEnhancedVoiceCommand = (command: string, confidence: number) => {
    console.log(`Voice command: "${command}" (confidence: ${(confidence * 100).toFixed(0)}%)`)
    setCommandConfidence(confidence * 100)

    // Visualizer commands
    if (command.includes("show visualizer") || command.includes("enable visualizer")) {
      setShowVisualizer(true);
      setVoiceCommandFeedback("Visualizer enabled");
      return;
    }
    
    if (command.includes("hide visualizer") || command.includes("disable visualizer")) {
      setShowVisualizer(false);
      setVoiceCommandFeedback("Visualizer disabled");
      return;
    }
    
    // Track info commands
    if (command.includes("show info") || command.includes("show details")) {
      setExpandedTrackInfo(true);
      setVoiceCommandFeedback("Showing track details");
      return;
    }
    
    if (command.includes("hide info") || command.includes("hide details")) {
      setExpandedTrackInfo(false);
      setVoiceCommandFeedback("Hiding track details");
      return;
    }
    
    // Play/pause commands
    if (command.includes("play") || command.includes("start")) {
      setIsPlaying(true)
      setVoiceCommandFeedback("Playing music")
      return
    }

    if (command.includes("pause") || command.includes("stop")) {
      setIsPlaying(false)
      setVoiceCommandFeedback("Pausing music")
      return
    }

    // Volume commands
    if (command.includes("volume up") || command.includes("louder")) {
      setVolume(prev => Math.min(prev + 10, 100))
      setVoiceCommandFeedback("Increasing volume")
      return
    }

    if (command.includes("volume down") || command.includes("quieter")) {
      setVolume(prev => Math.max(prev - 10, 0))
      setVoiceCommandFeedback("Decreasing volume")
      return
    }

    if (command.includes("mute")) {
      setIsMuted(true)
      setVoiceCommandFeedback("Muting audio")
      return
    }

    if (command.includes("unmute")) {
      setIsMuted(false)
      setVoiceCommandFeedback("Unmuting audio")
      return
    }

    // Track navigation commands
    if (command.includes("next") || command.includes("skip")) {
      nextTrack()
      setVoiceCommandFeedback("Playing next track")
      return
    }

    if (command.includes("previous") || command.includes("back")) {
      prevTrack()
      setVoiceCommandFeedback("Playing previous track")
      return
    }

    // Track selection by name
    for (let i = 0; i < audioTracks.length; i++) {
      const trackName = audioTracks[i].name.toLowerCase()
      if (command.includes(trackName)) {
        changeTrack(i)
        setVoiceCommandFeedback(`Playing "${audioTracks[i].name}"`)
        return
      }
    }

    // If no command matched
    setVoiceCommandFeedback("Command not recognized")
  };

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Headphones className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Voice Controlled Player</h2>
            <p className="text-xs text-white/60">
              Use voice commands to control playback
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleVisualizer}
                  className="border-white/10 text-white hover:bg-white/5 w-8 h-8 p-0"
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Visualizer</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="sm"
            variant={isListening ? "default" : "outline"}
            onClick={toggleListening}
            className={cn(
              "gap-2 transition-all",
              isListening
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "border-white/10 text-white hover:bg-white/5"
            )}
          >
            {isListening ? (
              <>
                <Mic className="h-4 w-4 animate-pulse" />
                <span>Listening</span>
              </>
            ) : (
              <>
                <MicOff className="h-4 w-4" />
                <span>Enable Voice</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Error messages */}
          {showError && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/30 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Voice command feedback */}
          {voiceCommandFeedback && (
            <div className="relative bg-purple-500/10 rounded-lg p-4 flex items-center">
              <div className="flex-1 pr-16">
                <p className="text-white font-medium">{voiceCommandFeedback}</p>
                <p className="text-xs text-white/60">
                  Try commands like "play", "pause", "next track", "volume up"
                </p>
              </div>
              {commandConfidence > 0 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <CircularProgress 
                    value={commandConfidence} 
                    size="sm" 
                    indicatorColor={
                      commandConfidence > 80 
                        ? "bg-green-500" 
                        : commandConfidence > 50 
                          ? "bg-yellow-500" 
                          : "bg-red-500"
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* Currently playing */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div 
                className={cn(
                  "rounded flex-shrink-0 overflow-hidden transition-all",
                  expandedTrackInfo ? "h-24 w-24" : "h-16 w-16"
                )}
                style={{ 
                  backgroundColor: audioTracks[currentTrack].chakraAssociation 
                    ? `${CHAKRA_COLORS[audioTracks[currentTrack].chakraAssociation]}20` 
                    : "rgba(139, 92, 246, 0.2)"
                }}
              >
                {audioTracks[currentTrack].coverArt ? (
                  <img 
                    src={audioTracks[currentTrack].coverArt} 
                    alt={audioTracks[currentTrack].name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Music className="h-8 w-8 text-purple-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white truncate">{audioTracks[currentTrack].name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-white/60 hover:bg-white/5"
                    onClick={toggleTrackInfo}
                  >
                    {expandedTrackInfo ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                  </Button>
                </div>
                
                {expandedTrackInfo && audioTracks[currentTrack].frequency && (
                  <div className="mt-1 text-xs text-white/60 bg-black/20 p-2 rounded-md">
                    <div className="flex flex-wrap gap-y-1">
                      {audioTracks[currentTrack].frequency && (
                        <div className="mr-3">
                          <span className="opacity-70">Frequency:</span>{" "}
                          <span className="text-white">{audioTracks[currentTrack].frequency}</span>
                        </div>
                      )}
                      {audioTracks[currentTrack].chakraAssociation && (
                        <div className="mr-3">
                          <span className="opacity-70">Chakra:</span>{" "}
                          <span 
                            className="text-white capitalize"
                            style={{ 
                              color: CHAKRA_COLORS[audioTracks[currentTrack].chakraAssociation] 
                            }}
                          >
                            {audioTracks[currentTrack].chakraAssociation}
                          </span>
                        </div>
                      )}
                    </div>
                    {audioTracks[currentTrack].description && (
                      <p className="mt-1 opacity-90">{audioTracks[currentTrack].description}</p>
                    )}
                  </div>
                )}
                
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-white/60">{formatTime(progress)}</span>
                  <div className="flex-1">
                    <Slider
                      value={[progress]}
                      max={duration}
                      step={0.1}
                      className="cursor-pointer"
                      onValueChange={(value) => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = value[0]
                          setProgress(value[0])
                        }
                      }}
                    />
                  </div>
                  <span className="text-xs text-white/60">{formatTime(duration)}</span>
                </div>
              </div>
            </div>
            
            {/* Audio Visualizer */}
            {showVisualizer && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-white/70">Audio Visualizer</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">Intensity</span>
                    <Slider
                      value={[visualizerIntensity]}
                      min={25}
                      max={100}
                      step={5}
                      className="w-24"
                      onValueChange={(value) => setVisualizerIntensity(value[0])}
                    />
                  </div>
                </div>
                <div 
                  className="relative h-24 rounded-md overflow-hidden bg-black/30 border border-white/5"
                  style={{ 
                    boxShadow: audioTracks[currentTrack].chakraAssociation 
                      ? `0 0 20px ${CHAKRA_COLORS[audioTracks[currentTrack].chakraAssociation]}40 inset` 
                      : "0 0 20px rgba(139, 92, 246, 0.2) inset"
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    width={500}
                    height={100}
                  />
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <p className="text-white/70 text-sm">Play audio to visualize</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Playback controls */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-white/10 text-white hover:bg-white/5"
                onClick={prevTrack}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </Button>

              <Button
                variant="default"
                size="icon"
                className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-white/10 text-white hover:bg-white/5"
                onClick={nextTrack}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
                </svg>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/5"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                className="w-24"
                onValueChange={(value) => setVolume(value[0])}
              />
            </div>
          </div>

          {/* Track list */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-white">Available Tracks</h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="autoNext" className="text-xs text-white/60">Voice control</Label>
                <Switch
                  id="autoNext"
                  checked={isListening}
                  onCheckedChange={toggleListening}
                />
              </div>
            </div>
            <div className="space-y-1">
              {audioTracks.map((track, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md transition-colors",
                    currentTrack === index
                      ? "bg-purple-500/20 text-white"
                      : "text-white/70 hover:bg-white/5"
                  )}
                  onClick={() => changeTrack(index)}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-xs opacity-60">{index + 1}</span>
                    <span>{track.name}</span>
                    {currentTrack === index && isPlaying && (
                      <span className="ml-2 flex space-x-1">
                        <span className="w-1 h-3 bg-purple-400 animate-pulse-fast rounded-full" />
                        <span className="w-1 h-3 bg-purple-400 animate-pulse-fast animation-delay-200 rounded-full" />
                        <span className="w-1 h-3 bg-purple-400 animate-pulse-fast animation-delay-500 rounded-full" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Command help */}
          <div className="text-xs text-white/60 bg-white/5 rounded-lg p-3">
            <h4 className="font-medium mb-1 flex items-center gap-1">
              <Settings className="h-3 w-3" /> 
              Available Voice Commands
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <div>
                <h5 className="font-medium mb-1 mt-2 text-purple-400">Playback Controls</h5>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>"Play" or "Start" - Begins playback</li>
                  <li>"Pause" or "Stop" - Pauses playback</li>
                  <li>"Next" or "Skip" - Plays the next track</li>
                  <li>"Previous" or "Back" - Plays the previous track</li>
                  <li>Say track name to play it directly</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-1 mt-2 text-purple-400">Audio & Display Controls</h5>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>"Volume up/down" - Adjusts volume</li>
                  <li>"Mute/Unmute" - Toggles audio</li>
                  <li>"Show/Hide visualizer" - Controls visualizer</li>
                  <li>"Show/Hide info" - Displays track details</li>
                </ul>
              </div>
            </div>
            <div className="mt-2 bg-black/20 p-2 rounded-md">
              <p className="font-medium text-purple-300">Pro Tips:</p>
              <p>For best results, speak clearly and use the exact commands listed above. The voice recognition works best in a quiet environment with minimal background noise.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}