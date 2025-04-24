/**
 * @file optimized-binaural-beat-generator.tsx
 * @description An optimized version of the BinauralBeatGenerator component 
 *              with performance improvements including memoization and callback optimizations
 * @author Replit AI Agent
 * @created 2025-04-15
 * @updated 2025-04-15
 * @status Active
 */

"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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

/**
 * Props for the BinauralBeatGenerator component
 * 
 * @property defaultLeftFreq - Initial frequency for left ear (default: 200Hz)
 * @property defaultRightFreq - Initial frequency for right ear (default: 210Hz)
 * @property defaultVolume - Initial volume level as percentage (default: 50%)
 * @property defaultWaveType - Initial oscillator wave type (default: sine)
 * @property defaultPreset - Initial preset to use (default: custom)
 */
interface BinauralBeatGeneratorProps {
  defaultLeftFreq?: number
  defaultRightFreq?: number
  defaultVolume?: number
  defaultWaveType?: "sine" | "square" | "triangle" | "sawtooth"
  defaultPreset?: string
}

/**
 * BinauralBeatGenerator
 * 
 * A component that generates binaural beats - audio frequencies that can help induce
 * different mental states such as relaxation, focus, or meditation.
 * 
 * The component creates two tones with slightly different frequencies, one for each ear.
 * The difference between these frequencies creates a "beat" that can influence brainwave patterns.
 * 
 * @example
 * ```tsx
 * <BinauralBeatGenerator 
 *   defaultLeftFreq={200}
 *   defaultRightFreq={210}
 *   defaultVolume={50}
 *   defaultWaveType="sine"
 * />
 * ```
 */
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

  // Presets for different states - memoized to prevent recreation on each render
  const presets = useMemo(() => [
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
      description: "10 Hz Alpha waves for concentration",
    },
    {
      name: "Relaxation",
      leftFreq: 300,
      rightFreq: 306,
      waveType: "sine" as OscillatorType,
      description: "6 Hz Theta waves for relaxation",
    },
    {
      name: "Sleep",
      leftFreq: 100,
      rightFreq: 102,
      waveType: "sine" as OscillatorType,
      description: "2 Hz Delta waves for sleep induction",
    },
    {
      name: "Creativity",
      leftFreq: 400,
      rightFreq: 408,
      waveType: "sine" as OscillatorType,
      description: "8 Hz Alpha waves for creative thinking",
    },
    {
      name: "Energy",
      leftFreq: 200,
      rightFreq: 213,
      waveType: "sine" as OscillatorType,
      description: "13 Hz Beta waves for energy and alertness",
    },
  ], [])

  // Calculate the beat frequency (difference between left and right) - memoized
  const beatFrequency = useMemo(() => Math.abs(leftFreq - rightFreq), [leftFreq, rightFreq])

  // Determine the brainwave category - memoized
  const brainwaveCategory = useMemo(() => {
    if (beatFrequency <= 4) return "Delta - Deep sleep, healing"
    if (beatFrequency <= 8) return "Theta - Meditation, intuition"
    if (beatFrequency <= 13) return "Alpha - Relaxation, creativity"
    if (beatFrequency <= 30) return "Beta - Focus, alertness"
    return "Gamma - Higher cognition, perception"
  }, [beatFrequency])

  // Memoized volume level for oscillator gain
  const volumeLevel = useMemo(() => (isMuted ? 0 : volume / 100), [volume, isMuted])

  /**
   * Initialize audio context and set up cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopOscillators()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      
      clearPulseDetection()
      clearTimerInterval()
    }
  }, [])

  /**
   * Start or stop oscillators when isPlaying changes
   */
  useEffect(() => {
    if (isPlaying) {
      startOscillators()
    } else {
      stopOscillators()
    }
  }, [isPlaying])

  /**
   * Update oscillator frequencies when they change
   */
  useEffect(() => {
    if (isPlaying && leftOscillatorRef.current && rightOscillatorRef.current) {
      leftOscillatorRef.current.frequency.setValueAtTime(
        leftFreq, 
        audioContextRef.current?.currentTime || 0
      )
      rightOscillatorRef.current.frequency.setValueAtTime(
        rightFreq, 
        audioContextRef.current?.currentTime || 0
      )
    }
  }, [leftFreq, rightFreq, isPlaying])

  /**
   * Update oscillator wave type when it changes
   */
  useEffect(() => {
    if (isPlaying) {
      // We need to recreate oscillators to change wave type
      stopOscillators()
      startOscillators()
    }
  }, [waveType, isPlaying])

  /**
   * Update volume/mute state
   */
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        volumeLevel, 
        audioContextRef.current.currentTime
      )
    }
  }, [volumeLevel])

  /**
   * Handle timer countdown
   */
  useEffect(() => {
    if (timerActive && isPlaying) {
      startTimer()
    } else {
      clearTimerInterval()
    }

    return () => clearTimerInterval()
  }, [timerActive, isPlaying, timerDuration])

  /**
   * Handle heart rate synchronization
   */
  useEffect(() => {
    if (isSyncingToHeartRate && heartRate && isPlaying) {
      // Calculate frequencies based on heart rate
      // Typical approach: Use heart rate as the beat frequency
      const calculatedRightFreq = 200
      const calculatedLeftFreq = 200 - heartRate / 60
      
      setLeftFreq(calculatedLeftFreq)
      setRightFreq(calculatedRightFreq)
    }
  }, [isSyncingToHeartRate, heartRate, isPlaying])

  /**
   * Handle pulse detection setup and cleanup
   */
  useEffect(() => {
    if (showPulseDetection) {
      setupPulseDetection()
    } else {
      clearPulseDetection()
    }

    return () => clearPulseDetection()
  }, [showPulseDetection])

  /**
   * Start oscillators
   */
  const startOscillators = useCallback(() => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContext()
    }

    // Stop any existing oscillators
    stopOscillators()

    // Create gain node
    if (audioContextRef.current) {
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = volumeLevel
      gainNodeRef.current.connect(audioContextRef.current.destination)

      // Create left oscillator
      leftOscillatorRef.current = audioContextRef.current.createOscillator()
      leftOscillatorRef.current.type = waveType
      leftOscillatorRef.current.frequency.value = leftFreq

      // Create right oscillator
      rightOscillatorRef.current = audioContextRef.current.createOscillator()
      rightOscillatorRef.current.type = waveType
      rightOscillatorRef.current.frequency.value = rightFreq

      // Create channel merger for stereo
      const merger = audioContextRef.current.createChannelMerger(2)
      
      // Connect left oscillator to left channel
      leftOscillatorRef.current.connect(merger, 0, 0)
      
      // Connect right oscillator to right channel
      rightOscillatorRef.current.connect(merger, 0, 1)
      
      // Connect merger to gain node
      merger.connect(gainNodeRef.current)
      
      // Start oscillators
      leftOscillatorRef.current.start()
      rightOscillatorRef.current.start()
    }
  }, [leftFreq, rightFreq, waveType, volumeLevel])

  /**
   * Stop oscillators
   */
  const stopOscillators = useCallback(() => {
    try {
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
      
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect()
        gainNodeRef.current = null
      }
    } catch (error) {
      console.error("Error stopping oscillators:", error)
    }
  }, [])

  /**
   * Start timer countdown
   */
  const startTimer = useCallback(() => {
    // Clear any existing timer
    clearTimerInterval()
    
    // Set initial timer value
    setTimerRemaining(timerDuration * 60)
    
    // Start countdown
    timerIntervalRef.current = setInterval(() => {
      setTimerRemaining(prevTime => {
        if (prevTime <= 1) {
          // Time's up - stop playback and clear interval
          setIsPlaying(false)
          clearTimerInterval()
          return 0
        }
        return prevTime - 1
      })
    }, 1000)
  }, [timerDuration])

  /**
   * Clear timer interval
   */
  const clearTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  /**
   * Set up pulse detection
   */
  const setupPulseDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    try {
      // Access user's camera for pulse detection
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        
        // Start pulse detection algorithm
        startPulseDetection()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setShowPulseDetection(false)
    }
  }, [])

  /**
   * Start pulse detection algorithm
   */
  const startPulseDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    // This is a simplified pulse detection algorithm
    // Real heart rate detection would be more complex
    pulseDetectionIntervalRef.current = setInterval(() => {
      if (!videoRef.current) return
      
      // Draw video frame to canvas
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      
      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      
      // Simple red channel analysis - this is just a simulation
      // Real pulse detection would analyze red channel changes over time
      let redSum = 0
      for (let i = 0; i < imageData.data.length; i += 4) {
        redSum += imageData.data[i]
      }
      const avgRed = redSum / (imageData.data.length / 4)
      
      // Simulate heart rate based on red value
      // In a real implementation, this would detect actual pulse
      const simulatedHeartRate = 60 + Math.sin(Date.now() / 1000) * 10
      
      setHeartRate(Math.round(simulatedHeartRate))
    }, 1000)
  }, [])

  /**
   * Clear pulse detection
   */
  const clearPulseDetection = useCallback(() => {
    if (pulseDetectionIntervalRef.current) {
      clearInterval(pulseDetectionIntervalRef.current)
      pulseDetectionIntervalRef.current = null
    }
    
    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }, [])

  /**
   * Toggle play/pause
   */
  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  /**
   * Handle volume change
   */
  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0])
  }, [])

  /**
   * Handle left frequency change
   */
  const handleLeftFreqChange = useCallback((value: number[]) => {
    setLeftFreq(value[0])
  }, [])

  /**
   * Handle right frequency change
   */
  const handleRightFreqChange = useCallback((value: number[]) => {
    setRightFreq(value[0])
  }, [])

  /**
   * Handle wave type change
   */
  const handleWaveTypeChange = useCallback((value: string) => {
    setWaveType(value as OscillatorType)
  }, [])

  /**
   * Apply preset
   */
  const applyPreset = useCallback((preset: any) => {
    setLeftFreq(preset.leftFreq)
    setRightFreq(preset.rightFreq)
    setWaveType(preset.waveType)
    setActivePreset(preset.name)
  }, [])

  /**
   * Toggle timer
   */
  const toggleTimer = useCallback(() => {
    setTimerActive(prev => !prev)
  }, [])

  /**
   * Handle timer duration change
   */
  const handleTimerDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setTimerDuration(value)
      setTimerRemaining(value * 60)
    }
  }, [])

  /**
   * Toggle pulse detection
   */
  const togglePulseDetection = useCallback(() => {
    setShowPulseDetection(prev => !prev)
  }, [])

  /**
   * Toggle heart rate sync
   */
  const toggleHeartRateSync = useCallback(() => {
    setIsSyncingToHeartRate(prev => !prev)
  }, [])

  /**
   * Toggle save preset dialog
   */
  const toggleSavePreset = useCallback(() => {
    setShowSavePreset(prev => !prev)
  }, [])

  /**
   * Save current settings as a preset
   */
  const saveCurrentPreset = useCallback(() => {
    if (presetName.trim()) {
      console.log("Saving preset:", {
        name: presetName,
        leftFreq,
        rightFreq,
        waveType,
      })
      
      // In a real implementation, this would save to storage
      
      setShowSavePreset(false)
      setPresetName("")
    }
  }, [presetName, leftFreq, rightFreq, waveType])

  /**
   * Format time from seconds to MM:SS
   */
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Render the component
  return (
    <div className="w-full max-w-3xl mx-auto bg-background rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Binaural Beat Generator</h2>
        </div>
        
        <div className="mb-4">
          <p className="text-muted-foreground text-sm">
            Current beat frequency: <strong>{beatFrequency} Hz</strong> ({brainwaveCategory})
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <Button 
            onClick={togglePlayback}
            variant="outline" 
            size="icon"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={toggleMute}
            variant="outline"
            size="icon"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <div className="flex items-center space-x-2 flex-1">
            <Label htmlFor="volume" className="w-12 text-xs">Volume</Label>
            <Slider
              id="volume"
              min={0}
              max={100}
              step={1}
              value={[volume]}
              onValueChange={handleVolumeChange}
              aria-label="Volume"
              className="flex-1"
            />
            <span className="text-xs w-8">{volume}%</span>
          </div>
          
          <Button
            onClick={toggleSavePreset}
            variant="outline"
            size="icon"
            title="Save preset"
            aria-label="Save preset"
          >
            <Save className="h-4 w-4" />
          </Button>
          
          {heartRate && (
            <Button
              onClick={toggleHeartRateSync}
              variant={isSyncingToHeartRate ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-1"
            >
              <Heart className="h-4 w-4" />
              <span>{heartRate} BPM</span>
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="frequencies" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="frequencies">Frequencies</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="frequencies">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="leftFreq">Left Ear Frequency</Label>
                  <span className="text-sm font-mono">{leftFreq} Hz</span>
                </div>
                <Slider
                  id="leftFreq"
                  min={20}
                  max={500}
                  step={1}
                  value={[leftFreq]}
                  onValueChange={handleLeftFreqChange}
                  aria-label="Left Ear Frequency"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rightFreq">Right Ear Frequency</Label>
                  <span className="text-sm font-mono">{rightFreq} Hz</span>
                </div>
                <Slider
                  id="rightFreq"
                  min={20}
                  max={500}
                  step={1}
                  value={[rightFreq]}
                  onValueChange={handleRightFreqChange}
                  aria-label="Right Ear Frequency"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Wave Type</Label>
                <div className="flex flex-wrap gap-2">
                  {["sine", "square", "triangle", "sawtooth"].map((type) => (
                    <Button
                      key={type}
                      variant={waveType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleWaveTypeChange(type)}
                    >
                      {type === "sine" && <Waves className="h-4 w-4 mr-2" />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="presets">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant={activePreset === preset.name ? "default" : "outline"}
                  className="justify-start h-auto p-4"
                  onClick={() => applyPreset(preset)}
                >
                  <div className="text-left">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                    <div className="text-xs mt-1">
                      L: {preset.leftFreq}Hz, R: {preset.rightFreq}Hz, Δ: {Math.abs(preset.leftFreq - preset.rightFreq)}Hz
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4" />
                    <Label htmlFor="timer-switch">Sleep Timer</Label>
                  </div>
                  <Switch
                    id="timer-switch"
                    checked={timerActive}
                    onCheckedChange={toggleTimer}
                  />
                </div>
                
                {timerActive && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      id="timer-duration"
                      type="number"
                      min="1"
                      max="120"
                      value={timerDuration}
                      onChange={handleTimerDurationChange}
                      className="w-20"
                    />
                    <Label htmlFor="timer-duration">minutes</Label>
                    
                    {timerRemaining < timerDuration * 60 && (
                      <div className="ml-4 text-sm font-mono">
                        {formatTime(timerRemaining)} remaining
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <Label htmlFor="pulse-switch">Pulse Detection</Label>
                  </div>
                  <Switch
                    id="pulse-switch"
                    checked={showPulseDetection}
                    onCheckedChange={togglePulseDetection}
                  />
                </div>
                
                {showPulseDetection && (
                  <div className="mt-2">
                    <div className="relative overflow-hidden rounded-md bg-muted h-32 mb-2">
                      <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full opacity-0"
                        width="320"
                        height="240"
                      />
                      
                      {heartRate && (
                        <div className="absolute bottom-2 right-2 bg-background/80 rounded-md px-2 py-1 text-sm font-mono flex items-center space-x-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span>{heartRate} BPM</span>
                        </div>
                      )}
                    </div>
                    
                    {heartRate && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="heart-sync-switch"
                          checked={isSyncingToHeartRate}
                          onCheckedChange={toggleHeartRateSync}
                        />
                        <Label htmlFor="heart-sync-switch">
                          Sync frequencies to heart rate
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {showSavePreset && (
          <div className="mt-4 p-4 border rounded-md">
            <h4 className="text-sm font-medium mb-2">Save Current Settings</h4>
            <div className="flex space-x-2">
              <Input
                placeholder="Preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={saveCurrentPreset} size="sm">
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BinauralBeatGenerator