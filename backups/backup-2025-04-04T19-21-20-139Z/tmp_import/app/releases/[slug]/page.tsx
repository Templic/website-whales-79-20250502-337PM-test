import Image from "next/image"
import Link from "next/link"
import { MusicPlayer } from "@/components/music-player"
import { ReleaseEngagement } from "@/components/release-engagement"
import { StreamingLinks } from "@/components/streaming-links"
import { LyricsSection } from "@/components/lyrics-section"
import { LiveSession } from "@/components/live-session"
import { TrackSegmentationViewer } from "@/components/track-segmentation-viewer"
import { FanRemixContest } from "@/components/fan-remix-contest"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

// This would typically come from a CMS or API
const getReleaseData = (slug: string) => {
  // Example data - in a real app, fetch this from an API
  return {
    title: "Cosmic Healing Frequencies",
    releaseDate: "March 15, 2024",
    coverArt: "/placeholder.svg?height=600&width=600",
    description:
      "A journey through the chakras with healing frequencies designed to balance and align your energy centers.",
    genre: "Ambient / Meditation / Electronic",
    tracks: [
      { id: 1, title: "Root Chakra Alignment", duration: "6:32", frequency: "396 Hz" },
      { id: 2, title: "Sacral Awakening", duration: "7:14", frequency: "417 Hz" },
      { id: 3, title: "Solar Plexus Activation", duration: "5:48", frequency: "528 Hz" },
      { id: 4, title: "Heart Resonance", duration: "8:21", frequency: "639 Hz" },
      { id: 5, title: "Throat Gateway", duration: "6:05", frequency: "741 Hz" },
      { id: 6, title: "Third Eye Vision", duration: "9:17", frequency: "852 Hz" },
      { id: 7, title: "Crown Connection", duration: "10:33", frequency: "963 Hz" },
    ],
    videos: [
      {
        id: 1,
        title: "Cosmic Healing Frequencies - Official Visualizer",
        thumbnail: "/placeholder.svg?height=300&width=500",
        url: "#",
      },
      {
        id: 2,
        title: "Making of Cosmic Healing Frequencies",
        thumbnail: "/placeholder.svg?height=300&width=500",
        url: "#",
      },
    ],
    artistNotes:
      "This album was created during a three-month meditation retreat in the mountains of Nepal. Each track is tuned to a specific Solfeggio frequency that corresponds to a chakra energy center in the body. The compositions blend ancient singing bowl recordings with modern synthesizers and field recordings of natural environments.",
    trackSegments: [
      {
        id: 1,
        name: "Introduction",
        startTime: 0,
        endTime: 45,
        description: "Gentle introduction with ambient sounds and soft drone",
        color: "#9333ea",
      },
      {
        id: 2,
        name: "Rising Energy",
        startTime: 45,
        endTime: 120,
        description: "Building intensity with rhythmic elements and singing bowls",
        color: "#4f46e5",
      },
      {
        id: 3,
        name: "Root Activation",
        startTime: 120,
        endTime: 210,
        description: "396 Hz frequency focus with earthy tones and grounding vibrations",
        color: "#ef4444",
      },
      {
        id: 4,
        name: "Meditation",
        startTime: 210,
        endTime: 300,
        description: "Deep meditative section with pure 396 Hz tones",
        color: "#8b5cf6",
      },
      {
        id: 5,
        name: "Integration",
        startTime: 300,
        endTime: 392,
        description: "Gentle return with harmonic overtones and nature sounds",
        color: "#3b82f6",
      },
    ],
  }
}

export default function ReleasePage({ params }: { params: { slug: string } }) {
  const release = getReleaseData(params.slug)

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950">
      {/* Release Banner */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="relative aspect-square max-w-md mx-auto lg:mx-0 overflow-hidden rounded-xl border border-purple-500/30 bg-black/20 p-2 backdrop-blur-sm">
              <div className="absolute inset-0 animate-pulse rounded-xl bg-purple-500/10"></div>
              <Image
                src={release.coverArt || "/placeholder.svg"}
                width={600}
                height={600}
                alt={release.title}
                className="relative z-10 h-full w-full rounded-lg object-cover"
              />
            </div>
            <div className="space-y-4 text-center lg:text-left">
              <div className="inline-block rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300">
                New Release
              </div>
              <h1 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
                {release.title}
              </h1>
              <div className="flex flex-col gap-2 text-white/70">
                <p>Release Date: {release.releaseDate}</p>
                <p>Genre: {release.genre}</p>
              </div>
              <p className="text-white/80 max-w-xl mx-auto lg:mx-0">{release.description}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                  Stream Now
                </Button>
                <Button
                  variant="outline"
                  className="border-purple-400/50 text-white hover:bg-purple-500/20 hover:text-white"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Session */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Live Release Session</h2>
          <LiveSession releaseId="cosmic-healing-frequencies" isLive={false} />
        </div>
      </section>

      {/* Music Player & Tracklist */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold text-white mb-6">Listen</h2>
              <MusicPlayer />
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6">Tracklist</h2>
              <div className="space-y-4">
                {release.tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                        <span className="text-xs font-medium text-white">{track.id}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{track.title}</h3>
                        <p className="text-xs text-white/60">{track.frequency}</p>
                      </div>
                    </div>
                    <span className="text-sm text-white/60">{track.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Track Segmentation Viewer */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Track Visualization</h2>
          <TrackSegmentationViewer
            trackTitle="Root Chakra Alignment"
            trackDuration={392}
            segments={release.trackSegments}
          />
        </div>
      </section>

      {/* Streaming Links */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Available On</h2>
          <StreamingLinks />
        </div>
      </section>

      {/* Fan Remix Contest */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Fan Remix Contest</h2>
          <FanRemixContest />
        </div>
      </section>

      {/* Videos Section */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Videos</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {release.videos.map((video) => (
              <Link href={video.url} key={video.id} className="group relative overflow-hidden rounded-xl">
                <Image
                  src={video.thumbnail || "/placeholder.svg"}
                  width={500}
                  height={300}
                  alt={video.title}
                  className="w-full aspect-video object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                  <div className="p-4">
                    <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                      {video.title}
                    </h3>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-16 w-16 rounded-full bg-purple-500/80 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={24}
                      height={24}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Artist Notes */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Artist Notes</h2>
            <div className="prose prose-invert prose-purple max-w-none">
              <p className="text-white/80 leading-relaxed">{release.artistNotes}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lyrics Section */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Lyrics & Frequencies</h2>
          <LyricsSection tracks={release.tracks} />
        </div>
      </section>

      {/* Engagement Section */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Fan Reactions</h2>
          <ReleaseEngagement />
        </div>
      </section>

      {/* Related Releases */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">You May Also Like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Link href={`/releases/related-album-${i}`} key={i} className="group">
                <div className="overflow-hidden rounded-xl bg-black/20 p-4 backdrop-blur-sm transition-all hover:bg-purple-900/20">
                  <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
                    <Image
                      src={`/placeholder.svg?height=300&width=300`}
                      width={300}
                      height={300}
                      alt={`Related Album ${i}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                    Ethereal Meditation Vol. {i}
                  </h3>
                  <p className="text-sm text-white/60">2023</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

