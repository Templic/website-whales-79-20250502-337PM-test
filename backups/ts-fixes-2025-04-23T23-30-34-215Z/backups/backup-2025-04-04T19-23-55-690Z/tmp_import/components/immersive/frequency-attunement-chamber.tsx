"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { CosmicCard } from "@/components/ui/cosmic/cosmic-card"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

interface FrequencyOption {
  name: string
  frequency: number
  color: string
}

const frequencyOptions: FrequencyOption[] = [
  { name: "Root Chakra", frequency: 396, color: "#FF5757" },
  { name: "Sacral Chakra", frequency: 417, color: "#FF8C42" },
  { name: "Solar Plexus", frequency: 528, color: "#FFCE45" },
  { name: "Heart Chakra", frequency: 639, color: "#4DFF73" },
  { name: "Throat Chakra", frequency: 741, color: "#45DDFF" },
  { name: "Third Eye", frequency: 852, color: "#4D4DFF" },
  { name: "Crown Chakra", frequency: 963, color: "#A64DFF" },
]

export function FrequencyAttunementChamber() {
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyOption>(frequencyOptions[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create gain node
      if (audioContextRef.current) {
        gainNodeRef.current = audioContextRef.current.createGain()
        gainNodeRef.current.connect(audioContextRef.current.destination)
      }
    }

    // Cleanup function
    return () => {
      stopSound()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Play or stop sound based on isPlaying state
  useEffect(() => {
    if (isPlaying) {
      playSound()
    } else {
      stopSound()
    }
  }, [isPlaying, selectedFrequency])

  // Play sound function
  const playSound = useCallback(() => {
    if (!audioContextRef.current || !gainNodeRef.current) return

    // Stop any existing oscillator
    stopSound()

    // Create and configure new oscillator
    const oscillator = audioContextRef.current.createOscillator()
    oscillator.type = "sine"
    oscillator.frequency.value = selectedFrequency.frequency
    oscillator.connect(gainNodeRef.current)

    // Start oscillator
    oscillator.start()
    oscillatorRef.current = oscillator
  }, [selectedFrequency])

  // Stop sound function
  const stopSound = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current.disconnect()
      oscillatorRef.current = null
    }
  }, [])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  // Handle frequency selection
  const handleFrequencySelect = useCallback((frequency: FrequencyOption) => {
    setSelectedFrequency(frequency)
    // If already playing, this will trigger the useEffect to restart with new frequency
  }, [])

  // Handle volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0])
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <CosmicCard className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Frequency Selector */}
          <div>
            <h3 className="text-white font-medium mb-4">Select Frequency</h3>
            <div className="grid grid-cols-2 gap-3">
              {frequencyOptions.map((option) => (
                <motion.button
                  key={option.name}
                  onClick={() => handleFrequencySelect(option)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    selectedFrequency.name === option.name
                      ? "bg-white/10 border border-white/20"
                      : "bg-black/20 border border-transparent hover:bg-black/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{ backgroundColor: `${option.color}40`, border: `2px solid ${option.color}` }}
                    >
                      {option.frequency}
                    </div>
                    <div>
                      <div className="text-white text-sm">{option.name}</div>
                      <div className="text-white/60 text-xs">{option.frequency} Hz</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Frequency Player */}
          <div className="flex flex-col">
            <h3 className="text-white font-medium mb-4">Frequency Player</h3>

            <div className="flex-1 flex flex-col justify-center items-center p-6 bg-black/20 rounded-lg border border-white/10">
              <div
                className="w-32 h-32 rounded-full mb-6 flex items-center justify-center"
                style={{
                  backgroundColor: `${selectedFrequency.color}20`,
                  border: `3px solid ${selectedFrequency.color}`,
                  boxShadow: isPlaying ? `0 0 30px ${selectedFrequency.color}50` : "none",
                  transition: "box-shadow 0.5s ease",
                }}
              >
                <motion.div
                  className="text-2xl font-bold text-white"
                  animate={{
                    scale: isPlaying ? [1, 1.05, 1] : 1,
                    opacity: isPlaying ? [1, 0.8, 1] : 1,
                  }}
                  transition={{
                    repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
                    duration: 2,
                  }}
                >
                  {selectedFrequency.frequency} Hz
                </motion.div>
              </div>

              <div className="w-full flex flex-col gap-4">
                <Button
                  onClick={togglePlay}
                  className={`w-full ${
                    isPlaying
                      ? "bg-white/20 hover:bg-white/30 border border-white/20"
                      : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" /> Stop
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" /> Play
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/10">
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CosmicCard>
    </div>
  )
}

