/**
 * musical-journey-timeline.tsx
 * 
 * Component Type: audio
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */import React from "react";
import React from "react";

/**
 * musical-journey-timeline.tsx
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
import { motion, AnimatePresence } from "framer-motion"
import { CosmicHeading } from "@/components/features/cosmic/CosmicHeading"
import { CosmicReveal } from "@/components/features/cosmic/CosmicInteractiveEffects"
import { cn } from "@/lib/utils"

interface TimelineEvent {
  id: string
  year: string
  title: string
  description: string
  image: string
  location: string
  category: "album" | "collaboration" | "event" | "breakthrough"
  details?: {
    heading: string
    content: string
  }[]
}

const timelineEvents: TimelineEvent[] = [
  {
    id: "event-1",
    year: "2018",
    title: "First Meditation Retreat",
    description: "A transformative 30-day silent retreat in the Himalayas that sparked the cosmic journey",
    image: "/placeholder.svg?height=400&width=600",
    location: "Himalayan Mountains, Nepal",
    category: "breakthrough",
    details: [
      {
        heading: "The Awakening",
        content:
          "During a 30-day silent retreat in the Himalayan mountains, I experienced a profound connection with cosmic frequencies that would forever change my approach to sound and healing.",
      },
      {
        heading: "Ancient Techniques",
        content:
          "Studying with Tibetan sound masters, I learned ancient techniques for producing harmonic overtones and resonant frequencies that activate specific energy centers in the body.",
      },
    ],
  },
  {
    id: "event-2",
    year: "2019",
    title: "Quantum Resonance",
    description: "Debut album exploring the harmonic frequencies aligned with universal constants",
    image: "/placeholder.svg?height=400&width=600",
    location: "Reykjavík, Iceland",
    category: "album",
    details: [
      {
        heading: "The Concept",
        content:
          "Quantum Resonance explores the mathematical relationships between sound frequencies and universal constants, creating a sonic experience that aligns listeners with cosmic harmonies.",
      },
      {
        heading: "Recording Process",
        content:
          "Recorded in a geothermally-powered studio in Iceland, the album incorporates field recordings of glaciers, geysers, and the natural resonance of ice caves to create a unique sonic landscape.",
      },
    ],
  },
  {
    id: "event-3",
    year: "2020",
    title: "Astral Projection",
    description: "Album featuring binaural beats for astral travel and lucid dreaming",
    image: "/placeholder.svg?height=400&width=600",
    location: "Sedona, Arizona",
    category: "album",
    details: [
      {
        heading: "Energy Vortexes",
        content:
          "Created in Sedona's energy vortexes, this album uses precise binaural beat frequencies to induce altered states of consciousness conducive to astral projection and lucid dreaming.",
      },
      {
        heading: "Scientific Approach",
        content:
          "Collaborated with neuroscientists to measure brainwave patterns during listening sessions, fine-tuning frequencies to optimize theta and delta wave production.",
      },
    ],
  },
  {
    id: "event-4",
    year: "2021",
    title: "Cosmic Collaboration",
    description: "Groundbreaking collaboration with indigenous sound healers from five continents",
    image: "/placeholder.svg?height=400&width=600",
    location: "Byron Bay, Australia",
    category: "collaboration",
    details: [
      {
        heading: "Global Wisdom",
        content:
          "This project brought together sound healing traditions from Aboriginal Australia, Native American tribes, African drumming circles, Tibetan monks, and Amazonian shamans.",
      },
      {
        heading: "Ancient Meets Modern",
        content:
          "Traditional instruments and vocal techniques were recorded and then processed through custom-designed quantum harmonizers to create a bridge between ancient wisdom and modern technology.",
      },
    ],
  },
  {
    id: "event-5",
    year: "2022",
    title: "Ethereal Meditation",
    description: "Ambient soundscapes for deep meditation recorded in ancient temples",
    image: "/placeholder.svg?height=400&width=600",
    location: "Kyoto, Japan",
    category: "album",
    details: [
      {
        heading: "Sacred Spaces",
        content:
          "Each track was recorded in a different ancient temple during specific lunar phases, capturing the unique acoustic properties and spiritual energies of these sacred spaces.",
      },
      {
        heading: "Zen Influence",
        content:
          "Studied with Zen masters to incorporate the philosophy of emptiness and presence into the compositional process, creating music that facilitates the dissolution of ego during meditation.",
      },
    ],
  },
  {
    id: "event-6",
    year: "2023",
    title: "Cosmic Healing Frequencies",
    description: "A journey through the chakras with healing frequencies",
    image: "/placeholder.svg?height=400&width=600",
    location: "Mount Shasta, California",
    category: "album",
    details: [
      {
        heading: "Chakra System",
        content:
          "Each track corresponds to one of the seven main chakras, using the specific frequency associated with that energy center along with complementary overtones and harmonics.",
      },
      {
        heading: "Crystal Resonance",
        content:
          "Incorporated the resonant frequencies of seven sacred crystals, each aligned with a chakra, by recording the vibrations produced when the crystals were activated by specific sound frequencies.",
      },
    ],
  },
  {
    id: "event-7",
    year: "2024",
    title: "Global Consciousness Concert Series",
    description: "Worldwide tour featuring immersive sound healing experiences",
    image: "/placeholder.svg?height=400&width=600",
    location: "Multiple Locations Worldwide",
    category: "event",
    details: [
      {
        heading: "Synchronized Healing",
        content:
          "These concerts are synchronized with cosmic events like solstices, equinoxes, and significant planetary alignments to maximize their energetic impact.",
      },
      {
        heading: "Interactive Experience",
        content:
          "Audiences participate in co-creating the sound experience through guided breathwork, movement, and vocalization, becoming part of a global consciousness field.",
      },
    ],
  },
]

export function MusicalJourneyTimeline() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const filteredEvents =
    activeCategory === "all" ? timelineEvents : timelineEvents.filter((event) => event.category === activeCategory)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "album":
        return "bg-purple-500"
      case "collaboration":
        return "bg-blue-500"
      case "event":
        return "bg-green-500"
      case "breakthrough":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "album":
        return "🎵"
      case "collaboration":
        return "👥"
      case "event":
        return "🌟"
      case "breakthrough":
        return "💡"
      default:
        return "✨"
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <CosmicHeading level={2} withAccent>
          Musical Journey Timeline
        </CosmicHeading>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm transition-colors",
              activeCategory === "all"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white",
            )}
          >
            All
          </button>
          {["album", "collaboration", "event", "breakthrough"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors",
                activeCategory === category
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white",
              )}
            >
              {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-indigo-500 to-purple-500/30 transform md:-translate-x-1/2"></div>

        <div className="space-y-0">
          {filteredEvents.map((event, index) => (
            <CosmicReveal key={event.id} direction={index % 2 === 0 ? "left" : "right"} delay={index * 0.1}>
              <div
                className={cn(
                  "relative flex items-start gap-4 pb-10",
                  index % 2 === 0 ? "md:flex-row-reverse text-right" : "md:flex-row text-left",
                  "flex-col md:flex-row",
                )}
              >
                {/* Timeline dot */}
                <div className="absolute left-0 md:left-1/2 w-5 h-5 rounded-full border-2 border-white bg-black transform -translate-x-1/2 z-10"></div>

                {/* Year marker */}
                <div
                  className={cn(
                    "absolute left-6 md:left-1/2 bg-purple-900/50 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-white border border-purple-500/30 transform md:translate-y-[-50%]",
                    index % 2 === 0 ? "md:-translate-x-[calc(100%+1rem)]" : "md:translate-x-4",
                  )}
                >
                  {event.year}
                </div>

                {/* Content */}
                <div
                  className={cn("w-full md:w-[calc(50%-2rem)] pt-8 md:pt-0", index % 2 === 0 ? "md:pr-8" : "md:pl-8")}
                >
                  <div
                    className="rounded-xl overflow-hidden bg-black/30 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform hover:scale-105 duration-500"
                      />
                      <div className="absolute top-3 right-3">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium text-white",
                            getCategoryColor(event.category),
                          )}
                        >
                          {event.category}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                      <div className="absolute bottom-0 left-0 p-4">
                        <h3 className="text-lg font-bold text-white">{event.title}</h3>
                        <p className="text-sm text-white/80">{event.location}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-white/70">{event.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CosmicReveal>
          ))}
        </div>
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-black/90 border border-purple-500/20"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium text-white",
                      getCategoryColor(selectedEvent.category),
                    )}
                  >
                    {selectedEvent.category}
                  </span>
                  <h2 className="text-xl font-bold text-white">{selectedEvent.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
                  <Image
                    src={selectedEvent.image || "/placeholder.svg"}
                    alt={selectedEvent.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
                        <p className="text-sm text-white/80">
                          {selectedEvent.location} • {selectedEvent.year}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-white/80 text-lg mb-6">{selectedEvent.description}</p>

                {selectedEvent.details && (
                  <div className="space-y-6 mt-8">
                    {selectedEvent.details.map((detail, index) => (
                      <div key={index} className="space-y-2">
                        <h4 className="text-lg font-medium text-purple-300">{detail.heading}</h4>
                        <p className="text-white/70">{detail.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}



/**
 * Original MusicalJourneyTimeline component merged from: client/src/components/common/musical-journey-timeline.tsx
 * Merge date: 2025-04-05
 */
function MusicalJourneyTimelineOriginal() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const filteredEvents =
    activeCategory === "all" ? timelineEvents : timelineEvents.filter((event) => event.category === activeCategory)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "album":
        return "bg-purple-500"
      case "collaboration":
        return "bg-blue-500"
      case "event":
        return "bg-green-500"
      case "breakthrough":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "album":
        return "🎵"
      case "collaboration":
        return "👥"
      case "event":
        return "🌟"
      case "breakthrough":
        return "💡"
      default:
        return "✨"
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <CosmicHeading level={2} withAccent>
          Musical Journey Timeline
        </CosmicHeading>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm transition-colors",
              activeCategory === "all"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white",
            )}
          >
            All
          </button>
          {["album", "collaboration", "event", "breakthrough"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors",
                activeCategory === category
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white",
              )}
            >
              {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-indigo-500 to-purple-500/30 transform md:-translate-x-1/2"></div>

        <div className="space-y-0">
          {filteredEvents.map((event, index) => (
            <CosmicReveal key={event.id} direction={index % 2 === 0 ? "left" : "right"} delay={index * 0.1}>
              <div
                className={cn(
                  "relative flex items-start gap-4 pb-10",
                  index % 2 === 0 ? "md:flex-row-reverse text-right" : "md:flex-row text-left",
                  "flex-col md:flex-row",
                )}
              >
                {/* Timeline dot */}
                <div className="absolute left-0 md:left-1/2 w-5 h-5 rounded-full border-2 border-white bg-black transform -translate-x-1/2 z-10"></div>

                {/* Year marker */}
                <div
                  className={cn(
                    "absolute left-6 md:left-1/2 bg-purple-900/50 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-white border border-purple-500/30 transform md:translate-y-[-50%]",
                    index % 2 === 0 ? "md:-translate-x-[calc(100%+1rem)]" : "md:translate-x-4",
                  )}
                >
                  {event.year}
                </div>

                {/* Content */}
                <div
                  className={cn("w-full md:w-[calc(50%-2rem)] pt-8 md:pt-0", index % 2 === 0 ? "md:pr-8" : "md:pl-8")}
                >
                  <div
                    className="rounded-xl overflow-hidden bg-black/30 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        fill
                        className="object-cover transition-transform hover:scale-105 duration-500"
                      />
                      <div className="absolute top-3 right-3">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium text-white",
                            getCategoryColor(event.category),
                          )}
                        >
                          {event.category}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                      <div className="absolute bottom-0 left-0 p-4">
                        <h3 className="text-lg font-bold text-white">{event.title}</h3>
                        <p className="text-sm text-white/80">{event.location}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-white/70">{event.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CosmicReveal>
          ))}
        </div>
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-black/90 border border-purple-500/20"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium text-white",
                      getCategoryColor(selectedEvent.category),
                    )}
                  >
                    {selectedEvent.category}
                  </span>
                  <h2 className="text-xl font-bold text-white">{selectedEvent.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
                  <Image
                    src={selectedEvent.image || "/placeholder.svg"}
                    alt={selectedEvent.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
                        <p className="text-sm text-white/80">
                          {selectedEvent.location} • {selectedEvent.year}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-white/80 text-lg mb-6">{selectedEvent.description}</p>

                {selectedEvent.details && (
                  <div className="space-y-6 mt-8">
                    {selectedEvent.details.map((detail, index) => (
                      <div key={index} className="space-y-2">
                        <h4 className="text-lg font-medium text-purple-300">{detail.heading}</h4>
                        <p className="text-white/70">{detail.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

