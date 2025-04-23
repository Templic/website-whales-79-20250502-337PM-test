/**
 * lyrics-section.tsx
 * 
 * Component Type: audio
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */import React from "react";
import React from "react";

/**
 * lyrics-section.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Track {
  id: number
  title: string
  duration: string
  frequency?: string
}

interface LyricsSectionProps {
  tracks: Track[]
}

export function LyricsSection({ tracks }: LyricsSectionProps) {
  const [activeTrack, setActiveTrack] = useState(1)

  // Example lyrics/descriptions - in a real app, these would come from the API
  const getLyrics = (trackId: number) => {
    return trackId === 1 ? (
      <>
        <p className="mb-4">
          This track is designed to resonate with the Root Chakra (Muladhara) at 396 Hz. This frequency helps release
          fear and guilt, grounding you to the earth and establishing a sense of security and stability.
        </p>
        <p className="mb-4">
          The composition begins with deep, earthy tones that gradually build into a rhythmic pattern mimicking the
          heartbeat of the earth. Tibetan singing bowls and low-frequency drones create a foundation for the healing
          frequency to work with your body's energy.
        </p>
        <p>
          <strong>Key elements:</strong>
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>396 Hz Solfeggio frequency</li>
          <li>Tibetan singing bowls</li>
          <li>Earth drums</li>
          <li>Deep drone tones</li>
        </ul>
        <p>
          For optimal results, listen while seated on the ground or floor with your spine straight, focusing your
          attention on the base of your spine.
        </p>
      </>
    ) : (
      <p className="text-white/60 italic">Select a track to view its frequency information and meditation guidance.</p>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="space-y-4">
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => setActiveTrack(track.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeTrack === track.id
                  ? "bg-purple-900/30 border border-purple-500/30"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    activeTrack === track.id ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-black/40"
                  }`}
                >
                  <span className="text-xs font-medium text-white">{track.id}</span>
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-white">{track.title}</h3>
                  <p className="text-xs text-white/60">{track.frequency}</p>
                </div>
              </div>
              <span className="text-sm text-white/60">{track.duration}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-3">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1">
            <TabsTrigger value="info" className="data-[state=active]:bg-purple-900/50">
              Frequency Info
            </TabsTrigger>
            <TabsTrigger value="meditation" className="data-[state=active]:bg-purple-900/50">
              Meditation Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 rounded-xl bg-black/20 p-6 backdrop-blur-sm text-white/80">
            {getLyrics(activeTrack)}
          </TabsContent>

          <TabsContent value="meditation" className="mt-4 rounded-xl bg-black/20 p-6 backdrop-blur-sm text-white/80">
            <h3 className="text-lg font-medium text-white mb-4">Meditation Guide</h3>
            <p className="mb-4">
              Find a comfortable seated position in a quiet space. Close your eyes and take several deep breaths,
              allowing your body to relax with each exhale.
            </p>
            <p className="mb-4">
              As the music begins, visualize a glowing red energy at the base of your spine. Feel this energy connecting
              you to the earth, providing stability and security.
            </p>
            <p className="mb-4">
              With each breath, imagine this energy becoming stronger and more vibrant, dissolving any blockages or
              tensions in this area.
            </p>
            <p>
              Continue this visualization throughout the track, allowing the 396 Hz frequency to resonate with your Root
              Chakra, bringing it into balance and harmony.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



/**
 * Original LyricsSection component merged from: client/src/components/common/lyrics-section.tsx
 * Merge date: 2025-04-05
 */
