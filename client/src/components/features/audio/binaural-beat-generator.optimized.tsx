/**
 * binaural-beat-generator.optimized.tsx
 * 
 * Performance optimized version of the BinauralBeatGenerator component
 * using React.memo, useMemo, and useCallback hooks for better performance.
 * 
 * Optimizations include:
 * - Memoizing expensive calculations with useMemo
 * - Preventing unnecessary re-renders with React.memo
 * - Optimizing callback functions with useCallback
 * - Consolidating related state variables
 * - Optimizing effect dependencies
 */

"use client"

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react"
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

// Type definitions to improve code readability
type OscillatorType = "sine" | "square" | "triangle" | "sawtooth";
type AudioRefs = {
  audioContext: AudioContext | null;
  leftOscillator: OscillatorNode | null;
  rightOscillator: OscillatorNode | null;
  gainNode: GainNode | null;
};

type PresetType = {
  name: string;
  leftFreq: number;
  rightFreq: number;
  waveType: OscillatorType;
  description: string;
};

type TimerState = {
  active: boolean;
  duration: number;
  remaining: number;
};

type PulseDetectionState = {
  show: boolean;
  heartRate: number | null;
  syncToHeartRate: boolean;
};

// Memoized preset array that never changes
const presets: PresetType[] = [
  {
    name: "Meditation",
    leftFreq: 200,
    rightFreq: 204,
    waveType: "sine",
    description: "4 Hz Delta waves for deep meditation",
  },
  {
    name: "Focus",
    leftFreq: 200,
    rightFreq: 210,
    waveType: "sine",
    description: "10 Hz Alpha waves for concentration and focus",
  },
  {
    name: "Relaxation",
    leftFreq: 200,
    rightFreq: 208,
    waveType: "sine",
    description: "8 Hz Alpha waves for relaxation",
  },
  {
    name: "Sleep",
    leftFreq: 200,
    rightFreq: 202,
    waveType: "sine",
    description: "2 Hz Delta waves to help with sleep",
  },
  {
    name: "Creativity",
    leftFreq: 200,
    rightFreq: 207,
    waveType: "sine",
    description: "7 Hz Theta waves to enhance creativity",
  },
  {
    name: "Energy",
    leftFreq: 200,
    rightFreq: 215,
    waveType: "sine",
    description: "15 Hz Beta waves for energy and alertness",
  },
];

// Memoized brain wave category function since its logic never changes
const getBrainWaveCategory = (freq: number) => {
  if (freq <= 4) return { name: "Delta", color: "#3b82f6", description: "Deep sleep, healing" };
  if (freq <= 8) return { name: "Theta", color: "#8b5cf6", description: "Meditation, creativity" };
  if (freq <= 12) return { name: "Alpha", color: "#10b981", description: "Relaxation, calmness" };
  if (freq <= 30) return { name: "Beta", color: "#f59e0b", description: "Focus, alertness" };
  return { name: "Gamma", color: "#ef4444", description: "Higher mental activity" };
};

