import { useEffect, useState } from "react";
import axios from "axios";

interface Track {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  createdAt: string;
}

export default function NewMusicPage() {
  const [tracks, setTracks] = useState<Track[]>([]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/2">
          <img 
            src="/static/images/album cover for feels so good song.png"
            alt="Album Cover - Feels So Good"
            className="w-full rounded-lg shadow-xl"
          />
        </div>
        <div className="w-full md:w-1/2 space-y-6">
          <h1 className="text-4xl font-bold text-[#00ebd6]">FEELS SO GOOD</h1>
          <div className="space-y-4">
            <p className="text-xl">Release Date: March 14, 2025</p>
            <p className="text-xl">Genre: R&B, Soulful, Cosmic, Conscious</p>
            <p className="text-xl">Artist: Dale The Whale & Featuring AC3-2085</p>
            <div className="music-player mt-6 p-6 bg-[rgba(10,50,92,0.6)] rounded-lg shadow-lg backdrop-blur-sm text-center">
              <h3 className="text-2xl font-semibold mb-4 text-[var(--fill-color)]">Listen Now</h3>
              <audio 
                controls 
                className="w-full focus:outline-none mt-2"
                style={{
                  height: '40px',
                  filter: 'invert(85%) hue-rotate(175deg) brightness(1.1)',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)'
                }}
              >
                <source src="/uploads/feels-so-good.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}