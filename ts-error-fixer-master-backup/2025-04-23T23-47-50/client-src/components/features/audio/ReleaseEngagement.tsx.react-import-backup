/**
 * ReleaseEngagement.tsx
 * 
 * Component Type: audio
 * Migrated from: v0 components
 * Migration Date: 2025-04-05
 */import React from "react";

/**
 * ReleaseEngagement.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: v0_extract/components/release-engagement.tsx
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageSquare, Share2 } from "lucide-react"

export function ReleaseEngagement() {
  const [comment, setComment] = useState("")

  // Example fan reactions - in a real app, these would come from an API
  const fanReactions = [
    {
      id: 1,
      name: "Alex M.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "This album has completely transformed my meditation practice. The Root Chakra track helped me feel grounded for the first time in years.",
      date: "2 days ago",
      likes: 24,
    },
    {
      id: 2,
      name: "Jordan T.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "I've been using these frequencies during my sound healing sessions with clients and the results have been incredible. The production quality is outstanding.",
      date: "1 week ago",
      likes: 18,
    },
    {
      id: 3,
      name: "Sam K.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "The Third Eye Vision track helped me break through a creative block I've had for months. Suddenly ideas are flowing again!",
      date: "2 weeks ago",
      likes: 15,
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the comment to an API
    setComment("")
    alert("Comment submitted! (This is just a demo)")
  }

  return (
    <div className="space-y-8">
      {/* Social Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <Heart className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">1.2K</span>
            <span className="text-sm text-white/60">Likes</span>
          </div>
        </div>
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <MessageSquare className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">348</span>
            <span className="text-sm text-white/60">Comments</span>
          </div>
        </div>
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <Share2 className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">526</span>
            <span className="text-sm text-white/60">Shares</span>
          </div>
        </div>
      </div>

      {/* Fan Comments */}
      <div className="space-y-4">
        {fanReactions.map((reaction) => (
          <div key={reaction.id} className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
            <div className="flex gap-4">
              <Image
                src={reaction.avatar || "/placeholder.svg"}
                width={50}
                height={50}
                alt={reaction.name}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{reaction.name}</h3>
                  <span className="text-xs text-white/60">{reaction.date}</span>
                </div>
                <p className="mt-2 text-white/80">{reaction.comment}</p>
                <div className="mt-3 flex items-center gap-4">
                  <button className="flex items-center gap-1 text-sm text-white/60 hover:text-purple-400 transition-colors">
                    <Heart className="h-4 w-4" />
                    <span>{reaction.likes}</span>
                  </button>
                  <button className="text-sm text-white/60 hover:text-purple-400 transition-colors">Reply</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Form */}
      <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
        <h3 className="font-medium text-white mb-4">Share Your Experience</h3>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How has this music affected you?"
            className="mb-4 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
            rows={4}
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
          >
            Post Comment
          </Button>
        </form>
      </div>
    </div>
  )
}



/**
 * Original ReleaseEngagement component merged from: client/src/components/common/release-engagement.tsx
 * Merge date: 2025-04-05
 */
