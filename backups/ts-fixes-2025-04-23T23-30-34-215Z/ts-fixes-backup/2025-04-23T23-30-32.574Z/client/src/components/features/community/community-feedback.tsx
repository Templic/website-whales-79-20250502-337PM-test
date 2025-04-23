/**
 * community-feedback.tsx
 * 
 * Component Type: community
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */import React from "react";

/**
 * community-feedback.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MessageSquare, ThumbsUp, Send, Star, Users, Lightbulb, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeedbackItem {
  id: number
  user: string
  avatar: string
  content: string
  date: string
  category: string
  status: "pending" | "implemented" | "considering" | "declined"
  votes: number
  userVoted?: boolean
  comments: number
}

export function CommunityFeedback() {
  const [activeTab, setActiveTab] = useState("feedback")
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackCategory, setFeedbackCategory] = useState("feature")
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [userVotes, setUserVotes] = useState<number[]>([])
  const [sortBy, setSortBy] = useState("popular")

  // Mock data for feedback items
  const feedbackItems: FeedbackItem[] = [
    {
      id: 1,
      user: "CosmicTraveler",
      avatar: "/placeholder.svg?height=50&width=50",
      content:
        "It would be amazing to have a feature that allows us to create custom playlists combining tracks from different albums based on specific chakras or healing intentions.",
      date: "2 days ago",
      category: "feature",
      status: "implemented",
      votes: 48,
      comments: 12,
    },
    {
      id: 2,
      user: "MeditationMaster",
      avatar: "/placeholder.svg?height=50&width=50",
      content:
        "Please add the ability to download tracks in higher quality formats like FLAC or 24-bit WAV for those of us who use professional audio equipment for sound healing sessions.",
      date: "1 week ago",
      category: "feature",
      status: "considering",
      votes: 36,
      comments: 8,
    },
    {
      id: 3,
      user: "HealingVibes",
      avatar: "/placeholder.svg?height=50&width=50",
      content:
        "The mobile app sometimes crashes when trying to download tracks for offline listening. This happens consistently on Android devices.",
      date: "3 days ago",
      category: "bug",
      status: "pending",
      votes: 27,
      comments: 5,
    },
    {
      id: 4,
      user: "ChakraAligned",
      avatar: "/placeholder.svg?height=50&width=50",
      content:
        "I'd love to see more educational content about the science behind frequency healing and how each track is designed to affect specific energy centers.",
      date: "2 weeks ago",
      category: "suggestion",
      status: "implemented",
      votes: 42,
      comments: 9,
    },
    {
      id: 5,
      user: "SoundHealer",
      avatar: "/placeholder.svg?height=50&width=50",
      content:
        "The volume normalization across different albums is inconsistent. Some tracks are much louder than others, which disrupts the flow during meditation sessions.",
      date: "5 days ago",
      category: "bug",
      status: "pending",
      votes: 31,
      comments: 7,
    },
  ]

  // Add user voted status based on userVotes state
  const feedbackWithVotes = feedbackItems.map((item) => ({
    ...item,
    userVoted: userVotes.includes(item.id),
  }))

  // Sort feedback items based on sortBy state
  const sortedFeedback = [...feedbackWithVotes].sort((a, b) => {
    if (sortBy === "popular") {
      return b.votes - a.votes
    } else if (sortBy === "recent") {
      // Simple sort by date string for demo purposes
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    } else if (sortBy === "implemented") {
      return a.status === "implemented" ? -1 : 1
    }
    return 0
  })

  const handleVote = (id: number) => {
    if (userVotes.includes(id)) {
      setUserVotes(userVotes.filter((itemId) => itemId !== id))
    } else {
      setUserVotes([...userVotes, id])
    }
  }

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the feedback to a backend
    setFeedbackSubmitted(true)

    // Reset after 3 seconds
    setTimeout(() => {
      setFeedbackSubmitted(false)
      setFeedbackText("")
      setFeedbackCategory("feature")
    }, 3000)
  }

  const getStatusIcon = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "implemented":
        return <Check className="h-4 w-4 text-green-500" />
      case "considering":
        return <Star className="h-4 w-4 text-yellow-500" />
      case "declined":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusText = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "implemented":
        return "Implemented"
      case "considering":
        return "Considering"
      case "declined":
        return "Declined"
      default:
        return "Pending"
    }
  }

  const getStatusColor = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "implemented":
        return "bg-green-500/10 text-green-500 border-green-500/30"
      case "considering":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
      case "declined":
        return "bg-red-500/10 text-red-500 border-red-500/30"
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/30"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "feature":
        return "bg-purple-500/10 text-purple-500 border-purple-500/30"
      case "bug":
        return "bg-red-500/10 text-red-500 border-red-500/30"
      case "suggestion":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/30"
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Community Feedback</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-md bg-white/5 border-white/10 text-sm text-white focus:border-purple-400 focus:outline-none focus:ring-0"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="implemented">Implemented</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="feedback" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10">
          <TabsList className="flex h-auto p-0 bg-transparent">
            <TabsTrigger
              value="feedback"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Community Feedback
            </TabsTrigger>
            <TabsTrigger
              value="submit"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Submit Feedback
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="feedback" className="p-6 space-y-6">
          <div className="space-y-4">
            {sortedFeedback.map((item) => (
              <div key={item.id} className="rounded-lg bg-black/40 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Image
                      src={item.avatar || "/placeholder.svg"}
                      width={40}
                      height={40}
                      alt={item.user}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{item.user}</span>
                        <span className="text-xs text-white/50">{item.date}</span>
                      </div>
                      <p className="text-white/80 mt-1">{item.content}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={cn("text-xs px-2 py-1 rounded-full border", getStatusColor(item.status))}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(item.status)}
                        <span>{getStatusText(item.status)}</span>
                      </div>
                    </div>
                    <div className={cn("text-xs px-2 py-1 rounded-full border", getCategoryColor(item.category))}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(item.id)}
                      className={cn(
                        "h-8 px-3 flex items-center gap-1",
                        item.userVoted ? "text-purple-400 hover:text-purple-500" : "text-white/60 hover:text-white",
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{item.userVoted ? item.votes + 1 : item.votes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-white/60 hover:text-white flex items-center gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{item.comments}</span>
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-white/60 hover:text-white">
                    Reply
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              className="border-purple-400/50 text-white hover:bg-purple-500/20 hover:text-white"
            >
              Load More Feedback
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="submit" className="p-6">
          {feedbackSubmitted ? (
            <div className="rounded-lg bg-green-900/20 border border-green-500/30 p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Thank You for Your Feedback!</h3>
              <p className="text-white/80 max-w-md mx-auto">
                Your input helps us improve the experience for our entire cosmic community. We'll review your feedback
                and keep you updated on its status.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="feedback-category" className="text-white mb-2 block">
                    Feedback Category
                  </Label>
                  <RadioGroup
                    defaultValue="feature"
                    value={feedbackCategory}
                    onValueChange={setFeedbackCategory}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="feature" id="feature" />
                      <Label htmlFor="feature" className="flex items-center gap-2 cursor-pointer">
                        <Lightbulb className="h-4 w-4 text-purple-400" />
                        <span className="text-white">Feature Request</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bug" id="bug" />
                      <Label htmlFor="bug" className="flex items-center gap-2 cursor-pointer">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-white">Bug Report</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="suggestion" id="suggestion" />
                      <Label htmlFor="suggestion" className="flex items-center gap-2 cursor-pointer">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-white">General Suggestion</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="feedback-text" className="text-white mb-2 block">
                    Your Feedback
                  </Label>
                  <Textarea
                    id="feedback-text"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your ideas, report issues, or suggest improvements..."
                    className="min-h-[150px] bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="feedback-name" className="text-white mb-2 block">
                      Your Name (Optional)
                    </Label>
                    <Input
                      id="feedback-name"
                      placeholder="How should we address you?"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedback-email" className="text-white mb-2 block">
                      Your Email (Optional)
                    </Label>
                    <Input
                      id="feedback-email"
                      type="email"
                      placeholder="To receive updates on your feedback"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Submit Feedback
              </Button>

              <p className="text-center text-xs text-white/60">
                By submitting feedback, you agree that it may be shared publicly in our community feedback section. We
                value your input and use it to guide our development priorities.
              </p>
            </form>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}



/**
 * Original CommunityFeedback component merged from: client/src/components/common/community-feedback.tsx
 * Merge date: 2025-04-05
 */
