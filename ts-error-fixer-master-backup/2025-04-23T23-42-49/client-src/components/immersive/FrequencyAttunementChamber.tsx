import React from "react";
"use client"

import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Waves, Volume2, VolumeX, Play, Pause } from "lucide-react";

// Type definition for frequency presets
interface FrequencyPreset {
  name: string;
  value: number;
  description: string;
}

export function FrequencyAttunementChamber() {
  const [frequency, setFrequency] = useState(432);
  const [harmony, setHarmony] = useState(50);
  const [resonance, setResonance] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  
  // Frequency presets
  const frequencyPresets: FrequencyPreset[] = [
    { name: "Earth Resonance", value: 7.83, description: "Schumann Resonance - Earth's electromagnetic field frequency" },
    { name: "Deep Healing", value: 432, description: "Natural frequency alignment with universal mathematics" },
    { name: "Solfeggio", value: 528, description: "DNA repair frequency from ancient Solfeggio scale" },
    { name: "Heart Chakra", value: 639, description: "Heart chakra frequency for love and harmony" },
  ];
  
  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const harmonicOscillatorRef = useRef<OscillatorNode | null>(null);
  const harmonicGainRef = useRef<GainNode | null>(null);

  // Environment sound refs
  const environmentSoundsRef = useRef<{
    [key: string]: { gain: GainNode | null; active: boolean; level: number };
  }>({
    ocean: { gain: null, active: true, level: 60 },
    bowls: { gain: null, active: true, level: 40 },
    forest: { gain: null, active: true, level: 25 },
    rain: { gain: null, active: true, level: 35 },
  });

  // Initialize audio context
  useEffect(() => {
    // Initialize the audio context only when needed
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || 
        (window as any).webkitAudioContext)();
      
      // Create the master gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = (isMuted ? 0 : volume / 100);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      // Create a harmonic gain node
      harmonicGainRef.current = audioContextRef.current.createGain();
      harmonicGainRef.current.gain.value = harmony / 100;
      harmonicGainRef.current.connect(gainNodeRef.current);
    }

    return () => {
      // Clean up audio context when component unmounts
      if (audioContextRef.current) {
        stopAllSounds();
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Update gain node volume when volume or mute state changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Update harmonic gain level when harmony changes
  useEffect(() => {
    if (harmonicGainRef.current) {
      harmonicGainRef.current.gain.value = harmony / 200; // Reduced to avoid overwhelming
    }
  }, [harmony]);

  // Start/stop oscillator based on isPlaying state
  useEffect(() => {
    if (isPlaying) {
      startSound();
    } else {
      stopSound();
    }
    
    return () => {
      if (oscillatorRef.current) {
        stopSound();
      }
    };
  }, [isPlaying]);

  // Update frequency when it changes
  useEffect(() => {
    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(
        frequency, 
        audioContextRef.current.currentTime
      );
      
      if (harmonicOscillatorRef.current) {
        // Set harmonic to 1.5x main frequency (perfect fifth)
        harmonicOscillatorRef.current.frequency.setValueAtTime(
          frequency * 1.5, 
          audioContextRef.current.currentTime
        );
      }
    }
  }, [frequency]);

  // Start the sound
  const startSound = () => {
    if (!audioContextRef.current) return;
    
    // If suspended (browser policy), resume
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    // Create the main oscillator
    oscillatorRef.current = audioContextRef.current.createOscillator();
    oscillatorRef.current.type = 'sine';
    oscillatorRef.current.frequency.setValueAtTime(
      frequency, 
      audioContextRef.current.currentTime
    );
    oscillatorRef.current.connect(gainNodeRef.current!);
    
    // Create a harmonic oscillator
    harmonicOscillatorRef.current = audioContextRef.current.createOscillator();
    harmonicOscillatorRef.current.type = 'sine';
    harmonicOscillatorRef.current.frequency.setValueAtTime(
      frequency * 1.5, 
      audioContextRef.current.currentTime
    );
    harmonicOscillatorRef.current.connect(harmonicGainRef.current!);
    
    // Start oscillators
    oscillatorRef.current.start();
    harmonicOscillatorRef.current.start();
  };

  // Stop the sound
  const stopSound = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    
    if (harmonicOscillatorRef.current) {
      harmonicOscillatorRef.current.stop();
      harmonicOscillatorRef.current.disconnect();
      harmonicOscillatorRef.current = null;
    }
  };

  // Stop all sounds including environment sounds
  const stopAllSounds = () => {
    stopSound();
    
    // Stop environment sounds if implemented
    Object.values(environmentSoundsRef.current).forEach(sound => {
      if (sound.gain) {
        sound.gain.disconnect();
        sound.gain = null;
      }
    });
  };

  // Toggle play/pause
  const togglePlay = () => {
    // Resume audio context if it's suspended (browser policy)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Apply preset
  const applyPreset = (presetValue: number) => {
    setFrequency(presetValue);
    
    // If already playing, restart to apply new frequency immediately
    if (isPlaying) {
      stopSound();
      // Short timeout to ensure clean restart
      setTimeout(() => {
        startSound();
      }, 10);
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl overflow-hidden">
      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-6 border-r border-white/10">
          <div className="space-y-6">
            {/* Main Frequency Visualization */}
            <div className="h-48 rounded-lg bg-gradient-to-r from-cyan-950/70 via-cyan-500/30 to-cyan-950/70 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-white">{frequency.toFixed(2)}</div>
                <div className="text-white/60 mt-1">Hz</div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white">Frequency (Hz)</Label>
                </div>
                <Slider
                  value={[frequency]}
                  min={1}
                  max={1000}
                  step={0.01}
                  onValueChange={(value) => setFrequency(value[0])}
                  className="py-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white">Harmonic Resonance</Label>
                </div>
                <Slider
                  value={[harmony]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => setHarmony(value[0])}
                  className="py-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white">Ambience Blend</Label>
                </div>
                <Slider
                  value={[resonance]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => setResonance(value[0])}
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
            </div>

            {/* Play Button */}
            <div className="flex justify-center">
              <Button
                variant="default"
                size="lg"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 shadow-lg"
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

        <div className="p-6">
          <Tabs defaultValue="presets" className="space-y-4">
            <TabsList className="grid grid-cols-2 bg-black/40">
              <TabsTrigger value="presets">Frequency Presets</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="space-y-4">
              <div className="grid gap-3">
                {frequencyPresets.map((preset: FrequencyPreset) => (
                  <div
                    key={preset.name}
                    className="p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors border border-white/5"
                    onClick={() => applyPreset(preset.value)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{preset.name}</h4>
                      <div className="text-cyan-400 font-medium">{preset.value} Hz</div>
                    </div>
                    <p className="text-xs text-white/60 mt-1">{preset.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="environment" className="space-y-4">
              <div className="grid gap-3">
                <div className="p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-cyan-400" />
                    <h4 className="font-medium text-white">Ocean Waves</h4>
                    <Slider
                      value={[environmentSoundsRef.current.ocean.level]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => {
                        const newLevel = value[0];
                        environmentSoundsRef.current.ocean.level = newLevel;
                        
                        // Update gain node if it exists
                        if (environmentSoundsRef.current.ocean.gain) {
                          environmentSoundsRef.current.ocean.gain.gain.value = newLevel / 100;
                        }
                      }}
                      className="ml-auto w-24"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-cyan-400" />
                    <h4 className="font-medium text-white">Singing Bowls</h4>
                    <Slider
                      value={[environmentSoundsRef.current.bowls.level]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => {
                        const newLevel = value[0];
                        environmentSoundsRef.current.bowls.level = newLevel;
                        
                        // Update gain node if it exists
                        if (environmentSoundsRef.current.bowls.gain) {
                          environmentSoundsRef.current.bowls.gain.gain.value = newLevel / 100;
                        }
                      }}
                      className="ml-auto w-24"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-cyan-400" />
                    <h4 className="font-medium text-white">Forest Night</h4>
                    <Slider
                      value={[environmentSoundsRef.current.forest.level]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => {
                        const newLevel = value[0];
                        environmentSoundsRef.current.forest.level = newLevel;
                        
                        // Update gain node if it exists
                        if (environmentSoundsRef.current.forest.gain) {
                          environmentSoundsRef.current.forest.gain.gain.value = newLevel / 100;
                        }
                      }}
                      className="ml-auto w-24"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <Waves className="h-4 w-4 text-cyan-400" />
                    <h4 className="font-medium text-white">Rain</h4>
                    <Slider
                      value={[environmentSoundsRef.current.rain.level]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => {
                        const newLevel = value[0];
                        environmentSoundsRef.current.rain.level = newLevel;
                        
                        // Update gain node if it exists
                        if (environmentSoundsRef.current.rain.gain) {
                          environmentSoundsRef.current.rain.gain.gain.value = newLevel / 100;
                        }
                      }}
                      className="ml-auto w-24"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4 p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
            <p className="text-sm text-white/80">
              <span className="text-cyan-400 font-semibold">Attunement Chamber:</span> These frequencies interact with your brainwaves to induce specific states of consciousness. The environment sounds blend with the main frequency to create a unique sonic experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}