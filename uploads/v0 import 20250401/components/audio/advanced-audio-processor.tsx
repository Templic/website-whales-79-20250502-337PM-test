"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  Pause,
  Download,
  Share2,
  AudioWaveformIcon as Waveform,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
} from "lucide-react"

interface AdvancedAudioProcessorProps {
  defaultFrequency?: number
  defaultVolume?: number
  defaultWaveType?: OscillatorType
  enableRecording?: boolean
  enableSharing?: boolean
  enableEffects?: boolean
}

export function AdvancedAudioProcessor({
  defaultFrequency = 432,
  defaultVolume = 50,
  defaultWaveType = "sine",
  enableRecording = true,
  enableSharing = true,
  enableEffects = true,
}: AdvancedAudioProcessorProps) {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false)
  const [frequency, setFrequency] = useState(defaultFrequency)
  const [volume, setVolume] = useState(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [waveType, setWaveType] = useState<OscillatorType>(defaultWaveType)
  const [activeTab, setActiveTab] = useState("controls")

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)

  // Effects state
  const [reverbAmount, setReverbAmount] = useState(20)
  const [delayAmount, setDelayAmount] = useState(0)
  const [filterFrequency, setFilterFrequency] = useState(2000)

  // Visualization state
  const [visualizationType, setVisualizationType] = useState<"waveform" | "frequency">("waveform")

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const convolverRef = useRef<ConvolverNode | null>(null)
  const delayNodeRef = useRef<DelayNode | null>(null)
  const filterNodeRef = useRef<BiquadFilterNode | null>(null)

  // Initialize audio context and nodes
  useEffect(() => {
    if (typeof window === "undefined") return

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    audioContextRef.current = new AudioContext()

    // Create analyzer for visualization
    analyserRef.current = audioContextRef.current.createAnalyser()
    analyserRef.current.fftSize = 2048

    // Create gain node for volume control
    gainNodeRef.current = audioContextRef.current.createGain()
    gainNodeRef.current.gain.value = volume / 100

    // Create effects nodes if enabled
    if (enableEffects) {
      // Create convolver for reverb
      convolverRef.current = audioContextRef.current.createConvolver()

      // Create delay node
      delayNodeRef.current = audioContextRef.current.createDelay(5.0)
      delayNodeRef.current.delayTime.value = delayAmount / 1000

      // Create filter node
      filterNodeRef.current = audioContextRef.current.createBiquadFilter()
      filterNodeRef.current.type = "lowpass"
      filterNodeRef.current.frequency.value = filterFrequency

      // Generate impulse response for reverb
      generateImpulseResponse()

      // Connect effects chain
      gainNodeRef.current.connect(delayNodeRef.current)
      delayNodeRef.current.connect(filterNodeRef.current)
      filterNodeRef.current.connect(convolverRef.current)
      convolverRef.current.connect(analyserRef.current)
    } else {
      // Connect without effects
      gainNodeRef.current.connect(analyserRef.current)
    }

    // Connect analyzer to output
    analyserRef.current.connect(audioContextRef.current.destination)

    // Start visualization
    startVisualization()

    return () => {
      // Clean up
      stopOscillator()
      stopRecording()
      stopVisualization()

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [enableEffects])

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Update effects parameters
  useEffect(() => {
    if (!enableEffects) return

    if (delayNodeRef.current) {
      delayNodeRef.current.delayTime.value = delayAmount / 1000
    }

    if (filterNodeRef.current) {
      filterNodeRef.current.frequency.value = filterFrequency
    }

    if (reverbAmount > 0 && convolverRef.current) {
      generateImpulseResponse()
    }
  }, [reverbAmount, delayAmount, filterFrequency, enableEffects])

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      startOscillator()
    } else {
      stopOscillator()
    }
  }, [isPlaying, waveType, frequency])

  // Generate impulse response for reverb
  const generateImpulseResponse = useCallback(() => {
    if (!audioContextRef.current || !convolverRef.current) return

    const sampleRate = audioContextRef.current.sampleRate
    const length = sampleRate * (reverbAmount / 100) * 2
    const impulse = audioContextRef.current.createBuffer(2, length, sampleRate)
    const leftChannel = impulse.getChannelData(0)
    const rightChannel = impulse.getChannelData(1)

    // Generate impulse response
    for (let i = 0; i < length; i++) {
      const n = i / length
      // Exponential decay
      const decay = Math.exp(-n * 5)
      // Random values for diffusion
      leftChannel[i] = (Math.random() * 2 - 1) * decay
      rightChannel[i] = (Math.random() * 2 - 1) * decay
    }

    convolverRef.current.buffer = impulse
  }, [reverbAmount])

  // Start oscillator
  const startOscillator = useCallback(() => {
    if (!audioContextRef.current || !gainNodeRef.current) return

    // Resume audio context if suspended
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume()
    }

    // Stop existing oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current.disconnect()
    }

    // Create new oscillator
    oscillatorRef.current = audioContextRef.current.createOscillator()
    oscillatorRef.current.type = waveType
    oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
    oscillatorRef.current.connect(gainNodeRef.current)
    oscillatorRef.current.start()
  }, [frequency, waveType])

  // Stop oscillator
  const stopOscillator = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current.disconnect()
      oscillatorRef.current = null
    }
  }, [])

  // Start visualization
  const startVisualization = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!analyserRef.current || !ctx) return

      // Set canvas dimensions
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(draw)

      if (visualizationType === "waveform") {
        // Get waveform data
        analyserRef.current.getByteTimeDomainData(dataArray)

        // Clear canvas
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw waveform
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgb(147, 51, 234)"
        ctx.beginPath()

        const sliceWidth = canvas.width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * canvas.height) / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }

          x += sliceWidth
        }

        ctx.lineTo(canvas.width, canvas.height / 2)
        ctx.stroke()
      } else {
        // Get frequency data
        analyserRef.current.getByteFrequencyData(dataArray)

        // Clear canvas
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw frequency bars
        const barWidth = (canvas.width / bufferLength) * 2.5
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height

          // Create gradient
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
          gradient.addColorStop(0, "rgba(147, 51, 234, 0.2)")
          gradient.addColorStop(1, "rgba(147, 51, 234, 1)")

          ctx.fillStyle = gradient
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

          x += barWidth + 1
        }
      }
    }

    draw()
  }, [visualizationType])

  // Stop visualization
  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Start recording
  const startRecording = useCallback(() => {
    if (!audioContextRef.current || !enableRecording) return

    // Create media stream destination
    const destination = audioContextRef.current.createMediaStreamDestination()

    // Connect our audio graph to the destination
    if (enableEffects && convolverRef.current) {
      convolverRef.current.connect(destination)
    } else if (gainNodeRef.current) {
      gainNodeRef.current.connect(destination)
    }

    // Create media recorder
    const options = { mimeType: "audio/webm" }
    try {
      mediaRecorderRef.current = new MediaRecorder(destination.stream, options)
    } catch (err) {
      console.error("Error creating MediaRecorder:", err)
      return
    }

    // Set up recorder events
    recordedChunksRef.current = []

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" })
      setRecordedBlob(blob)
    }

    // Start recording
    mediaRecorderRef.current.start()
    setIsRecording(true)
    setRecordingTime(0)

    // Update recording time
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)
  }, [enableEffects, enableRecording])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return

    mediaRecorderRef.current.stop()
    setIsRecording(false)

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
  }, [isRecording])

  // Download recording
  const downloadRecording = useCallback(() => {
    if (!recordedBlob) return

    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = `frequency-${frequency}-${new Date().toISOString()}.webm`
    document.body.appendChild(a)
    a.click()

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }, [recordedBlob, frequency])

  // Share recording
  const shareRecording = useCallback(async () => {
    if (!recordedBlob || !navigator.share) return

    const file = new File([recordedBlob], `frequency-${frequency}.webm`, {
      type: "audio/webm",
    })

    try {
      await navigator.share({
        files: [file],
        title: `Frequency ${frequency}Hz`,
        text: "Check out this healing frequency I created with ASTRA!",
      })
    } catch (err) {
      console.error("Error sharing:", err)
    }
  }, [recordedBlob, frequency])

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Waveform className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Advanced Frequency Generator</h2>
            <p className="text-xs text-white/60">
              {frequency} Hz • {waveType} wave
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={isPlaying ? "destructive" : "default"} size="sm" onClick={togglePlay}>
            {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isPlaying ? "Stop" : "Play"}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-6 border-r border-white/10">
          <div className="space-y-6">
            {/* Visualization */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-black/40">
              <canvas ref={canvasRef} className="w-full h-full" />

              <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-2 py-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVisualizationType("waveform")}
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      visualizationType === "waveform"
                        ? "bg-purple-500/50 text-white"
                        : "text-white/60 hover:text-white",
                    )}
                  >
                    Waveform
                  </button>
                  <button
                    onClick={() => setVisualizationType("frequency")}
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      visualizationType === "frequency"
                        ? "bg-purple-500/50 text-white"
                        : "text-white/60 hover:text-white",
                    )}
                  >
                    Spectrum
                  </button>
                </div>
              </div>
            </div>

            {/* Frequency Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-white">Frequency (Hz)</label>
                <span className="text-white font-medium">{frequency} Hz</span>
              </div>
              <Slider
                value={[frequency]}
                min={20}
                max={20000}
                step={1}
                onValueChange={(value) => setFrequency(value[0])}
              />
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/10">
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
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

              <div className="flex items-center gap-2">
                {enableRecording && (
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={isRecording ? "" : "border-white/10 text-white hover:bg-white/5"}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="mr-2 h-4 w-4" />
                        {formatTime(recordingTime)}
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Record
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="controls" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/20 p-1">
              <TabsTrigger value="controls" className="data-[state=active]:bg-purple-900/50">
                Controls
              </TabsTrigger>
              {enableEffects && (
                <TabsTrigger value="effects" className="data-[state=active]:bg-purple-900/50">
                  Effects
                </TabsTrigger>
              )}
              {(enableRecording || enableSharing) && (
                <TabsTrigger value="recordings" className="data-[state=active]:bg-purple-900/50">
                  Recordings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="controls" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-white mb-2 block">Wave Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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

                <div className="space-y-2">
                  <label className="text-white mb-2 block">Frequency Presets</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { name: "Root Chakra", freq: 396 },
                      { name: "Sacral Chakra", freq: 417 },
                      { name: "Solar Plexus", freq: 528 },
                      { name: "Heart Chakra", freq: 639 },
                      { name: "Throat Chakra", freq: 741 },
                      { name: "Third Eye", freq: 852 },
                    ].map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/5"
                        onClick={() => setFrequency(preset.freq)}
                      >
                        {preset.name} ({preset.freq}Hz)
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {enableEffects && (
              <TabsContent value="effects" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-white">Reverb</label>
                      <span className="text-white/70 text-sm">{reverbAmount}%</span>
                    </div>
                    <Slider
                      value={[reverbAmount]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setReverbAmount(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-white">Delay</label>
                      <span className="text-white/70 text-sm">{delayAmount}ms</span>
                    </div>
                    <Slider
                      value={[delayAmount]}
                      min={0}
                      max={1000}
                      step={10}
                      onValueChange={(value) => setDelayAmount(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-white">Filter Cutoff</label>
                      <span className="text-white/70 text-sm">{filterFrequency}Hz</span>
                    </div>
                    <Slider
                      value={[filterFrequency]}
                      min={20}
                      max={20000}
                      step={10}
                      onValueChange={(value) => setFilterFrequency(value[0])}
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            {(enableRecording || enableSharing) && (
              <TabsContent value="recordings" className="mt-4 space-y-4">
                {recordedBlob ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-black/40 p-4">
                      <h3 className="font-medium text-white mb-2">Recorded Audio</h3>
                      <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {enableSharing && navigator.share && (
                        <Button
                          onClick={shareRecording}
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share Recording
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={downloadRecording}
                        className="border-white/10 text-white hover:bg-white/5"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Recording
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mic className="h-12 w-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-white font-medium text-lg mb-2">No Recordings Yet</h3>
                    <p className="text-white/60 mb-4">
                      {enableRecording
                        ? "Click the Record button to start recording your frequency session"
                        : "Recording is not enabled for this session"}
                    </p>
                    {enableRecording && (
                      <Button
                        onClick={startRecording}
                        disabled={isRecording}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                      >
                        <Mic className="mr-2 h-4 w-4" />
                        Start Recording
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}

