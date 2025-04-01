"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CosmicCard } from "@/components/cosmic/ui/cosmic-card";
import { CosmicReveal } from "@/components/cosmic/CosmicReveal";
import { CosmicIcon } from "@/components/cosmic/ui/cosmic-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverArt: string;
  audioSrc: string;
}

interface Playlist {
  id: string;
  title: string;
  description: string;
  coverArt: string;
  tracks: Track[];
  category: string;
  mood?: string;
  frequency?: number;
  chakra?: string;
}

interface DynamicPlaylistsProps {
  playlists: Playlist[];
  onPlay?: (trackId: string) => void;
  className?: string;
}

export function DynamicPlaylists({ playlists, onPlay, className }: DynamicPlaylistsProps) {
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(false);

  // Set first playlist as active by default
  useEffect(() => {
    if (playlists.length > 0 && !activePlaylist) {
      setActivePlaylist(playlists[0]);
    }
  }, [playlists, activePlaylist]);

  // Get unique categories
  const uniqueCategories = playlists.map(playlist => playlist.category).filter((value, index, self) => self.indexOf(value) === index);
  const categories = ["all", ...uniqueCategories];

  // Filter playlists by category
  const filteredPlaylists = filter === "all" ? playlists : playlists.filter((playlist) => playlist.category === filter);

  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">
          Cosmic Playlists
        </h2>

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
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Playlist selection */}
        <div className="md:col-span-1">
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {filteredPlaylists.map((playlist, index) => (
              <CosmicReveal key={playlist.id} delay={index * 0.1}>
                <button
                  onClick={() => setActivePlaylist(playlist)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-colors",
                    activePlaylist?.id === playlist.id
                      ? "bg-purple-900/30 border border-purple-500/30"
                      : "bg-black/20 hover:bg-black/30 border border-white/5",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={playlist.coverArt || "/placeholder.svg"}
                        alt={playlist.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{playlist.title}</h3>
                      <p className="text-xs text-white/60 line-clamp-1">{playlist.description}</p>
                    </div>
                  </div>
                </button>
              </CosmicReveal>
            ))}
          </div>
        </div>

        {/* Active playlist */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {activePlaylist && (
              <motion.div
                key={activePlaylist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CosmicCard className="p-0 overflow-hidden">
                  {/* Playlist header */}
                  <div className="relative h-48 md:h-64">
                    <img
                      src={activePlaylist.coverArt || "/placeholder.svg"}
                      alt={activePlaylist.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent">
                      <div className="absolute bottom-0 left-0 p-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                          {activePlaylist.title}
                        </h2>
                        <p className="text-white/80 max-w-md">{activePlaylist.description}</p>

                        {/* Playlist metadata */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {activePlaylist.category && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80">
                              {activePlaylist.category}
                            </div>
                          )}
                          {activePlaylist.mood && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80">
                              Mood: {activePlaylist.mood}
                            </div>
                          )}
                          {activePlaylist.frequency && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80">
                              {activePlaylist.frequency} Hz
                            </div>
                          )}
                          {activePlaylist.chakra && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80">
                              {activePlaylist.chakra} Chakra
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Track list */}
                  <div className="p-4">
                    <div className="space-y-2">
                      {activePlaylist.tracks.slice(0, isExpanded ? undefined : 5).map((track, index) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={track.coverArt || "/placeholder.svg"}
                                alt={track.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-white">{track.title}</div>
                              <div className="text-xs text-white/60">{track.artist}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-white/60">{track.duration}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onPlay && onPlay(track.id)}
                              className="flex items-center gap-1"
                            >
                              <Play size={16} className="mr-1" />
                              <span>Play</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show more/less button */}
                    {activePlaylist.tracks.length > 5 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                        >
                          {isExpanded ? "Show Less" : `Show ${activePlaylist.tracks.length - 5} More Tracks`}
                        </button>
                      </div>
                    )}
                  </div>
                </CosmicCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Recommended playlists component
export function RecommendedPlaylists({
  playlists,
  onSelect,
}: {
  playlists: Playlist[];
  onSelect?: (playlist: Playlist) => void;
}) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Recommended for You</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {playlists.slice(0, 4).map((playlist, index) => (
          <CosmicReveal key={playlist.id} delay={index * 0.1}>
            <CosmicCard className="p-0 overflow-hidden h-full">
              <div className="relative aspect-square">
                <img
                  src={playlist.coverArt || "/placeholder.svg"}
                  alt={playlist.title}
                  className="h-full w-full object-cover transition-transform hover:scale-105 duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onSelect && onSelect(playlist)}
                    className="flex items-center gap-1"
                  >
                    <Play size={16} className="mr-1" />
                    <span>Play</span>
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-white line-clamp-1">{playlist.title}</h3>
                <p className="text-xs text-white/60 line-clamp-1">{playlist.description}</p>
              </div>
            </CosmicCard>
          </CosmicReveal>
        ))}
      </div>
    </div>
  );
}