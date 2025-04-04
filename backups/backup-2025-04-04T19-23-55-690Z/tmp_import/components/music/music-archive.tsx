"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Play, Clock, Download, Info } from "lucide-react"
import { CosmicReveal } from "@/components/cosmic-interactive-effects"

interface Collection {
  id: string
  title: string
  tracks: number
  totalDuration: string
  coverArt: string
  frequencies: string[]
  year: number
}

interface Track {
  id: string
  title: string
  frequency: string
  duration: string
  coverArt: string
  year: number
}

// Sample data for music archive
const collections: Collection[] = [
  {
    id: "collection-1",
    title: "Chakra Alignment Series",
    tracks: 7,
    totalDuration: "1h 24m",
    coverArt: "/placeholder.svg?height=100&width=100",
    frequencies: ["396 Hz", "417 Hz", "528 Hz", "639 Hz", "741 Hz", "852 Hz", "963 Hz"],
    year: 2024,
  },
  {
    id: "collection-2",
    title: "Cosmic Sleep Cycles",
    tracks: 5,
    totalDuration: "3h 10m",
    coverArt: "/placeholder.svg?height=100&width=100",
    frequencies: ["432 Hz", "528 Hz"],
    year: 2023,
  },
  {
    id: "collection-3",
    title: "Quantum Meditation",
    tracks: 4,
    totalDuration: "2h 45m",
    coverArt: "/placeholder.svg?height=100&width=100",
    frequencies: ["528 Hz", "639 Hz"],
    year: 2023,
  },
  {
    id: "collection-4",
    title: "Galactic Consciousness",
    tracks: 6,
    totalDuration: "4h 20m",
    coverArt: "/placeholder.svg?height=100&width=100",
    frequencies: ["963 Hz", "432 Hz"],
    year: 2022,
  },
]

const individualTracks: Track[] = [
  {
    id: "track-1",
    title: "Solar Plexus Activation",
    frequency: "528 Hz",
    duration: "15:32",
    coverArt: "/placeholder.svg?height=50&width=50",
    year: 2024,
  },
  {
    id: "track-2",
    title: "Heart Chakra Resonance",
    frequency: "639 Hz",
    duration: "18:45",
    coverArt: "/placeholder.svg?height=50&width=50",
    year: 2024,
  },
  {
    id: "track-3",
    title: "Third Eye Awakening",
    frequency: "852 Hz",
    duration: "20:18",
    coverArt: "/placeholder.svg?height=50&width=50",
    year: 2023,
  },
  {
    id: "track-4",
    title: "Root Chakra Grounding",
    frequency: "396 Hz",
    duration: "22:10",
    coverArt: "/placeholder.svg?height=50&width=50",
    year: 2023,
  },
  {
    id: "track-5",
    title: "Crown Connection",
    frequency: "963 Hz",
    duration: "17:33",
    coverArt: "/placeholder.svg?height=50&width=50",
    year: 2022,
  },
  {
    id: "track-6",
    title: "Throat Chakra Expression",
    frequency: "741 Hz",
    duration: "19:27",
    coverArt: "/placeholder.svg?height=50&width=50",
    year: 2022,
  },
]

