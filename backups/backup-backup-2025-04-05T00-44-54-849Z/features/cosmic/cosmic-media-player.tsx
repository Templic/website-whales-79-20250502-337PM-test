/**
 * cosmic-media-player.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { useState, useEffect, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  MoreVertical,
  Download,
  Share2,
  Heart,
  ListMusic
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the media player container variants
const playerContainerVariants = cva(
  'rounded-lg overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-gray-900 border border-gray-800',
        cosmic: 'bg-cosmic-900/80 border border-cosmic-primary/30 backdrop-blur-sm',
        frosted: 'bg-gray-900/60 backdrop-blur-md border border-white/10',
        minimal: 'bg-gray-950',
        glow: 'bg-cosmic-900/80 border border-cosmic-primary/30 shadow-cosmic shadow-cosmic-primary/20',
      },
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Define the progress bar variants
const progressBarVariants = cva(
  'h-1 cursor-pointer rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-gray-700',
        cosmic: 'bg-cosmic-900',
        frosted: 'bg-white/20',
        minimal: 'bg-gray-800',
        glow: 'bg-gray-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Define the progress fill variants
const progressFillVariants = cva(
  'h-full rounded-full transition-all duration-100',
  {
    variants: {
      variant: {
        default: 'bg-white',
        cosmic: 'bg-gradient-to-r from-cosmic-primary to-cosmic-secondary',
        frosted: 'bg-white',
        minimal: 'bg-cosmic-primary',
        glow: 'bg-cosmic-primary shadow-glow shadow-cosmic-primary/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Define the control button variants
const controlButtonVariants = cva(
  'flex items-center justify-center rounded-full transition-all',
  {
    variants: {
      variant: {
        default: 'hover:bg-gray-800 text-white',
        cosmic: 'hover:bg-cosmic-primary/20 text-cosmic-primary',
        frosted: 'hover:bg-white/10 text-white',
        minimal: 'hover:bg-gray-900 text-gray-300',
        glow: 'hover:bg-cosmic-primary/20 text-cosmic-primary hover:shadow-glow hover:shadow-cosmic-primary/30',
      },
      size: {
        sm: 'p-1',
        md: 'p-2',
        lg: 'p-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Define the primary control button variants (play/pause)
const primaryControlButtonVariants = cva(
  'flex items-center justify-center rounded-full transition-all',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900 hover:bg-gray-200',
        cosmic: 'bg-cosmic-primary text-white hover:bg-cosmic-secondary',
        frosted: 'bg-white/90 text-gray-900 hover:bg-white backdrop-blur-sm',
        minimal: 'bg-cosmic-primary text-white hover:opacity-90',
        glow: 'bg-cosmic-primary text-white hover:bg-cosmic-primary/90 shadow-glow shadow-cosmic-primary/50',
      },
      size: {
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Define type for media track
export interface MediaTrack {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  src: string;
  duration?: number;
}

// Main component props
export interface CosmicMediaPlayerProps extends VariantProps<typeof playerContainerVariants> {
  tracks: MediaTrack[];
  initialTrackIndex?: number;
  onTrackChange?: (track: MediaTrack, index: number) => void;
  onPlay?: (track: MediaTrack) => void;
  onPause?: (track: MediaTrack) => void;
  onEnded?: (track: MediaTrack) => void;
  showPlaylist?: boolean;
  showControls?: boolean;
  showVolumeControl?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
  artworkClassName?: string;
  controlsClassName?: string;
  allowDownload?: boolean;
  allowSharing?: boolean;
  favoriteAction?: (track: MediaTrack) => void;
  visualizer?: boolean;
  hideArtwork?: boolean;
  compact?: boolean;
}

export const CosmicMediaPlayer: React.FC<CosmicMediaPlayerProps> = ({
  tracks,
  initialTrackIndex = 0,
  onTrackChange,
  onPlay,
  onPause,
  onEnded,
  showPlaylist = false,
  showControls = true,
  showVolumeControl = true,
  autoPlay = false,
  loop = false,
  className,
  artworkClassName,
  controlsClassName,
  allowDownload = false,
  allowSharing = false,
  favoriteAction,
  visualizer = false,
  hideArtwork = false,
  compact = false,
  variant = 'default',
  size = 'md',
}) => {
  // State for handling player functionality
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(loop);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(showPlaylist);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Current track
  const currentTrack = tracks[currentTrackIndex];
  
  // Visualizer effect setup
  useEffect(() => {
    if (visualizer && canvasRef.current && audioRef.current && isPlaying) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const audioSrc = audioContext.createMediaElementSource(audioRef.current);
      
      audioSrc.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      const renderFrame = () => {
        if (!canvas || !ctx) return;
        
        animationFrameRef.current = requestAnimationFrame(renderFrame);
        
        analyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2;
          
          // Use colors based on variant
          let gradient;
          if (variant === 'cosmic') {
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(120, 80, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(60, 140, 255, 0.2)');
          } else if (variant === 'glow') {
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(100, 80, 255, 0.9)');
            gradient.addColorStop(1, 'rgba(100, 80, 255, 0.1)');
          } else {
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
          }
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          
          x += barWidth + 1;
        }
      };
      
      renderFrame();
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        // Cleanup audio context
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      };
    }
  }, [visualizer, isPlaying, variant]);
  
  // Handle track duration and time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      if (onEnded && currentTrack) {
        onEnded(currentTrack);
      }
      
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(err => console.error('Error playing audio:', err));
        return;
      }
      
      if (isShuffling) {
        const nextIndex = Math.floor(Math.random() * tracks.length);
        setCurrentTrackIndex(nextIndex);
        return;
      }
      
      if (currentTrackIndex < tracks.length - 1) {
        setCurrentTrackIndex(currentTrackIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, currentTrack, isLooping, isShuffling, onEnded, tracks.length]);
  
  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex]);
  
  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);
  
  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Reset time
    setCurrentTime(0);
    
    // Auto play on track change if already playing
    if (isPlaying) {
      audio.load();
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    }
    
    if (onTrackChange && currentTrack) {
      onTrackChange(currentTrack, currentTrackIndex);
    }
  }, [currentTrackIndex, currentTrack, onTrackChange]);
  
  // Auto play on component mount if specified
  useEffect(() => {
    if (autoPlay) {
      setIsPlaying(true);
    }
  }, [autoPlay]);
  
  // Toggle play/pause
  const togglePlayPause = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    
    if (newState && onPlay && currentTrack) {
      onPlay(currentTrack);
    } else if (!newState && onPause && currentTrack) {
      onPause(currentTrack);
    }
  };
  
  // Skip to previous track
  const skipToPreviousTrack = () => {
    if (currentTime > 3 || currentTrackIndex === 0) {
      // If current time > 3 seconds, restart current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else {
      setCurrentTrackIndex(prev => (prev > 0 ? prev - 1 : tracks.length - 1));
    }
  };
  
  // Skip to next track
  const skipToNextTrack = () => {
    if (isShuffling) {
      const nextIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIndex(nextIndex);
    } else {
      setCurrentTrackIndex(prev => (prev < tracks.length - 1 ? prev + 1 : 0));
    }
  };
  
  // Format time
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle progress bar click
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    const audio = audioRef.current;
    
    if (!progressBar || !audio) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Download current track
  const downloadTrack = () => {
    if (!currentTrack) return;
    
    const link = document.createElement('a');
    link.href = currentTrack.src;
    link.download = `${currentTrack.artist} - ${currentTrack.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Share current track
  const shareTrack = () => {
    if (!currentTrack || !navigator.share) return;
    
    navigator.share({
      title: `${currentTrack.artist} - ${currentTrack.title}`,
      text: `Listen to ${currentTrack.title} by ${currentTrack.artist}`,
      url: window.location.href,
    }).catch(err => console.error('Error sharing:', err));
  };
  
  return (
    <div 
      className={cn(
        playerContainerVariants({ variant, size }),
        className
      )}
    >
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentTrack?.src} 
        preload="metadata"
      />
      
      {/* Player Layout */}
      <div className={cn(
        "flex flex-col",
        compact && !hideArtwork && "md:flex-row"
      )}>
        {/* Artwork Section */}
        {!hideArtwork && currentTrack?.artwork && (
          <div className={cn(
            "relative",
            compact ? "md:w-1/3" : "w-full",
            artworkClassName
          )}>
            <img 
              src={currentTrack.artwork} 
              alt={`${currentTrack.title} artwork`}
              className="w-full object-cover aspect-square"
            />
            
            {/* Visualizer overlay if enabled */}
            {visualizer && isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <canvas 
                  ref={canvasRef} 
                  width="300" 
                  height="300"
                  className="absolute inset-0 w-full h-full opacity-70"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Controls Section */}
        <div className={cn(
          "flex flex-col p-4",
          compact && !hideArtwork ? "md:w-2/3" : "w-full",
          controlsClassName
        )}>
          {/* Track Info */}
          <div className="mb-4">
            <h3 className="text-lg font-medium truncate text-white">
              {currentTrack?.title || 'No track selected'}
            </h3>
            {currentTrack?.artist && (
              <p className="text-sm text-gray-400 truncate">
                {currentTrack.artist}
                {currentTrack.album && ` · ${currentTrack.album}`}
              </p>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div 
              ref={progressBarRef}
              className={progressBarVariants({ variant })}
              onClick={handleProgressBarClick}
            >
              <div 
                className={progressFillVariants({ variant })}
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            
            {/* Time Display */}
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Main Controls */}
          {showControls && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsShuffling(!isShuffling)}
                  className={cn(
                    controlButtonVariants({ variant, size: 'sm' }),
                    isShuffling && "text-cosmic-primary"
                  )}
                  aria-label="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                
                <button
                  onClick={skipToPreviousTrack}
                  className={controlButtonVariants({ variant, size: 'sm' })}
                  disabled={tracks.length <= 1}
                  aria-label="Previous track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={togglePlayPause}
                className={primaryControlButtonVariants({ variant })}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying 
                  ? <Pause className="w-6 h-6" /> 
                  : <Play className="w-6 h-6" />
                }
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={skipToNextTrack}
                  className={controlButtonVariants({ variant, size: 'sm' })}
                  disabled={tracks.length <= 1}
                  aria-label="Next track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={cn(
                    controlButtonVariants({ variant, size: 'sm' }),
                    isLooping && "text-cosmic-primary"
                  )}
                  aria-label="Repeat"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Additional Controls */}
          <div className="flex items-center justify-between">
            {/* Volume Control */}
            {showVolumeControl && (
              <div className="flex items-center space-x-2 w-32">
                <button
                  onClick={toggleMute}
                  className={controlButtonVariants({ variant, size: 'sm' })}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted 
                    ? <VolumeX className="w-4 h-4" /> 
                    : <Volume2 className="w-4 h-4" />
                  }
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {favoriteAction && (
                <button
                  onClick={() => favoriteAction(currentTrack)}
                  className={controlButtonVariants({ variant, size: 'sm' })}
                  aria-label="Favorite"
                >
                  <Heart className="w-4 h-4" />
                </button>
              )}
              
              {allowDownload && (
                <button
                  onClick={downloadTrack}
                  className={controlButtonVariants({ variant, size: 'sm' })}
                  aria-label="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              
              {allowSharing && typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={shareTrack}
                  className={controlButtonVariants({ variant, size: 'sm' })}
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              
              {tracks.length > 1 && (
                <button
                  onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
                  className={cn(
                    controlButtonVariants({ variant, size: 'sm' }),
                    isPlaylistOpen && "text-cosmic-primary"
                  )}
                  aria-label="Playlist"
                >
                  <ListMusic className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Playlist */}
          {isPlaylistOpen && tracks.length > 1 && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              <ul className="space-y-1">
                {tracks.map((track, index) => (
                  <li 
                    key={track.id || index}
                    className={cn(
                      "flex items-center p-2 rounded cursor-pointer",
                      currentTrackIndex === index 
                        ? "bg-cosmic-primary/20" 
                        : "hover:bg-gray-800"
                    )}
                    onClick={() => {
                      setCurrentTrackIndex(index);
                      setIsPlaying(true);
                    }}
                  >
                    <div className="flex-1 truncate">
                      <p className={cn(
                        "font-medium truncate",
                        currentTrackIndex === index ? "text-white" : "text-gray-300"
                      )}>
                        {track.title}
                      </p>
                      {track.artist && (
                        <p className="text-sm text-gray-400 truncate">
                          {track.artist}
                        </p>
                      )}
                    </div>
                    
                    {currentTrackIndex === index && isPlaying && (
                      <div className="flex-shrink-0 w-4 h-4">
                        <div className="w-full h-full flex items-end space-x-0.5">
                          <div className="w-1 bg-cosmic-primary animate-sound-wave-1 h-full"></div>
                          <div className="w-1 bg-cosmic-primary animate-sound-wave-2 h-full"></div>
                          <div className="w-1 bg-cosmic-primary animate-sound-wave-3 h-full"></div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};