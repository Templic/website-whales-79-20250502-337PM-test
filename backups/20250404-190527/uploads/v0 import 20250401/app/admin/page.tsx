import { CommunityFeedback } from "@/components/community-feedback"
import { PerformanceOptimizations } from "@/components/performance-optimizations"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950">
      {/* Admin Header */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">Admin Dashboard</h1>
            <p className="mt-4 text-white/80 max-w-xl">
              Manage your site, monitor performance, and engage with your community.
            </p>
          </div>
        </div>
      </section>

      {/* Community Feedback */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Community Feedback</h2>
          <CommunityFeedback />
        </div>
      </section>

      {/* Performance & Security */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Performance & Security</h2>
          <PerformanceOptimizations />
        </div>
      </section>
    </div>
  )
}

