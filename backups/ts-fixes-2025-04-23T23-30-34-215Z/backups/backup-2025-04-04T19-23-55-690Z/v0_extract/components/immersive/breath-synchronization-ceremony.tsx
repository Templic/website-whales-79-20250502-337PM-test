"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CosmicCard } from "@/components/ui/cosmic/cosmic-card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipForward, SkipBack, Settings } from "lucide-react"

interface BreathPattern {
  id: string
  name: string
  description: string
  inhale: number
  hold1: number
  exhale: number
  hold2: number
  color: string
}

const breathPatterns: BreathPattern[] = [
  {
    id: "pattern-1",
    name: "4-7-8 Relaxation",
    description: "Calms the nervous system and promotes relaxation",
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    color: "#9C27B0",
  },
  {
    id: "pattern-2",
    name: "Box Breathing",
    description: "Reduces stress and improves concentration",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    color: "#3F51B5",
  },
  {
    id: "pattern-3",
    name: "Wim Hof Method",
    description: "Increases energy and immune response",
    inhale: 2,
    hold1: 0,
    exhale: 2,
    hold2: 0,
    color: "#2196F3",
  },
  {
    id: "pattern-4",
    name: "Cosmic Expansion",
    description: "Opens consciousness to higher dimensions",
    inhale: 6,
    hold1: 2,
    exhale: 7,
    hold2: 0,
    color: "#673AB7",
  },
]

type BreathPhase = "inhale" | "hold1" | "exhale" | "hold2"

