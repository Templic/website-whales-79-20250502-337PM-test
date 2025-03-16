import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Album, Track } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

type AudioPlayerProps = {
  track: Track;
  onNext?: () => void;
  onPrevious?: () => void;
};

const AudioPlayer = ({ track, onNext, onPrevious }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="bg-[rgba(10,50,92,0.6)] p-4 rounded-xl flex items-center gap-4">
      <audio
        ref={audioRef}
        src={track.audioUrl}
        onEnded={() => {
          setIsPlaying(false);
          onNext?.();
        }}
      />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          disabled={!onPrevious}
        >
          <SkipBack className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={!onNext}
        >
          <SkipForward className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex items-center gap-2 w-32">
        <Volume2 className="h-4 w-4" />
        <Slider
          defaultValue={[1]}
          max={1}
          step={0.1}
          value={[volume]}
          onValueChange={handleVolumeChange}
        />
      </div>

      <div className="text-sm">
        <p className="font-medium">{track.title}</p>
        <p className="text-gray-400">{track.artist}</p>
      </div>
    </div>
  );
};

export default function MusicArchivePage() {
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);

  const { data: albums, isLoading: albumsLoading } = useQuery<Album[]>({
    queryKey: ['/api/albums'],
  });

  const { data: tracks, isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
  });

  useEffect(() => {
    document.title = "Music Archive - Dale Loves Whales";
  }, []);

  const currentTrack = tracks?.find(track => track.id === currentTrackId);
  const albumTracks = tracks?.filter(track => track.albumId === currentTrack?.albumId);

  const handleNextTrack = () => {
    if (albumTracks && currentTrackId) {
      const currentIndex = albumTracks.findIndex(track => track.id === currentTrackId);
      if (currentIndex < albumTracks.length - 1) {
        setCurrentTrackId(albumTracks[currentIndex + 1].id);
      }
    }
  };

  const handlePreviousTrack = () => {
    if (albumTracks && currentTrackId) {
      const currentIndex = albumTracks.findIndex(track => track.id === currentTrackId);
      if (currentIndex > 0) {
        setCurrentTrackId(albumTracks[currentIndex - 1].id);
      }
    }
  };

  return (
    <div className="space-y-8">
      <section className="header-section text-center mb-12">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Music Archive</h1>
        <p className="text-xl max-w-2xl mx-auto">
          Explore Dale's complete discography, from cosmic beginnings to latest stellar releases.
        </p>
      </section>

      {currentTrack && (
        <section className="sticky top-4 z-10">
          <AudioPlayer
            track={currentTrack}
            onNext={albumTracks && albumTracks.length > 1 ? handleNextTrack : undefined}
            onPrevious={albumTracks && albumTracks.length > 1 ? handlePreviousTrack : undefined}
          />
        </section>
      )}

      <section className="albums-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {albumsLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-[rgba(10,50,92,0.3)] h-64 rounded-xl mb-4" />
              <div className="h-6 bg-[rgba(10,50,92,0.3)] rounded w-3/4 mb-2" />
              <div className="h-4 bg-[rgba(10,50,92,0.3)] rounded w-1/2" />
            </div>
          ))
        ) : albums?.map((album) => (
          <div key={album.id} className="album-card bg-[rgba(10,50,92,0.6)] rounded-xl overflow-hidden shadow-lg hover:transform hover:scale-105 transition-transform duration-300">
            {album.coverImage && (
              <img 
                src={album.coverImage} 
                alt={`${album.title} Cover`} 
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold text-[#00ebd6] mb-2">{album.title}</h3>
              <p className="text-sm mb-4">Released: {new Date(album.releaseDate!).toLocaleDateString()}</p>

              {tracks?.filter(track => track.albumId === album.id).map(track => (
                <div 
                  key={track.id}
                  className="flex justify-between items-center p-2 hover:bg-[rgba(48,52,54,0.5)] rounded-lg cursor-pointer"
                  onClick={() => setCurrentTrackId(track.id)}
                >
                  <span className="text-sm">{track.title}</span>
                  <span className="text-sm text-gray-400">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
      <section className="playlists bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm mt-12">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Featured Playlists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="playlist-item p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
            <h3 className="text-lg font-bold mb-2">Best of Dale</h3>
            <p className="text-sm mb-4">A curated collection of Dale's most popular tracks</p>
            <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">
              Play All
            </button>
          </div>
          <div className="playlist-item p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
            <h3 className="text-lg font-bold mb-2">Cosmic Journey</h3>
            <p className="text-sm mb-4">Experience the evolution of Dale's cosmic sound</p>
            <button className="bg-[#00ebd6] text-[#303436] px-4 py-2 rounded-lg hover:bg-[#fe0064] hover:text-white transition-colors">
              Play All
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}