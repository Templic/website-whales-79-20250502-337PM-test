import React from "react";
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
    } catch (error: unknown) {
      console.error('Error fetching tracks:', error);
    }
  };

  //handleDelete function removed

  return (
    <>
      <SpotlightEffect />
      <div className="space-y-8">
        <section className="flex flex-col md:flex-row gap-8 items-start relative">
          <div className="w-full md:w-1/2">
            <iframe
              src="https://www.youtube-nocookie.com/embed/jzpvkq3Krjg"
              title="Feels So Good - Music Video"
              className="w-full aspect-video rounded-lg shadow-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <h1 className="cosmic-heading-responsive-lg font-bold text-[#00ebd6]">FEELS SO GOOD</h1>
            <div className="space-y-4 cosmic-margin-y-responsive">
              <p className="cosmic-text-responsive">Release Date: March 14, 2025</p>
              <p className="cosmic-text-responsive">Genre: R&B, Soulful, Cosmic, Conscious</p>
              <p className="cosmic-text-responsive">
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