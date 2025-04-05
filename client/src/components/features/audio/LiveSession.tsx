/**
 * LiveSession.tsx
 * 
 * Component Type: audio
 * Migrated from: v0 components
 * Migration Date: 2025-04-05
 */
/**
 * LiveSession.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: v0_extract/components/live-session.tsx
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Play, Pause, Users, MessageSquare, Send, Calendar, Clock, Bell, BellOff } from "lucide-react"

interface LiveSessionProps {
  releaseId: string
  title?: string
  scheduledTime?: string
  isLive?: boolean
}

export function LiveSession({
  releaseId,
  title = "Cosmic Healing Frequencies - Live Release Session",
  scheduledTime = "2024-04-15T19:00:00Z",
  isLive = false,
}: LiveSessionProps) {
  const [playing, setPlaying] = useState(false)
  const [message, setMessage] = useState("")
  const [remindMe, setRemindMe] = useState(false)
  const [countdown, setCountdown] = useState("")
  const [viewerCount, setViewerCount] = useState(0)

  // Mock chat messages
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      user: "CosmicTraveler",
      avatar: "/placeholder.svg?height=40&width=40",
      message: "So excited for this release! The previews sound amazing.",
      time: "2 min ago",
    },
    {
      id: 2,
      user: "AstralHealer",
      avatar: "/placeholder.svg?height=40&width=40",
      message: "Will you be explaining the frequency science behind each track?",
      time: "1 min ago",
    },
    {
      id: 3,
      user: "MeditationMaster",
      avatar: "/placeholder.svg?height=40&width=40",
      message: "The Root Chakra track has already helped my meditation practice so much!",
      time: "Just now",
    },
  ])

  // Calculate countdown to live session
  useEffect(() => {
    if (isLive) return

    const interval = setInterval(() => {
      const now = new Date()
      const eventTime = new Date(scheduledTime)
      const diff = eventTime.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown("Starting soon...")
        clearInterval(interval)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setCountdown(`${days}d ${hours}h ${minutes}m`)
    }, 1000)

    return () => clearInterval(interval)
  }, [scheduledTime, isLive])

  // Simulate changing viewer count
  useEffect(() => {
    if (!isLive) {
      setViewerCount(0)
      return
    }

    const interval = setInterval(() => {
      // Random fluctuation in viewer count for demo purposes
      setViewerCount((prev) => Math.max(120, prev + Math.floor(Math.random() * 11) - 5))
    }, 5000)

    // Initial count
    setViewerCount(127)

    return () => clearInterval(interval)
  }, [isLive])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    // In a real app, this would send the message to a backend
    const newMessage = {
      id: chatMessages.length + 1,
      user: "You",
      avatar: "/placeholder.svg?height=40&width=40",
      message: message,
      time: "Just now",
    }

    setChatMessages((prev) => [...prev, newMessage])
    setMessage("")
  }

  const toggleReminder = () => {
    // In a real app, this would register for notifications
    setRemindMe(!remindMe)
  }

  return (
    <div className="rounded-xl overflow-hidden bg-black/40 backdrop-blur-sm border border-purple-500/20">
      <div className="relative aspect-video bg-black">
        {isLive ? (
          <>
            {/* Live stream video */}
            <div className="relative h-full w-full">
              <Image src="/placeholder.svg?height=720&width=1280" alt="Live session" fill className="object-cover" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-2 bg-red-600 px-2 py-1 rounded-md">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                  <span className="text-xs font-medium text-white">LIVE</span>
                </div>
                <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
                  <Users className="h-3 w-3 text-white" />
                  <span className="text-xs font-medium text-white">{viewerCount}</span>
                </div>
              </div>

              {/* Play/pause controls */}
              <div className="absolute inset-0 flex items-center justify-center">
                {!playing && (
                  <Button
                    onClick={() => setPlaying(true)}
                    size="icon"
                    className="h-16 w-16 rounded-full bg-purple-500/80 hover:bg-purple-600/80 text-white"
                  >
                    <Play className="h-8 w-8" />
                    <span className="sr-only">Play</span>
                  </Button>
                )}
              </div>

              {/* Video controls (simplified) */}
              {playing && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setPlaying(false)}
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-full text-white hover:bg-white/10"
                    >
                      <Pause className="h-5 w-5" />
                      <span className="sr-only">Pause</span>
                    </Button>

                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-purple-500"></div>
                    </div>

                    <span className="text-xs text-white">12:34 / 45:00</span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Upcoming stream placeholder */}
            <div className="relative h-full w-full bg-gradient-to-br from-purple-900/40 to-indigo-900/40">
              <Image
                src="/placeholder.svg?height=720&width=1280"
                alt="Upcoming session"
                fill
                className="object-cover opacity-40"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{title}</h3>
                <div className="flex items-center gap-2 text-white/80 mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(scheduledTime).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <Clock className="h-4 w-4 ml-2" />
                  <span>
                    {new Date(scheduledTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="bg-black/60 px-6 py-3 rounded-full backdrop-blur-sm mb-6">
                  <span className="text-lg md:text-xl font-bold text-white">Starting in {countdown}</span>
                </div>
                <Button
                  onClick={toggleReminder}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                >
                  {remindMe ? <BellOff className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
                  {remindMe ? "Reminder Set" : "Remind Me"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chat section */}
      <div className="h-80 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-medium text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple-400" />
            Live Chat
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <Image
                src={msg.avatar || "/placeholder.svg"}
                width={32}
                height={32}
                alt={msg.user}
                className="h-8 w-8 rounded-full"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{msg.user}</span>
                  <span className="text-xs text-white/50">{msg.time}</span>
                </div>
                <p className="text-white/80 text-sm">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
            />
            <Button type="submit" size="icon" className="h-10 w-10 bg-purple-500 text-white hover:bg-purple-600">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

