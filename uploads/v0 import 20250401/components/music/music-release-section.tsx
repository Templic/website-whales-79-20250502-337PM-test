"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Play, Pause, Volume2, VolumeX, Clock, Heart } from "lucide-react"
import { CosmicText } from "@/components/ui/cosmic/cosmic-text"
import { CosmicReveal } from "@/components/cosmic-interactive-effects"

interface MusicRelease {
  id: string
  title: string
  frequency: string
  duration: string
  coverArt: string
  audioSample: string
  description: string
}

// Sample data for new releases
const newReleases: MusicRelease[] = [
  {
    id: "release-1",
    title: "Celestial Awakening",
    frequency: "432 Hz",
    duration: "10:32",
    coverArt: "/placeholder.svg?height=300&width=300",
    audioSample: "#",
    description: "A journey through the cosmic awakening process, attuned to the healing frequency of 432 Hz.",
  },
  {
    id: "release-2",
    title: "Quantum Resonance",
    frequency: "528 Hz",
    duration: "8:45",
    coverArt: "/placeholder.svg?height=300&width=300",
    audioSample: "#",
    description: "Experience the DNA repair frequency of 528 Hz through this quantum resonance meditation.",
  },
  {
    id: "release-3",
    title: "Galactic Harmony",
    frequency: "639 Hz",
    duration: "12:18",
    coverArt: "/placeholder.svg?height=300&width=300",
    audioSample: "#",
    description: "Connect with the frequency of love and harmony at 639 Hz, balancing relationships and community.",
  },
]

export function MusicReleaseSection() {
  const [activeTrack, setActiveTrack] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  const togglePlay = useCallback((trackId: string) => {
    setActiveTrack((prevTrack) => (prevTrack === trackId ? null : trackId))
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  return (
    <div className="space-y-8">
      <CosmicText variant="subtitle" className="text-cosmic-purple mb-6">
        Experience our latest frequency-attuned sonic journeys
      </CosmicText>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {newReleases.map((release, index) => (
          <CosmicReveal key={release.id} delay={index * 0.1}>
            <div className="relative group">
              {/* Sacred geometry overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                aria-hidden="true"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="0.5" fill="none" />
                  <polygon points="50,5 95,50 50,95 5,50" stroke="white" strokeWidth="0.5" fill="none" />
                  <polygon points="50,15 85,50 50,85 15,50" stroke="white" strokeWidth="0.5" fill="none" />
                </svg>
              </div>

              {/* Cover Art */}
              <div className="relative aspect-square overflow-hidden mb-4 rounded-lg">
                <img
                  src={release.coverArt || "/placeholder.svg"}
                  alt={`Cover art for ${release.title}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />

                {/* Play/Pause Button */}
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => togglePlay(release.id)}
                  aria-label={activeTrack === release.id ? `Pause ${release.title}` : `Play ${release.title}`}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 rounded-full bg-cosmic-purple/80 flex items-center justify-center"
                  >
                    {activeTrack === release.id ? (
                      <Pause className="w-8 h-8 text-white" aria-hidden="true" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" aria-hidden="true" />
                    )}
                  </motion.div>
                </button>

                {/* Frequency Badge */}
                <div
                  className="absolute top-2 right-2 bg-black/70 text-cosmic-sea-300 px-3 py-1 rounded-full text-sm backdrop-blur-sm"
                  aria-label={`Frequency: ${release.frequency}`}
                >
                  {release.frequency}
                </div>
              </div>

              {/* Track Info */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">{release.title}</h3>
                <p className="text-sm text-cosmic-sea-200">{release.description}</p>

                {/* Track Controls */}
                <div className="flex items-center justify-between mt-3 text-white/70">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={toggleMute}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                      className="focus:outline-none focus:ring-2 focus:ring-cosmic-purple-400 focus:ring-opacity-50 rounded-full p-1"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" aria-hidden="true" />
                      ) : (
                        <Volume2 className="w-5 h-5" aria-hidden="true" />
                      )}
                    </button>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span className="text-xs">{release.duration}</span>
                    </div>
                  </div>
                  <button
                    className="text-cosmic-sunset-400 hover:text-cosmic-sunset-300 transition-colors focus:outline-none focus:ring-2 focus:ring-cosmic-sunset-400 focus:ring-opacity-50 rounded-full p-1"
                    aria-label={`Add ${release.title} to favorites`}
                  >
                    <Heart className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </CosmicReveal>
        ))}
      </div>
    </div>
  )
}

