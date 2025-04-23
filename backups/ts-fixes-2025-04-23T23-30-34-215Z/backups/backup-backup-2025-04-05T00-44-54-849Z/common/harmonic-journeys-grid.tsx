/**
 * harmonic-journeys-grid.tsx
 * 
 * Component Type: common
 * Migrated from imported components.
 */
/**
 * harmonic-journeys-grid.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Play, Pause, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { CosmicCard } from "@/components/cosmic-card"
import { CosmicText } from "@/components/cosmic-text"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ChakraFrequency {
  name: string
  frequency: number
  color: string
  description: string
  benefits: string[]
  imageSrc: string
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  imageSrc: string
  category: string
}

interface HarmonicJourneysGridProps {
  chakraFrequencies?: ChakraFrequency[]
  events?: Event[]
  title?: string
  subtitle?: string
}

export function HarmonicJourneysGrid({
  chakraFrequencies = [
    {
      name: "Root Chakra",
      frequency: 396,
      color: "#FF0000",
      description: "The foundation of our energy system, connected to feelings of safety and security.",
      benefits: ["Grounding", "Stability", "Physical vitality", "Courage"],
      imageSrc: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Sacral Chakra",
      frequency: 417,
      color: "#FF8C00",
      description: "Center of creativity, pleasure, and emotional well-being.",
      benefits: ["Creativity", "Emotional balance", "Sensuality", "Adaptability"],
      imageSrc: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Solar Plexus",
      frequency: 528,
      color: "#FFFF00",
      description: "Our personal power center, governing self-esteem and confidence.",
      benefits: ["Confidence", "Willpower", "Self-discipline", "Clarity"],
      imageSrc: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Heart Chakra",
      frequency: 639,
      color: "#00FF00",
      description: "The bridge between lower and higher chakras, center of love and compassion.",
      benefits: ["Love", "Compassion", "Forgiveness", "Harmony"],
      imageSrc: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Throat Chakra",
      frequency: 741,
      color: "#00BFFF",
      description: "Our communication center, expressing our truth and creativity.",
      benefits: ["Clear communication", "Self-expression", "Authenticity", "Resonance"],
      imageSrc: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Third Eye",
      frequency: 852,
      color: "#0000FF",
      description: "Seat of intuition and inner wisdom, connecting us to deeper insights.",
      benefits: ["Intuition", "Clarity", "Imagination", "Psychic abilities"],
      imageSrc: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Crown Chakra",
      frequency: 963,
      color: "#9400D3",
      description: "Our connection to higher consciousness and spiritual awareness.",
      benefits: ["Spiritual connection", "Enlightenment", "Universal consciousness", "Bliss"],
      imageSrc: "/placeholder.svg?height=300&width=300",
    },
  ],
  events = [],
  title = "Harmonic Journeys",
  subtitle = "Explore the healing frequencies of the chakra system and upcoming ceremonies",
}: HarmonicJourneysGridProps) {
  const [playingFrequency, setPlayingFrequency] = useState<number | null>(null)
  const [selectedChakra, setSelectedChakra] = useState<ChakraFrequency | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)

  // Handle play/pause for chakra frequencies
  const togglePlay = (frequency: number) => {
    if (playingFrequency === frequency) {
      // Stop playing
      if (audioRef) {
        audioRef.pause()
        audioRef.currentTime = 0
      }
      setPlayingFrequency(null)
    } else {
      // Stop current audio if playing
      if (audioRef) {
        audioRef.pause()
        audioRef.currentTime = 0
      }

      // Create a new audio context and oscillator for the frequency
      try {
        const audio = new Audio()
        const context = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = context.createOscillator()
        const gainNode = context.createGain()

        oscillator.type = "sine"
        oscillator.frequency.value = frequency
        gainNode.gain.value = 0.1

        oscillator.connect(gainNode)
        gainNode.connect(context.destination)

        oscillator.start()

        // Store reference to audio and oscillator for cleanup
        setAudioRef(audio)
        setPlayingFrequency(frequency)

        // Add a timeout to stop after 30 seconds to prevent continuous playing
        setTimeout(() => {
          if (oscillator) {
            oscillator.stop()
            setPlayingFrequency(null)
          }
        }, 30000)
      } catch (error) {
        console.error("Error playing frequency:", error)
      }
    }
  }

  // Open chakra details dialog
  const openChakraDetails = (chakra: ChakraFrequency) => {
    setSelectedChakra(chakra)
  }

  // Close chakra details dialog
  const closeChakraDetails = () => {
    setSelectedChakra(null)
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <CosmicText variant="subtitle" className="text-white mb-2">
          {title}
        </CosmicText>
        <p className="text-white/70 max-w-2xl mx-auto">{subtitle}</p>
      </div>

      {/* Chakra Frequencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {chakraFrequencies.map((chakra, index) => (
          <motion.div
            key={chakra.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <CosmicCard className="p-4 h-full flex flex-col" glowColor={chakra.color + "80"}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: chakra.color + "40", border: `2px solid ${chakra.color}` }}
                >
                  <span className="text-xs font-bold text-white">{chakra.frequency}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{chakra.name}</h3>
                  <p className="text-white/60 text-sm">{chakra.frequency} Hz</p>
                </div>
              </div>

              <p className="text-white/70 text-sm mb-4 line-clamp-2">{chakra.description}</p>

              <div className="mt-auto flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-white/10 hover:bg-white/10",
                    playingFrequency === chakra.frequency && "bg-purple-500/20 border-purple-500/50",
                  )}
                  onClick={() => togglePlay(chakra.frequency)}
                >
                  {playingFrequency === chakra.frequency ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" /> Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" /> Play
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => openChakraDetails(chakra)}
                >
                  <Info className="h-4 w-4 mr-1" /> Details
                </Button>
              </div>
            </CosmicCard>
          </motion.div>
        ))}
      </div>

      {/* Cosmic Grid Connector */}
      <div className="relative py-8">
        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-purple-500/80 to-indigo-500/80"></div>
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
        </div>
        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative">
              <div className="absolute top-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500/80"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Events Grid (if events are provided) */}
      {events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <CosmicCard className="p-0 overflow-hidden h-full flex flex-col">
                <div className="relative h-40">
                  <Image src={event.imageSrc || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-4">
                    <span className="px-2 py-1 bg-purple-500/80 text-white text-xs rounded-full">{event.category}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-white font-medium text-lg mb-1">{event.title}</h3>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-white/70 text-sm">{event.date}</div>
                    <div className="text-white/70 text-sm">{event.time}</div>
                  </div>

                  <p className="text-white/70 text-sm mb-3">{event.location}</p>

                  <p className="text-white/60 text-sm line-clamp-3 mb-4">{event.description}</p>

                  <div className="mt-auto">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                      Register Now
                    </Button>
                  </div>
                </div>
              </CosmicCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Chakra Details Dialog */}
      <Dialog open={!!selectedChakra} onOpenChange={() => closeChakraDetails()}>
        <DialogContent className="bg-black/90 border border-purple-500/30 backdrop-blur-lg max-w-2xl">
          {selectedChakra && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: selectedChakra.color }}></div>
                  {selectedChakra.name} - {selectedChakra.frequency} Hz
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Explore the healing properties and benefits of this frequency
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6 py-4">
                <div>
                  <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={selectedChakra.imageSrc || "/placeholder.svg"}
                      alt={selectedChakra.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <Button
                    className={cn(
                      "w-full",
                      playingFrequency === selectedChakra.frequency
                        ? "bg-purple-500/20 border border-purple-500/50 text-purple-300"
                        : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700",
                    )}
                    onClick={() => togglePlay(selectedChakra.frequency)}
                  >
                    {playingFrequency === selectedChakra.frequency ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" /> Stop Playing
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" /> Play {selectedChakra.frequency} Hz
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Description</h4>
                    <p className="text-white/70 text-sm">{selectedChakra.description}</p>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2">Benefits</h4>
                    <ul className="grid grid-cols-2 gap-2">
                      {selectedChakra.benefits.map((benefit) => (
                        <li key={benefit} className="text-white/70 text-sm flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedChakra.color }}></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2">Recommended Practice</h4>
                    <p className="text-white/70 text-sm">
                      Listen to this frequency for 5-15 minutes daily while meditating or during relaxation. Focus your
                      attention on the area of the body associated with this chakra to enhance the effects.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

