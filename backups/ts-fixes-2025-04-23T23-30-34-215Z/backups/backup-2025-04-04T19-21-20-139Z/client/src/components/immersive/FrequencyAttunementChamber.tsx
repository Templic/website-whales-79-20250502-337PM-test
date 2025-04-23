"use client"

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Waves, Volume2, VolumeX, Play, Pause } from "lucide-react";

export function FrequencyAttunementChamber() {
  const [frequency, setFrequency] = useState(432);
  const [harmony, setHarmony] = useState(50);
  const [resonance, setResonance] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  // Frequency presets
  const frequencyPresets = [
    { name: "Earth Resonance", value: 7.83, description: "Schumann Resonance - Earth's electromagnetic field frequency" },
    { name: "Deep Healing", value: 432, description: "Natural frequency alignment with universal mathematics" },
    { name: "Solfeggio", value: 528, description: "DNA repair frequency from ancient Solfeggio scale" },
    { name: "Heart Chakra", value: 639, description: "Heart chakra frequency for love and harmony" },
  ];

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Apply preset
  const applyPreset = (presetValue: number) => {
    setFrequency(presetValue);
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
                {frequencyPresets.map((preset) => (
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
                      value={[60]}
                      min={0}
                      max={100}
                      step={1}
                      className="ml-auto w-24"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-cyan-400" />
                    <h4 className="font-medium text-white">Singing Bowls</h4>
                    <Slider
                      value={[40]}
                      min={0}
                      max={100}
                      step={1}
                      className="ml-auto w-24"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-cyan-400" />
                    <h4 className="font-medium text-white">Forest Night</h4>
                    <Slider
                      value={[25]}
                      min={0}
                      max={100}
                      step={1}
                      className="ml-auto w-24"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <Waves className="h-4 w-4 text-cyan-400" />
                    <h4 className="font-medium text-white">Rain</h4>
                    <Slider
                      value={[35]}
                      min={0}
                      max={100}
                      step={1}
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