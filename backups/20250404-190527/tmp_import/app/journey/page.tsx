import { HarmonicJourneysGrid } from "@/components/journey/harmonic-journeys-grid"
import { UpcomingCeremoniesGrid } from "@/components/journey/upcoming-ceremonies-grid"
import { CosmicBackground } from "@/components/ui/cosmic/cosmic-background"
import { CosmicSection } from "@/components/ui/cosmic/cosmic-section"
import { CosmicText } from "@/components/ui/cosmic/cosmic-text"

// Sample event data
const upcomingEvents = [
  {
    id: "event-1",
    title: "Full Moon Sound Bath",
    date: "April 15, 2025",
    time: "8:00 PM - 10:00 PM",
    location: "Cosmic Temple, Los Angeles",
    facilitator: "Luna Starlight",
    description:
      "Immerse yourself in the healing vibrations of crystal singing bowls, gongs, and chimes during this powerful full moon ceremony.",
    imageSrc: "/placeholder.svg?height=400&width=600",
    category: "Sound Healing",
    price: "$45",
    capacity: 30,
    spotsLeft: 12,
    duration: "2 hours",
    level: "All Levels",
    tags: ["Full Moon", "Sound Bath", "Meditation", "Healing"],
  },
  {
    id: "event-2",
    title: "Cacao & Breathwork Journey",
    date: "April 22, 2025",
    time: "7:00 PM - 9:30 PM",
    location: "Ethereal Garden, San Francisco",
    facilitator: "Orion Phoenix",
    description:
      "Begin with a sacred cacao ceremony to open your heart, followed by a guided breathwork journey to access expanded states of consciousness.",
    imageSrc: "/placeholder.svg?height=400&width=600",
    category: "Breathwork",
    price: "$55",
    capacity: 25,
    spotsLeft: 8,
    duration: "2.5 hours",
    level: "All Levels",
    tags: ["Cacao", "Breathwork", "Heart Opening", "Transformation"],
  },
  {
    id: "event-3",
    title: "Quantum Sound Healing",
    date: "May 5, 2025",
    time: "6:30 PM - 8:30 PM",
    location: "Harmonic Space, New York",
    facilitator: "Nova Frequency",
    description:
      "Experience the cutting-edge of sound healing with this quantum approach that combines binaural beats, solfeggio frequencies, and vocal toning.",
    imageSrc: "/placeholder.svg?height=400&width=600",
    category: "Sound Healing",
    price: "$60",
    capacity: 20,
    spotsLeft: 5,
    duration: "2 hours",
    level: "Intermediate",
    tags: ["Quantum", "Binaural", "Solfeggio", "Coherence"],
  },
  {
    id: "event-4",
    title: "Shamanic Drum Journey",
    date: "May 12, 2025",
    time: "7:00 PM - 9:00 PM",
    location: "Spirit Grove, Austin",
    facilitator: "Wolf Thunder",
    description:
      "The rhythmic beating of the drum will guide you into a trance state where you can connect with spirit guides, power animals, and receive insights.",
    imageSrc: "/placeholder.svg?height=400&width=600",
    category: "Shamanic",
    price: "$50",
    capacity: 15,
    spotsLeft: 3,
    duration: "2 hours",
    level: "All Levels",
    tags: ["Shamanic", "Drum", "Journey", "Spirit Guides"],
  },
]

export default function JourneyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950 relative">
      <CosmicBackground />

      {/* Page Header */}
      <CosmicSection className="pt-20 pb-12 md:pt-28 md:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <CosmicText variant="title" glowColor="rgba(139, 92, 246, 0.5)">
            Harmonic Journeys
          </CosmicText>
          <CosmicText variant="body" className="mt-4 text-white/80 max-w-xl mx-auto" delay={0.5}>
            Explore the healing power of sound frequencies and join our transformative ceremonies to elevate your
            consciousness and connect with cosmic vibrations.
          </CosmicText>
        </div>
      </CosmicSection>

      {/* Chakra Frequencies Section */}
      <CosmicSection variant="alt" className="py-10 md:py-12">
        <HarmonicJourneysGrid />
      </CosmicSection>

      {/* Upcoming Ceremonies Section */}
      <CosmicSection className="py-10 md:py-12">
        <UpcomingCeremoniesGrid ceremonies={upcomingEvents} />
      </CosmicSection>

      {/* Call to Action */}
      <CosmicSection variant="gradient" className="py-10 md:py-12">
        <div className="max-w-2xl mx-auto text-center">
          <CosmicText variant="subtitle" className="text-white mb-4">
            Begin Your Sonic Healing Journey
          </CosmicText>
          <p className="text-white/80 mb-6">
            Subscribe to receive updates about upcoming ceremonies, exclusive sound healing sessions, and special
            offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-3 rounded-lg bg-black/30 border border-purple-500/30 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 transition-all duration-300">
              Subscribe
            </button>
          </div>
        </div>
      </CosmicSection>
    </div>
  )
}

