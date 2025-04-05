/**
 * community-feedback-loop.tsx
 * 
 * Component Type: common
 * Migrated from imported components.
 */
/**
 * community-feedback-loop.tsx
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
import { motion, AnimatePresence } from "framer-motion"
import { CosmicCard } from "@/components/cosmic-card"
import { CosmicButton } from "@/components/cosmic-button"
import { CosmicHeading } from "@/components/cosmic-heading"
import { CosmicIcon } from "@/components/cosmic-icons"
import { CosmicReveal } from "@/components/cosmic-interactive-effects"
import { cn } from "@/lib/utils"

interface FeedbackItem {
  id: string
  user: {
    name: string
    avatar: string
  }
  content: string
  date: string
  category: string
  status: "pending" | "implemented" | "considering" | "declined"
  votes: number
  userVoted?: boolean
  comments: number
}

interface CommunityFeedbackLoopProps {
  feedbackItems: FeedbackItem[]
  onVote?: (id: string) => void
  onSubmit?: (feedback: { content: string; category: string }) => void
  onComment?: (id: string, comment: string) => void
  className?: string
}

export function CommunityFeedbackLoop({
  feedbackItems,
  onVote,
  onSubmit,
  onComment,
  className,
}: CommunityFeedbackLoopProps) {
  const [activeTab, setActiveTab] = useState<"browse" | "submit">("browse")
  const [filter, setFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "implemented">("popular")
  const [feedbackContent, setFeedbackContent] = useState("")
  const [feedbackCategory, setFeedbackCategory] = useState("feature")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")

  // Get unique categories
  const categories = ["all", ...new Set(feedbackItems.map((item) => item.category))]

  // Filter and sort feedback items
  const filteredItems = filter === "all" ? feedbackItems : feedbackItems.filter((item) => item.category === filter)

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "popular") {
      return b.votes - a.votes
    } else if (sortBy === "recent") {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    } else if (sortBy === "implemented") {
      return a.status === "implemented" ? -1 : 1
    }
    return 0
  })

  // Handle feedback submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackContent.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit({
          content: feedbackContent,
          category: feedbackCategory,
        })
      }

      // Reset form
      setFeedbackContent("")
      setFeedbackCategory("feature")
      setActiveTab("browse")
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle comment submission
  const handleCommentSubmit = (id: string) => {
    if (!commentText.trim() || !onComment) return

    onComment(id, commentText)
    setCommentText("")
    setActiveItem(null)
  }

  // Get status color
  const getStatusColor = (status: FeedbackItem["status"]) => {
    switch (status) {
      case "implemented":
        return "text-green-500 bg-green-500/10 border-green-500/30"
      case "considering":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30"
      case "declined":
        return "text-red-500 bg-red-500/10 border-red-500/30"
      default:
        return "text-blue-500 bg-blue-500/10 border-blue-500/30"
    }
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "feature":
        return "text-purple-500 bg-purple-500/10 border-purple-500/30"
      case "bug":
        return "text-red-500 bg-red-500/10 border-red-500/30"
      case "suggestion":
        return "text-blue-500 bg-blue-500/10 border-blue-500/30"
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/30"
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <CosmicHeading level={2} withAccent>
          Community Feedback
        </CosmicHeading>

        <div className="flex items-center gap-2">
          <CosmicButton
            variant={activeTab === "browse" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab("browse")}
            icon={<CosmicIcon name="list" size={16} />}
          >
            Browse
          </CosmicButton>

          <CosmicButton
            variant={activeTab === "submit" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab("submit")}
            icon={<CosmicIcon name="message-square" size={16} />}
          >
            Submit Feedback
          </CosmicButton>
        </div>
      </div>

      <CosmicCard className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === "browse" ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                {/* Category filters */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setFilter(category)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-colors",
                        filter === category
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Sort options */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white"
                >
                  <option value="popular">Most Popular</option>
                  <option value="recent">Most Recent</option>
                  <option value="implemented">Implemented First</option>
                </select>
              </div>

              {/* Feedback items */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {sortedItems.map((item) => (
                  <CosmicReveal key={item.id}>
                    <div className="rounded-xl bg-black/20 border border-white/5 p-4">
                      <div className="flex items-start gap-3">
                        <Image
                          src={item.user.avatar || "/placeholder.svg"}
                          alt={item.user.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{item.user.name}</span>
                              <span className="text-xs text-white/50">{item.date}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div
                                className={cn("text-xs px-2 py-0.5 rounded-full border", getStatusColor(item.status))}
                              >
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </div>

                              <div
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full border",
                                  getCategoryColor(item.category),
                                )}
                              >
                                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                              </div>
                            </div>
                          </div>

                          <p className="text-white/80 mt-2">{item.content}</p>

                          <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/10">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => onVote && onVote(item.id)}
                                className={cn(
                                  "flex items-center gap-1 text-sm",
                                  item.userVoted ? "text-purple-400" : "text-white/60 hover:text-white",
                                )}
                              >
                                <CosmicIcon
                                  name="thumbs-up"
                                  size={16}
                                  className={item.userVoted ? "text-purple-400" : "text-white/60"}
                                />
                                <span>{item.votes}</span>
                              </button>

                              <button
                                onClick={() => setActiveItem(activeItem === item.id ? null : item.id)}
                                className="flex items-center gap-1 text-sm text-white/60 hover:text-white"
                              >
                                <CosmicIcon name="message-square" size={16} />
                                <span>{item.comments}</span>
                              </button>
                            </div>
                          </div>

                          {/* Comments section */}
                          <AnimatePresence>
                            {activeItem === item.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 pt-4 border-t border-white/10"
                              >
                                <div className="flex gap-3">
                                  <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 min-h-[80px] bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/50 focus:outline-none focus:border-purple-500"
                                  />
                                </div>

                                <div className="flex justify-end mt-2">
                                  <CosmicButton
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleCommentSubmit(item.id)}
                                    disabled={!commentText.trim()}
                                  >
                                    Post Comment
                                  </CosmicButton>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </CosmicReveal>
                ))}

                {sortedItems.length === 0 && (
                  <div className="text-center py-12">
                    <CosmicIcon name="message-square" size={48} className="mx-auto text-white/20 mb-4" />
                    <h3 className="text-white font-medium text-lg mb-2">No feedback found</h3>
                    <p className="text-white/60">Be the first to submit feedback in this category!</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Feedback Category</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["feature", "bug", "suggestion"].map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setFeedbackCategory(category)}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border transition-colors",
                            feedbackCategory === category
                              ? "bg-purple-500/20 border-purple-500/30 text-white"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white",
                          )}
                        >
                          <CosmicIcon
                            name={
                              category === "feature" ? "sparkles" : category === "bug" ? "alert-triangle" : "lightbulb"
                            }
                            size={24}
                            className="mb-2"
                          />
                          <span className="text-sm font-medium">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="feedback-content" className="block text-white font-medium mb-2">
                      Your Feedback
                    </label>
                    <textarea
                      id="feedback-content"
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="Share your ideas, report issues, or suggest improvements..."
                      className="w-full min-h-[200px] bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder:text-white/50 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <CosmicButton
                      type="submit"
                      variant="primary"
                      disabled={!feedbackContent.trim() || isSubmitting}
                      icon={<CosmicIcon name="send" size={16} />}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </CosmicButton>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </CosmicCard>
    </div>
  )
}

// Feedback statistics component
export function FeedbackStatistics({ stats }: { stats: { implemented: number; considering: number; total: number } }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <CosmicCard className="p-4 text-center">
        <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
        <div className="text-sm text-white/70">Total Feedback</div>
      </CosmicCard>

      <CosmicCard className="p-4 text-center">
        <div className="text-3xl font-bold text-green-500 mb-1">{stats.implemented}</div>
        <div className="text-sm text-white/70">Implemented</div>
      </CosmicCard>

      <CosmicCard className="p-4 text-center">
        <div className="text-3xl font-bold text-yellow-500 mb-1">{stats.considering}</div>
        <div className="text-sm text-white/70">Under Consideration</div>
      </CosmicCard>
    </div>
  )
}

