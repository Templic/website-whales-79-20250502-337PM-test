/**
 * MusicReleasePage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/hooks/use-auth";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import MusicSearchComponent from "@/components/music/MusicSearchComponent";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface Track {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  frequency?: string;
  description?: string;
  createdAt: string;
}

export default function MusicReleasePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const { user } = useAuth();
  const [location] = useLocation();
  // Parse query parameters if any
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const searchQuery = queryParams.get('q') || '';
  const searchFilter = queryParams.get('filter') || 'all';

  useEffect(() => {
    document.title = "New Music - Dale Loves Whales";
    fetchTracks();
  }, [searchQuery, searchFilter]);

  const fetchTracks = async () => {
    try {
      // Add query params if they exist
      const params: Record<string, string> = {};
      if (searchQuery) {
        params.q = searchQuery;
        if (searchFilter !== 'all') {
          params.filter = searchFilter;
        }
      }
      
      const response = await axios.get('/api/tracks', { params });
      setTracks(response.data);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  const handleTrackSelect = (track: any) => {
    // Navigate to the specific track detail page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SpotlightEffect />
      <div className="space-y-8 container mx-auto px-4">
        {/* Search bar section */}
        <div className="my-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
            Search Music by Title, Frequency or Description
          </h2>
          <MusicSearchComponent 
            onResultClick={handleTrackSelect}
            placeholder="Search by title, frequency or description..."
            className="w-full"
          />
        </div>

        <section className="flex flex-col lg:flex-row gap-8 items-start relative">
          <div className="w-full lg:w-2/3 bg-gray-900 rounded-lg shadow-xl relative overflow-hidden">
            <div className="pt-[56.25%] relative">
              <iframe
                src="https://www.youtube.com/embed/jzpvkq3Krjg?rel=0&showinfo=0&controls=1"
                title="Feels So Good - Music Video"
                className="absolute inset-0 w-full h-full rounded-lg"
                frameBorder="0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            {/* Fallback message in case the iframe doesn't load */}
            <div className="hidden youtube-fallback absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4 text-center">
              <div>
                <p className="text-lg font-medium mb-2">Video not available</p>
                <a 
                  href="https://www.youtube.com/watch?v=jzpvkq3Krjg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#00ebd6] hover:underline"
                >
                  Watch "Feels So Good" on YouTube
                </a>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/3 space-y-6">
            <h1 className="text-4xl font-bold text-[#00ebd6]">FEELS SO GOOD</h1>
            <div className="space-y-4">
              <p className="text-xl">Release Date: March 14, 2025</p>
              <p className="text-xl">Genre: R&B, Soulful, Cosmic, Conscious</p>
              <p className="text-xl">
                Artist: Dale The Whale<br />
                Featuring: AC3-2085
              </p>
              <p className="text-xl">
                Frequency: 432 Hz<br />
                Duration: 4:32
              </p>
            </div>
          </div>
        </section>

        {/* Display available tracks */}
        {tracks.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
              More Cosmic Frequencies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tracks.map((track) => (
                <Card 
                  key={track.id} 
                  className="overflow-hidden transition-all hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer"
                  onClick={() => window.location.href = `/music/track/${track.id}`}
                >
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold mb-2">{track.title}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Artist: {track.artist}</p>
                      {track.frequency && <p>Frequency: {track.frequency}</p>}
                      <p>Released: {new Date(track.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/music/track/${track.id}`;
                        }}
                      >
                        Listen Now ▶
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}