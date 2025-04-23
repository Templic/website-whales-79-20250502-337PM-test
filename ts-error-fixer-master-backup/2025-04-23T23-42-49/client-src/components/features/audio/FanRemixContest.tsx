/**
 * FanRemixContest.tsx
 * 
 * Component Type: audio
 * Migrated from: v0 components
 * Migration Date: 2025-04-05
 */
import React from "react";

/**
 * FanRemixContest.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: v0_extract/components/fan-remix-contest.tsx
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Download, Upload, ThumbsUp, Share2, Music, Trophy, Clock, Users, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface RemixEntry {
  id: number
  title: string
  artist: string
  avatar: string
  coverArt: string
  votes: number
  audioUrl: string
  submitted: string
}

export function FanRemixContest() {
  const [activeTab, setActiveTab] = useState("stems")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [userVoted, setUserVoted] = useState<number[]>([])

  // Mock data for available stems
  const stems = [
    { id: 1, name: "Root Chakra - Vocals", size: "24.5 MB", format: "WAV (24-bit/48kHz)" },
    { id: 2, name: "Root Chakra - Drums", size: "18.2 MB", format: "WAV (24-bit/48kHz)" },
    { id: 3, name: "Root Chakra - Bass", size: "15.7 MB", format: "WAV (24-bit/48kHz)" },
    { id: 4, name: "Root Chakra - Synths", size: "22.3 MB", format: "WAV (24-bit/48kHz)" },
    { id: 5, name: "Root Chakra - Ambient", size: "31.8 MB", format: "WAV (24-bit/48kHz)" },
    { id: 6, name: "Root Chakra - Complete Stem Pack", size: "112.5 MB", format: "ZIP (WAV files)" },
  ]

  // Mock data for remix entries
  const remixes: RemixEntry[] = [
    {
      id: 1,
      title: "Root Chakra (Celestial Remix)",
      artist: "AstralHealer",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 128,
      audioUrl: "/placeholder.mp3",
      submitted: "3 days ago",
    },
    {
      id: 2,
      title: "Root Chakra (Deep Bass Meditation)",
      artist: "QuantumBeats",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 95,
      audioUrl: "/placeholder.mp3",
      submitted: "5 days ago",
    },
    {
      id: 3,
      title: "Root Chakra (Ambient Journey)",
      artist: "CosmicTraveler",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 87,
      audioUrl: "/placeholder.mp3",
      submitted: "1 week ago",
    },
    {
      id: 4,
      title: "Root Chakra (Binaural Beats Edition)",
      artist: "FrequencyShifter",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 76,
      audioUrl: "/placeholder.mp3",
      submitted: "1 week ago",
    },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    // Simulate file upload
    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsUploading(false)
            setActiveTab("submissions")
            // Reset file input
            if (e.target) e.target.value = ""
          }, 500)
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  const handleVote = (remixId: number) => {
    if (userVoted.includes(remixId)) {
      setUserVoted(userVoted.filter((id) => id !== remixId))
    } else {
      setUserVoted([...userVoted, remixId])
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Fan Remix Contest</h2>
            <p className="text-white/70">Download stems, create your remix, and share with the community</p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-sm text-white">Contest Ends In</p>
              <p className="text-lg font-bold text-white">14 days, 6 hours</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stems" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10">
          <TabsList className="flex h-auto p-0 bg-transparent">
            <TabsTrigger
              value="stems"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Download Stems
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Upload Your Remix
            </TabsTrigger>
            <TabsTrigger
              value="submissions"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Community Submissions
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Contest Rules
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stems" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-medium text-white">Available Stem Packs</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {stems.map((stem) => (
                <div key={stem.id} className="rounded-lg bg-black/40 p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-white">{stem.name}</h4>
                    <p className="text-sm text-white/60">
                      {stem.size} • {stem.format}
                    </p>
                  </div>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-purple-900/20 border border-purple-500/30 p-4">
            <h4 className="font-medium text-white mb-2">Remix Guidelines</h4>
            <ul className="list-disc pl-5 text-white/80 space-y-1 text-sm">
              <li>You may use any or all of the provided stems in your remix</li>
              <li>Feel free to add your own elements, but the original stems should be recognizable</li>
              <li>Final submission should be in WAV or MP3 format (320kbps minimum)</li>
              <li>By submitting, you grant permission to share your remix on our platforms with credit</li>
              <li>The winning remix may be included in future official releases</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-medium text-white">Upload Your Remix</h3>
            </div>

            {isUploading ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-black/40 p-6 text-center">
                  <h4 className="font-medium text-white mb-4">Uploading Your Remix...</h4>
                  <Progress value={uploadProgress} className="h-2 mb-2" />
                  <p className="text-sm text-white/60">{uploadProgress}% Complete</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-black/40 border border-dashed border-white/20 p-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Drag and drop your remix file</h4>
                    <p className="text-sm text-white/60 mb-4">or click to browse your files</p>
                    <input
                      type="file"
                      id="remix-upload"
                      className="hidden"
                      accept=".mp3,.wav"
                      onChange={handleFileUpload}
                    />
                    <Button
                      onClick={() => document.getElementById("remix-upload")?.click()}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                    >
                      Select File
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">Accepted formats: MP3, WAV • Maximum file size: 50MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-black/40 p-4">
            <h4 className="font-medium text-white mb-2">Submission Tips</h4>
            <ul className="list-disc pl-5 text-white/80 space-y-1 text-sm">
              <li>Make sure your remix is properly mastered for the best sound quality</li>
              <li>Include your artist name in the file name (e.g., "RootChakra_YourName_Remix.wav")</li>
              <li>You can edit your submission until the contest closes</li>
              <li>Share your remix on social media with #CosmicRemixContest to gain more votes</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-medium text-white">Community Submissions</h3>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Users className="h-4 w-4" />
                <span>{remixes.length} Submissions</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {remixes.map((remix) => (
                <div key={remix.id} className="rounded-lg bg-black/40 overflow-hidden">
                  <div className="relative aspect-square">
                    <Image src={remix.coverArt || "/placeholder.svg"} alt={remix.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-16 w-16 rounded-full bg-purple-500/80 hover:bg-purple-600/80 text-white"
                      >
                        <Play className="h-8 w-8" />
                        <span className="sr-only">Play</span>
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      {remix.submitted}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={remix.avatar || "/placeholder.svg"}
                        width={24}
                        height={24}
                        alt={remix.artist}
                        className="rounded-full"
                      />
                      <span className="text-sm font-medium text-white">{remix.artist}</span>
                    </div>
                    <h4 className="font-medium text-white">{remix.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-white/60 text-sm">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{userVoted.includes(remix.id) ? remix.votes + 1 : remix.votes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-full",
                            userVoted.includes(remix.id)
                              ? "bg-purple-500 text-white hover:bg-purple-600"
                              : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white",
                          )}
                          onClick={() => handleVote(remix.id)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="sr-only">Vote</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="sr-only">Share</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-white text-lg">Current Leader</h4>
                <p className="text-white/80">The winning remix will be featured on our official platforms</p>
              </div>
              <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                Submit Your Remix
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Contest Rules & Guidelines</h3>

            <div className="rounded-lg bg-black/40 p-6 space-y-6">
              <div>
                <h4 className="font-medium text-white mb-2">Eligibility</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>The contest is open to all fans worldwide</li>
                  <li>No purchase necessary to participate</li>
                  <li>One submission per person</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Submission Requirements</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>Remixes must use at least one stem from the provided pack</li>
                  <li>Submissions must be original works</li>
                  <li>Audio files must be in WAV or MP3 format (320kbps minimum)</li>
                  <li>Maximum file size: 50MB</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Judging & Prizes</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>Winners will be determined by community votes (70%) and artist selection (30%)</li>
                  <li>First Place: Official release on streaming platforms, merchandise package, and signed vinyl</li>
                  <li>Second Place: Merchandise package and signed vinyl</li>
                  <li>Third Place: Signed vinyl</li>
                  <li>All participants will receive exclusive digital content</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Rights & Usage</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>By submitting, you grant us the right to share your remix on our platforms with proper credit</li>
                  <li>The winning remix may be included in future official releases</li>
                  <li>You retain ownership of your original contributions to the remix</li>
                  <li>You may not commercially distribute your remix without written permission</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}



/**
 * Original FanRemixContest component merged from: client/src/components/common/fan-remix-contest.tsx
 * Merge date: 2025-04-05
 */
