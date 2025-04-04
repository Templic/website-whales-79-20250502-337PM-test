/**
 * BinauralBeatGenerator.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */
"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BinauralBeatGeneratorProps {
  defaultLeftFreq?: number;
  defaultRightFreq?: number;
  defaultVolume?: number;
  defaultWaveType?: "sine" | "square" | "triangle" | "sawtooth";
  defaultPreset?: string;
}

export function BinauralBeatGenerator({
  defaultLeftFreq = 200,
  defaultRightFreq = 210,
  defaultVolume = 50,
  defaultWaveType = "sine",
  defaultPreset = "custom",
}: BinauralBeatGeneratorProps) {
  // Audio context and oscillators
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // State for controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [leftFreq, setLeftFreq] = useState(defaultLeftFreq);
  const [rightFreq, setRightFreq] = useState(defaultRightFreq);
  const [volume, setVolume] = useState(defaultVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [waveType, setWaveType] = useState<OscillatorType>(defaultWaveType);
  const [activePreset, setActivePreset] = useState(defaultPreset);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(15);
  const [timerRemaining, setTimerRemaining] = useState(15 * 60); // in seconds
  const [showPulseDetection, setShowPulseDetection] = useState(false);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isSyncingToHeartRate, setIsSyncingToHeartRate] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");

  // Video element for pulse detection
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pulseDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer interval
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
  ];

  // Initialize audio context
  useEffect(() => {
    // Create audio context on first play to avoid autoplay restrictions
    const setupAudio = () => {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }
    };

    // Clean up on unmount
    return () => {
      stopOscillators();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      startOscillators();
    } else {
      stopOscillators();
    }
  }, [isPlaying]);

  // Update oscillator frequencies when they change
  useEffect(() => {
    if (leftOscillatorRef.current) {
      leftOscillatorRef.current.frequency.setValueAtTime(leftFreq, audioContextRef.current?.currentTime || 0);
    }
    if (rightOscillatorRef.current) {
      rightOscillatorRef.current.frequency.setValueAtTime(rightFreq, audioContextRef.current?.currentTime || 0);
    }
  }, [leftFreq, rightFreq]);

  // Update oscillator wave type when it changes
  useEffect(() => {
    if (isPlaying) {
      // Need to restart oscillators to change wave type
      stopOscillators();
      startOscillators();
    }
  }, [waveType]);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume / 100, audioContextRef.current?.currentTime || 0);
    }
  }, [volume, isMuted]);

  // Handle timer
  useEffect(() => {
    if (timerActive && isPlaying) {
      setTimerRemaining(timerDuration * 60);

      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            setIsPlaying(false);
            setTimerActive(false);
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
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
  }, [timerActive, timerDuration, isPlaying]);

  // Handle heart rate sync
  useEffect(() => {
    if (isSyncingToHeartRate && heartRate) {
      // Calculate frequencies based on heart rate
      // We'll use a simple formula: base frequency + heart rate / 10
      const baseFreq = 200;
      const beatFreq = heartRate / 10;

      setLeftFreq(baseFreq);
      setRightFreq(baseFreq + beatFreq);
    }
  }, [isSyncingToHeartRate, heartRate]);

  // Start pulse detection
  useEffect(() => {
    if (showPulseDetection) {
      startPulseDetection();
    } else {
      stopPulseDetection();
    }

    return () => {
      stopPulseDetection();
    };
  }, [showPulseDetection]);

  // Start oscillators
  const startOscillators = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
    }

    // Create gain node if it doesn't exist
    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    // Set volume
    gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume / 100, audioContextRef.current.currentTime);

    // Create and start left oscillator
    leftOscillatorRef.current = audioContextRef.current.createOscillator();
    leftOscillatorRef.current.type = waveType;
    leftOscillatorRef.current.frequency.setValueAtTime(leftFreq, audioContextRef.current.currentTime);

    // Create stereo panner for left ear
    const leftPanner = audioContextRef.current.createStereoPanner();
    leftPanner.pan.setValueAtTime(-1, audioContextRef.current.currentTime); // Full left

    leftOscillatorRef.current.connect(leftPanner);
    leftPanner.connect(gainNodeRef.current);
    leftOscillatorRef.current.start();

    // Create and start right oscillator
    rightOscillatorRef.current = audioContextRef.current.createOscillator();
    rightOscillatorRef.current.type = waveType;
    rightOscillatorRef.current.frequency.setValueAtTime(rightFreq, audioContextRef.current.currentTime);

    // Create stereo panner for right ear
    const rightPanner = audioContextRef.current.createStereoPanner();
    rightPanner.pan.setValueAtTime(1, audioContextRef.current.currentTime); // Full right

    rightOscillatorRef.current.connect(rightPanner);
    rightPanner.connect(gainNodeRef.current);
    rightOscillatorRef.current.start();
  };

  // Stop oscillators
  const stopOscillators = () => {
    if (leftOscillatorRef.current) {
      leftOscillatorRef.current.stop();
      leftOscillatorRef.current.disconnect();
      leftOscillatorRef.current = null;
    }

    if (rightOscillatorRef.current) {
      rightOscillatorRef.current.stop();
      rightOscillatorRef.current.disconnect();
      rightOscillatorRef.current = null;
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Apply preset
  const applyPreset = (preset: string) => {
    const selectedPreset = presets.find((p) => p.name.toLowerCase() === preset.toLowerCase());

    if (selectedPreset) {
      setLeftFreq(selectedPreset.leftFreq);
      setRightFreq(selectedPreset.rightFreq);
      setWaveType(selectedPreset.waveType);
      setActivePreset(preset);
    } else {
      setActivePreset("custom");
    }
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start pulse detection
  const startPulseDetection = async () => {
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
            setHeartRate(Math.round(bpm));
          }
        }

        // Draw visualization
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw pulse wave
        ctx.beginPath();
        ctx.strokeStyle = "#00e6e6"; // Using cyan instead of purple to match the theme
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
        if (heartRate) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "24px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${heartRate} BPM`, canvas.width / 2, 30);
        }
      }, 33); // ~30fps
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  // Stop pulse detection
  const stopPulseDetection = () => {
    if (pulseDetectionIntervalRef.current) {
      clearInterval(pulseDetectionIntervalRef.current);
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Save current settings as preset
  const savePreset = () => {
    // In a real app, this would save to a database or localStorage
    alert(`Preset "${presetName}" saved with: Left: ${leftFreq}Hz, Right: ${rightFreq}Hz, Wave: ${waveType}`);
    setShowSavePreset(false);
    setPresetName("");
  };

  // Calculate beat frequency
  const beatFrequency = Math.abs(rightFreq - leftFreq);

  // Get brain wave category
  const getBrainWaveCategory = (freq: number) => {
    if (freq <= 4) return { name: "Delta", color: "#3b82f6", description: "Deep sleep, healing" };
    if (freq <= 8) return { name: "Theta", color: "#8b5cf6", description: "Meditation, creativity" };
    if (freq <= 12) return { name: "Alpha", color: "#10b981", description: "Relaxation, calmness" };
    if (freq <= 30) return { name: "Beta", color: "#f59e0b", description: "Focus, alertness" };
    return { name: "Gamma", color: "#ef4444", description: "Higher mental activity" };
  };

  const brainWave = getBrainWaveCategory(beatFrequency);

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-cyan-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Brain className="h-4 w-4 text-cyan-400" />
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
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-300/10 flex items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{
                      background: `linear-gradient(to right, ${brainWave.color}40, ${brainWave.color}90)`,
                      boxShadow: `0 0 15px ${brainWave.color}50`,
                    }}
                  >
                    {beatFrequency.toFixed(1)}
                    <span className="text-xs ml-1">Hz</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                {brainWave.name}: {brainWave.description}
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white">Left Ear Frequency: {leftFreq} Hz</Label>
                </div>
                <Slider
                  value={[leftFreq]}
                  min={50}
                  max={500}
                  step={1}
                  onValueChange={(value) => setLeftFreq(value[0])}
                  className="py-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white">Right Ear Frequency: {rightFreq} Hz</Label>
                </div>
                <Slider
                  value={[rightFreq]}
                  min={50}
                  max={500}
                  step={1}
                  onValueChange={(value) => setRightFreq(value[0])}
                  className="py-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white">Volume: {volume}%</Label>
                  <Button variant="ghost" size="icon" onClick={toggleMute} className="h-6 w-6 text-white">
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => setVolume(value[0])}
                  disabled={isMuted}
                  className="py-2"
                />
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-white">Wave Type:</Label>
                <div className="flex gap-2">
                  {["sine", "square", "triangle", "sawtooth"].map((type) => (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 text-white border border-white/10",
                        waveType === type && "bg-cyan-500/20 border-cyan-400/30"
                      )}
                      onClick={() => setWaveType(type as OscillatorType)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Player Controls */}
            <div>
              <div className="flex justify-center gap-4 mt-6">
                <Button
                  variant="default"
                  size="lg"
                  onClick={togglePlay}
                  className={cn(
                    "w-16 h-16 rounded-full bg-gradient-to-br shadow-lg",
                    isPlaying ? "from-cyan-600 to-cyan-800" : "from-cyan-500 to-cyan-700"
                  )}
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8 text-white" />
                  ) : (
                    <Play className="h-8 w-8 text-white ml-1" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="presets" className="space-y-4">
            <TabsList className="grid grid-cols-3 bg-black/40">
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="timer">Timer</TabsTrigger>
              <TabsTrigger value="heartrate">Heart Rate</TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="space-y-4">
              <div className="grid gap-3">
                {presets.slice(0, 6).map((preset) => (
                  <div
                    key={preset.name}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors",
                      activePreset === preset.name && "bg-cyan-950/30 border border-cyan-500/20"
                    )}
                    onClick={() => applyPreset(preset.name)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: getBrainWaveCategory(
                            Math.abs(preset.rightFreq - preset.leftFreq)
                          ).color,
                        }}
                      />
                      <h4 className="font-medium text-white">{preset.name}</h4>
                      <div className="ml-auto text-xs text-white/60">
                        {Math.abs(preset.rightFreq - preset.leftFreq)} Hz
                      </div>
                    </div>
                    <p className="text-xs text-white/60 mt-1 ml-5">{preset.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="timer" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-white block mb-2">Session Duration (minutes)</Label>
                  <Slider
                    value={[timerDuration]}
                    min={1}
                    max={60}
                    step={1}
                    onValueChange={(value) => setTimerDuration(value[0])}
                    className="py-2"
                  />
                  <div className="text-center text-sm text-white/60 mt-1">{timerDuration} minutes</div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-white">Automatic Timer</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={timerActive} onCheckedChange={setTimerActive} disabled={!isPlaying} />
                    <span className="text-sm text-white/60">{timerActive ? "Active" : "Disabled"}</span>
                  </div>
                </div>

                {timerActive && (
                  <div className="rounded-lg bg-black/40 p-3 text-center">
                    <div className="text-2xl font-bold text-white mb-2">{formatTime(timerRemaining)}</div>
                    <p className="text-sm text-white/80">
                      Tones will stop playing when the timer reaches zero
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="heartrate" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Heart Rate Detection</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={showPulseDetection} onCheckedChange={setShowPulseDetection} />
                  <span className="text-sm text-white/60">{showPulseDetection ? "Enabled" : "Disabled"}</span>
                </div>
              </div>

              {showPulseDetection ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-black/40 overflow-hidden">
                    <video ref={videoRef} className="hidden" />
                    <canvas
                      ref={canvasRef}
                      width={320}
                      height={240}
                      className="w-full h-40 rounded-lg bg-black/80"
                    />
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{heartRate ? `${heartRate} BPM` : "Detecting..."}</div>
                    <p className="text-xs text-white/60 mt-1">
                      Position your finger over the camera for best results
                    </p>
                  </div>

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
            </TabsContent>
          </Tabs>

          {/* Save Preset Modal */}
          {showSavePreset && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full">
                <h3 className="text-xl font-semibold text-white mb-4">Save Custom Preset</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Preset Name</Label>
                    <Input
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="My Custom Preset"
                      className="mt-1"
                    />
                  </div>
                  <div className="text-sm text-white/80">
                    <div className="grid grid-cols-2 gap-2">
                      <div>Left Frequency: {leftFreq} Hz</div>
                      <div>Right Frequency: {rightFreq} Hz</div>
                      <div>Beat Frequency: {beatFrequency.toFixed(1)} Hz</div>
                      <div>Wave Type: {waveType}</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" onClick={() => setShowSavePreset(false)}>
                      Cancel
                    </Button>
                    <Button onClick={savePreset} disabled={!presetName.trim()}>
                      Save Preset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}