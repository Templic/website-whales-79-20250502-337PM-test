
import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audioSrc: string;
}

interface MusicPlayerProps {
  tracks?: Track[];
  currentTrackIndex?: number;
  onTrackChange?: (index: number) => void;
  minimized?: boolean;
}

const defaultTracks: Track[] = [
  {
    id: "1",
    title: "Cosmic Meditation",
    artist: "Cosmic Healer",
    duration: 187,
    audioSrc: "https://dl.dropboxusercontent.com/scl/fi/yvyzivzgpidw4uu59bqe7/cosmic-meditation.mp3?rlkey=u9bx2uxpunbpow9t6wkmxylki"
  },
  {
    id: "2",
    title: "Astral Journey",
    artist: "Cosmic Healer",
    duration: 201,
    audioSrc: "https://dl.dropboxusercontent.com/scl/fi/o7d6byyqdhyrvg4qrg6fj/astral-journey.mp3?rlkey=ndzfefsgdg9jvz4a4t78ezugn"
  },
  {
    id: "3",
    title: "Healing Vibrations",
    artist: "Cosmic Healer",
    duration: 174,
    audioSrc: "https://dl.dropboxusercontent.com/scl/fi/fjikahf7ewvxg3qzw6x09/healing-vibrations.mp3?rlkey=hrhz4m4wtcyysvx3jfz6yz5a6"
  }
];

const MusicPlayer = ({ 
  tracks = defaultTracks, 
  currentTrackIndex = 0, 
  onTrackChange,
  minimized = false 
}: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(currentTrackIndex);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = tracks[activeTrackIndex];

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(currentTrack.audioSrc);
    audioRef.current.volume = volume;
    
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };
    
    const handleEnded = () => {
      nextTrack();
    };
    
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [activeTrackIndex]);
  
  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Audio playback error:", error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, activeTrackIndex]);
  
  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      const newTime = value[0];
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const previousTrack = () => {
    const newIndex = activeTrackIndex === 0 ? tracks.length - 1 : activeTrackIndex - 1;
    setActiveTrackIndex(newIndex);
    if (onTrackChange) onTrackChange(newIndex);
    setCurrentTime(0);
    setIsPlaying(true);
  };
  
  const nextTrack = () => {
    const newIndex = activeTrackIndex === tracks.length - 1 ? 0 : activeTrackIndex + 1;
    setActiveTrackIndex(newIndex);
    if (onTrackChange) onTrackChange(newIndex);
    setCurrentTime(0);
    setIsPlaying(true);
  };
  
  if (minimized) {
    return (
      <div className="fixed bottom-0 right-0 mb-4 mr-4 z-40 cosmic-card p-2 flex items-center space-x-2">
        <button 
          onClick={togglePlayPause}
          className="h-8 w-8 rounded-full bg-cosmic-primary flex items-center justify-center text-white"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div className="text-xs">
          <p className="font-medium truncate max-w-[100px]">{currentTrack.title}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="cosmic-card p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">{currentTrack.title}</h3>
            <p className="text-sm text-muted-foreground">{currentTrack.artist}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={toggleMute} className="p-1 hover:text-cosmic-primary transition-colors">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="w-20">
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="h-1"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={currentTrack.duration}
            step={1}
            onValueChange={handleSeek}
            className="h-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>
        
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={previousTrack}
            className="p-2 hover:text-cosmic-primary transition-colors"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlayPause}
            className="h-12 w-12 rounded-full bg-cosmic-primary hover:bg-cosmic-vivid flex items-center justify-center text-white transition-colors"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
          <button
            onClick={nextTrack}
            className="p-2 hover:text-cosmic-primary transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