function FanRemixContestOriginal() {
  const [activeTab, setActiveTab] = useState("stems")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [userVoted, setUserVoted] = useState<number[]>([])

  // Mock data for available stems
  const stems = [
    { id: 1, name: "Root Chakra - Vocals", size: "24.5 MB", format: "WAV (24-bit/48kHz)" },
    { id: 2, name: "Root Chakra - Drums", size: "18.2 MB", format: "WAV (24-bit/48kHz)" },
    { id: 3, name: "Root Chakra - Bass", size: "15.7 MB", format: "WAV (24-bit/48kHz)" },
    { id: 4, name: "Root Chakra - Synths", size: "22.3 MB", format: "WAV (24-bit/48kHz)" },
    { id: 5, name: "Root Chakra - Ambient", size: "31.8 MB", format: "WAV (24-bit/48kHz)" },
    { id: 6, name: "Root Chakra - Complete Stem Pack", size: "112.5 MB", format: "ZIP (WAV files)" },
  ]

  // Mock data for remix entries
  const remixes: RemixEntry[] = [
    {
      id: 1,
      title: "Root Chakra (Celestial Remix)",
      artist: "AstralHealer",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 128,
      audioUrl: "/placeholder.mp3",
      submitted: "3 days ago",
    },
    {
      id: 2,
      title: "Root Chakra (Deep Bass Meditation)",
      artist: "QuantumBeats",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 95,
      audioUrl: "/placeholder.mp3",
      submitted: "5 days ago",
    },
    {
      id: 3,
      title: "Root Chakra (Ambient Journey)",
      artist: "CosmicTraveler",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 87,
      audioUrl: "/placeholder.mp3",
      submitted: "1 week ago",
    },
    {
      id: 4,
      title: "Root Chakra (Binaural Beats Edition)",
      artist: "FrequencyShifter",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 76,
      audioUrl: "/placeholder.mp3",
      submitted: "1 week ago",
    },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    // Simulate file upload
    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsUploading(false)
            setActiveTab("submissions")
            // Reset file input
            if (e.target) e.target.value = ""
          }, 500)
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  const handleVote = (remixId: number) => {
    if (userVoted.includes(remixId)) {
      setUserVoted(userVoted.filter((id) => id !== remixId))
    } else {
      setUserVoted([...userVoted, remixId])
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Fan Remix Contest</h2>
            <p className="text-white/70">Download stems, create your remix, and share with the community</p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-sm text-white">Contest Ends In</p>
              <p className="text-lg font-bold text-white">14 days, 6 hours</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stems" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10">
          <TabsList className="flex h-auto p-0 bg-transparent">
            <TabsTrigger
              value="stems"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Download Stems
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Upload Your Remix
            </TabsTrigger>
            <TabsTrigger
              value="submissions"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Community Submissions
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Contest Rules
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stems" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-medium text-white">Available Stem Packs</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {stems.map((stem) => (
                <div key={stem.id} className="rounded-lg bg-black/40 p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-white">{stem.name}</h4>
                    <p className="text-sm text-white/60">
                      {stem.size} • {stem.format}
                    </p>
                  </div>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-purple-900/20 border border-purple-500/30 p-4">
            <h4 className="font-medium text-white mb-2">Remix Guidelines</h4>
            <ul className="list-disc pl-5 text-white/80 space-y-1 text-sm">
              <li>You may use any or all of the provided stems in your remix</li>
              <li>Feel free to add your own elements, but the original stems should be recognizable</li>
              <li>Final submission should be in WAV or MP3 format (320kbps minimum)</li>
              <li>By submitting, you grant permission to share your remix on our platforms with credit</li>
              <li>The winning remix may be included in future official releases</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-medium text-white">Upload Your Remix</h3>
            </div>

            {isUploading ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-black/40 p-6 text-center">
                  <h4 className="font-medium text-white mb-4">Uploading Your Remix...</h4>
                  <Progress value={uploadProgress} className="h-2 mb-2" />
                  <p className="text-sm text-white/60">{uploadProgress}% Complete</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-black/40 border border-dashed border-white/20 p-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Drag and drop your remix file</h4>
                    <p className="text-sm text-white/60 mb-4">or click to browse your files</p>
                    <input
                      type="file"
                      id="remix-upload"
                      className="hidden"
                      accept=".mp3,.wav"
                      onChange={handleFileUpload}
                    />
                    <Button
                      onClick={() => document.getElementById("remix-upload")?.click()}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                    >
                      Select File
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">Accepted formats: MP3, WAV • Maximum file size: 50MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-black/40 p-4">
            <h4 className="font-medium text-white mb-2">Submission Tips</h4>
            <ul className="list-disc pl-5 text-white/80 space-y-1 text-sm">
              <li>Make sure your remix is properly mastered for the best sound quality</li>
              <li>Include your artist name in the file name (e.g., "RootChakra_YourName_Remix.wav")</li>
              <li>You can edit your submission until the contest closes</li>
              <li>Share your remix on social media with #CosmicRemixContest to gain more votes</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-medium text-white">Community Submissions</h3>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Users className="h-4 w-4" />
                <span>{remixes.length} Submissions</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {remixes.map((remix) => (
                <div key={remix.id} className="rounded-lg bg-black/40 overflow-hidden">
                  <div className="relative aspect-square">
                    <Image src={remix.coverArt || "/placeholder.svg"} alt={remix.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-16 w-16 rounded-full bg-purple-500/80 hover:bg-purple-600/80 text-white"
                      >
                        <Play className="h-8 w-8" />
                        <span className="sr-only">Play</span>
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      {remix.submitted}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={remix.avatar || "/placeholder.svg"}
                        width={24}
                        height={24}
                        alt={remix.artist}
                        className="rounded-full"
                      />
                      <span className="text-sm font-medium text-white">{remix.artist}</span>
                    </div>
                    <h4 className="font-medium text-white">{remix.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-white/60 text-sm">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{userVoted.includes(remix.id) ? remix.votes + 1 : remix.votes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-full",
                            userVoted.includes(remix.id)
                              ? "bg-purple-500 text-white hover:bg-purple-600"
                              : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white",
                          )}
                          onClick={() => handleVote(remix.id)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="sr-only">Vote</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="sr-only">Share</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-white text-lg">Current Leader</h4>
                <p className="text-white/80">The winning remix will be featured on our official platforms</p>
              </div>
              <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                Submit Your Remix
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Contest Rules & Guidelines</h3>

            <div className="rounded-lg bg-black/40 p-6 space-y-6">
              <div>
                <h4 className="font-medium text-white mb-2">Eligibility</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>The contest is open to all fans worldwide</li>
                  <li>No purchase necessary to participate</li>
                  <li>One submission per person</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Submission Requirements</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>Remixes must use at least one stem from the provided pack</li>
                  <li>Submissions must be original works</li>
                  <li>Audio files must be in WAV or MP3 format (320kbps minimum)</li>
                  <li>Maximum file size: 50MB</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Judging & Prizes</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>Winners will be determined by community votes (70%) and artist selection (30%)</li>
                  <li>First Place: Official release on streaming platforms, merchandise package, and signed vinyl</li>
                  <li>Second Place: Merchandise package and signed vinyl</li>
                  <li>Third Place: Signed vinyl</li>
                  <li>All participants will receive exclusive digital content</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Rights & Usage</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>By submitting, you grant us the right to share your remix on our platforms with proper credit</li>
                  <li>The winning remix may be included in future official releases</li>
                  <li>You retain ownership of your original contributions to the remix</li>
                  <li>You may not commercially distribute your remix without written permission</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}



/**
 * Original FanRemixContest component merged from: client/src/components/common/FanRemixContest.tsx
 * Merge date: 2025-04-05
 */
function FanRemixContestOriginal() {
  const [activeTab, setActiveTab] = useState("stems")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [userVoted, setUserVoted] = useState<number[]>([])

  // Mock data for available stems
  const stems = [
    { id: 1, name: "Root Chakra - Vocals", size: "24.5 MB", format: "WAV (24-bit/48kHz)" },
    { id: 2, name: "Root Chakra - Drums", size: "18.2 MB", format: "WAV (24-bit/48kHz)" },
    { id: 3, name: "Root Chakra - Bass", size: "15.7 MB", format: "WAV (24-bit/48kHz)" },
    { id: 4, name: "Root Chakra - Synths", size: "22.3 MB", format: "WAV (24-bit/48kHz)" },
    { id: 5, name: "Root Chakra - Ambient", size: "31.8 MB", format: "WAV (24-bit/48kHz)" },
    { id: 6, name: "Root Chakra - Complete Stem Pack", size: "112.5 MB", format: "ZIP (WAV files)" },
  ]

  // Mock data for remix entries
  const remixes: RemixEntry[] = [
    {
      id: 1,
      title: "Root Chakra (Celestial Remix)",
      artist: "AstralHealer",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 128,
      audioUrl: "/placeholder.mp3",
      submitted: "3 days ago",
    },
    {
      id: 2,
      title: "Root Chakra (Deep Bass Meditation)",
      artist: "QuantumBeats",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 95,
      audioUrl: "/placeholder.mp3",
      submitted: "5 days ago",
    },
    {
      id: 3,
      title: "Root Chakra (Ambient Journey)",
      artist: "CosmicTraveler",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 87,
      audioUrl: "/placeholder.mp3",
      submitted: "1 week ago",
    },
    {
      id: 4,
      title: "Root Chakra (Binaural Beats Edition)",
      artist: "FrequencyShifter",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 76,
      audioUrl: "/placeholder.mp3",
      submitted: "1 week ago",
    },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    // Simulate file upload
    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsUploading(false)
            setActiveTab("submissions")
            // Reset file input
            if (e.target) e.target.value = ""
          }, 500)
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  const handleVote = (remixId: number) => {
    if (userVoted.includes(remixId)) {
      setUserVoted(userVoted.filter((id) => id !== remixId))
    } else {
      setUserVoted([...userVoted, remixId])
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Fan Remix Contest</h2>
            <p className="text-white/70">Download stems, create your remix, and share with the community</p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-sm text-white">Contest Ends In</p>
              <p className="text-lg font-bold text-white">14 days, 6 hours</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stems" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10">
          <TabsList className="flex h-auto p-0 bg-transparent">
            <TabsTrigger
              value="stems"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Download Stems
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Upload Your Remix
            </TabsTrigger>
            <TabsTrigger
              value="submissions"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Community Submissions
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Contest Rules
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stems" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-medium text-white">Available Stem Packs</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {stems.map((stem) => (
                <div key={stem.id} className="rounded-lg bg-black/40 p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-white">{stem.name}</h4>
                    <p className="text-sm text-white/60">
                      {stem.size} • {stem.format}
                    </p>
                  </div>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-purple-900/20 border border-purple-500/30 p-4">
            <h4 className="font-medium text-white mb-2">Remix Guidelines</h4>
            <ul className="list-disc pl-5 text-white/80 space-y-1 text-sm">
              <li>You may use any or all of the provided stems in your remix</li>
              <li>Feel free to add your own elements, but the original stems should be recognizable</li>
              <li>Final submission should be in WAV or MP3 format (320kbps minimum)</li>
              <li>By submitting, you grant permission to share your remix on our platforms with credit</li>
              <li>The winning remix may be included in future official releases</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-medium text-white">Upload Your Remix</h3>
            </div>

            {isUploading ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-black/40 p-6 text-center">
                  <h4 className="font-medium text-white mb-4">Uploading Your Remix...</h4>
                  <Progress value={uploadProgress} className="h-2 mb-2" />
                  <p className="text-sm text-white/60">{uploadProgress}% Complete</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-black/40 border border-dashed border-white/20 p-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Drag and drop your remix file</h4>
                    <p className="text-sm text-white/60 mb-4">or click to browse your files</p>
                    <input
                      type="file"
                      id="remix-upload"
                      className="hidden"
                      accept=".mp3,.wav"
                      onChange={handleFileUpload}
                    />
                    <Button
                      onClick={() => document.getElementById("remix-upload")?.click()}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                    >
                      Select File
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">Accepted formats: MP3, WAV • Maximum file size: 50MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-black/40 p-4">
            <h4 className="font-medium text-white mb-2">Submission Tips</h4>
            <ul className="list-disc pl-5 text-white/80 space-y-1 text-sm">
              <li>Make sure your remix is properly mastered for the best sound quality</li>
              <li>Include your artist name in the file name (e.g., "RootChakra_YourName_Remix.wav")</li>
              <li>You can edit your submission until the contest closes</li>
              <li>Share your remix on social media with #CosmicRemixContest to gain more votes</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-medium text-white">Community Submissions</h3>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Users className="h-4 w-4" />
                <span>{remixes.length} Submissions</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {remixes.map((remix) => (
                <div key={remix.id} className="rounded-lg bg-black/40 overflow-hidden">
                  <div className="relative aspect-square">
                    <Image src={remix.coverArt || "/placeholder.svg"} alt={remix.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-16 w-16 rounded-full bg-purple-500/80 hover:bg-purple-600/80 text-white"
                      >
                        <Play className="h-8 w-8" />
                        <span className="sr-only">Play</span>
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      {remix.submitted}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={remix.avatar || "/placeholder.svg"}
                        width={24}
                        height={24}
                        alt={remix.artist}
                        className="rounded-full"
                      />
                      <span className="text-sm font-medium text-white">{remix.artist}</span>
                    </div>
                    <h4 className="font-medium text-white">{remix.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-white/60 text-sm">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{userVoted.includes(remix.id) ? remix.votes + 1 : remix.votes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-full",
                            userVoted.includes(remix.id)
                              ? "bg-purple-500 text-white hover:bg-purple-600"
                              : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white",
                          )}
                          onClick={() => handleVote(remix.id)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="sr-only">Vote</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="sr-only">Share</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-white text-lg">Current Leader</h4>
                <p className="text-white/80">The winning remix will be featured on our official platforms</p>
              </div>
              <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                Submit Your Remix
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Contest Rules & Guidelines</h3>

            <div className="rounded-lg bg-black/40 p-6 space-y-6">
              <div>
                <h4 className="font-medium text-white mb-2">Eligibility</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>The contest is open to all fans worldwide</li>
                  <li>No purchase necessary to participate</li>
                  <li>One submission per person</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Submission Requirements</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>Remixes must use at least one stem from the provided pack</li>
                  <li>Submissions must be original works</li>
                  <li>Audio files must be in WAV or MP3 format (320kbps minimum)</li>
                  <li>Maximum file size: 50MB</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Judging & Prizes</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>Winners will be determined by community votes (70%) and artist selection (30%)</li>
                  <li>First Place: Official release on streaming platforms, merchandise package, and signed vinyl</li>
                  <li>Second Place: Merchandise package and signed vinyl</li>
                  <li>Third Place: Signed vinyl</li>
                  <li>All participants will receive exclusive digital content</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Rights & Usage</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>By submitting, you grant us the right to share your remix on our platforms with proper credit</li>
                  <li>The winning remix may be included in future official releases</li>
                  <li>You retain ownership of your original contributions to the remix</li>
                  <li>You may not commercially distribute your remix without written permission</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}



/**
 * Original FanRemixContest component merged from: client/src/components/features/community/fan-remix-contest.tsx
 * Merge date: 2025-04-05
 */
function FanRemixContestOriginal() {
  const [activeTab, setActiveTab] = useState("stems")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [userVoted, setUserVoted] = useState<number[]>([])

  // Mock data for available stems
  const stems = [
    { id: 1, name: "Root Chakra - Vocals", size: "24.5 MB", format: "WAV (24-bit/48kHz)" },
    { id: 2, name: "Root Chakra - Drums", size: "18.2 MB", format: "WAV (24-bit/48kHz)" },
    { id: 3, name: "Root Chakra - Bass", size: "15.7 MB", format: "WAV (24-bit/48kHz)" },
    { id: 4, name: "Root Chakra - Synths", size: "22.3 MB", format: "WAV (24-bit/48kHz)" },
    { id: 5, name: "Root Chakra - Ambient", size: "31.8 MB", format: "WAV (24-bit/48kHz)" },
    { id: 6, name: "Root Chakra - Complete Stem Pack", size: "112.5 MB", format: "ZIP (WAV files)" },
  ]

  // Mock data for remix entries
  const remixes: RemixEntry[] = [
    {
      id: 1,
      title: "Root Chakra (Celestial Remix)",
      artist: "AstralHealer",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 128,
      audioUrl: "/placeholder.mp3",
      submitted: "3 days ago",
    },
    {
      id: 2,
      title: "Root Chakra (Deep Bass Meditation)",
      artist: "QuantumBeats",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 95,
      audioUrl: "/placeholder.mp3",
      submitted: "5 days ago",
    },
    {
      id: 3,
      title: "Root Chakra (Ambient Journey)",
      artist: "CosmicTraveler",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 87,
      audioUrl: "/placeholder.mp3",
      submitted: "1 week ago",
    },
    {
      id: 4,
      title: "Root Chakra (Binaural Beats Edition)",
      artist: "FrequencyShifter",
      avatar: "/placeholder.svg?height=50&width=50",
      coverArt: "/placeholder.svg?height=300&width=300",
      votes: 76,
      audioUrl: "/placeholder.mp3",
      submitted: "1 week ago",
    },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    // Simulate file upload
    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsUploading(false)
            setActiveTab("submissions")
            // Reset file input
            if (e.target) e.target.value = ""
          }, 500)
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  const handleVote = (remixId: number) => {
    if (userVoted.includes(remixId)) {
      setUserVoted(userVoted.filter((id) => id !== remixId))
    } else {
      setUserVoted([...userVoted, remixId])
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Fan Remix Contest</h2>
            <p className="text-white/70">Download stems, create your remix, and share with the community</p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-sm text-white">Contest Ends In</p>
              <p className="text-lg font-bold text-white">14 days, 6 hours</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stems" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10">
          <TabsList className="flex h-auto p-0 bg-transparent">
            <TabsTrigger
              value="stems"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Download Stems
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Upload Your Remix
            </TabsTrigger>
            <TabsTrigger
              value="submissions"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Community Submissions
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Contest Rules
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stems" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-medium text-white">Available Stem Packs</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {stems.map((stem) => (
                <div key={stem.id} className="rounded-lg bg-black/40 p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-white">{stem.name}</h4>
                    <p className="text-sm text-white/60">
                      {stem.size} • {stem.format}
                    </p>
                  </div>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-purple-900/20 border border-purple-500/30 p-4">
            <h4 className="font-medium text-white mb-2">Remix Guidelines</h4>
            <ul className="list-disc pl-5 text-white/80 space-y-1 text-sm">
              <li>You may use any or all of the provided stems in your remix</li>
              <li>Feel free to add your own elements, but the original stems should be recognizable</li>
              <li>Final submission should be in WAV or MP3 format (320kbps minimum)</li>
              <li>By submitting, you grant permission to share your remix on our platforms with credit</li>
              <li>The winning remix may be included in future official releases</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-medium text-white">Upload Your Remix</h3>
            </div>

            {isUploading ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-black/40 p-6 text-center">
                  <h4 className="font-medium text-white mb-4">Uploading Your Remix...</h4>
                  <Progress value={uploadProgress} className="h-2 mb-2" />
                  <p className="text-sm text-white/60">{uploadProgress}% Complete</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-black/40 border border-dashed border-white/20 p-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Drag and drop your remix file</h4>
                    <p className="text-sm text-white/60 mb-4">or click to browse your files</p>
                    <input
                      type="file"
                      id="remix-upload"
                      className="hidden"
                      accept=".mp3,.wav"
                      onChange={handleFileUpload}
                    />
                    <Button
                      onClick={() => document.getElementById("remix-upload")?.click()}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                    >
                      Select File
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">Accepted formats: MP3, WAV • Maximum file size: 50MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-black/40 p-4">
            <h4 className="font-medium text-white mb-2">Submission Tips</h4>
            <ul className="list-disc pl-5 text-white/80 space-y-1 text-sm">
              <li>Make sure your remix is properly mastered for the best sound quality</li>
              <li>Include your artist name in the file name (e.g., "RootChakra_YourName_Remix.wav")</li>
              <li>You can edit your submission until the contest closes</li>
              <li>Share your remix on social media with #CosmicRemixContest to gain more votes</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-medium text-white">Community Submissions</h3>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Users className="h-4 w-4" />
                <span>{remixes.length} Submissions</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {remixes.map((remix) => (
                <div key={remix.id} className="rounded-lg bg-black/40 overflow-hidden">
                  <div className="relative aspect-square">
                    <Image src={remix.coverArt || "/placeholder.svg"} alt={remix.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-16 w-16 rounded-full bg-purple-500/80 hover:bg-purple-600/80 text-white"
                      >
                        <Play className="h-8 w-8" />
                        <span className="sr-only">Play</span>
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      {remix.submitted}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={remix.avatar || "/placeholder.svg"}
                        width={24}
                        height={24}
                        alt={remix.artist}
                        className="rounded-full"
                      />
                      <span className="text-sm font-medium text-white">{remix.artist}</span>
                    </div>
                    <h4 className="font-medium text-white">{remix.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-white/60 text-sm">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{userVoted.includes(remix.id) ? remix.votes + 1 : remix.votes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-full",
                            userVoted.includes(remix.id)
                              ? "bg-purple-500 text-white hover:bg-purple-600"
                              : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white",
                          )}
                          onClick={() => handleVote(remix.id)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="sr-only">Vote</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="sr-only">Share</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-white text-lg">Current Leader</h4>
                <p className="text-white/80">The winning remix will be featured on our official platforms</p>
              </div>
              <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                Submit Your Remix
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Contest Rules & Guidelines</h3>

            <div className="rounded-lg bg-black/40 p-6 space-y-6">
              <div>
                <h4 className="font-medium text-white mb-2">Eligibility</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>The contest is open to all fans worldwide</li>
                  <li>No purchase necessary to participate</li>
                  <li>One submission per person</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Submission Requirements</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>Remixes must use at least one stem from the provided pack</li>
                  <li>Submissions must be original works</li>
                  <li>Audio files must be in WAV or MP3 format (320kbps minimum)</li>
                  <li>Maximum file size: 50MB</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Judging & Prizes</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>Winners will be determined by community votes (70%) and artist selection (30%)</li>
                  <li>First Place: Official release on streaming platforms, merchandise package, and signed vinyl</li>
                  <li>Second Place: Merchandise package and signed vinyl</li>
                  <li>Third Place: Signed vinyl</li>
                  <li>All participants will receive exclusive digital content</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Rights & Usage</h4>
                <ul className="list-disc pl-5 text-white/80 space-y-1">
                  <li>By submitting, you grant us the right to share your remix on our platforms with proper credit</li>
                  <li>The winning remix may be included in future official releases</li>
                  <li>You retain ownership of your original contributions to the remix</li>
                  <li>You may not commercially distribute your remix without written permission</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

