/**
 * ArchivePage.tsx
 * 
 * ARCHIVED PAGE
 * 
 * This page is no longer in active use and has been archived.
 * It is kept for reference purposes only.
 * 
 * Please use the current implementation for any new development.
 */import React from "react";

import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { AlbumShowcase } from "@/components/music/AlbumShowcase";
import { DynamicPlaylists, RecommendedPlaylists } from "@/components/music/DynamicPlaylists";
import { playlists } from "@/data/playlists";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Disc, Headphones, Clock, Search, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CosmicReveal } from "@/components/features/cosmic/CosmicReveal";

export default function ArchivePage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Notify user about work in progress features
  useEffect(() => {
    toast({
      title: "Archive Features",
      description: "The search and filtering features are coming soon. Currently displaying a showcase of albums.",
      duration: 5000
    });
  }, [toast]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Archived Page Banner */}
      <div className="w-full bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
        <p className="font-bold">Archived Page</p>
        <p>This page is no longer actively maintained and is kept for reference only.</p>
      </div>

      <CosmicBackground />
      
      <div className="container mx-auto pt-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-500">
            Cosmic Music Archive
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Explore our collection of consciousness-transforming music, healing frequencies, and 
            guided meditations designed to elevate your vibration.
          </p>
        </div>
        
        {/* Search and Filter */}
        <div className="bg-black/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input 
                  type="text"
                  placeholder="Search by title, frequency or description..."
                  className="pl-10 bg-black/20 border-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Button variant="outline" className="w-full border-white/10">
                <Clock className="mr-2 h-4 w-4" />
                Sort by Date
              </Button>
            </div>
            
            <div>
              <Button variant="outline" className="w-full border-white/10">
                <Disc className="mr-2 h-4 w-4" />
                Filter by Type
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="mb-16">
          <Tabs defaultValue="albums" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-black/20 backdrop-blur-sm">
              <TabsTrigger value="albums">
                <Disc className="h-4 w-4 mr-2" />
                Albums
              </TabsTrigger>
              <TabsTrigger value="singles">
                <Headphones className="h-4 w-4 mr-2" />
                Singles
              </TabsTrigger>
              <TabsTrigger value="meditation">
                <Clock className="h-4 w-4 mr-2" />
                Meditations
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="albums" className="space-y-8">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Featured Albums</h2>
                <AlbumShowcase />
              </div>
            </TabsContent>
            
            <TabsContent value="singles" className="space-y-8">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Recent Singles</h2>
                
                <CosmicReveal delay={0.2}>
                  <RecommendedPlaylists 
                    playlists={playlists.filter(p => p.category === 'sleep' || p.category === 'astral')}
                    onSelect={(playlist) => {
                      toast({
                        title: "Playlist Selected",
                        description: `You've selected the "${playlist.title}" playlist. Audio player coming soon.`,
                        duration: 3000
                      });
                    }}
                  />
                </CosmicReveal>
              </div>
            </TabsContent>
            
            <TabsContent value="meditation" className="space-y-8">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Guided Meditations</h2>
                <DynamicPlaylists 
                  playlists={playlists.filter(p => p.category === 'meditation' || p.category === 'healing')}
                  onPlay={(trackId) => {
                    toast({
                      title: "Audio Feature",
                      description: `The audio player for track ${trackId} will be implemented soon.`,
                      duration: 3000
                    });
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Call to Action */}
        <div className="bg-black/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-8 mb-16 text-center">
          <h2 className="text-2xl font-semibold mb-3">Join Our Archive Community</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-6">
            Get early access to new releases, exclusive ceremonies, and cosmic events
            by joining our community of frequency explorers.
          </p>
          <Button className="bg-gradient-to-r from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-600">
            Subscribe for Updates
          </Button>
        </div>
      </div>
    </div>
  );
}