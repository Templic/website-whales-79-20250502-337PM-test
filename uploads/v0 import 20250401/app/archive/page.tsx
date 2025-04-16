"use client"

import { DynamicPlaylists, RecommendedPlaylists } from "@/components/dynamic-playlists"
import { CosmicHeading } from "@/components/cosmic-heading"
import { CosmicText } from "@/components/cosmic-text"
import { CosmicBackground } from "@/components/cosmic-background"
import { CosmicCard } from "@/components/cosmic-card"

// Sample data for playlists
const samplePlaylists = [
  {
    id: "playlist-1",
    title: "Chakra Alignment Series",
    description: "A complete journey through all seven chakras with specific healing frequencies",
    coverArt: "/placeholder.svg?height=300&width=300",
    category: "meditation",
    mood: "peaceful",
    frequency: 432,
    tracks: [
      {
        id: "track-1",
        title: "Root Chakra Activation",
        artist: "ASTRA",
        duration: "10:33",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/root-chakra.mp3",
      },
      {
        id: "track-2",
        title: "Sacral Creativity Flow",
        artist: "ASTRA",
        duration: "9:47",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/sacral-chakra.mp3",
      },
      {
        id: "track-3",
        title: "Solar Plexus Empowerment",
        artist: "ASTRA",
        duration: "8:21",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/solar-plexus.mp3",
      },
      {
        id: "track-4",
        title: "Heart Chakra Opening",
        artist: "ASTRA",
        duration: "12:15",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/heart-chakra.mp3",
      },
      {
        id: "track-5",
        title: "Throat Chakra Expression",
        artist: "ASTRA",
        duration: "7:42",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/throat-chakra.mp3",
      },
      {
        id: "track-6",
        title: "Third Eye Awakening",
        artist: "ASTRA",
        duration: "11:11",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/third-eye.mp3",
      },
      {
        id: "track-7",
        title: "Crown Connection",
        artist: "ASTRA",
        duration: "14:22",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/crown-chakra.mp3",
      },
    ],
  },
  {
    id: "playlist-2",
    title: "Quantum Healing Frequencies",
    description: "Precise frequencies based on quantum physics principles for deep cellular healing",
    coverArt: "/placeholder.svg?height=300&width=300",
    category: "healing",
    mood: "restorative",
    frequency: 528,
    tracks: [
      {
        id: "track-8",
        title: "DNA Repair",
        artist: "ASTRA",
        duration: "20:33",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/dna-repair.mp3",
      },
      {
        id: "track-9",
        title: "Cellular Regeneration",
        artist: "ASTRA",
        duration: "18:47",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/cellular-regeneration.mp3",
      },
      {
        id: "track-10",
        title: "Quantum Field Harmonizer",
        artist: "ASTRA",
        duration: "15:21",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/quantum-field.mp3",
      },
      {
        id: "track-11",
        title: "Mitochondrial Activation",
        artist: "ASTRA",
        duration: "12:15",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/mitochondrial.mp3",
      },
      {
        id: "track-12",
        title: "Pineal Decalcification",
        artist: "ASTRA",
        duration: "17:42",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/pineal.mp3",
      },
    ],
  },
  {
    id: "playlist-3",
    title: "Astral Projection Guides",
    description: "Binaural beats and isochronic tones designed to facilitate out-of-body experiences",
    coverArt: "/placeholder.svg?height=300&width=300",
    category: "astral",
    mood: "expansive",
    tracks: [
      {
        id: "track-13",
        title: "Vibrational Lifting",
        artist: "ASTRA",
        duration: "30:33",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/vibrational-lifting.mp3",
      },
      {
        id: "track-14",
        title: "Etheric Body Activation",
        artist: "ASTRA",
        duration: "25:47",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/etheric-body.mp3",
      },
      {
        id: "track-15",
        title: "Silver Cord Tether",
        artist: "ASTRA",
        duration: "28:21",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/silver-cord.mp3",
      },
      {
        id: "track-16",
        title: "Astral Realm Navigation",
        artist: "ASTRA",
        duration: "32:15",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/astral-navigation.mp3",
      },
    ],
  },
  {
    id: "playlist-4",
    title: "Cosmic Sleep Cycles",
    description: "Specially designed soundscapes for each sleep cycle phase for optimal rest",
    coverArt: "/placeholder.svg?height=300&width=300",
    category: "sleep",
    mood: "peaceful",
    tracks: [
      {
        id: "track-17",
        title: "Alpha Wave Descent",
        artist: "ASTRA",
        duration: "45:33",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/alpha-descent.mp3",
      },
      {
        id: "track-18",
        title: "Theta Dreamscape",
        artist: "ASTRA",
        duration: "50:47",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/theta-dreamscape.mp3",
      },
      {
        id: "track-19",
        title: "Delta Deep Healing",
        artist: "ASTRA",
        duration: "60:21",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/delta-healing.mp3",
      },
      {
        id: "track-20",
        title: "REM Enhancement",
        artist: "ASTRA",
        duration: "40:15",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/rem-enhancement.mp3",
      },
    ],
  },
  {
    id: "playlist-5",
    title: "Elemental Attunements",
    description: "Connect with the five elements through resonant frequencies and nature sounds",
    coverArt: "/placeholder.svg?height=300&width=300",
    category: "nature",
    mood: "grounding",
    tracks: [
      {
        id: "track-21",
        title: "Earth Connection",
        artist: "ASTRA",
        duration: "15:33",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/earth-connection.mp3",
      },
      {
        id: "track-22",
        title: "Water Flow State",
        artist: "ASTRA",
        duration: "14:47",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/water-flow.mp3",
      },
      {
        id: "track-23",
        title: "Fire Transformation",
        artist: "ASTRA",
        duration: "16:21",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/fire-transformation.mp3",
      },
      {
        id: "track-24",
        title: "Air Expansion",
        artist: "ASTRA",
        duration: "13:15",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/air-expansion.mp3",
      },
      {
        id: "track-25",
        title: "Ether Integration",
        artist: "ASTRA",
        duration: "17:42",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/ether-integration.mp3",
      },
    ],
  },
  {
    id: "playlist-6",
    title: "Cosmic Creativity Activators",
    description: "Frequencies that stimulate creative thinking and artistic expression",
    coverArt: "/placeholder.svg?height=300&width=300",
    category: "creativity",
    mood: "inspiring",
    frequency: 639,
    tracks: [
      {
        id: "track-26",
        title: "Right Brain Activation",
        artist: "ASTRA",
        duration: "18:33",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/right-brain.mp3",
      },
      {
        id: "track-27",
        title: "Creative Flow State",
        artist: "ASTRA",
        duration: "22:47",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/creative-flow.mp3",
      },
      {
        id: "track-28",
        title: "Inspiration Channel",
        artist: "ASTRA",
        duration: "19:21",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/inspiration.mp3",
      },
      {
        id: "track-29",
        title: "Artistic Expression",
        artist: "ASTRA",
        duration: "21:15",
        coverArt: "/placeholder.svg?height=300&width=300",
        audioSrc: "/audio/artistic-expression.mp3",
      },
    ],
  },
]

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950 relative">
      <CosmicBackground />

      {/* Header */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <CosmicText variant="title" glowColor="rgba(139, 92, 246, 0.5)">
              Sound Archive
            </CosmicText>
            <CosmicText variant="body" className="mt-4 text-white/80 max-w-xl mx-auto" delay={0.5}>
              Explore our complete collection of healing frequencies, cosmic soundscapes, and consciousness-expanding
              audio journeys.
            </CosmicText>
          </div>
        </div>
      </section>

      {/* Recommended Playlists */}
      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <RecommendedPlaylists
            playlists={samplePlaylists.slice(0, 4)}
            onSelect={(playlist) => console.log("Selected playlist:", playlist.id)}
          />
        </div>
      </section>

      {/* Dynamic Playlists */}
      <section className="py-8 md:py-10">
        <div className="container px-4 md:px-6">
          <DynamicPlaylists playlists={samplePlaylists} onPlay={(trackId) => console.log("Play track:", trackId)} />
        </div>
      </section>

      {/* Frequency Guide */}
      <section className="py-8 md:py-10 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <CosmicHeading level={2} withAccent className="mb-6">
            Frequency Guide
          </CosmicHeading>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CosmicCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-2">396 Hz - Liberation from Fear</h3>
              <p className="text-white/70 text-sm">
                Helps release fear and guilt, allowing for emotional liberation and spiritual growth.
              </p>
            </CosmicCard>

            <CosmicCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-2">417 Hz - Facilitating Change</h3>
              <p className="text-white/70 text-sm">
                Helps clear negative energy and facilitates positive transformation in your life.
              </p>
            </CosmicCard>

            <CosmicCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-2">528 Hz - Transformation and Miracles</h3>
              <p className="text-white/70 text-sm">
                Known as the "love frequency," it promotes healing, DNA repair, and spiritual awakening.
              </p>
            </CosmicCard>

            <CosmicCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-2">639 Hz - Connection and Relationships</h3>
              <p className="text-white/70 text-sm">
                Enhances communication, understanding, and harmonious relationships.
              </p>
            </CosmicCard>

            <CosmicCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-2">741 Hz - Awakening Intuition</h3>
              <p className="text-white/70 text-sm">
                Helps cleanse the body from toxins and awakens intuitive abilities.
              </p>
            </CosmicCard>

            <CosmicCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-2">852 Hz - Spiritual Awakening</h3>
              <p className="text-white/70 text-sm">
                Awakens the third eye and facilitates a return to spiritual order and higher consciousness.
              </p>
            </CosmicCard>

            <CosmicCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-2">963 Hz - Divine Consciousness</h3>
              <p className="text-white/70 text-sm">
                Connects with the spiritual light and the cosmic consciousness, activating the crown chakra.
              </p>
            </CosmicCard>

            <CosmicCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-2">432 Hz - Natural Harmony</h3>
              <p className="text-white/70 text-sm">
                Aligns with the natural frequency of the universe, promoting peace and well-being.
              </p>
            </CosmicCard>

            <CosmicCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-2">174 Hz - Foundation Healing</h3>
              <p className="text-white/70 text-sm">
                The lowest of the Solfeggio frequencies, it serves as a natural anesthetic and relieves pain.
              </p>
            </CosmicCard>
          </div>
        </div>
      </section>
    </div>
  )
}