export function MusicArchive({ type }: { type: "collections" | "individual" }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredItems, setFilteredItems] = useState<Collection[] | Track[]>(
    type === "collections" ? collections : individualTracks,
  )

  // Update filtered items when search term changes
  useEffect(() => {
    const items = type === "collections" ? collections : individualTracks

    if (!searchTerm.trim()) {
      setFilteredItems(items)
      return
    }

    const searchLower = searchTerm.toLowerCase()

    if (type === "collections") {
      setFilteredItems(
        (items as Collection[]).filter(
          (item) =>
            item.title.toLowerCase().includes(searchLower) ||
            item.frequencies.some((freq) => freq.toLowerCase().includes(searchLower)),
        ),
      )
    } else {
      setFilteredItems(
        (items as Track[]).filter(
          (item) =>
            item.title.toLowerCase().includes(searchLower) || item.frequency.toLowerCase().includes(searchLower),
        ),
      )
    }
  }, [searchTerm, type])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex items-center space-x-2 bg-black/30 rounded-full px-4 py-2">
        <Search className="w-4 h-4 text-white/50" aria-hidden="true" />
        <input
          type="text"
          placeholder={`Search ${type === "collections" ? "collections" : "tracks"}...`}
          className="bg-transparent border-none outline-none text-white w-full text-sm"
          value={searchTerm}
          onChange={handleSearchChange}
          aria-label={`Search ${type === "collections" ? "collections" : "tracks"}`}
        />
        <button
          className="text-white/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-cosmic-sea-400 focus:ring-opacity-50 rounded-full p-1"
          aria-label="Filter options"
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Archive Content */}
      <div
        className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
        aria-label={type === "collections" ? "Collections list" : "Tracks list"}
      >
        {filteredItems.length === 0 ? (
          <p className="text-white/70 text-center py-4">No results found for "{searchTerm}"</p>
        ) : type === "collections" ? (
          // Collections View
          (filteredItems as Collection[]).map((collection, index) => (
            <CosmicReveal key={collection.id} delay={index * 0.05}>
              <motion.div
                className="flex items-center space-x-4 bg-black/20 backdrop-blur-sm p-3 rounded-lg hover:bg-black/30 transition-colors"
                whileHover={{ x: 5 }}
              >
                <img
                  src={collection.coverArt || "/placeholder.svg"}
                  alt={`Cover art for ${collection.title}`}
                  className="w-16 h-16 rounded-md object-cover"
                  loading="lazy"
                />
                <div className="flex-1">
                  <h4 className="text-white font-medium">{collection.title}</h4>
                  <div className="flex items-center space-x-4 text-xs text-white/60">
                    <span>{collection.tracks} tracks</span>
                    <span>{collection.totalDuration}</span>
                    <span>{collection.year}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {collection.frequencies.map((freq) => (
                      <span
                        key={freq}
                        className="text-xs bg-cosmic-purple/20 text-cosmic-purple-300 px-2 py-0.5 rounded-full"
                        aria-label={`Frequency: ${freq}`}
                      >
                        {freq}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  className="p-2 rounded-full bg-cosmic-purple/20 hover:bg-cosmic-purple/40 transition-colors focus:outline-none focus:ring-2 focus:ring-cosmic-purple-400 focus:ring-opacity-50"
                  aria-label={`Play ${collection.title}`}
                >
                  <Play className="w-4 h-4 text-cosmic-purple-300" aria-hidden="true" />
                </button>
              </motion.div>
            </CosmicReveal>
          ))
        ) : (
          // Individual Tracks View
          (filteredItems as Track[]).map((track, index) => (
            <CosmicReveal key={track.id} delay={index * 0.05}>
              <motion.div
                className="flex items-center space-x-3 bg-black/20 backdrop-blur-sm p-2 rounded-lg hover:bg-black/30 transition-colors"
                whileHover={{ x: 5 }}
              >
                <img
                  src={track.coverArt || "/placeholder.svg"}
                  alt={`Cover art for ${track.title}`}
                  className="w-10 h-10 rounded-md object-cover"
                  loading="lazy"
                />
                <div className="flex-1">
                  <h4 className="text-white text-sm font-medium">{track.title}</h4>
                  <div className="flex items-center space-x-2 text-xs text-white/60">
                    <span
                      className="bg-cosmic-sea-500/20 text-cosmic-sea-300 px-2 py-0.5 rounded-full"
                      aria-label={`Frequency: ${track.frequency}`}
                    >
                      {track.frequency}
                    </span>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                      <span>{track.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    className="p-1.5 rounded-full bg-cosmic-purple/20 hover:bg-cosmic-purple/40 transition-colors focus:outline-none focus:ring-2 focus:ring-cosmic-purple-400 focus:ring-opacity-50"
                    aria-label={`Play ${track.title}`}
                  >
                    <Play className="w-3.5 h-3.5 text-cosmic-purple-300" aria-hidden="true" />
                  </button>
                  <button
                    className="p-1.5 rounded-full bg-cosmic-sea-500/20 hover:bg-cosmic-sea-500/40 transition-colors focus:outline-none focus:ring-2 focus:ring-cosmic-sea-400 focus:ring-opacity-50"
                    aria-label={`Download ${track.title}`}
                  >
                    <Download className="w-3.5 h-3.5 text-cosmic-sea-300" aria-hidden="true" />
                  </button>
                  <button
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-opacity-50"
                    aria-label={`More information about ${track.title}`}
                  >
                    <Info className="w-3.5 h-3.5 text-white/70" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            </CosmicReveal>
          ))
        )}
      </div>
    </div>
  )
}

