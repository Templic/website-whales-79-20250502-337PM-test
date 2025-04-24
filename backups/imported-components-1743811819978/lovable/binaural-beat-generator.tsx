/**
 * binaural-beat-generator.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Brain,
  Waves,
  Timer,
  Heart,
  Moon,
  Sun,
  Zap,
  Save,
  Download,
  Share2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BinauralBeatGeneratorProps {
  defaultLeftFreq?: number
  defaultRightFreq?: number
  defaultVolume?: number
  defaultWaveType?: "sine" | "square" | "triangle" | "sawtooth"
  defaultPreset?: string
}

export function BinauralBeatGenerator({
  defaultLeftFreq = 200,
  defaultRightFreq = 210,
  defaultVolume = 50,
  defaultWaveType = "sine",
  defaultPreset = "custom",
}: BinauralBeatGeneratorProps) {
  // Audio context and oscillators
  const audioContextRef = useRef<AudioContext | null>(null)
  const leftOscillatorRef = useRef<OscillatorNode | null>(null)
  const rightOscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // State for controls
  const [isPlaying, setIsPlaying] = useState(false)
  const [leftFreq, setLeftFreq] = useState(defaultLeftFreq)
  const [rightFreq, setRightFreq] = useState(defaultRightFreq)
  const [volume, setVolume] = useState(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [waveType, setWaveType] = useState<OscillatorType>(defaultWaveType)
  const [activePreset, setActivePreset] = useState(defaultPreset)
  const [timerActive, setTimerActive] = useState(false)
  const [timerDuration, setTimerDuration] = useState(15)
  const [timerRemaining, setTimerRemaining] = useState(15 * 60) // in seconds
  const [showPulseDetection, setShowPulseDetection] = useState(false)
  const [heartRate, setHeartRate] = useState<number | null>(null)
  const [isSyncingToHeartRate, setIsSyncingToHeartRate] = useState(false)
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [presetName, setPresetName] = useState("")

  // Video element for pulse detection
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pulseDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Timer interval
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Presets for different states
  const presets = [
    {
      name: "Meditation",
      leftFreq: 200,
      rightFreq: 204,
      waveType: "sine" as OscillatorType,
      description: "4 Hz Delta waves for deep meditation",
    },
    {
      name: "Focus",
      leftFreq: 200,
      rightFreq: 210,
      waveType: "sine" as OscillatorType,
      description: "10 Hz Alpha waves for concentration and focus",
    },
    {
      name: "Relaxation",
      leftFreq: 200,
      rightFreq: 208,
      waveType: "sine" as OscillatorType,
      description: "8 Hz Alpha waves for relaxation",
    },
    {
      name: "Sleep",
      leftFreq: 200,
      rightFreq: 202,
      waveType: "sine" as OscillatorType,
      description: "2 Hz Delta waves to help with sleep",
    },
    {
      name: "Creativity",
      leftFreq: 200,
      rightFreq: 207,
      waveType: "sine" as OscillatorType,
      description: "7 Hz Theta waves to enhance creativity",
    },
    {
      name: "Energy",
      leftFreq: 200,
      rightFreq: 215,
      waveType: "sine" as OscillatorType,
      description: "15 Hz Beta waves for energy and alertness",
    },
  ]

  // Initialize audio context
  useEffect(() => {
    // Create audio context on first play to avoid autoplay restrictions
    const setupAudio = () => {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioContext()
      }
    }

    // Clean up on unmount
    return () => {
      stopOscillators()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      startOscillators()
    } else {
      stopOscillators()
    }
  }, [isPlaying])

  // Update oscillator frequencies when they change
  useEffect(() => {
    if (leftOscillatorRef.current) {
      leftOscillatorRef.current.frequency.setValueAtTime(leftFreq, audioContextRef.current?.currentTime || 0)
    }
    if (rightOscillatorRef.current) {
      rightOscillatorRef.current.frequency.setValueAtTime(rightFreq, audioContextRef.current?.currentTime || 0)
    }
  }, [leftFreq, rightFreq])

  // Update oscillator wave type when it changes
  useEffect(() => {
    if (isPlaying) {
      // Need to restart oscillators to change wave type
      stopOscillators()
      startOscillators()
    }
  }, [waveType])

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume / 100, audioContextRef.current?.currentTime || 0)
    }
  }, [volume, isMuted])

  // Handle timer
  useEffect(() => {
    if (timerActive && isPlaying) {
      setTimerRemaining(timerDuration * 60)

      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            setIsPlaying(false)
            setTimerActive(false)
            clearInterval(timerIntervalRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [timerActive, timerDuration, isPlaying])

  // Handle heart rate sync
  useEffect(() => {
    if (isSyncingToHeartRate && heartRate) {
      // Calculate frequencies based on heart rate
      // We'll use a simple formula: base frequency + heart rate / 10
      const baseFreq = 200
      const beatFreq = heartRate / 10

      setLeftFreq(baseFreq)
      setRightFreq(baseFreq + beatFreq)
    }
  }, [isSyncingToHeartRate, heartRate])

  // Start pulse detection
  useEffect(() => {
    if (showPulseDetection) {
      startPulseDetection()
    } else {
      stopPulseDetection()
    }

    return () => {
      stopPulseDetection()
    }
  }, [showPulseDetection])

  // Start oscillators
  const startOscillators = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContext()
    }

    // Create gain node if it doesn't exist
    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)
    }

    // Set volume
    gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume / 100, audioContextRef.current.currentTime)

    // Create and start left oscillator
    leftOscillatorRef.current = audioContextRef.current.createOscillator()
    leftOscillatorRef.current.type = waveType
    leftOscillatorRef.current.frequency.setValueAtTime(leftFreq, audioContextRef.current.currentTime)

    // Create stereo panner for left ear
    const leftPanner = audioContextRef.current.createStereoPanner()
    leftPanner.pan.setValueAtTime(-1, audioContextRef.current.currentTime) // Full left

    leftOscillatorRef.current.connect(leftPanner)
    leftPanner.connect(gainNodeRef.current)
    leftOscillatorRef.current.start()

    // Create and start right oscillator
    rightOscillatorRef.current = audioContextRef.current.createOscillator()
    rightOscillatorRef.current.type = waveType
    rightOscillatorRef.current.frequency.setValueAtTime(rightFreq, audioContextRef.current.currentTime)

    // Create stereo panner for right ear
    const rightPanner = audioContextRef.current.createStereoPanner()
    rightPanner.pan.setValueAtTime(1, audioContextRef.current.currentTime) // Full right

    rightOscillatorRef.current.connect(rightPanner)
    rightPanner.connect(gainNodeRef.current)
    rightOscillatorRef.current.start()
  }

  // Stop oscillators
  const stopOscillators = () => {
    if (leftOscillatorRef.current) {
      leftOscillatorRef.current.stop()
      leftOscillatorRef.current.disconnect()
      leftOscillatorRef.current = null
    }

    if (rightOscillatorRef.current) {
      rightOscillatorRef.current.stop()
      rightOscillatorRef.current.disconnect()
      rightOscillatorRef.current = null
    }
  }

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Apply preset
  const applyPreset = (preset: string) => {
    const selectedPreset = presets.find((p) => p.name.toLowerCase() === preset.toLowerCase())

    if (selectedPreset) {
      setLeftFreq(selectedPreset.leftFreq)
      setRightFreq(selectedPreset.rightFreq)
      setWaveType(selectedPreset.waveType)
      setActivePreset(preset)
    } else {
      setActivePreset("custom")
    }
  }

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Start pulse detection
  const startPulseDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      videoRef.current.srcObject = stream

      // Wait for video to be ready
      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = resolve
        }
      })

      if (videoRef.current) {
        videoRef.current.play()
      }

      // Start pulse detection algorithm
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) return

      // Array to store red values for analysis
      const redValues: number[] = []
      const maxSamples = 100

      pulseDetectionIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !ctx) return

        // Draw video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

        // Get image data from center of frame
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const radius = Math.min(canvas.width, canvas.height) / 10

        const imageData = ctx.getImageData(centerX - radius, centerY - radius, radius * 2, radius * 2)

        // Calculate average red value (blood flow indicator)
        let totalRed = 0
        for (let i = 0; i < imageData.data.length; i += 4) {
          totalRed += imageData.data[i] // Red channel
        }

        const avgRed = totalRed / (imageData.data.length / 4)

        // Add to array
        redValues.push(avgRed)

        // Keep array at max size
        if (redValues.length > maxSamples) {
          redValues.shift()
        }

        // Need at least 50 samples to calculate
        if (redValues.length >= 50) {
          // Simple peak detection
          let peaks = 0
          let lastValue = redValues[0]
          let rising = false

          for (let i = 1; i < redValues.length; i++) {
            if (redValues[i] > lastValue && !rising) {
              rising = true
            } else if (redValues[i] < lastValue && rising) {
              peaks++
              rising = false
            }

            lastValue = redValues[i]
          }

          // Calculate heart rate (peaks per minute)
          // Assuming 30 fps, 50 samples = 1.67 seconds
          const timeSpan = redValues.length / 30
          const bpm = (peaks / timeSpan) * 60

          // Only update if reasonable value (40-180 bpm)
          if (bpm >= 40 && bpm <= 180) {
            setHeartRate(Math.round(bpm))
          }
        }

        // Draw visualization
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw pulse wave
        ctx.beginPath()
        ctx.strokeStyle = "#9333ea"
        ctx.lineWidth = 2

        for (let i = 0; i < redValues.length; i++) {
          const x = (i / maxSamples) * canvas.width
          const y = canvas.height - (((redValues[i] - 100) / 50) * canvas.height) / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()

        // Draw heart rate
        if (heartRate) {
          ctx.fillStyle = "#ffffff"
          ctx.font = "24px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(`${heartRate} BPM`, canvas.width / 2, 30)
        }
      }, 33) // ~30fps
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }

  // Stop pulse detection
  const stopPulseDetection = () => {
    if (pulseDetectionIntervalRef.current) {
      clearInterval(pulseDetectionIntervalRef.current)
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  // Save current settings as preset
  const savePreset = () => {
    // In a real app, this would save to a database or localStorage
    alert(`Preset "${presetName}" saved with: Left: ${leftFreq}Hz, Right: ${rightFreq}Hz, Wave: ${waveType}`)
    setShowSavePreset(false)
    setPresetName("")
  }

  // Calculate beat frequency
  const beatFrequency = Math.abs(rightFreq - leftFreq)

  // Get brain wave category
  const getBrainWaveCategory = (freq: number) => {
    if (freq <= 4) return { name: "Delta", color: "#3b82f6", description: "Deep sleep, healing" }
    if (freq <= 8) return { name: "Theta", color: "#8b5cf6", description: "Meditation, creativity" }
    if (freq <= 12) return { name: "Alpha", color: "#10b981", description: "Relaxation, calmness" }
    if (freq <= 30) return { name: "Beta", color: "#f59e0b", description: "Focus, alertness" }
    return { name: "Gamma", color: "#ef4444", description: "Higher mental activity" }
  }

  const brainWave = getBrainWaveCategory(beatFrequency)

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Binaural Beat Generator</h2>
            <p className="text-xs text-white/60">
              {beatFrequency.toFixed(1)} Hz • {brainWave.name} Waves
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavePreset(true)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Preset
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-6 border-r border-white/10">
          <div className="space-y-6">
            {/* Visualization */}
            <div
              className="relative h-40 rounded-lg bg-black/40 overflow-hidden"
              style={{
                background: `linear-gradient(to right, rgba(0,0,0,0.8), ${brainWave.color}40, rgba(0,0,0,0.8))`,
              }}
            >
              {showPulseDetection ? (
                <>
                  <video ref={videoRef} className="hidden" width="320" height="240" muted playsInline />
                  <canvas ref={canvasRef} width="320" height="160" className="w-full h-full" />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div
                      className={cn("absolute -inset-4 rounded-full opacity-20", isPlaying ? "animate-ping" : "")}
                      style={{ backgroundColor: brainWave.color }}
                    ></div>
                    <div
                      className="relative h-20 w-20 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: brainWave.color }}
                    >
                      <Waves className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Wave type indicator */}
              <div className="absolute bottom-2 right-2 bg-black/60 rounded-full px-2 py-1 text-xs text-white">
                {waveType.charAt(0).toUpperCase() + waveType.slice(1)} Wave
              </div>

              {/* Brain wave indicator */}
              <div
                className="absolute top-2 left-2 rounded-full px-2 py-1 text-xs text-white"
                style={{ backgroundColor: brainWave.color }}
              >
                {brainWave.name} • {brainWave.description}
              </div>
            </div>

            {/* Frequency Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Left Ear Frequency</Label>
                  <span className="text-white font-medium">{leftFreq} Hz</span>
                </div>
                <Slider
                  value={[leftFreq]}
                  min={20}
                  max={500}
                  step={1}
                  onValueChange={(value) => setLeftFreq(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Right Ear Frequency</Label>
                  <span className="text-white font-medium">{rightFreq} Hz</span>
                </div>
                <Slider
                  value={[rightFreq]}
                  min={20}
                  max={500}
                  step={1}
                  onValueChange={(value) => setRightFreq(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Beat Frequency</Label>
                  <span className="text-white font-medium">{beatFrequency.toFixed(1)} Hz</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((beatFrequency / 30) * 100, 100)}%`,
                      backgroundColor: brainWave.color,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Wave Type Selection */}
            <div className="space-y-2">
              <Label className="text-white">Wave Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["sine", "square", "triangle", "sawtooth"] as OscillatorType[]).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className={cn(
                      "border-white/10 text-white hover:bg-white/5",
                      waveType === type && "bg-purple-500/20 border-purple-500",
                    )}
                    onClick={() => setWaveType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
              <Button
                onClick={togglePlay}
                className={cn(
                  "w-20",
                  isPlaying
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700",
                )}
              >
                {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isPlaying ? "Stop" : "Play"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
                </Button>
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => setVolume(value[0])}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/20 p-1">
              <TabsTrigger value="presets" className="data-[state=active]:bg-purple-900/50">
                Presets
              </TabsTrigger>
              <TabsTrigger value="timer" className="data-[state=active]:bg-purple-900/50">
                Timer
              </TabsTrigger>
              <TabsTrigger value="heartrate" className="data-[state=active]:bg-purple-900/50">
                Heart Rate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className={cn(
                      "h-auto flex flex-col items-start p-3 border-white/10 text-white hover:bg-white/5",
                      activePreset === preset.name && "bg-purple-500/20 border-purple-500",
                    )}
                    onClick={() => applyPreset(preset.name)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                        {preset.name === "Meditation" && <Moon className="h-3 w-3 text-purple-400" />}
                        {preset.name === "Focus" && <Zap className="h-3 w-3 text-purple-400" />}
                        {preset.name === "Relaxation" && <Waves className="h-3 w-3 text-purple-400" />}
                        {preset.name === "Sleep" && <Moon className="h-3 w-3 text-purple-400" />}
                        {preset.name === "Creativity" && <Brain className="h-3 w-3 text-purple-400" />}
                        {preset.name === "Energy" && <Sun className="h-3 w-3 text-purple-400" />}
                      </div>
                      <span className="font-medium">{preset.name}</span>
                    </div>
                    <p className="text-xs text-left text-white/60 mt-1">{preset.description}</p>
                    <div className="text-xs text-left text-white/60 mt-1">
                      {Math.abs(preset.rightFreq - preset.leftFreq)} Hz Difference
                    </div>
                  </Button>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/5"
                  onClick={() => {
                    // In a real app, this would generate a file
                    alert("Downloading current settings...")
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Settings
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/5"
                  onClick={() => {
                    // In a real app, this would share a link
                    alert("Sharing current configuration...")
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Configuration
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="timer" className="mt-4 space-y-4">
              <div className="rounded-lg bg-black/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Session Timer</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={timerActive} onCheckedChange={setTimerActive} />
                    <span className="text-sm text-white/60">{timerActive ? "Enabled" : "Disabled"}</span>
                  </div>
                </div>

                {timerActive && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Duration (minutes)</span>
                        <span className="text-white font-medium">{timerDuration} min</span>
                      </div>
                      <Slider
                        value={[timerDuration]}
                        min={1}
                        max={60}
                        step={1}
                        onValueChange={(value) => setTimerDuration(value[0])}
                      />
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="h-24 w-24 rounded-full bg-black/40 border-4 border-purple-500 flex items-center justify-center">
                        <div className="text-center">
                          <Timer className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                          <span className="text-lg font-bold text-white">{formatTime(timerRemaining)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-lg bg-black/40 p-4 space-y-4">
                <h3 className="font-medium text-white">Quick Presets</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15, 20, 30, 45].map((mins) => (
                    <Button
                      key={mins}
                      variant="outline"
                      className="border-white/10 text-white hover:bg-white/5"
                      onClick={() => {
                        setTimerDuration(mins)
                        setTimerActive(true)
                        setTimerRemaining(mins * 60)
                      }}
                    >
                      {mins} min
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="heartrate" className="mt-4 space-y-4">
              <div className="rounded-lg bg-black/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Heart Rate Detection</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={showPulseDetection} onCheckedChange={setShowPulseDetection} />
                    <span className="text-sm text-white/60">{showPulseDetection ? "Active" : "Inactive"}</span>
                  </div>
                </div>

                {showPulseDetection ? (
                  <div className="space-y-4">
                    <p className="text-sm text-white/80">
                      Position your face in good lighting and remain still. The camera will detect subtle color changes
                      in your skin to estimate your heart rate.
                    </p>

                    {heartRate ? (
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <Heart className="h-8 w-8 text-red-500 mx-auto mb-1 animate-pulse" />
                          <span className="text-2xl font-bold text-white">{heartRate} BPM</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-white/60">Detecting heart rate...</div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label className="text-white">Sync to Heart Rate</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isSyncingToHeartRate}
                          onCheckedChange={setIsSyncingToHeartRate}
                          disabled={!heartRate}
                        />
                        <span className="text-sm text-white/60">{isSyncingToHeartRate ? "Enabled" : "Disabled"}</span>
                      </div>
                    </div>

                    {isSyncingToHeartRate && heartRate && (
                      <div className="rounded-lg bg-black/40 p-3">
                        <p className="text-sm text-white/80">
                          Binaural beat frequency is now synced to your heart rate: {heartRate / 10} Hz
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Heart className="h-12 w-12 text-white/20 mx-auto mb-2" />
                    <p className="text-white/60">Enable heart rate detection to sync binaural beats with your pulse</p>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-black/40 p-4">
                <h3 className="font-medium text-white mb-3">How It Works</h3>
                <p className="text-sm text-white/80">
                  The heart rate detection uses your device's camera to analyze subtle color changes in your skin that
                  occur with each heartbeat. This technique, called Photoplethysmography (PPG), is the same principle
                  used in many fitness trackers.
                </p>
                <p className="text-sm text-white/80 mt-2">
                  When enabled, the binaural beat frequency will adjust to complement your heart rate, creating a
                  personalized meditation experience.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Save Preset Dialog */}
      {showSavePreset && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-purple-500/20 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Save Custom Preset</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name" className="text-white">
                  Preset Name
                </Label>
                <Input
                  id="preset-name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="My Custom Preset"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
                />
              </div>

              <div className="rounded-lg bg-black/40 p-3">
                <h4 className="font-medium text-white mb-2">Current Settings</h4>
                <div className="space-y-1 text-sm text-white/80">
                  <div className="flex justify-between">
                    <span>Left Frequency:</span>
                    <span>{leftFreq} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Right Frequency:</span>
                    <span>{rightFreq} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beat Frequency:</span>
                    <span>{beatFrequency.toFixed(1)} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wave Type:</span>
                    <span>{waveType}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                  onClick={() => setShowSavePreset(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={savePreset}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                  disabled={!presetName.trim()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Preset
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