function ReleaseEngagementOriginal() {
  const [comment, setComment] = useState("")

  // Example fan reactions - in a real app, these would come from an API
  const fanReactions = [
    {
      id: 1,
      name: "Alex M.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "This album has completely transformed my meditation practice. The Root Chakra track helped me feel grounded for the first time in years.",
      date: "2 days ago",
      likes: 24,
    },
    {
      id: 2,
      name: "Jordan T.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "I've been using these frequencies during my sound healing sessions with clients and the results have been incredible. The production quality is outstanding.",
      date: "1 week ago",
      likes: 18,
    },
    {
      id: 3,
      name: "Sam K.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "The Third Eye Vision track helped me break through a creative block I've had for months. Suddenly ideas are flowing again!",
      date: "2 weeks ago",
      likes: 15,
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the comment to an API
    setComment("")
    alert("Comment submitted! (This is just a demo)")
  }

  return (
    <div className="space-y-8">
      {/* Social Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <Heart className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">1.2K</span>
            <span className="text-sm text-white/60">Likes</span>
          </div>
        </div>
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <MessageSquare className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">348</span>
            <span className="text-sm text-white/60">Comments</span>
          </div>
        </div>
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <Share2 className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">526</span>
            <span className="text-sm text-white/60">Shares</span>
          </div>
        </div>
      </div>

      {/* Fan Comments */}
      <div className="space-y-4">
        {fanReactions.map((reaction) => (
          <div key={reaction.id} className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
            <div className="flex gap-4">
              <Image
                src={reaction.avatar || "/placeholder.svg"}
                width={50}
                height={50}
                alt={reaction.name}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{reaction.name}</h3>
                  <span className="text-xs text-white/60">{reaction.date}</span>
                </div>
                <p className="mt-2 text-white/80">{reaction.comment}</p>
                <div className="mt-3 flex items-center gap-4">
                  <button className="flex items-center gap-1 text-sm text-white/60 hover:text-purple-400 transition-colors">
                    <Heart className="h-4 w-4" />
                    <span>{reaction.likes}</span>
                  </button>
                  <button className="text-sm text-white/60 hover:text-purple-400 transition-colors">Reply</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Form */}
      <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
        <h3 className="font-medium text-white mb-4">Share Your Experience</h3>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How has this music affected you?"
            className="mb-4 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
            rows={4}
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
          >
            Post Comment
          </Button>
        </form>
      </div>
    </div>
  )
}



/**
 * Original ReleaseEngagement component merged from: client/src/components/common/ReleaseEngagement.tsx
 * Merge date: 2025-04-05
 */
function ReleaseEngagementOriginal() {
  const [comment, setComment] = useState("")

  // Example fan reactions - in a real app, these would come from an API
  const fanReactions = [
    {
      id: 1,
      name: "Alex M.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "This album has completely transformed my meditation practice. The Root Chakra track helped me feel grounded for the first time in years.",
      date: "2 days ago",
      likes: 24,
    },
    {
      id: 2,
      name: "Jordan T.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "I've been using these frequencies during my sound healing sessions with clients and the results have been incredible. The production quality is outstanding.",
      date: "1 week ago",
      likes: 18,
    },
    {
      id: 3,
      name: "Sam K.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "The Third Eye Vision track helped me break through a creative block I've had for months. Suddenly ideas are flowing again!",
      date: "2 weeks ago",
      likes: 15,
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the comment to an API
    setComment("")
    alert("Comment submitted! (This is just a demo)")
  }

  return (
    <div className="space-y-8">
      {/* Social Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <Heart className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">1.2K</span>
            <span className="text-sm text-white/60">Likes</span>
          </div>
        </div>
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <MessageSquare className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">348</span>
            <span className="text-sm text-white/60">Comments</span>
          </div>
        </div>
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <Share2 className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">526</span>
            <span className="text-sm text-white/60">Shares</span>
          </div>
        </div>
      </div>

      {/* Fan Comments */}
      <div className="space-y-4">
        {fanReactions.map((reaction) => (
          <div key={reaction.id} className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
            <div className="flex gap-4">
              <Image
                src={reaction.avatar || "/placeholder.svg"}
                width={50}
                height={50}
                alt={reaction.name}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{reaction.name}</h3>
                  <span className="text-xs text-white/60">{reaction.date}</span>
                </div>
                <p className="mt-2 text-white/80">{reaction.comment}</p>
                <div className="mt-3 flex items-center gap-4">
                  <button className="flex items-center gap-1 text-sm text-white/60 hover:text-purple-400 transition-colors">
                    <Heart className="h-4 w-4" />
                    <span>{reaction.likes}</span>
                  </button>
                  <button className="text-sm text-white/60 hover:text-purple-400 transition-colors">Reply</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Form */}
      <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
        <h3 className="font-medium text-white mb-4">Share Your Experience</h3>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How has this music affected you?"
            className="mb-4 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
            rows={4}
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
          >
            Post Comment
          </Button>
        </form>
      </div>
    </div>
  )
}



/**
 * Original ReleaseEngagement component merged from: client/src/components/features/community/release-engagement.tsx
 * Merge date: 2025-04-05
 */
function ReleaseEngagementOriginal() {
  const [comment, setComment] = useState("")

  // Example fan reactions - in a real app, these would come from an API
  const fanReactions = [
    {
      id: 1,
      name: "Alex M.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "This album has completely transformed my meditation practice. The Root Chakra track helped me feel grounded for the first time in years.",
      date: "2 days ago",
      likes: 24,
    },
    {
      id: 2,
      name: "Jordan T.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "I've been using these frequencies during my sound healing sessions with clients and the results have been incredible. The production quality is outstanding.",
      date: "1 week ago",
      likes: 18,
    },
    {
      id: 3,
      name: "Sam K.",
      avatar: "/placeholder.svg?height=50&width=50",
      comment:
        "The Third Eye Vision track helped me break through a creative block I've had for months. Suddenly ideas are flowing again!",
      date: "2 weeks ago",
      likes: 15,
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the comment to an API
    setComment("")
    alert("Comment submitted! (This is just a demo)")
  }

  return (
    <div className="space-y-8">
      {/* Social Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <Heart className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">1.2K</span>
            <span className="text-sm text-white/60">Likes</span>
          </div>
        </div>
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <MessageSquare className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">348</span>
            <span className="text-sm text-white/60">Comments</span>
          </div>
        </div>
        <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <Share2 className="h-6 w-6 text-purple-400 mb-2" />
            <span className="text-2xl font-bold text-white">526</span>
            <span className="text-sm text-white/60">Shares</span>
          </div>
        </div>
      </div>

      {/* Fan Comments */}
      <div className="space-y-4">
        {fanReactions.map((reaction) => (
          <div key={reaction.id} className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
            <div className="flex gap-4">
              <Image
                src={reaction.avatar || "/placeholder.svg"}
                width={50}
                height={50}
                alt={reaction.name}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{reaction.name}</h3>
                  <span className="text-xs text-white/60">{reaction.date}</span>
                </div>
                <p className="mt-2 text-white/80">{reaction.comment}</p>
                <div className="mt-3 flex items-center gap-4">
                  <button className="flex items-center gap-1 text-sm text-white/60 hover:text-purple-400 transition-colors">
                    <Heart className="h-4 w-4" />
                    <span>{reaction.likes}</span>
                  </button>
                  <button className="text-sm text-white/60 hover:text-purple-400 transition-colors">Reply</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Form */}
      <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
        <h3 className="font-medium text-white mb-4">Share Your Experience</h3>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How has this music affected you?"
            className="mb-4 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
            rows={4}
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
          >
            Post Comment
          </Button>
        </form>
      </div>
    </div>
  )
}

