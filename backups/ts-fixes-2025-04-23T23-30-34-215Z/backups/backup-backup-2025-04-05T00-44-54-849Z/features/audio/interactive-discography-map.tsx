/**
 * interactive-discography-map.tsx
 * 
 * Component Type: audio
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */
/**
 * interactive-discography-map.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Music, Calendar, Info, ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react"
import { cn } from "@/lib/utils"

interface Location {
  id: number
  name: string
  coordinates: [number, number] // [x, y] as percentage of container
  country: string
  description: string
  releases: Release[]
  image: string
}

interface Release {
  id: number
  title: string
  year: string
  type: "Album" | "EP" | "Single" | "Collaboration"
  coverArt: string
  slug: string
  description: string
}

export function InteractiveDiscographyMap() {
  const [activeLocation, setActiveLocation] = useState<Location | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapZoom, setMapZoom] = useState(1)
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Mock data for locations
  const locations: Location[] = [
    {
      id: 1,
      name: "Himalayan Retreat",
      coordinates: [25, 30],
      country: "Nepal",
      description:
        "A three-month meditation retreat in the Himalayan mountains where the Cosmic Healing Frequencies album was conceived and recorded using ancient singing bowls and natural sounds.",
      image: "/placeholder.svg?height=400&width=600",
      releases: [
        {
          id: 1,
          title: "Cosmic Healing Frequencies",
          year: "2023",
          type: "Album",
          coverArt: "/placeholder.svg?height=300&width=300",
          slug: "cosmic-healing-frequencies",
          description: "A journey through the chakras with healing frequencies",
        },
      ],
    },
    {
      id: 2,
      name: "Kyoto Temple",
      coordinates: [80, 35],
      country: "Japan",
      description:
        "A historic temple in Kyoto where the Ethereal Meditation album was recorded during a series of full moon ceremonies, incorporating traditional Japanese instruments and ambient sounds.",
      image: "/placeholder.svg?height=400&width=600",
      releases: [
        {
          id: 2,
          title: "Ethereal Meditation",
          year: "2022",
          type: "Album",
          coverArt: "/placeholder.svg?height=300&width=300",
          slug: "ethereal-meditation",
          description: "Ambient soundscapes for deep meditation",
        },
      ],
    },
    {
      id: 3,
      name: "Sedona Vortex",
      coordinates: [15, 60],
      country: "USA",
      description:
        "The energy vortexes of Sedona, Arizona inspired the Astral Projection album, which was recorded in a studio built into the red rocks, capturing the unique resonance of this spiritual location.",
      image: "/placeholder.svg?height=400&width=600",
      releases: [
        {
          id: 3,
          title: "Astral Projection",
          year: "2021",
          type: "Album",
          coverArt: "/placeholder.svg?height=300&width=300",
          slug: "astral-projection",
          description: "Binaural beats for astral travel and lucid dreaming",
        },
        {
          id: 7,
          title: "Cosmic Ocean",
          year: "2023",
          type: "Single",
          coverArt: "/placeholder.svg?height=300&width=300",
          slug: "cosmic-ocean",
          description: "A deep dive into the cosmic ocean of consciousness",
        },
      ],
    },
    {
      id: 4,
      name: "Byron Bay",
      coordinates: [85, 75],
      country: "Australia",
      description:
        "The coastal energy of Byron Bay influenced the creation of the Solar Flares EP, which combines ocean sounds with electronic beats to create a unique solar-inspired soundscape.",
      image: "/placeholder.svg?height=400&width=600",
      releases: [
        {
          id: 6,
          title: "Solar Flares",
          year: "2021",
          type: "EP",
          coverArt: "/placeholder.svg?height=300&width=300",
          slug: "solar-flares",
          description: "Energetic compositions inspired by solar activity",
        },
      ],
    },
    {
      id: 5,
      name: "Icelandic Glacier",
      coordinates: [45, 15],
      country: "Iceland",
      description:
        "The pristine silence of Iceland's glaciers provided the perfect backdrop for recording the Quantum Resonance album, which explores the harmonic frequencies found in ice formations and geothermal activity.",
      image: "/placeholder.svg?height=400&width=600",
      releases: [
        {
          id: 4,
          title: "Quantum Resonance",
          year: "2020",
          type: "Album",
          coverArt: "/placeholder.svg?height=300&width=300",
          slug: "quantum-resonance",
          description: "Harmonic frequencies aligned with universal constants",
        },
      ],
    },
  ]

  const handleLocationClick = (location: Location) => {
    setActiveLocation(location)
  }

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return

    if (!isFullscreen) {
      if (mapContainerRef.current.requestFullscreen) {
        mapContainerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - mapPosition.x, y: e.clientY - mapPosition.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    setMapPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setMapZoom((prev) => Math.min(prev + 0.2, 2))
  }

  const handleZoomOut = () => {
    setMapZoom((prev) => Math.max(prev - 0.2, 0.5))
  }

  const handleReset = () => {
    setMapZoom(1)
    setMapPosition({ x: 0, y: 0 })
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Musical Journey Map</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={handleZoomIn}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Zoom In</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={handleZoomOut}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Zoom Out</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={handleReset}
          >
            <MapPin className="h-4 w-4" />
            <span className="sr-only">Reset</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            <span className="sr-only">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </Button>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className={cn("relative overflow-hidden bg-black", isFullscreen ? "h-screen" : "h-[600px]")}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* World map */}
        <div
          className="absolute transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${mapZoom})`,
            transformOrigin: "center",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          <Image
            src="/placeholder.svg?height=1200&width=2400"
            width={2400}
            height={1200}
            alt="World Map"
            className="opacity-70"
          />

          {/* Location pins */}
          {locations.map((location) => (
            <button
              key={location.id}
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all",
                activeLocation?.id === location.id ? "z-20 scale-125" : "z-10 hover:scale-110",
              )}
              style={{
                left: `${location.coordinates[0]}%`,
                top: `${location.coordinates[1]}%`,
              }}
              onClick={() => handleLocationClick(location)}
            >
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center",
                  activeLocation?.id === location.id ? "bg-purple-500" : "bg-indigo-500/70 hover:bg-purple-500/70",
                )}
              >
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div
                className={cn(
                  "absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap px-2 py-1 rounded text-xs font-medium",
                  activeLocation?.id === location.id
                    ? "bg-purple-500 text-white"
                    : "bg-black/60 text-white/80 backdrop-blur-sm",
                )}
              >
                {location.name}
              </div>
            </button>
          ))}
        </div>

        {/* Location details panel */}
        {activeLocation && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-6 transform transition-transform duration-300 ease-out">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => setActiveLocation(null)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span className="sr-only">Close</span>
            </Button>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">{activeLocation.name}</h3>
                </div>
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={activeLocation.image || "/placeholder.svg"}
                    alt={activeLocation.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    {activeLocation.country}
                  </div>
                </div>
                <p className="text-white/80 text-sm">{activeLocation.description}</p>
              </div>

              <div className={cn("space-y-4", activeLocation.releases.length > 2 ? "lg:col-span-2" : "")}>
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Releases from this Location</h3>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {activeLocation.releases.map((release) => (
                    <Link href={`/releases/${release.slug}`} key={release.id} className="group">
                      <div className="rounded-lg bg-black/40 p-3 flex gap-3 hover:bg-purple-900/20 transition-colors">
                        <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden">
                          <Image
                            src={release.coverArt || "/placeholder.svg"}
                            alt={release.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                            {release.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <span>{release.type}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{release.year}</span>
                            </div>
                          </div>
                          <p className="text-xs text-white/70 line-clamp-1 mt-1">{release.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions overlay - shown when no location is selected */}
        {!activeLocation && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Info className="h-5 w-5 text-purple-400" />
              <h3 className="font-medium text-white">Explore the Musical Journey</h3>
            </div>
            <p className="text-white/80 text-sm">
              Click on the map pins to discover the locations that inspired different albums and releases. Drag to pan
              and use the controls to zoom in/out.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