function LyricsSectionOriginal({ tracks }: LyricsSectionProps) {
  const [activeTrack, setActiveTrack] = useState(1)

  // Example lyrics/descriptions - in a real app, these would come from the API
  const getLyrics = (trackId: number) => {
    return trackId === 1 ? (
      <>
        <p className="mb-4">
          This track is designed to resonate with the Root Chakra (Muladhara) at 396 Hz. This frequency helps release
          fear and guilt, grounding you to the earth and establishing a sense of security and stability.
        </p>
        <p className="mb-4">
          The composition begins with deep, earthy tones that gradually build into a rhythmic pattern mimicking the
          heartbeat of the earth. Tibetan singing bowls and low-frequency drones create a foundation for the healing
          frequency to work with your body's energy.
        </p>
        <p>
          <strong>Key elements:</strong>
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>396 Hz Solfeggio frequency</li>
          <li>Tibetan singing bowls</li>
          <li>Earth drums</li>
          <li>Deep drone tones</li>
        </ul>
        <p>
          For optimal results, listen while seated on the ground or floor with your spine straight, focusing your
          attention on the base of your spine.
        </p>
      </>
    ) : (
      <p className="text-white/60 italic">Select a track to view its frequency information and meditation guidance.</p>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="space-y-4">
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => setActiveTrack(track.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeTrack === track.id
                  ? "bg-purple-900/30 border border-purple-500/30"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    activeTrack === track.id ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-black/40"
                  }`}
                >
                  <span className="text-xs font-medium text-white">{track.id}</span>
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-white">{track.title}</h3>
                  <p className="text-xs text-white/60">{track.frequency}</p>
                </div>
              </div>
              <span className="text-sm text-white/60">{track.duration}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-3">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1">
            <TabsTrigger value="info" className="data-[state=active]:bg-purple-900/50">
              Frequency Info
            </TabsTrigger>
            <TabsTrigger value="meditation" className="data-[state=active]:bg-purple-900/50">
              Meditation Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 rounded-xl bg-black/20 p-6 backdrop-blur-sm text-white/80">
            {getLyrics(activeTrack)}
          </TabsContent>

          <TabsContent value="meditation" className="mt-4 rounded-xl bg-black/20 p-6 backdrop-blur-sm text-white/80">
            <h3 className="text-lg font-medium text-white mb-4">Meditation Guide</h3>
            <p className="mb-4">
              Find a comfortable seated position in a quiet space. Close your eyes and take several deep breaths,
              allowing your body to relax with each exhale.
            </p>
            <p className="mb-4">
              As the music begins, visualize a glowing red energy at the base of your spine. Feel this energy connecting
              you to the earth, providing stability and security.
            </p>
            <p className="mb-4">
              With each breath, imagine this energy becoming stronger and more vibrant, dissolving any blockages or
              tensions in this area.
            </p>
            <p>
              Continue this visualization throughout the track, allowing the 396 Hz frequency to resonate with your Root
              Chakra, bringing it into balance and harmony.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



/**
 * Original LyricsSection component merged from: client/src/components/common/LyricsSection.tsx
 * Merge date: 2025-04-05
 */
function LyricsSectionOriginal({ tracks }: LyricsSectionProps) {
  const [activeTrack, setActiveTrack] = useState(1)

  // Example lyrics/descriptions - in a real app, these would come from the API
  const getLyrics = (trackId: number) => {
    return trackId === 1 ? (
      <>
        <p className="mb-4">
          This track is designed to resonate with the Root Chakra (Muladhara) at 396 Hz. This frequency helps release
          fear and guilt, grounding you to the earth and establishing a sense of security and stability.
        </p>
        <p className="mb-4">
          The composition begins with deep, earthy tones that gradually build into a rhythmic pattern mimicking the
          heartbeat of the earth. Tibetan singing bowls and low-frequency drones create a foundation for the healing
          frequency to work with your body's energy.
        </p>
        <p>
          <strong>Key elements:</strong>
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>396 Hz Solfeggio frequency</li>
          <li>Tibetan singing bowls</li>
          <li>Earth drums</li>
          <li>Deep drone tones</li>
        </ul>
        <p>
          For optimal results, listen while seated on the ground or floor with your spine straight, focusing your
          attention on the base of your spine.
        </p>
      </>
    ) : (
      <p className="text-white/60 italic">Select a track to view its frequency information and meditation guidance.</p>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="space-y-4">
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => setActiveTrack(track.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeTrack === track.id
                  ? "bg-purple-900/30 border border-purple-500/30"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    activeTrack === track.id ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-black/40"
                  }`}
                >
                  <span className="text-xs font-medium text-white">{track.id}</span>
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-white">{track.title}</h3>
                  <p className="text-xs text-white/60">{track.frequency}</p>
                </div>
              </div>
              <span className="text-sm text-white/60">{track.duration}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-3">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1">
            <TabsTrigger value="info" className="data-[state=active]:bg-purple-900/50">
              Frequency Info
            </TabsTrigger>
            <TabsTrigger value="meditation" className="data-[state=active]:bg-purple-900/50">
              Meditation Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 rounded-xl bg-black/20 p-6 backdrop-blur-sm text-white/80">
            {getLyrics(activeTrack)}
          </TabsContent>

          <TabsContent value="meditation" className="mt-4 rounded-xl bg-black/20 p-6 backdrop-blur-sm text-white/80">
            <h3 className="text-lg font-medium text-white mb-4">Meditation Guide</h3>
            <p className="mb-4">
              Find a comfortable seated position in a quiet space. Close your eyes and take several deep breaths,
              allowing your body to relax with each exhale.
            </p>
            <p className="mb-4">
              As the music begins, visualize a glowing red energy at the base of your spine. Feel this energy connecting
              you to the earth, providing stability and security.
            </p>
            <p className="mb-4">
              With each breath, imagine this energy becoming stronger and more vibrant, dissolving any blockages or
              tensions in this area.
            </p>
            <p>
              Continue this visualization throughout the track, allowing the 396 Hz frequency to resonate with your Root
              Chakra, bringing it into balance and harmony.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}



/**
 * Original LyricsSection component merged from: client/src/components/features/audio/LyricsSection.tsx
 * Merge date: 2025-04-05
 */
function LyricsSectionOriginal({ tracks }: LyricsSectionProps) {
  const [activeTrack, setActiveTrack] = useState(1)

  // Example lyrics/descriptions - in a real app, these would come from the API
  const getLyrics = (trackId: number) => {
    return trackId === 1 ? (
      <>
        <p className="mb-4">
          This track is designed to resonate with the Root Chakra (Muladhara) at 396 Hz. This frequency helps release
          fear and guilt, grounding you to the earth and establishing a sense of security and stability.
        </p>
        <p className="mb-4">
          The composition begins with deep, earthy tones that gradually build into a rhythmic pattern mimicking the
          heartbeat of the earth. Tibetan singing bowls and low-frequency drones create a foundation for the healing
          frequency to work with your body's energy.
        </p>
        <p>
          <strong>Key elements:</strong>
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>396 Hz Solfeggio frequency</li>
          <li>Tibetan singing bowls</li>
          <li>Earth drums</li>
          <li>Deep drone tones</li>
        </ul>
        <p>
          For optimal results, listen while seated on the ground or floor with your spine straight, focusing your
          attention on the base of your spine.
        </p>
      </>
    ) : (
      <p className="text-white/60 italic">Select a track to view its frequency information and meditation guidance.</p>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="space-y-4">
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => setActiveTrack(track.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                activeTrack === track.id
                  ? "bg-purple-900/30 border border-purple-500/30"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    activeTrack === track.id ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-black/40"
                  }`}
                >
                  <span className="text-xs font-medium text-white">{track.id}</span>
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-white">{track.title}</h3>
                  <p className="text-xs text-white/60">{track.frequency}</p>
                </div>
              </div>
              <span className="text-sm text-white/60">{track.duration}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-3">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1">
            <TabsTrigger value="info" className="data-[state=active]:bg-purple-900/50">
              Frequency Info
            </TabsTrigger>
            <TabsTrigger value="meditation" className="data-[state=active]:bg-purple-900/50">
              Meditation Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 rounded-xl bg-black/20 p-6 backdrop-blur-sm text-white/80">
            {getLyrics(activeTrack)}
          </TabsContent>

          <TabsContent value="meditation" className="mt-4 rounded-xl bg-black/20 p-6 backdrop-blur-sm text-white/80">
            <h3 className="text-lg font-medium text-white mb-4">Meditation Guide</h3>
            <p className="mb-4">
              Find a comfortable seated position in a quiet space. Close your eyes and take several deep breaths,
              allowing your body to relax with each exhale.
            </p>
            <p className="mb-4">
              As the music begins, visualize a glowing red energy at the base of your spine. Feel this energy connecting
              you to the earth, providing stability and security.
            </p>
            <p className="mb-4">
              With each breath, imagine this energy becoming stronger and more vibrant, dissolving any blockages or
              tensions in this area.
            </p>
            <p>
              Continue this visualization throughout the track, allowing the 396 Hz frequency to resonate with your Root
              Chakra, bringing it into balance and harmony.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

