/**
 * genius-lyrics-integration.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, Search, Info, Quote, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface GeniusLyricsIntegrationProps {
  trackTitle: string
  artistName?: string
  albumTitle?: string
}

export function GeniusLyricsIntegration({
  trackTitle,
  artistName = "ASTRA",
  albumTitle = "Cosmic Healing Frequencies",
}: GeniusLyricsIntegrationProps) {
  const [activeTab, setActiveTab] = useState("lyrics")
  const [isLoading, setIsLoading] = useState(false)
  const [showAnnotation, setShowAnnotation] = useState<number | null>(null)

  // Mock data for lyrics
  const lyrics = [
    { id: 1, text: "Breathe in the cosmic energy", hasAnnotation: true },
    { id: 2, text: "Feel the vibrations at 396 Hz", hasAnnotation: true },
    { id: 3, text: "Grounding to the earth below", hasAnnotation: false },
    { id: 4, text: "Releasing fear, letting go", hasAnnotation: false },
    { id: 5, text: "Root chakra awakening now", hasAnnotation: true },
    { id: 6, text: "Ancient wisdom shows us how", hasAnnotation: false },
    { id: 7, text: "Muladhara spinning red", hasAnnotation: true },
    { id: 8, text: "Healing energy from head to toe", hasAnnotation: false },
    { id: 9, text: "Cosmic healing frequencies", hasAnnotation: false },
    { id: 10, text: "Aligning with universal harmonies", hasAnnotation: true },
  ]

  // Mock data for annotations
  const annotations = {
    1: {
      text: "The opening line refers to the practice of conscious breathwork, which is often used in meditation to connect with universal energy. In many spiritual traditions, breath (prana) is seen as the carrier of life force energy.",
      author: "CosmicScholar",
      likes: 42,
      comments: 5,
      verified: true,
    },
    2: {
      text: "396 Hz is a Solfeggio frequency associated with the Root Chakra. This frequency is believed to help release fear and guilt while grounding the listener. It's part of the ancient Solfeggio scale rediscovered in modern times.",
      author: "FrequencyHealer",
      likes: 78,
      comments: 12,
      verified: true,
    },
    5: {
      text: "The Root Chakra (Muladhara) is the first of seven main chakras in the body. Located at the base of the spine, it's associated with feelings of safety, security, and being grounded. When balanced, it helps establish a solid foundation for opening the other chakras.",
      author: "ChakraExpert",
      likes: 56,
      comments: 8,
      verified: false,
    },
    7: {
      text: "Muladhara is the Sanskrit name for the Root Chakra. The word comes from 'mula' meaning 'root' and 'adhara' meaning 'support' or 'base'. It's traditionally visualized as a red, four-petaled lotus flower.",
      author: "SanskritStudent",
      likes: 31,
      comments: 3,
      verified: false,
    },
    10: {
      text: "This line references the concept that certain frequencies are in harmony with the natural vibrations of the universe. The idea draws from both ancient mystical traditions and modern quantum physics, suggesting that everything in existence has its own vibrational frequency.",
      author: "QuantumMystic",
      likes: 64,
      comments: 7,
      verified: true,
    },
  }

  // Mock data for song facts
  const songFacts = [
    "This track uses the Solfeggio frequency of 396 Hz, which is associated with the Root Chakra",
    "Recorded during a three-month meditation retreat in the Himalayan mountains",
    "Features authentic Tibetan singing bowls recorded in a sacred temple",
    "The rhythmic pattern in the background mimics the average human heartbeat at rest",
    "Incorporates binaural beats to enhance the meditative state",
  ]

  // Mock data for related songs
  const relatedSongs = [
    { title: "Sacral Awakening", album: "Cosmic Healing Frequencies", image: "/placeholder.svg?height=60&width=60" },
    { title: "Earth Connection", album: "Ethereal Meditation", image: "/placeholder.svg?height=60&width=60" },
    { title: "Grounding Ritual", album: "Quantum Resonance", image: "/placeholder.svg?height=60&width=60" },
    { title: "Base Frequency", album: "Astral Projection", image: "/placeholder.svg?height=60&width=60" },
  ]

  // Simulate loading effect
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const toggleAnnotation = (id: number) => {
    if (showAnnotation === id) {
      setShowAnnotation(null)
    } else {
      setShowAnnotation(id)
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black"
            >
              <path d="M9 10h.01"></path>
              <path d="M15 10h.01"></path>
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"></path>
              <path d="M9 16c.5 1 1.5 2 3 2s2.5-1 3-2"></path>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Genius</h2>
            <p className="text-xs text-white/60">Lyrics & Meaning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            <input
              type="search"
              placeholder="Search lyrics..."
              className="h-9 w-[180px] rounded-md bg-white/5 border-white/10 pl-9 text-sm text-white placeholder:text-white/50 focus:border-purple-400 focus:outline-none focus:ring-0"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/5"
            onClick={() => window.open("https://genius.com", "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Genius
          </Button>
        </div>
      </div>

      <Tabs defaultValue="lyrics" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10">
          <TabsList className="flex h-auto p-0 bg-transparent">
            <TabsTrigger
              value="lyrics"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Lyrics
            </TabsTrigger>
            <TabsTrigger
              value="facts"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Song Facts
            </TabsTrigger>
            <TabsTrigger
              value="related"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Related Songs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lyrics" className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin mb-4"></div>
              <p className="text-white/70">Loading lyrics from Genius...</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-5">
              <div className="md:col-span-3 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden">
                    <Image src="/placeholder.svg?height=100&width=100" alt={albumTitle} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{trackTitle}</h3>
                    <p className="text-sm text-white/60">
                      {artistName} • {albumTitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {lyrics.map((line) => (
                    <div key={line.id} className="group">
                      <div
                        className={cn(
                          "text-white text-lg leading-relaxed cursor-pointer",
                          line.hasAnnotation ? "hover:bg-yellow-500/20 rounded" : "",
                        )}
                        onClick={() => line.hasAnnotation && toggleAnnotation(line.id)}
                      >
                        {line.text}
                        {line.hasAnnotation && (
                          <Info className="inline-block ml-2 h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>

                      {showAnnotation === line.id && annotations[line.id] && (
                        <div className="mt-2 mb-4 ml-4 border-l-2 border-yellow-500 pl-4">
                          <div className="bg-black/40 rounded-md p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Quote className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium text-white">
                                  Annotation by {annotations[line.id].author}
                                </span>
                                {annotations[line.id].verified && (
                                  <span className="bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-white/60 text-xs">
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>{annotations[line.id].likes}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{annotations[line.id].comments}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-white/80 text-sm">{annotations[line.id].text}</p>
                            <div className="mt-3 flex justify-between">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10"
                                >
                                  <ThumbsUp className="mr-1 h-3 w-3" />
                                  Upvote
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10"
                                >
                                  <ThumbsDown className="mr-1 h-3 w-3" />
                                  Downvote
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10"
                              >
                                <MessageSquare className="mr-1 h-3 w-3" />
                                Comment
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 text-center">
                  <p className="text-white/60 text-sm mb-2">Know something about this song?</p>
                  <Button
                    variant="outline"
                    className="border-yellow-500/50 text-white hover:bg-yellow-500/20 hover:text-white"
                  >
                    Add Annotation
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-lg bg-black/40 p-4">
                  <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                    <Info className="h-4 w-4 text-yellow-500" />
                    About "{trackTitle}"
                  </h4>
                  <p className="text-white/80 text-sm mb-4">
                    "Root Chakra Alignment" is the opening track from ASTRA's album "Cosmic Healing Frequencies." The
                    track is designed to resonate with the Root Chakra (Muladhara) using the Solfeggio frequency of 396
                    Hz, which is believed to help release fear and guilt while establishing a sense of security and
                    stability.
                  </p>
                  <p className="text-white/80 text-sm">
                    The composition features authentic Tibetan singing bowls recorded during a three-month meditation
                    retreat in the Himalayan mountains, combined with subtle electronic elements and nature sounds to
                    create a grounding sonic experience.
                  </p>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <h4 className="font-medium text-white mb-3">Credits</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Written By</span>
                        <span className="text-white">ASTRA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Produced By</span>
                        <span className="text-white">ASTRA & Quantum Harmonics</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Release Date</span>
                        <span className="text-white">March 15, 2023</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="facts" className="p-6">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Interesting Facts About "{trackTitle}"</h3>

            <div className="grid gap-4 md:grid-cols-2">
              {songFacts.map((fact, i) => (
                <div key={i} className="rounded-lg bg-black/40 p-4 flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-black font-bold">
                    {i + 1}
                  </div>
                  <p className="text-white/80">{fact}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-black/40 p-6">
              <h4 className="font-medium text-white mb-4">Did You Know?</h4>
              <p className="text-white/80">
                The Solfeggio frequencies used in this album, including the 396 Hz frequency in this track, were
                rediscovered by Dr. Joseph Puleo in the 1970s. These frequencies are believed to have been used in
                ancient Gregorian chants and are said to have powerful healing properties. Modern sound therapy has
                adopted these frequencies for various healing applications.
              </p>
            </div>

            <div className="text-center">
              <p className="text-white/60 text-sm mb-2">Know another interesting fact?</p>
              <Button
                variant="outline"
                className="border-yellow-500/50 text-white hover:bg-yellow-500/20 hover:text-white"
              >
                Submit Fact
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="related" className="p-6">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Songs Related to "{trackTitle}"</h3>

            <div className="space-y-3">
              {relatedSongs.map((song, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-black/40 p-3 flex items-center justify-between group hover:bg-black/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded overflow-hidden">
                      <Image src={song.image || "/placeholder.svg"} alt={song.title} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white group-hover:text-yellow-500 transition-colors">
                        {song.title}
                      </h4>
                      <p className="text-sm text-white/60">{song.album}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/40 text-white hover:bg-yellow-500 hover:text-black"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View lyrics</span>
                  </Button>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-lg">Explore More on Genius</h4>
                  <p className="text-white/80">Discover lyrics, meanings, and connections for thousands of songs</p>
                </div>
                <Button
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  onClick={() => window.open("https://genius.com", "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Genius
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

