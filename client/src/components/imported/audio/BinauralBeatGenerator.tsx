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

      <div className="p-6">
        <div className="space-y-6">
          {/* Visualization */}
          <div
            className="relative h-40 rounded-lg bg-black/40 overflow-hidden"
            style={{
              background: `linear-gradient(to right, rgba(0,0,0,0.8), ${brainWave.color}40, rgba(0,0,0,0.8))`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-white">{beatFrequency.toFixed(1)}</div>
                <div className="text-sm text-white/70">Hz difference</div>
                <div className="mt-1 text-md font-medium" style={{ color: brainWave.color }}>
                  {brainWave.name} Waves
                </div>
                <div className="text-xs text-white/60">{brainWave.description}</div>
              </div>
            </div>

            {/* Animated waves */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-30">
              <svg
                viewBox="0 0 1440 320"
                className="absolute bottom-0 left-0 w-full"
                style={{ transform: "translateY(30%)" }}
              >
                <path
                  fill={brainWave.color}
                  fillOpacity="0.5"
                  d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ></path>
              </svg>
              <svg viewBox="0 0 1440 320" className="absolute bottom-0 left-0 w-full animate-pulse">
                <path
                  fill={brainWave.color}
                  fillOpacity="0.3"
                  d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,266.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ></path>
              </svg>
            </div>
          </div>

          {/* Main Controls */}
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Controls</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Frequency */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white">Left Ear Frequency</label>
                    <span className="text-white font-medium">{leftFreq} Hz</span>
                  </div>
                  <Slider
                    value={[leftFreq]}
                    min={20}
                    max={1000}
                    step={1}
                    onValueChange={(value) => setLeftFreq(value[0])}
                    className="mb-6"
                  />
                </div>

                {/* Right Frequency */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white">Right Ear Frequency</label>
                    <span className="text-white font-medium">{rightFreq} Hz</span>
                  </div>
                  <Slider
                    value={[rightFreq]}
                    min={20}
                    max={1000}
                    step={1}
                    onValueChange={(value) => setRightFreq(value[0])}
                    className="mb-6"
                  />
                </div>
              </div>

              {/* Wave Type */}
              <div className="flex flex-wrap gap-2">
                {["sine", "square", "triangle", "sawtooth"].map((type) => (
                  <Button
                    key={type}
                    variant={waveType === type ? "default" : "outline"}
                    onClick={() => setWaveType(type as OscillatorType)}
                    className={cn(
                      "flex-1 min-w-[100px]",
                      waveType === type
                        ? "bg-purple-500 hover:bg-purple-600 text-white"
                        : "border-white/10 text-white hover:bg-white/5"
                    )}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Volume & Play Controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className={cn(isMuted && "text-red-500")}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolume(value[0])}
                    className="w-32"
                  />
                </div>
                <Button
                  variant={isPlaying ? "destructive" : "default"}
                  onClick={togglePlay}
                  className={isPlaying ? "bg-red-500 hover:bg-red-600" : ""}
                  size="lg"
                >
                  {isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                  {isPlaying ? "Stop" : "Play"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {/* Timer Controls */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="timer-switch"
                    checked={timerActive}
                    onCheckedChange={(checked) => setTimerActive(checked)}
                  />
                  <Label htmlFor="timer-switch" className="text-white">
                    Session Timer
                  </Label>
                  {timerActive && isPlaying && (
                    <span className="ml-auto text-white font-medium">{formatTime(timerRemaining)}</span>
                  )}
                </div>

                {timerActive && (
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 30].map((mins) => (
                      <Button
                        key={mins}
                        variant={timerDuration === mins ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimerDuration(mins)}
                        className={cn(
                          timerDuration === mins
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "border-white/10 text-white hover:bg-white/5"
                        )}
                      >
                        {mins} min
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Heart Rate Detection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pulse-switch"
                    checked={showPulseDetection}
                    onCheckedChange={(checked) => setShowPulseDetection(checked)}
                  />
                  <Label htmlFor="pulse-switch" className="text-white">
                    Heart Rate Detection
                  </Label>
                  {heartRate && (
                    <span className="ml-auto text-white font-medium flex items-center">
                      <Heart className="w-4 h-4 text-red-500 mr-1" />
                      {heartRate} BPM
                    </span>
                  )}
                </div>

                {showPulseDetection && (
                  <div>
                    <div className="rounded-lg overflow-hidden bg-black/40 aspect-video relative">
                      <canvas
                        ref={canvasRef}
                        width={320}
                        height={240}
                        className="absolute inset-0 w-full h-full"
                      />
                      <video
                        ref={videoRef}
                        width={320}
                        height={240}
                        className="opacity-0 absolute"
                        playsInline
                        muted
                      />
                    </div>

                    {heartRate && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="sync-hr-switch"
                            checked={isSyncingToHeartRate}
                            onCheckedChange={(checked) => setIsSyncingToHeartRate(checked)}
                          />
                          <Label htmlFor="sync-hr-switch" className="text-white">
                            Sync to Heart Rate
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="presets" className="space-y-4">
              {/* Presets */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant={activePreset === preset.name ? "default" : "outline"}
                    onClick={() => applyPreset(preset.name)}
                    className={cn(
                      "h-auto py-3 justify-start flex-col items-start text-left",
                      activePreset === preset.name
                        ? "bg-purple-500 hover:bg-purple-600 text-white"
                        : "border-white/10 text-white hover:bg-white/5"
                    )}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs opacity-80 mt-1">{preset.description}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {Math.abs(preset.rightFreq - preset.leftFreq)} Hz difference
                    </div>
                  </Button>
                ))}
              </div>

              {/* Save Preset Form */}
              {showSavePreset && (
                <div className="mt-4 rounded-lg border border-white/10 p-4 bg-black/20">
                  <h3 className="text-lg font-medium text-white mb-3">Save Current Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="preset-name" className="text-white">
                        Preset Name
                      </Label>
                      <Input
                        id="preset-name"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className="bg-black/30 border-white/10 text-white"
                        placeholder="My Custom Preset"
                      />
                    </div>
                    <div className="text-sm text-white/60">
                      <p>Current Settings:</p>
                      <p>
                        Left: {leftFreq}Hz, Right: {rightFreq}Hz ({beatFrequency.toFixed(1)}Hz difference)
                      </p>
                      <p>
                        Wave: {waveType}, Category: {brainWave.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={savePreset} className="bg-purple-500 hover:bg-purple-600 text-white">
                        Save Preset
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowSavePreset(false)}
                        className="border-white/10 text-white hover:bg-white/5"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Brain Wave Info */}
          <div className="rounded-lg border border-white/10 p-4 bg-black/20">
            <h3 className="text-lg font-medium text-white mb-2">Brain Wave Information</h3>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { name: "Delta", range: "0.5-4Hz", color: "#3b82f6", desc: "Deep sleep" },
                { name: "Theta", range: "4-8Hz", color: "#8b5cf6", desc: "Meditation" },
                { name: "Alpha", range: "8-12Hz", color: "#10b981", desc: "Relaxation" },
                { name: "Beta", range: "12-30Hz", color: "#f59e0b", desc: "Focus" },
                { name: "Gamma", range: "30-100Hz", color: "#ef4444", desc: "Insight" },
              ].map((wave) => (
                <div
                  key={wave.name}
                  className={cn(
                    "rounded p-2 text-white text-sm",
                    brainWave.name === wave.name ? "bg-black/30 border border-white/20" : ""
                  )}
                  style={{
                    boxShadow: brainWave.name === wave.name ? `0 0 10px ${wave.color}` : "none",
                  }}
                >
                  <div className="font-medium" style={{ color: wave.color }}>
                    {wave.name}
                  </div>
                  <div className="text-xs text-white/70">{wave.range}</div>
                  <div className="text-xs text-white/70">{wave.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}