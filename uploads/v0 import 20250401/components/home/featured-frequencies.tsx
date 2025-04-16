"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Play, Pause, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Frequency {
  id: string
  title: string
  description: string
  frequency: number
  chakra: string
  color: string
  imageSrc: string
}

const frequencies: Frequency[] = [
  {
    id: "root",
    title: "Root Chakra",
    description: "Grounding and stability",
    frequency: 396,
    chakra: "Root",
    color: "#ff0000",
    imageSrc: "/placeholder.svg?height=300&width=300",
  },
  {
    id: "sacral",
    title: "Sacral Chakra",
    description: "Creativity and emotion",
    frequency: 417,
    chakra: "Sacral",
    color: "#ff8c00",
    imageSrc: "/placeholder.svg?height=300&width=300",
  },
  {
    id: "solar",
    title: "Solar Plexus",
    description: "Personal power and confidence",
    frequency: 528,
    chakra: "Solar Plexus",
    color: "#ffff00",
    imageSrc: "/placeholder.svg?height=300&width=300",
  },
  {
    id: "heart",
    title: "Heart Chakra",
    description: "Love and compassion",
    frequency: 639,
    chakra: "Heart",
    color: "#00ff00",
    imageSrc: "/placeholder.svg?height=300&width=300",
  },
]

export default function FeaturedFrequencies() {
  const [playingFrequency, setPlayingFrequency] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true)

    // Initialize audio context
    if (typeof window !== "undefined") {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContext()

      // Create gain node
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = 0.1 // Set volume to a low level
      gainNodeRef.current.connect(audioContextRef.current.destination)
    }

    return () => {
      // Clean up audio resources
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
        oscillatorRef.current.disconnect()
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Play/pause frequency
  const togglePlay = (id: string, frequency: number) => {
    if (!isMounted || !audioContextRef.current || !gainNodeRef.current) return

    // If already playing this frequency, stop it
    if (playingFrequency === id) {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
        oscillatorRef.current.disconnect()
        oscillatorRef.current = null
      }
      setPlayingFrequency(null)
      return
    }

    // If playing a different frequency, stop the current one
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current.disconnect()
      oscillatorRef.current = null
    }

    // Create and start new oscillator
    oscillatorRef.current = audioContextRef.current.createOscillator()
    oscillatorRef.current.type = "sine"
    oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
    oscillatorRef.current.connect(gainNodeRef.current)
    oscillatorRef.current.start()

    setPlayingFrequency(id)
  }

  if (!isMounted) {
    return (
      <div className="py-16 md:py-24">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Featured Frequencies</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Experience the healing power of these carefully tuned frequencies designed to balance your energy centers
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {frequencies.map((item) => (
            <div key={item.id} className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
              <div className="aspect-square rounded-lg bg-black/20 mb-4"></div>
              <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
              <p className="text-white/60 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 md:py-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Featured Frequencies</h2>
        <p className="text-white/70 max-w-2xl mx-auto">
          Experience the healing power of these carefully tuned frequencies designed to balance your energy centers
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {frequencies.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden mb-4 group">
              <Image src={item.imageSrc || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: `${item.color}40` }}
              >
                <button
                  onClick={() => togglePlay(item.id, item.frequency)}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                    playingFrequency === item.id
                      ? "bg-white text-purple-900"
                      : "bg-white/20 text-white hover:bg-white/30",
                  )}
                >
                  {playingFrequency === item.id ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
            <div className="flex justify-between items-center">
              <p className="text-white/60 text-sm">{item.frequency} Hz</p>
              <button
                onClick={() => togglePlay(item.id, item.frequency)}
                className={cn(
                  "text-sm flex items-center gap-1 transition-colors",
                  playingFrequency === item.id ? "text-purple-400" : "text-white/60 hover:text-white",
                )}
              >
                {playingFrequency === item.id ? "Stop" : "Play"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/archive"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <span>Explore all frequencies</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

