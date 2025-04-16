"use client"

import { CommunityFeedbackLoop, FeedbackStatistics } from "@/components/community-feedback-loop"
import { CosmicHeading } from "@/components/cosmic-heading"
import { CosmicText } from "@/components/cosmic-text"
import { CosmicBackground } from "@/components/cosmic-background"
import { CosmicCard } from "@/components/cosmic-card"

// Sample data for feedback items
const sampleFeedbackItems = [
  {
    id: "feedback-1",
    user: {
      name: "Astral Explorer",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    content:
      "The Astral Projection album completely transformed my meditation practice. I've been able to achieve states of consciousness I never thought possible. Would love to see more guided journeys specifically for lucid dreaming!",
    date: "2 days ago",
    category: "suggestion",
    status: "considering",
    votes: 42,
    userVoted: true,
    comments: 5,
  },
  {
    id: "feedback-2",
    user: {
      name: "Quantum Healer",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    content:
      "I've noticed that the 528 Hz tracks sometimes have a slight background noise that can be distracting during deep meditation sessions. Could this be cleaned up in future releases?",
    date: "1 week ago",
    category: "bug",
    status: "implemented",
    votes: 38,
    userVoted: false,
    comments: 7,
  },
  {
    id: "feedback-3",
    user: {
      name: "Cosmic Voyager",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    content:
      "It would be amazing to have a feature that allows us to create custom playlists that follow the chakra system from root to crown. This would help create a complete journey through all energy centers.",
    date: "2 weeks ago",
    category: "feature",
    status: "implemented",
    votes: 76,
    userVoted: true,
    comments: 12,
  },
  {
    id: "feedback-4",
    user: {
      name: "Etheric Wanderer",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    content:
      "The website is beautiful, but I find it difficult to navigate on mobile devices. The menu sometimes disappears when I'm trying to access different sections.",
    date: "3 weeks ago",
    category: "bug",
    status: "pending",
    votes: 29,
    userVoted: false,
    comments: 3,
  },
  {
    id: "feedback-5",
    user: {
      name: "Frequency Alchemist",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    content:
      "I would love to see a collaboration with indigenous sound healers from different traditions. Combining your modern approach with ancient wisdom could create something truly revolutionary.",
    date: "1 month ago",
    category: "suggestion",
    status: "considering",
    votes: 105,
    userVoted: true,
    comments: 18,
  },
  {
    id: "feedback-6",
    user: {
      name: "Harmonic Resonator",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    content:
      "The Crystal Frequency Pendant has been life-changing for me. I'd love to see an expanded line of frequency-infused jewelry, perhaps with different crystals for different chakras or intentions.",
    date: "1 month ago",
    category: "feature",
    status: "pending",
    votes: 67,
    userVoted: false,
    comments: 9,
  },
  {
    id: "feedback-7",
    user: {
      name: "Quantum Observer",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    content:
      "I've been using the Breath Sync Player daily and it's transformed my practice. One suggestion: could you add custom breathing patterns that users can program themselves?",
    date: "2 months ago",
    category: "feature",
    status: "implemented",
    votes: 93,
    userVoted: true,
    comments: 14,
  },
]

// Sample statistics
const feedbackStats = {
  implemented: 24,
  considering: 37,
  total: 89,
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950 relative">
      <CosmicBackground />

      {/* Header */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <CosmicText variant="title" glowColor="rgba(139, 92, 246, 0.5)">
              Cosmic Community
            </CosmicText>
            <CosmicText variant="body" className="mt-4 text-white/80 max-w-xl mx-auto" delay={0.5}>
              Join our collective consciousness and help shape the future of our cosmic journey through shared wisdom
              and collaborative creation.
            </CosmicText>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          <FeedbackStatistics stats={feedbackStats} />
        </div>
      </section>

      {/* Feedback Loop */}
      <section className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          <CommunityFeedbackLoop
            feedbackItems={sampleFeedbackItems}
            onVote={(id) => console.log("Vote for:", id)}
            onSubmit={(feedback) => console.log("Submit feedback:", feedback)}
            onComment={(id, comment) => console.log("Comment on:", id, comment)}
          />
        </div>
      </section>

      {/* Community Events */}
      <section className="py-8 md:py-12 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <CosmicHeading level={2} withAccent className="mb-6">
            Upcoming Community Events
          </CosmicHeading>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CosmicCard className="p-4">
              <div className="space-y-3">
                <div className="text-purple-400 text-sm font-medium">VIRTUAL GATHERING</div>
                <h3 className="text-lg font-bold text-white">Global Sound Healing Meditation</h3>
                <p className="text-white/70 text-sm">
                  Join thousands of cosmic explorers worldwide for a synchronized meditation using the Crown Connection
                  frequency.
                </p>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-white/60 text-sm">June 21, 2024 • 12:00 UTC</div>
                  <button className="px-3 py-1.5 rounded-full text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Set Reminder
                  </button>
                </div>
              </div>
            </CosmicCard>

            <CosmicCard className="p-4">
              <div className="space-y-3">
                <div className="text-blue-400 text-sm font-medium">LIVE WORKSHOP</div>
                <h3 className="text-lg font-bold text-white">Frequency Fundamentals: Understanding Solfeggio</h3>
                <p className="text-white/70 text-sm">
                  A beginner-friendly workshop explaining the science and history behind healing frequencies and how to
                  apply them.
                </p>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-white/60 text-sm">July 5, 2024 • 18:00 UTC</div>
                  <button className="px-3 py-1.5 rounded-full text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Register
                  </button>
                </div>
              </div>
            </CosmicCard>

            <CosmicCard className="p-4">
              <div className="space-y-3">
                <div className="text-green-400 text-sm font-medium">COMMUNITY CHALLENGE</div>
                <h3 className="text-lg font-bold text-white">21-Day Cosmic Consciousness Expansion</h3>
                <p className="text-white/70 text-sm">
                  Join our guided 21-day journey with daily frequencies, meditations, and practices to expand your
                  consciousness.
                </p>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-white/60 text-sm">Starts August 1, 2024</div>
                  <button className="px-3 py-1.5 rounded-full text-sm bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Join Challenge
                  </button>
                </div>
              </div>
            </CosmicCard>
          </div>
        </div>
      </section>
    </div>
  )
}

