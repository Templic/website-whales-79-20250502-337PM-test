"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrackSegment {
  id: number
  name: string
  startTime: number // in seconds
  endTime: number // in seconds
  description: string
  color: string
}

interface TrackSegmentationViewerProps {
  trackTitle: string
  trackDuration: number // in seconds
  audioSrc: string
  segments: TrackSegment[]
}

export function TrackSegmentationViewer({
  trackTitle,
  trackDuration,
  audioSrc = "/placeholder.mp3",
  segments,
}: TrackSegmentationViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [activeSegment, setActiveSegment] = useState<TrackSegment | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const [hoverPosition, setHoverPosition] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio and set up event listeners
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Playback failed:", error)
          setIsPlaying(false)
        })
        startTimer()
      } else {
        audioRef.current.pause()
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // Update mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
    }
  }, [isMuted])

  // Find active segment based on current time
  useEffect(() => {
    const current =
      segments.find((segment) => currentTime >= segment.startTime && currentTime < segment.endTime) || null

    setActiveSegment(current)
  }, [currentTime, segments])

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (audioRef.current && audioRef.current.ended) {
        setIsPlaying(false)
        setCurrentTime(0)
        setProgress(0)
      } else if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
        setProgress((audioRef.current.currentTime / trackDuration) * 100)
      }
    }, 100)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const onProgressChange = (value: number[]) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * trackDuration
      audioRef.current.currentTime = newTime
      setProgress(value[0])
      setCurrentTime(newTime)
    }
  }

  const onVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(value[0] === 0)
  }

  const handleProgressBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const position = e.clientX - rect.left
    const percentage = (position / rect.width) * 100
    const time = (percentage / 100) * trackDuration

    setHoverTime(time)
    setHoverPosition(position)
  }

  const handleSegmentClick = (segment: TrackSegment) => {
    if (audioRef.current) {
      audioRef.current.currentTime = segment.startTime
      setCurrentTime(segment.startTime)
      setProgress((segment.startTime / trackDuration) * 100)
      if (!isPlaying) {
        setIsPlaying(true)
      }
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{trackTitle}</h3>
          <p className="text-sm text-white/60">Track Segmentation Viewer</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={onVolumeChange}
              className="w-24 cursor-pointer"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
          </Button>
        </div>
      </div>

      <audio ref={audioRef} src={audioSrc} />

      {/* Waveform visualization with segments */}
      <div className="space-y-2">
        <div
          ref={progressBarRef}
          className="relative h-24 bg-black/40 rounded-lg overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={handleProgressBarHover}
        >
          {/* Segments */}
          <div className="absolute inset-0 flex">
            {segments.map((segment) => {
              const startPercent = (segment.startTime / trackDuration) * 100
              const widthPercent = ((segment.endTime - segment.startTime) / trackDuration) * 100

              return (
                <div
                  key={segment.id}
                  className={cn(
                    "h-full relative cursor-pointer transition-opacity",
                    activeSegment?.id === segment.id ? "opacity-100" : "opacity-70 hover:opacity-90",
                  )}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: segment.color,
                  }}
                  onClick={() => handleSegmentClick(segment)}
                >
                  <div className="absolute bottom-0 left-0 right-0 bg-black/30 p-1 text-center">
                    <span className="text-xs font-medium text-white truncate">{segment.name}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress overlay */}
          <div
            className="absolute top-0 left-0 h-full bg-white/10 pointer-events-none"
            style={{ width: `${progress}%` }}
          ></div>

          {/* Hover tooltip */}
          {isHovering && (
            <div
              className="absolute top-0 bg-black/80 text-white text-xs py-1 px-2 rounded pointer-events-none transform -translate-x-1/2"
              style={{ left: hoverPosition }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs text-white/60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(trackDuration)}</span>
        </div>
      </div>

      {/* Segment details */}
      <div className="space-y-4">
        <h4 className="font-medium text-white">Current Segment</h4>
        <div className="rounded-lg bg-black/40 p-4">
          {activeSegment ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: activeSegment.color }}></div>
                <h5 className="font-medium text-white">{activeSegment.name}</h5>
                <span className="text-xs text-white/60">
                  {formatTime(activeSegment.startTime)} - {formatTime(activeSegment.endTime)}
                </span>
              </div>
              <p className="text-white/80">{activeSegment.description}</p>
            </div>
          ) : (
            <p className="text-white/60 italic">Select a segment or play the track to see details</p>
          )}
        </div>
      </div>

      {/* Segment list */}
      <div className="space-y-2">
        <h4 className="font-medium text-white">All Segments</h4>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => handleSegmentClick(segment)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md transition-colors text-left",
                activeSegment?.id === segment.id
                  ? "bg-white/10 border border-purple-500/30"
                  : "bg-black/20 hover:bg-white/5",
              )}
            >
              <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: segment.color }}></div>
              <div className="overflow-hidden">
                <h5 className="font-medium text-white text-sm truncate">{segment.name}</h5>
                <span className="text-xs text-white/60">
                  {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