function CommunityFeedbackOriginal() {
  const [activeTab, setActiveTab] = useState("feedback")
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackCategory, setFeedbackCategory] = useState("feature")
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [userVotes, setUserVotes] = useState<number[]>([])
  const [sortBy, setSortBy] = useState("popular")

  // Mock data for feedback items
  const feedbackItems: FeedbackItem[] = [
    {
      id: 1,
      user: "CosmicTraveler",
      avatar: "/placeholder.svg?height=50&width=50",
      content:
        "It would be amazing to have a feature that allows us to create custom playlists combining tracks from different albums based on specific chakras or healing intentions.",
      date: "2 days ago",
      category: "feature",
      status: "implemented",
      votes: 48,
      comments: 12,
    },
    {
      id: 2,
      user: "MeditationMaster",
      avatar: "/placeholder.svg?height=50&width=50",
      content:
        "Please add the ability to download tracks in higher quality formats like FLAC or 24-bit WAV for those of us who use professional audio equipment for sound healing sessions.",
      date: "1 week ago",
      category: "feature",
      status: "considering",
      votes: 36,
      comments: 8,
    },
    {
      id: 3,
      user: "HealingVibes",
      avatar: "/placeholder.svg?height=50&width=50",
      content:
        "The mobile app sometimes crashes when trying to download tracks for offline listening. This happens consistently on Android devices.",
      date: "3 days ago",
      category: "bug",
      status: "pending",
      votes: 27,
      comments: 5,
    },
    {
      id: 4,
      user: "ChakraAligned",
      avatar: "/placeholder.svg?height=50&width=50",
      content:
        "I'd love to see more educational content about the science behind frequency healing and how each track is designed to affect specific energy centers.",
      date: "2 weeks ago",
      category: "suggestion",
      status: "implemented",
      votes: 42,
      comments: 9,
    },
    {
      id: 5,
      user: "SoundHealer",
      avatar: "/placeholder.svg?height=50&width=50",
      content:
        "The volume normalization across different albums is inconsistent. Some tracks are much louder than others, which disrupts the flow during meditation sessions.",
      date: "5 days ago",
      category: "bug",
      status: "pending",
      votes: 31,
      comments: 7,
    },
  ]

  // Add user voted status based on userVotes state
  const feedbackWithVotes = feedbackItems.map((item) => ({
    ...item,
    userVoted: userVotes.includes(item.id),
  }))

  // Sort feedback items based on sortBy state
  const sortedFeedback = [...feedbackWithVotes].sort((a, b) => {
    if (sortBy === "popular") {
      return b.votes - a.votes
    } else if (sortBy === "recent") {
      // Simple sort by date string for demo purposes
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    } else if (sortBy === "implemented") {
      return a.status === "implemented" ? -1 : 1
    }
    return 0
  })

  const handleVote = (id: number) => {
    if (userVotes.includes(id)) {
      setUserVotes(userVotes.filter((itemId) => itemId !== id))
    } else {
      setUserVotes([...userVotes, id])
    }
  }

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the feedback to a backend
    setFeedbackSubmitted(true)

    // Reset after 3 seconds
    setTimeout(() => {
      setFeedbackSubmitted(false)
      setFeedbackText("")
      setFeedbackCategory("feature")
    }, 3000)
  }

  const getStatusIcon = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "implemented":
        return <Check className="h-4 w-4 text-green-500" />
      case "considering":
        return <Star className="h-4 w-4 text-yellow-500" />
      case "declined":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusText = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "implemented":
        return "Implemented"
      case "considering":
        return "Considering"
      case "declined":
        return "Declined"
      default:
        return "Pending"
    }
  }

  const getStatusColor = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "implemented":
        return "bg-green-500/10 text-green-500 border-green-500/30"
      case "considering":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
      case "declined":
        return "bg-red-500/10 text-red-500 border-red-500/30"
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/30"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "feature":
        return "bg-purple-500/10 text-purple-500 border-purple-500/30"
      case "bug":
        return "bg-red-500/10 text-red-500 border-red-500/30"
      case "suggestion":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/30"
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Community Feedback</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-md bg-white/5 border-white/10 text-sm text-white focus:border-purple-400 focus:outline-none focus:ring-0"
          >
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="implemented">Implemented</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="feedback" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10">
          <TabsList className="flex h-auto p-0 bg-transparent">
            <TabsTrigger
              value="feedback"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Community Feedback
            </TabsTrigger>
            <TabsTrigger
              value="submit"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Submit Feedback
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="feedback" className="p-6 space-y-6">
          <div className="space-y-4">
            {sortedFeedback.map((item) => (
              <div key={item.id} className="rounded-lg bg-black/40 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Image
                      src={item.avatar || "/placeholder.svg"}
                      width={40}
                      height={40}
                      alt={item.user}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{item.user}</span>
                        <span className="text-xs text-white/50">{item.date}</span>
                      </div>
                      <p className="text-white/80 mt-1">{item.content}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={cn("text-xs px-2 py-1 rounded-full border", getStatusColor(item.status))}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(item.status)}
                        <span>{getStatusText(item.status)}</span>
                      </div>
                    </div>
                    <div className={cn("text-xs px-2 py-1 rounded-full border", getCategoryColor(item.category))}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(item.id)}
                      className={cn(
                        "h-8 px-3 flex items-center gap-1",
                        item.userVoted ? "text-purple-400 hover:text-purple-500" : "text-white/60 hover:text-white",
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{item.userVoted ? item.votes + 1 : item.votes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-white/60 hover:text-white flex items-center gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{item.comments}</span>
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-white/60 hover:text-white">
                    Reply
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              className="border-purple-400/50 text-white hover:bg-purple-500/20 hover:text-white"
            >
              Load More Feedback
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="submit" className="p-6">
          {feedbackSubmitted ? (
            <div className="rounded-lg bg-green-900/20 border border-green-500/30 p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Thank You for Your Feedback!</h3>
              <p className="text-white/80 max-w-md mx-auto">
                Your input helps us improve the experience for our entire cosmic community. We'll review your feedback
                and keep you updated on its status.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="feedback-category" className="text-white mb-2 block">
                    Feedback Category
                  </Label>
                  <RadioGroup
                    defaultValue="feature"
                    value={feedbackCategory}
                    onValueChange={setFeedbackCategory}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="feature" id="feature" />
                      <Label htmlFor="feature" className="flex items-center gap-2 cursor-pointer">
                        <Lightbulb className="h-4 w-4 text-purple-400" />
                        <span className="text-white">Feature Request</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bug" id="bug" />
                      <Label htmlFor="bug" className="flex items-center gap-2 cursor-pointer">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-white">Bug Report</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="suggestion" id="suggestion" />
                      <Label htmlFor="suggestion" className="flex items-center gap-2 cursor-pointer">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-white">General Suggestion</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="feedback-text" className="text-white mb-2 block">
                    Your Feedback
                  </Label>
                  <Textarea
                    id="feedback-text"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your ideas, report issues, or suggest improvements..."
                    className="min-h-[150px] bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="feedback-name" className="text-white mb-2 block">
                      Your Name (Optional)
                    </Label>
                    <Input
                      id="feedback-name"
                      placeholder="How should we address you?"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedback-email" className="text-white mb-2 block">
                      Your Email (Optional)
                    </Label>
                    <Input
                      id="feedback-email"
                      type="email"
                      placeholder="To receive updates on your feedback"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Submit Feedback
              </Button>

              <p className="text-center text-xs text-white/60">
                By submitting feedback, you agree that it may be shared publicly in our community feedback section. We
                value your input and use it to guide our development priorities.
              </p>
            </form>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