export function BreathSynchronizationCeremony() {
  const [selectedPattern, setSelectedPattern] = useState<BreathPattern>(breathPatterns[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>("inhale")
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [customPattern, setCustomPattern] = useState<BreathPattern>({
    id: "custom",
    name: "Custom Pattern",
    description: "Your personalized breath pattern",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 2,
    color: "#FF5722",
  })
  const [isCustomizing, setIsCustomizing] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/audio/soft-bell.mp3")
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Handle breath cycle
  useEffect(() => {
    if (isPlaying) {
      // Set initial time remaining based on current phase
      setTimeRemaining(selectedPattern[currentPhase])

      // Start the interval
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            // Play sound at phase change
            if (audioRef.current) {
              audioRef.current.currentTime = 0
              audioRef.current.play().catch((err) => console.error("Audio play failed:", err))
            }

            // Move to next phase
            let nextPhase: BreathPhase
            switch (currentPhase) {
              case "inhale":
                nextPhase = selectedPattern.hold1 > 0 ? "hold1" : "exhale"
                break
              case "hold1":
                nextPhase = "exhale"
                break
              case "exhale":
                nextPhase = selectedPattern.hold2 > 0 ? "hold2" : "inhale"
                break
              case "hold2":
              default:
                nextPhase = "inhale"
                break
            }

            setCurrentPhase(nextPhase)
            return selectedPattern[nextPhase]
          }
          return prev - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, currentPhase, selectedPattern])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  // Select a breath pattern
  const selectPattern = useCallback(
    (pattern: BreathPattern) => {
      setSelectedPattern(pattern)
      setCurrentPhase("inhale")
      setTimeRemaining(pattern.inhale)

      // If already playing, restart with new pattern
      if (isPlaying) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        setIsPlaying(true)
      }
    },
    [isPlaying],
  )

  // Update custom pattern
  const updateCustomPattern = useCallback((key: keyof BreathPattern, value: number) => {
    setCustomPattern((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  // Toggle custom pattern editor
  const toggleCustomizing = useCallback(() => {
    setIsCustomizing((prev) => !prev)
    if (!isCustomizing) {
      setIsPlaying(false)
    }
  }, [isCustomizing])

  // Save custom pattern
  const saveCustomPattern = useCallback(() => {
    setSelectedPattern(customPattern)
    setIsCustomizing(false)
    setCurrentPhase("inhale")
    setTimeRemaining(customPattern.inhale)
  }, [customPattern])

  // Get phase display text
  const getPhaseText = useCallback(() => {
    switch (currentPhase) {
      case "inhale":
        return "Inhale"
      case "hold1":
        return "Hold"
      case "exhale":
        return "Exhale"
      case "hold2":
        return "Hold"
      default:
        return ""
    }
  }, [currentPhase])

  // Calculate circle size based on phase
  const getCircleSize = useCallback(() => {
    switch (currentPhase) {
      case "inhale":
        return "scale(1)"
      case "hold1":
        return "scale(1)"
      case "exhale":
        return "scale(0.8)"
      case "hold2":
        return "scale(0.8)"
      default:
        return "scale(0.9)"
    }
  }, [currentPhase])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <CosmicCard className="p-6">
        <AnimatePresence mode="wait">
          {isCustomizing ? (
            <motion.div
              key="custom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h3 className="text-white font-medium text-lg text-center">Customize Your Breath Pattern</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-white/80 text-sm block mb-2">Inhale Duration (seconds)</label>
                    <Slider
                      value={[customPattern.inhale]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("inhale", value[0])}
                    />
                    <div className="text-right text-white/60 text-sm mt-1">{customPattern.inhale}s</div>
                  </div>

                  <div>
                    <label className="text-white/80 text-sm block mb-2">Hold After Inhale (seconds)</label>
                    <Slider
                      value={[customPattern.hold1]}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("hold1", value[0])}
                    />
                    <div className="text-right text-white/60 text-sm mt-1">{customPattern.hold1}s</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-white/80 text-sm block mb-2">Exhale Duration (seconds)</label>
                    <Slider
                      value={[customPattern.exhale]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("exhale", value[0])}
                    />
                    <div className="text-right text-white/60 text-sm mt-1">{customPattern.exhale}s</div>
                  </div>

                  <div>
                    <label className="text-white/80 text-sm block mb-2">Hold After Exhale (seconds)</label>
                    <Slider
                      value={[customPattern.hold2]}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("hold2", value[0])}
                    />
                    <div className="text-right text-white/60 text-sm mt-1">{customPattern.hold2}s</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <Button variant="outline" onClick={toggleCustomizing}>
                  Cancel
                </Button>
                <Button onClick={saveCustomPattern}>Save Pattern</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Breath Patterns */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-medium">Breath Patterns</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCustomizing}
                    className="text-white/70 hover:text-white"
                  >
                    <Settings className="h-4 w-4 mr-1" /> Customize
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {[...breathPatterns, customPattern].map((pattern) => (
                    <motion.button
                      key={pattern.id}
                      onClick={() => selectPattern(pattern)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedPattern.id === pattern.id
                          ? "bg-white/10 border border-white/20"
                          : "bg-black/20 border border-transparent hover:bg-black/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex-shrink-0"
                          style={{
                            background: `conic-gradient(
                              ${pattern.color} 0%, 
                              ${pattern.color} ${(pattern.inhale / (pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2)) * 100}%, 
                              ${pattern.color}80 ${(pattern.inhale / (pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2)) * 100}%, 
                              ${pattern.color}80 ${((pattern.inhale + pattern.hold1) / (pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2)) * 100}%, 
                              ${pattern.color}60 ${((pattern.inhale + pattern.hold1) / (pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2)) * 100}%, 
                              ${pattern.color}60 ${((pattern.inhale + pattern.hold1 + pattern.exhale) / (pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2)) * 100}%, 
                              ${pattern.color}40 ${((pattern.inhale + pattern.hold1 + pattern.exhale) / (pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2)) * 100}%, 
                              ${pattern.color}40 100%
                            )`,
                          }}
                        />
                        <div>
                          <div className="text-white text-sm">{pattern.name}</div>
                          <div className="text-white/60 text-xs">{pattern.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Breath Visualization */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 mb-6">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-white/20"
                    style={{ borderColor: `${selectedPattern.color}40` }}
                  />

                  <motion.div
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${selectedPattern.color}20`,
                      transform: getCircleSize(),
                      transition: "transform 1s ease-in-out",
                    }}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{timeRemaining}</div>
                      <div className="text-white/80 text-sm">{getPhaseText()}</div>
                    </div>
                  </motion.div>
                </div>

                <div className="w-full space-y-4">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setIsPlaying(false)
                        setCurrentPhase("inhale")
                        setTimeRemaining(selectedPattern.inhale)
                      }}
                      disabled={!isPlaying}
                      className="text-white/70 hover:text-white"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={togglePlay}
                      className={`px-8 ${
                        isPlaying
                          ? "bg-white/20 hover:bg-white/30 border border-white/20"
                          : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" /> Begin
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (intervalRef.current) {
                          clearInterval(intervalRef.current)
                        }

                        // Skip to next phase
                        let nextPhase: BreathPhase
                        switch (currentPhase) {
                          case "inhale":
                            nextPhase = selectedPattern.hold1 > 0 ? "hold1" : "exhale"
                            break
                          case "hold1":
                            nextPhase = "exhale"
                            break
                          case "exhale":
                            nextPhase = selectedPattern.hold2 > 0 ? "hold2" : "inhale"
                            break
                          case "hold2":
                          default:
                            nextPhase = "inhale"
                            break
                        }

                        setCurrentPhase(nextPhase)
                        setTimeRemaining(selectedPattern[nextPhase])

                        // Restart interval if playing
                        if (isPlaying) {
                          setIsPlaying(true)
                        }
                      }}
                      disabled={!isPlaying}
                      className="text-white/70 hover:text-white"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-center text-white/60 text-sm">
                    {selectedPattern.inhale}-{selectedPattern.hold1}-{selectedPattern.exhale}-{selectedPattern.hold2}{" "}
                    Rhythm
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CosmicCard>
    </div>
  )
}

