"use client"

import { useState, useCallback } from "react"
import { Calendar, MapPin, Clock, Users, ExternalLink } from "lucide-react"
import { CosmicButton } from "@/components/ui/cosmic/cosmic-button"
import { CosmicReveal } from "@/components/cosmic-interactive-effects"

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  image: string
  link: string
  attendees: number
}

interface Promotion {
  id: string
  title: string
  releaseDate: string
  description: string
  image: string
  link: string
  discount?: string
}

// Sample data for upcoming events and promotions
const upcomingEvents: Event[] = [
  {
    id: "event-1",
    title: "Cosmic Frequency Meditation",
    date: "June 21, 2025",
    time: "8:00 PM - 10:00 PM",
    location: "Virtual Event",
    description: "Join us for a live cosmic frequency meditation session with our sound healers.",
    image: "/placeholder.svg?height=200&width=400",
    link: "#",
    attendees: 128,
  },
  {
    id: "event-2",
    title: "Sacred Geometry Sound Bath",
    date: "July 7, 2025",
    time: "7:30 PM - 9:30 PM",
    location: "Harmony Center, Los Angeles",
    description: "Experience a live sound bath using sacred geometry principles and healing frequencies.",
    image: "/placeholder.svg?height=200&width=400",
    link: "#",
    attendees: 64,
  },
]

const promotions: Promotion[] = [
  {
    id: "promo-1",
    title: "Cosmic Frequencies Vol. 3",
    releaseDate: "Coming August 1, 2025",
    description: "Pre-order our upcoming album featuring 7 new cosmic frequency compositions.",
    image: "/placeholder.svg?height=200&width=400",
    link: "#",
  },
  {
    id: "promo-2",
    title: "Frequency Attunement Bundle",
    releaseDate: "Available Now",
    description: "Get our complete frequency attunement series at a special harmonized price.",
    image: "/placeholder.svg?height=200&width=400",
    link: "#",
    discount: "30% OFF",
  },
]

export function MusicPromotionArea() {
  const [activeTab, setActiveTab] = useState<"events" | "releases">("events")

  const handleTabChange = useCallback((tab: "events" | "releases") => {
    setActiveTab(tab)
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-black/30 backdrop-blur-md rounded-full p-1" role="tablist">
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "events" ? "bg-cosmic-blue text-white" : "text-white/70 hover:text-white"
            }`}
            onClick={() => handleTabChange("events")}
            role="tab"
            aria-selected={activeTab === "events"}
            aria-controls="events-panel"
            id="events-tab"
          >
            Upcoming Events
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === "releases" ? "bg-cosmic-purple text-white" : "text-white/70 hover:text-white"
            }`}
            onClick={() => handleTabChange("releases")}
            role="tab"
            aria-selected={activeTab === "releases"}
            aria-controls="releases-panel"
            id="releases-tab"
          >
            Coming Soon
          </button>
        </div>
      </div>

      <div
        id="events-panel"
        role="tabpanel"
        aria-labelledby="events-tab"
        className={activeTab === "events" ? "space-y-8" : "hidden"}
      >
        {upcomingEvents.map((event, index) => (
          <CosmicReveal key={event.id} delay={index * 0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-black/20 backdrop-blur-sm rounded-lg overflow-hidden">
              <div className="md:col-span-1">
                <img
                  src={event.image || "/placeholder.svg"}
                  alt={`Event image for ${event.title}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="md:col-span-2 p-6">
                <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                <p className="text-cosmic-sea-200 mb-4">{event.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-white/70">
                    <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                    <span className="text-sm">{event.date}</span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <Clock className="w-4 h-4 mr-2" aria-hidden="true" />
                    <span className="text-sm">{event.time}</span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <Users className="w-4 h-4 mr-2" aria-hidden="true" />
                    <span className="text-sm">{event.attendees} attending</span>
                  </div>
                </div>

                <CosmicButton>
                  Register Now
                  <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                </CosmicButton>
              </div>
            </div>
          </CosmicReveal>
        ))}
      </div>

      <div
        id="releases-panel"
        role="tabpanel"
        aria-labelledby="releases-tab"
        className={activeTab === "releases" ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "hidden"}
      >
        {promotions.map((promo, index) => (
          <CosmicReveal key={promo.id} delay={index * 0.1}>
            <div className="relative group overflow-hidden rounded-lg">
              <img
                src={promo.image || "/placeholder.svg"}
                alt={`Promotion image for ${promo.title}`}
                className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />

              {promo.discount && (
                <div
                  className="absolute top-4 right-4 bg-cosmic-sunset-500 text-white px-3 py-1 rounded-full text-sm font-bold"
                  aria-label={`Discount: ${promo.discount}`}
                >
                  {promo.discount}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-xl font-bold text-white mb-1">{promo.title}</h3>
                <p className="text-cosmic-purple-300 mb-2">{promo.releaseDate}</p>
                <p className="text-white/70 mb-4">{promo.description}</p>

                <CosmicButton variant="outline" size="sm">
                  Learn More
                  <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                </CosmicButton>
              </div>
            </div>
          </CosmicReveal>
        ))}
      </div>
    </div>
  )
}

