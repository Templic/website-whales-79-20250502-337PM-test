"use client";

import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Volume2, VolumeX, BrainCircuit } from "lucide-react";

interface BinauralBeatGeneratorProps {
  className?: string;
}

type BrainwavePreset = {
  name: string;
  carrierFreq: number;
  beatFreq: number;
  description: string;
};

export function BinauralBeatGenerator({ className }: BinauralBeatGeneratorProps) {
  // Audio context and oscillators
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // User interaction is required before AudioContext can start
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);

  // Frequencies and state
  const [carrierFrequency, setCarrierFrequency] = useState(256);
  const [beatFrequency, setBeatFrequency] = useState(7.83); // Schumann resonance
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("custom");

  // Presets for different brainwave states
  const presets: Record<string, BrainwavePreset> = {
    custom: {
      name: "Custom",
      carrierFreq: 256,
      beatFreq: 7.83,
      description: "Create your own custom binaural beat",
    },
    delta: {
      name: "Delta",
      carrierFreq: 256,
      beatFreq: 2.5,
      description: "Deep sleep, healing (0.5-4 Hz)",
    },
    theta: {
      name: "Theta",
      carrierFreq: 256,
      beatFreq: 6,
      description: "Meditation, creativity, dream state (4-8 Hz)",
    },
    alpha: {
      name: "Alpha",
      carrierFreq: 256,
      beatFreq: 10,
      description: "Relaxation, calmness, present awareness (8-13 Hz)",
    },
    schumann: {
      name: "Schumann Resonance",
      carrierFreq: 256,
      beatFreq: 7.83,
      description: "Earth's electromagnetic frequency (7.83 Hz)",
    },
    beta: {
      name: "Beta",
      carrierFreq: 256,
      beatFreq: 20,
      description: "Focus, alertness, active thinking (13-30 Hz)",
    },
    gamma: {
      name: "Gamma",
      carrierFreq: 256,
      beatFreq: 40,
      description: "Higher mental activity, insight (30-100 Hz)",
    },
  };

  // Initialize audio context when user interacts
  const initializeAudioContext = () => {
    if (audioContextInitialized) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      // Set initial volume
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = volume / 100;
      }
      
      setAudioContextInitialized(true);
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (leftOscillatorRef.current) {
        leftOscillatorRef.current.stop();
        leftOscillatorRef.current.disconnect();
      }
      if (rightOscillatorRef.current) {
        rightOscillatorRef.current.stop();
        rightOscillatorRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (!gainNodeRef.current) return;
    
    // Use the value directly to set the gain
    const volumeValue = isMuted ? 0 : volume / 100;
    gainNodeRef.current.gain.value = volumeValue;
  }, [volume, isMuted]);

  // Start or stop binaural beat generation
  useEffect(() => {
    if (!audioContextInitialized) return;

    if (isPlaying) {
      startBinauralBeat();
    } else {
      stopBinauralBeat();
    }

    return () => {
      if (isPlaying) {
        stopBinauralBeat();
      }
    };
  }, [isPlaying, carrierFrequency, beatFrequency, audioContextInitialized]);

  // Start binaural beat generation
  const startBinauralBeat = () => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    // Stop any existing oscillators
    stopBinauralBeat();

    try {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Create oscillators for left and right channels
      const leftFreq = carrierFrequency - (beatFrequency / 2);
      const rightFreq = carrierFrequency + (beatFrequency / 2);

      // Left channel oscillator
      leftOscillatorRef.current = audioContextRef.current.createOscillator();
      leftOscillatorRef.current.type = 'sine';
      leftOscillatorRef.current.frequency.value = leftFreq;

      // Right channel oscillator
      rightOscillatorRef.current = audioContextRef.current.createOscillator();
      rightOscillatorRef.current.type = 'sine';
      rightOscillatorRef.current.frequency.value = rightFreq;

      // Create stereo panner for left and right channels
      const leftPanner = audioContextRef.current.createStereoPanner();
      const rightPanner = audioContextRef.current.createStereoPanner();
      
      leftPanner.pan.value = -1; // Full left
      rightPanner.pan.value = 1; // Full right
      
      // Connect oscillators to panners to gain node to output
      leftOscillatorRef.current.connect(leftPanner);
      rightOscillatorRef.current.connect(rightPanner);
      leftPanner.connect(gainNodeRef.current);
      rightPanner.connect(gainNodeRef.current);
      
      // Start the oscillators
      leftOscillatorRef.current.start();
      rightOscillatorRef.current.start();
    } catch (error) {
      console.error("Error starting binaural beat:", error);
      setIsPlaying(false);
    }
  };

  // Stop binaural beat generation
  const stopBinauralBeat = () => {
    try {
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
    } catch (error) {
      console.error("Error stopping binaural beat:", error);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioContextInitialized) {
      initializeAudioContext();
    }
    setIsPlaying(!isPlaying);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Handle preset selection
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value !== "custom" && presets[value]) {
      setCarrierFrequency(presets[value].carrierFreq);
      setBeatFrequency(presets[value].beatFreq);
    }
  };

  return (
    <div className={`p-6 rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Binaural Beat Generator</h3>
            <p className="text-xs text-white/60">Create healing frequencies for your mind</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="border-white/10 text-white hover:bg-white/5"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="default"
            onClick={togglePlay}
            className={isPlaying ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? "Stop" : "Start"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Preset selection */}
        <div className="space-y-2">
          <Label className="text-white">Brainwave Preset</Label>
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="bg-black/30 border-white/10 text-white">
              <SelectValue placeholder="Select a preset" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/10">
              {Object.keys(presets).map((key) => (
                <SelectItem key={key} value={key} className="text-white hover:bg-white/10">
                  {presets[key].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-white/60">
            {presets[selectedPreset]?.description || "Select a preset to see description"}
          </p>
        </div>

        {/* Carrier frequency control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-white">Carrier Frequency</Label>
            <span className="text-sm text-white/80 font-mono">{carrierFrequency.toFixed(1)} Hz</span>
          </div>
          <Slider
            min={100}
            max={500}
            step={1}
            value={[carrierFrequency]}
            onValueChange={(value) => {
              setCarrierFrequency(value[0]);
              setSelectedPreset("custom");
            }}
            className="cursor-pointer"
          />
          <p className="text-xs text-white/60">
            The main tone you hear (100-500 Hz)
          </p>
        </div>

        {/* Beat frequency control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-white">Beat Frequency</Label>
            <span className="text-sm text-white/80 font-mono">{beatFrequency.toFixed(2)} Hz</span>
          </div>
          <Slider
            min={0.5}
            max={50}
            step={0.1}
            value={[beatFrequency]}
            onValueChange={(value) => {
              setBeatFrequency(value[0]);
              setSelectedPreset("custom");
            }}
            className="cursor-pointer"
          />
          <p className="text-xs text-white/60">
            The difference between left and right ear (0.5-50 Hz)
          </p>
        </div>

        {/* Volume control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-white">Volume</Label>
            <span className="text-sm text-white/80">{volume}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            className="cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-6 p-3 bg-white/5 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">How to use:</h4>
        <ul className="text-xs text-white/70 space-y-1 list-disc pl-4">
          <li>Use headphones for best results</li>
          <li>Set the carrier frequency to a comfortable tone</li>
          <li>Choose a beat frequency based on your desired mental state</li>
          <li>Listen for at least 5-10 minutes to experience effects</li>
          <li>Do not use while driving or operating machinery</li>
        </ul>
      </div>
    </div>
  );
}