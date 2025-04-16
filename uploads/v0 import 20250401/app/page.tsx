import { Suspense } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Headphones, Music, Calendar, Instagram, Twitter, Youtube, ArrowRight } from "lucide-react"
import { CosmicSection } from "@/components/ui/cosmic/cosmic-section"

// Lazy load components to improve initial load time
const FeaturedFrequencies = dynamic(() => import("@/components/home/featured-frequencies"), {
  loading: () => <div className="h-96 bg-white/5 rounded-xl animate-pulse"></div>,
  ssr: false,
})

const Newsletter = dynamic(() => import("@/components/newsletter").then((mod) => mod.Newsletter), {
  loading: () => <div className="h-48 bg-white/5 rounded-xl animate-pulse"></div>,
  ssr: true,
})

export default function Home() {
  // Use a static date format to prevent hydration mismatches
  const currentYear = new Date().getFullYear()

  return (
    <div className="container px-4 md:px-6 mx-auto">
      {/* Hero Section */}
      <CosmicSection className="py-20 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-300">
          ASTRA
        </h1>
        <h2 className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
          Experience transformative sound healing through cosmic frequencies designed to balance chakras and elevate
          consciousness
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/immersive"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium hover:from-purple-600 hover:to-indigo-700 transition-colors flex items-center gap-2"
          >
            <Headphones className="h-5 w-5" />
            <span>Begin Journey</span>
          </Link>
          <Link
            href="/archive"
            className="px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Music className="h-5 w-5" />
            <span>Explore Frequencies</span>
          </Link>
        </div>
      </CosmicSection>

      {/* Featured Sections */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {/* Immersive Experience */}
        <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors group">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <Headphones className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Immersive Experience</h3>
          <p className="text-white/70 mb-4">
            Dive into multi-dimensional sound journeys designed to transport your consciousness to higher realms.
          </p>
          <Link
            href="/immersive"
            className="text-purple-400 flex items-center gap-1 group-hover:text-purple-300 transition-colors"
          >
            <span>Experience Now</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Sound Archive */}
        <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors group">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
            <Music className="h-6 w-6 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Sound Archive</h3>
          <p className="text-white/70 mb-4">
            Explore our collection of healing frequencies, binaural beats, and cosmic soundscapes for daily practice.
          </p>
          <Link
            href="/archive"
            className="text-indigo-400 flex items-center gap-1 group-hover:text-indigo-300 transition-colors"
          >
            <span>Browse Archive</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Upcoming Ceremonies */}
        <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors group">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Upcoming Ceremonies</h3>
          <p className="text-white/70 mb-4">
            Join our virtual and in-person sound healing ceremonies, workshops, and cosmic gatherings.
          </p>
          <Link
            href="/journey"
            className="text-blue-400 flex items-center gap-1 group-hover:text-blue-300 transition-colors"
          >
            <span>View Schedule</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Featured Frequencies */}
      <Suspense fallback={<div className="h-96 bg-white/5 rounded-xl animate-pulse"></div>}>
        <FeaturedFrequencies />
      </Suspense>

      {/* About Section */}
      <CosmicSection className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Cosmic Healing Through Sound</h2>
          <p className="text-lg text-white/80 mb-8">
            ASTRA harnesses the ancient wisdom of sound healing combined with modern frequency science to create
            transformative audio experiences. Our carefully crafted frequencies align with the natural resonance of your
            body's energy centers, facilitating healing, balance, and expanded consciousness.
          </p>
          <Link
            href="/journey"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>Learn about our journey</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CosmicSection>

      {/* Newsletter */}
      <CosmicSection className="py-16 md:py-24 bg-gradient-to-b from-black/0 via-purple-900/10 to-black/0">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Join Our Cosmic Community</h2>
            <p className="text-white/70">
              Subscribe to receive updates on new frequencies, upcoming ceremonies, and exclusive content.
            </p>
          </div>
          <Newsletter />
        </div>
      </CosmicSection>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/60 backdrop-blur-md">
        <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between md:py-12 px-4 md:px-6">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative h-8 w-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <path d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3z" fill="currentColor" />
                    <path d="M12 21a9 9 0 0 0 9-9h-3a6 6 0 0 1-6 6v3z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              <span className="text-lg font-bold tracking-wider text-white">ASTRA</span>
            </Link>
            <p className="text-sm text-white/60">© {currentYear} ASTRA. All rights reserved.</p>
          </div>

          <div className="flex gap-4">
            <Link href="#" className="text-white/60 hover:text-white transition-colors">
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="#" className="text-white/60 hover:text-white transition-colors">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="text-white/60 hover:text-white transition-colors">
              <Youtube className="h-5 w-5" />
              <span className="sr-only">YouTube</span>
            </Link>
            <Link href="#" className="text-white/60 hover:text-white transition-colors">
              <Headphones className="h-5 w-5" />
              <span className="sr-only">Spotify</span>
            </Link>
          </div>

          <nav className="flex gap-4 md:gap-6">
            <Link href="#" className="text-xs text-white/60 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs text-white/60 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-xs text-white/60 hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

