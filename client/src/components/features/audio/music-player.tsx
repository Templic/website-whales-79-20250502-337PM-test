/**
 * music-player.tsx
 * 
 * Component Type: audio
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */
/**
 * music-player.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

const tracks = [
  {
    id: 1,
    title: "Cosmic Alignment",
    duration: "6:32",
    description: "Root Chakra • 396 Hz",
    color: "from-red-500 to-orange-500",
    audioSrc: "/audio/cosmic-alignment.mp3", // Placeholder path
  },
  {
    id: 2,
    title: "Ethereal Flow",
    duration: "7:14",
    description: "Sacral Chakra • 417 Hz",
    color: "from-orange-500 to-amber-500",
    audioSrc: "/audio/ethereal-flow.mp3", // Placeholder path
  },
  {
    id: 3,
    title: "Solar Plexus Activation",
    duration: "5:48",
    description: "Solar Plexus Chakra • 528 Hz",
    color: "from-yellow-500 to-lime-500",
    audioSrc: "/audio/solar-plexus.mp3", // Placeholder path
  },
  {
    id: 4,
    title: "Heart Resonance",
    duration: "8:21",
    description: "Heart Chakra • 639 Hz",
    color: "from-green-500 to-emerald-500",
    audioSrc: "/audio/heart-resonance.mp3", // Placeholder path
  },
  {
    id: 5,
    title: "Throat Gateway",
    duration: "6:05",
    description: "Throat Chakra • 741 Hz",
    color: "from-blue-500 to-sky-500",
    audioSrc: "/audio/throat-gateway.mp3", // Placeholder path
  },
  {
    id: 6,
    title: "Third Eye Vision",
    duration: "9:17",
    description: "Third Eye Chakra • 852 Hz",
    color: "from-indigo-500 to-violet-500",
    audioSrc: "/audio/third-eye.mp3", // Placeholder path
  },
  {
    id: 7,
    title: "Crown Connection",
    duration: "10:33",
    description: "Crown Chakra • 963 Hz",
    color: "from-purple-500 to-fuchsia-500",
    audioSrc: "/audio/crown-connection.mp3", // Placeholder path
  },
]

// Generate a silent audio buffer to use as a fallback
const generateSilentAudio = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const buffer = audioContext.createBuffer(2, audioContext.sampleRate * 10, audioContext.sampleRate)
  const source = audioContext.createBufferSource()
  source.buffer = buffer
  source.connect(audioContext.destination)

  // Convert to blob URL
  const myArrayBuffer = buffer.getChannelData(0)
  const audioBlob = new Blob([myArrayBuffer], { type: "audio/mp3" })
  return URL.createObjectURL(audioBlob)
}

export function MusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [silentAudioUrl, setSilentAudioUrl] = useState<string | null>(null)
  const [audioError, setAudioError] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const track = tracks[currentTrack]

  // Generate silent audio on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const silentUrl = generateSilentAudio()
        setSilentAudioUrl(silentUrl)
      } catch (error) {
        console.error("Failed to generate silent audio:", error)
      }

      // Cleanup function
      return () => {
        if (silentAudioUrl) {
          URL.revokeObjectURL(silentAudioUrl)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playback started successfully
              setAudioError(false)
              startTimer()
            })
            .catch((error) => {
              console.error("Playback failed:", error)
              setIsPlaying(false)
              setAudioError(true)
            })
        }
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
  }, [isPlaying, currentTrack])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
    }
  }, [isMuted])

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (audioRef.current && audioRef.current.ended) {
        nextTrack()
      } else if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
      }
    }, 1000)
  }

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setAudioError(false)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev === 0 ? tracks.length - 1 : prev - 1))
    setProgress(0)
    setCurrentTime(0)
    setIsPlaying(true)
    setAudioError(false)
  }

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev === tracks.length - 1 ? 0 : prev + 1))
    setProgress(0)
    setCurrentTime(0)
    setIsPlaying(true)
    setAudioError(false)
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
    setIsMuted(value[0] === 0)
  }

  // Get the audio source with fallback
  const getAudioSource = () => {
    if (audioError && silentAudioUrl) {
      return silentAudioUrl
    }
    return track.audioSrc || "/audio/silent.mp3"
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <audio
        ref={audioRef}
        src={getAudioSource()}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={nextTrack}
        onError={() => setAudioError(true)}
      />

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tracks.map((t, i) => (
            <div
              key={t.id}
              onClick={() => {
                setCurrentTrack(i)
                setIsPlaying(true)
                setProgress(0)
                setCurrentTime(0)
                setAudioError(false)
              }}
              className={cn(
                "group cursor-pointer rounded-xl p-3 transition-all hover:bg-white/5",
                i === currentTrack && "bg-white/10",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br",
                    t.color,
                  )}
                >
                  {i === currentTrack && isPlaying ? (
                    <Pause className="h-5 w-5 text-white" />
                  ) : (
                    <Play className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="space-y-1 text-left">
                  <h3 className="font-medium text-white group-hover:text-white/90">{t.title}</h3>
                  <p className="text-xs text-white/60">{t.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white/5 p-4 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">{track.title}</h3>
              <p className="text-sm text-white/60">{track.description}</p>
            </div>
            <div className="text-sm text-white/60">
              {formatTime(currentTime)} / {audioError ? track.duration : formatTime(duration || 0)}
            </div>
          </div>

          <div className="mb-4">
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={onProgressChange}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={onVolumeChange}
                className="w-24 cursor-pointer"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevTrack}
                className="text-white hover:bg-white/10 hover:text-white"
              >
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
              <Button
                variant="ghost"
                size="icon"
                onClick={nextTrack}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <SkipForward className="h-5 w-5" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
            <div className="w-[88px]"></div> {/* Spacer to balance the layout */}
          </div>

          {audioError && (
            <div className="mt-3 text-center">
              <p className="text-amber-400 text-sm">
                Using visualization mode. Connect headphones or speakers to experience the full audio.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



/**
 * Original MusicPlayer component merged from: client/src/components/common/music-player.tsx
 * Merge date: 2025-04-05
 */
function MusicPlayerOriginal() {
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [silentAudioUrl, setSilentAudioUrl] = useState<string | null>(null)
  const [audioError, setAudioError] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const track = tracks[currentTrack]

  // Generate silent audio on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const silentUrl = generateSilentAudio()
        setSilentAudioUrl(silentUrl)
      } catch (error) {
        console.error("Failed to generate silent audio:", error)
      }

      // Cleanup function
      return () => {
        if (silentAudioUrl) {
          URL.revokeObjectURL(silentAudioUrl)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playback started successfully
              setAudioError(false)
              startTimer()
            })
            .catch((error) => {
              console.error("Playback failed:", error)
              setIsPlaying(false)
              setAudioError(true)
            })
        }
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
  }, [isPlaying, currentTrack])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
    }
  }, [isMuted])

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (audioRef.current && audioRef.current.ended) {
        nextTrack()
      } else if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
      }
    }, 1000)
  }

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setAudioError(false)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev === 0 ? tracks.length - 1 : prev - 1))
    setProgress(0)
    setCurrentTime(0)
    setIsPlaying(true)
    setAudioError(false)
  }

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev === tracks.length - 1 ? 0 : prev + 1))
    setProgress(0)
    setCurrentTime(0)
    setIsPlaying(true)
    setAudioError(false)
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
    setIsMuted(value[0] === 0)
  }

  // Get the audio source with fallback
  const getAudioSource = () => {
    if (audioError && silentAudioUrl) {
      return silentAudioUrl
    }
    return track.audioSrc || "/audio/silent.mp3"
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <audio
        ref={audioRef}
        src={getAudioSource()}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={nextTrack}
        onError={() => setAudioError(true)}
      />

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tracks.map((t, i) => (
            <div
              key={t.id}
              onClick={() => {
                setCurrentTrack(i)
                setIsPlaying(true)
                setProgress(0)
                setCurrentTime(0)
                setAudioError(false)
              }}
              className={cn(
                "group cursor-pointer rounded-xl p-3 transition-all hover:bg-white/5",
                i === currentTrack && "bg-white/10",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br",
                    t.color,
                  )}
                >
                  {i === currentTrack && isPlaying ? (
                    <Pause className="h-5 w-5 text-white" />
                  ) : (
                    <Play className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="space-y-1 text-left">
                  <h3 className="font-medium text-white group-hover:text-white/90">{t.title}</h3>
                  <p className="text-xs text-white/60">{t.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white/5 p-4 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">{track.title}</h3>
              <p className="text-sm text-white/60">{track.description}</p>
            </div>
            <div className="text-sm text-white/60">
              {formatTime(currentTime)} / {audioError ? track.duration : formatTime(duration || 0)}
            </div>
          </div>

          <div className="mb-4">
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={onProgressChange}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={onVolumeChange}
                className="w-24 cursor-pointer"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevTrack}
                className="text-white hover:bg-white/10 hover:text-white"
              >
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
              <Button
                variant="ghost"
                size="icon"
                onClick={nextTrack}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <SkipForward className="h-5 w-5" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
            <div className="w-[88px]"></div> {/* Spacer to balance the layout */}
          </div>

          {audioError && (
            <div className="mt-3 text-center">
              <p className="text-amber-400 text-sm">
                Using visualization mode. Connect headphones or speakers to experience the full audio.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