/**
 * Format time in seconds to MM:SS format
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Main component (wrapped with memo to prevent unnecessary re-renders)
export const BinauralBeatGenerator = memo(({
  defaultLeftFreq = 200,
  defaultRightFreq = 210,
  defaultVolume = 50,
  defaultWaveType = "sine",
  defaultPreset = "custom",
}: BinauralBeatGeneratorProps) => {
  // Audio refs - consolidated in a single ref to reduce updates
  const audioRefs = useRef<AudioRefs>({
    audioContext: null,
    leftOscillator: null,
    rightOscillator: null,
    gainNode: null
  });
  
  // Core audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequencies, setFrequencies] = useState({
    left: defaultLeftFreq,
    right: defaultRightFreq
  });
  const [audioSettings, setAudioSettings] = useState({
    volume: defaultVolume,
    isMuted: false,
    waveType: defaultWaveType as OscillatorType
  });
  const [activePreset, setActivePreset] = useState(defaultPreset);
  
  // Timer state - consolidated related state
  const [timer, setTimer] = useState<TimerState>({
    active: false,
    duration: 15,
    remaining: 15 * 60
  });
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Pulse detection state - consolidated related state
  const [pulseDetection, setPulseDetection] = useState<PulseDetectionState>({
    show: false,
    heartRate: null,
    syncToHeartRate: false
  });
  
  // Video elements for pulse detection
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pulseDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Preset saving state
  const [presetSaving, setPresetSaving] = useState({
    show: false,
    name: ""
  });
  
  // Calculate beat frequency (memoized to prevent recalculation)
  const beatFrequency = useMemo(
    () => Math.abs(frequencies.right - frequencies.left),
    [frequencies.left, frequencies.right]
  );
  
  // Get brain wave category (memoized since it depends on beat frequency)
  const brainWave = useMemo(
    () => getBrainWaveCategory(beatFrequency),
    [beatFrequency]
  );
  
  // Initialize audio context - called only once on mount
  useEffect(() => {
    return () => {
      stopOscillators();
      if (audioRefs.current.audioContext) {
        audioRefs.current.audioContext.close();
      }
    };
  }, []);
  
  // Memoized function to stop oscillators
  const stopOscillators = useCallback(() => {
    if (audioRefs.current.leftOscillator) {
      audioRefs.current.leftOscillator.stop();
      audioRefs.current.leftOscillator.disconnect();
      audioRefs.current.leftOscillator = null;
    }
    
    if (audioRefs.current.rightOscillator) {
      audioRefs.current.rightOscillator.stop();
      audioRefs.current.rightOscillator.disconnect();
      audioRefs.current.rightOscillator = null;
    }
  }, []);
  
  // Memoized function to start oscillators
  const startOscillators = useCallback(() => {
    if (!audioRefs.current.audioContext) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioRefs.current.audioContext = new AudioContext();
    }
    
    // Create gain node if it doesn't exist
    if (!audioRefs.current.gainNode) {
      audioRefs.current.gainNode = audioRefs.current.audioContext.createGain();
      audioRefs.current.gainNode.connect(audioRefs.current.audioContext.destination);
    }
    
    // Set volume
    const { volume, isMuted } = audioSettings;
    audioRefs.current.gainNode.gain.setValueAtTime(
      isMuted ? 0 : volume / 100, 
      audioRefs.current.audioContext.currentTime
    );
    
    // Create and start left oscillator
    audioRefs.current.leftOscillator = audioRefs.current.audioContext.createOscillator();
    audioRefs.current.leftOscillator.type = audioSettings.waveType;
    audioRefs.current.leftOscillator.frequency.setValueAtTime(
      frequencies.left, 
      audioRefs.current.audioContext.currentTime
    );
    
    // Create stereo panner for left ear
    const leftPanner = audioRefs.current.audioContext.createStereoPanner();
    leftPanner.pan.setValueAtTime(-1, audioRefs.current.audioContext.currentTime); // Full left
    
    audioRefs.current.leftOscillator.connect(leftPanner);
    leftPanner.connect(audioRefs.current.gainNode);
    audioRefs.current.leftOscillator.start();
    
    // Create and start right oscillator
    audioRefs.current.rightOscillator = audioRefs.current.audioContext.createOscillator();
    audioRefs.current.rightOscillator.type = audioSettings.waveType;
    audioRefs.current.rightOscillator.frequency.setValueAtTime(
      frequencies.right, 
      audioRefs.current.audioContext.currentTime
    );
    
    // Create stereo panner for right ear
    const rightPanner = audioRefs.current.audioContext.createStereoPanner();
    rightPanner.pan.setValueAtTime(1, audioRefs.current.audioContext.currentTime); // Full right
    
    audioRefs.current.rightOscillator.connect(rightPanner);
    rightPanner.connect(audioRefs.current.gainNode);
    audioRefs.current.rightOscillator.start();
  }, [frequencies.left, frequencies.right, audioSettings]);
  
  // Play/pause effect
  useEffect(() => {
    if (isPlaying) {
      startOscillators();
    } else {
      stopOscillators();
    }
  }, [isPlaying, startOscillators, stopOscillators]);
  
  // Update oscillator frequencies
  useEffect(() => {
    if (!isPlaying) return; // Skip if not playing
    
    const { audioContext, leftOscillator, rightOscillator } = audioRefs.current;
    if (leftOscillator && rightOscillator && audioContext) {
      leftOscillator.frequency.setValueAtTime(frequencies.left, audioContext.currentTime);
      rightOscillator.frequency.setValueAtTime(frequencies.right, audioContext.currentTime);
    }
  }, [frequencies, isPlaying]);
  
  // Update wave type
  useEffect(() => {
    if (isPlaying) {
      // Need to restart oscillators to change wave type
      stopOscillators();
      startOscillators();
    }
  }, [audioSettings.waveType, isPlaying, startOscillators, stopOscillators]);
  
  // Update volume
  useEffect(() => {
    const { gainNode, audioContext } = audioRefs.current;
    const { volume, isMuted } = audioSettings;
    
    if (gainNode && audioContext) {
      gainNode.gain.setValueAtTime(
        isMuted ? 0 : volume / 100, 
        audioContext.currentTime
      );
    }
  }, [audioSettings]);
  
  // Handle timer
  useEffect(() => {
    if (timer.active && isPlaying) {
      setTimer(prev => ({
        ...prev,
        remaining: prev.duration * 60
      }));
      
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev.remaining <= 1) {
            // Timer finished
            setIsPlaying(false);
            clearInterval(timerIntervalRef.current!);
            return {
              ...prev,
              active: false,
              remaining: 0
            };
          }
          return {
            ...prev,
            remaining: prev.remaining - 1
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timer.active, timer.duration, isPlaying]);
  
  // Handle heart rate sync
  useEffect(() => {
    if (pulseDetection.syncToHeartRate && pulseDetection.heartRate) {
      // Calculate frequencies based on heart rate
      const baseFreq = 200;
      const beatFreq = pulseDetection.heartRate / 10;
      
      setFrequencies({
        left: baseFreq,
        right: baseFreq + beatFreq
      });
    }
  }, [pulseDetection.syncToHeartRate, pulseDetection.heartRate]);
  
  // Start pulse detection
  useEffect(() => {
    if (pulseDetection.show) {
      startPulseDetection();
    } else {
      stopPulseDetection();
    }
    
    return () => {
      stopPulseDetection();
    };
  }, [pulseDetection.show]);
  
  // Toggle play/pause (memoized to prevent function recreation)
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);
  
  // Toggle mute (memoized to prevent function recreation)
  const toggleMute = useCallback(() => {
    setAudioSettings(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }));
  }, []);
  
  // Apply preset (memoized to prevent function recreation)
  const applyPreset = useCallback((preset: string) => {
    const selectedPreset = presets.find(p => p.name.toLowerCase() === preset.toLowerCase());
    
    if (selectedPreset) {
      setFrequencies({
        left: selectedPreset.leftFreq,
        right: selectedPreset.rightFreq
      });
      setAudioSettings(prev => ({
        ...prev,
        waveType: selectedPreset.waveType
      }));
      setActivePreset(preset);
    } else {
      setActivePreset("custom");
    }
  }, []);
  
  // Handle left frequency change (memoized)
  const handleLeftFreqChange = useCallback((value: number[]) => {
    setFrequencies(prev => ({ ...prev, left: value[0] }));
  }, []);
  
  // Handle right frequency change (memoized)
  const handleRightFreqChange = useCallback((value: number[]) => {
    setFrequencies(prev => ({ ...prev, right: value[0] }));
  }, []);
  
  // Handle volume change (memoized)
  const handleVolumeChange = useCallback((value: number[]) => {
    setAudioSettings(prev => ({ ...prev, volume: value[0] }));
  }, []);
  
  // Handle wave type change (memoized)
  const handleWaveTypeChange = useCallback((value: OscillatorType) => {
    setAudioSettings(prev => ({ ...prev, waveType: value }));
  }, []);
  
  // Handle timer duration change (memoized)
  const handleTimerDurationChange = useCallback((value: number[]) => {
    setTimer(prev => ({ ...prev, duration: value[0] }));
  }, []);
  
  // Toggle timer (memoized)
  const toggleTimer = useCallback(() => {
    setTimer(prev => ({ ...prev, active: !prev.active }));
  }, []);
  
  // Toggle pulse detection (memoized)
  const togglePulseDetection = useCallback(() => {
    setPulseDetection(prev => ({ ...prev, show: !prev.show }));
  }, []);
  
  // Toggle heart rate sync (memoized)
  const toggleHeartRateSync = useCallback(() => {
    setPulseDetection(prev => ({ ...prev, syncToHeartRate: !prev.syncToHeartRate }));
  }, []);
  
  // Start pulse detection (memoized)
  const startPulseDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = resolve;
        }
      });
      
      if (videoRef.current) {
        videoRef.current.play();
      }
      
      // Start pulse detection algorithm
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;
      
      // Array to store red values for analysis
      const redValues: number[] = [];
      const maxSamples = 100;
      
      pulseDetectionIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !ctx) return;
        
        // Draw video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Get image data from center of frame
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 10;
        
        const imageData = ctx.getImageData(centerX - radius, centerY - radius, radius * 2, radius * 2);
        
        // Calculate average red value (blood flow indicator)
        let totalRed = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
          totalRed += imageData.data[i]; // Red channel
        }
        
        const avgRed = totalRed / (imageData.data.length / 4);
        
        // Add to array
        redValues.push(avgRed);
        
        // Keep array at max size
        if (redValues.length > maxSamples) {
          redValues.shift();
        }
        
        // Need at least 50 samples to calculate
        if (redValues.length >= 50) {
          // Simple peak detection
          let peaks = 0;
          let lastValue = redValues[0];
          let rising = false;
          
          for (let i = 1; i < redValues.length; i++) {
            if (redValues[i] > lastValue && !rising) {
              rising = true;
            } else if (redValues[i] < lastValue && rising) {
              peaks++;
              rising = false;
            }
            
            lastValue = redValues[i];
          }
          
          // Calculate heart rate (peaks per minute)
          // Assuming 30 fps, 50 samples = 1.67 seconds
          const timeSpan = redValues.length / 30;
          const bpm = (peaks / timeSpan) * 60;
          
          // Only update if reasonable value (40-180 bpm)
          if (bpm >= 40 && bpm <= 180) {
            setPulseDetection(prev => ({
              ...prev,
              heartRate: Math.round(bpm)
            }));
          }
        }
        
        // Draw visualization
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw pulse wave
        ctx.beginPath();
        ctx.strokeStyle = "#9333ea";
        ctx.lineWidth = 2;
        
        for (let i = 0; i < redValues.length; i++) {
          const x = (i / maxSamples) * canvas.width;
          const y = canvas.height - (((redValues[i] - 100) / 50) * canvas.height) / 2;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
        
        // Draw heart rate
        if (pulseDetection.heartRate) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "24px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${pulseDetection.heartRate} BPM`, canvas.width / 2, 30);
        }
      }, 33); // ~30fps
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }, []);
  
  // Stop pulse detection (memoized)
  const stopPulseDetection = useCallback(() => {
    if (pulseDetectionIntervalRef.current) {
      clearInterval(pulseDetectionIntervalRef.current);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);
  
  // Show save preset dialog (memoized)
  const showSavePresetDialog = useCallback(() => {
    setPresetSaving(prev => ({ ...prev, show: true }));
  }, []);
  
  // Hide save preset dialog (memoized)
  const hideSavePresetDialog = useCallback(() => {
    setPresetSaving({ show: false, name: "" });
  }, []);
  
  // Save preset (memoized)
  const savePreset = useCallback(() => {
    // In a real app, this would save to a database or localStorage
    alert(`Preset "${presetSaving.name}" saved with: Left: ${frequencies.left}Hz, Right: ${frequencies.right}Hz, Wave: ${audioSettings.waveType}`);
    setPresetSaving({ show: false, name: "" });
  }, [presetSaving.name, frequencies, audioSettings.waveType]);
  
  // Handle preset name change (memoized)
  const handlePresetNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPresetSaving(prev => ({ ...prev, name: e.target.value }));
  }, []);
  
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
            onClick={showSavePresetDialog}
            className="border-white/10 text-white hover:bg-white/5"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Preset
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex mb-6">
          <Button
            onClick={togglePlay}
            size="lg"
            className={cn(
              "w-full rounded-full flex gap-2 items-center justify-center",
              isPlaying
                ? "bg-red-500 hover:bg-red-600"
                : "bg-purple-600 hover:bg-purple-700"
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="h-5 w-5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5" /> Play
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="frequencies" className="mb-6">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="frequencies">Frequencies</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="frequencies">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Left Ear: {frequencies.left} Hz</Label>
                  <span className="text-xs text-white/60">100-500 Hz</span>
                </div>
                <Slider
                  min={100}
                  max={500}
                  step={1}
                  value={[frequencies.left]}
                  onValueChange={handleLeftFreqChange}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Right Ear: {frequencies.right} Hz</Label>
                  <span className="text-xs text-white/60">100-500 Hz</span>
                </div>
                <Slider
                  min={100}
                  max={500}
                  step={1}
                  value={[frequencies.right]}
                  onValueChange={handleRightFreqChange}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Beat Frequency: {beatFrequency.toFixed(1)} Hz</Label>
                  <span
                    className="text-xs"
                    style={{ color: brainWave.color }}
                  >
                    {brainWave.name} Waves
                  </span>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 rounded-full" />
                <p className="text-xs text-white/60">
                  {brainWave.description}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant={
                    activePreset === preset.name ? "default" : "outline"
                  }
                  className={cn(
                    "h-auto py-2 flex flex-col items-start text-left",
                    activePreset === preset.name
                      ? "bg-purple-600 text-white"
                      : "border-white/10 text-white hover:bg-white/5"
                  )}
                  onClick={() => applyPreset(preset.name)}
                >
                  <span className="font-bold">{preset.name}</span>
                  <span className="text-xs opacity-80">
                    {Math.abs(preset.rightFreq - preset.leftFreq)} Hz -{" "}
                    {preset.description}
                  </span>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="effects" className="space-y-6">
            <div className="space-y-2">
              <Label>Wave Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {["sine", "square", "triangle", "sawtooth"].map((type) => (
                  <Button
                    key={type}
                    variant={
                      audioSettings.waveType === type ? "default" : "outline"
                    }
                    className={
                      audioSettings.waveType === type
                        ? "bg-purple-600"
                        : "border-white/10 text-white hover:bg-white/5"
                    }
                    onClick={() => handleWaveTypeChange(type as OscillatorType)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Timer</Label>
                <Switch checked={timer.active} onCheckedChange={toggleTimer} />
              </div>

              {timer.active && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Duration: {timer.duration} minutes</Label>
                    </div>
                    <Slider
                      min={1}
                      max={60}
                      step={1}
                      value={[timer.duration]}
                      onValueChange={handleTimerDurationChange}
                    />
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg flex items-center justify-center">
                    <Timer className="mr-2 h-5 w-5 text-white/80" />
                    <span className="text-2xl font-mono">
                      {formatTime(timer.remaining)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto bg-transparent hover:bg-transparent"
                    onClick={toggleMute}
                  >
                    {audioSettings.isMuted ? (
                      <VolumeX className="h-5 w-5 text-white/80" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-white/80" />
                    )}
                  </Button>
                  <Label className="ml-2">Volume</Label>
                </div>
                <span className="text-xs text-white/60">
                  {audioSettings.volume}%
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[audioSettings.volume]}
                onValueChange={handleVolumeChange}
                disabled={audioSettings.isMuted}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Heart Rate Detection</Label>
                <Switch
                  checked={pulseDetection.show}
                  onCheckedChange={togglePulseDetection}
                />
              </div>

              {pulseDetection.show && (
                <>
                  <div className="aspect-video bg-black/30 rounded-lg overflow-hidden relative">
                    <video
                      ref={videoRef}
                      className="absolute inset-0 opacity-0 pointer-events-none"
                    />
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={360}
                      className="w-full h-full"
                    />
                  </div>

                  {pulseDetection.heartRate && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Heart className="h-5 w-5 text-red-500 mr-2" />
                          <Label>Sync to Heart Rate</Label>
                        </div>
                        <Switch
                          checked={pulseDetection.syncToHeartRate}
                          onCheckedChange={toggleHeartRateSync}
                        />
                      </div>

                      <p className="text-sm text-white/60">
                        Your detected heart rate is{" "}
                        <span className="text-white">
                          {pulseDetection.heartRate} BPM
                        </span>
                        . Syncing will adjust the beat frequency based on your
                        heart rate.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {presetSaving.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-purple-500/20 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Save Custom Preset</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={presetSaving.name}
                  onChange={handlePresetNameChange}
                  placeholder="My Custom Preset"
                />
              </div>

              <div className="bg-black/20 p-4 rounded-lg space-y-2 text-sm">
                <p>
                  Left Frequency: <span className="font-mono">{frequencies.left} Hz</span>
                </p>
                <p>
                  Right Frequency: <span className="font-mono">{frequencies.right} Hz</span>
                </p>
                <p>
                  Beat Frequency: <span className="font-mono">{beatFrequency.toFixed(1)} Hz</span>
                </p>
                <p>
                  Wave Type: <span className="font-mono">{audioSettings.waveType}</span>
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={hideSavePresetDialog}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!presetSaving.name.trim()}
                  onClick={savePreset}
                >
                  Save Preset
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Set display name for debugging purposes
BinauralBeatGenerator.displayName = "BinauralBeatGenerator";

export default BinauralBeatGenerator;