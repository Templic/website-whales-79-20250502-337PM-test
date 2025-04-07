/**
 * MusicReleasePage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/hooks/use-auth";
//import { useToast } from "@/hooks/use-toast"; // Removed as not needed anymore
//import { Button } from "@/components/ui/button"; // Removed as not needed anymore
//import { XCircle } from "lucide-react"; // Removed as not needed anymore
import { SpotlightEffect } from "@/components/SpotlightEffect";

interface Track {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  createdAt: string;
}

export default function MusicReleasePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const { user } = useAuth();
  //const { toast } = useToast(); // Removed as not needed anymore

  useEffect(() => {
    document.title = "New Music - Dale Loves Whales";
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await axios.get('/api/tracks');
      setTracks(response.data);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  //handleDelete function removed

  return (
    <>
      <SpotlightEffect />
      <div className="space-y-8">
        <section className="flex flex-col md:flex-row gap-8 items-start relative">
          <div className="w-full md:w-1/2 bg-gray-900 rounded-lg shadow-xl relative overflow-hidden">
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
          <div className="w-full md:w-1/2 space-y-6">
            <h1 className="text-4xl font-bold text-[#00ebd6]">FEELS SO GOOD</h1>
            <div className="space-y-4">
              <p className="text-xl">Release Date: March 14, 2025</p>
              <p className="text-xl">Genre: R&B, Soulful, Cosmic, Conscious</p>
              <p className="text-xl">
                Artist: Dale The Whale<br />
                Featuring: AC3-2085
              </p>

              {/*Removed Music Player div*/}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}