/**
 * @file MusicPlayer.tsx
 * @description Enhanced music player component with visualizations and playlist support
 * @author Cosmic Team
 * @created 2025-03-01
 * @updated 2025-04-15
 * @status Active
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatTime, calculateAverageFrequency } from '@/lib/audio-utils';
import { Track } from '@shared/schema';
import { AudioVisualizer } from './AudioVisualizer';
import { PlaylistSelector } from './PlaylistSelector';

/**
 * MusicPlayer
 * 
 * Enhanced music player component with audio visualizations, playlist support,
 * and responsive controls. This component handles audio playback with custom
 * controls while managing audio context for visualizations.
 * 
 * @example
 * ```tsx
 * <MusicPlayer
 *   trackId="track-123"
 *   autoPlay={false}
 *   showVisualizer={true}
 *   onTrackComplete={() => console.log('Track completed')}
 * />
 * ```
 * 
 * @see PlaylistSelector - For selecting and managing playlists
 * @see AudioVisualizer - For audio visualization display
 */

/**
 * Props for the MusicPlayer component
 */
interface MusicPlayerProps {
  /**
   * ID of the track to play
   * @required
   */
  trackId: string;
  
  /**
   * Whether to automatically start playback
   * @default false
   */
  autoPlay?: boolean;
  
  /**
   * Whether to show the audio visualizer
   * @default true
   */
  showVisualizer?: boolean;
  
  /**
   * Whether to allow the playlist feature
   * @default true
   */
  enablePlaylist?: boolean;
  
  /**
   * Function called when track finishes playing
   */
  onTrackComplete?: () => void;
  
  /**
   * Custom CSS class name
   */
  className?: string;
}

/**
 * MusicPlayer Component Implementation
 */
export function MusicPlayer({
  trackId,
  autoPlay = false,
  showVisualizer = true,
  enablePlaylist = true,
  onTrackComplete,
  className = '',
}: MusicPlayerProps) {
  // State for audio playback
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(80);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Fetch track data
  const { data: track, isLoading, error } = useQuery({
    queryKey: ['/api/tracks', trackId],
    enabled: !!trackId
  });
  
  // Toast notifications
  const { toast } = useToast();
  
  // Track history mutation
  const addToHistoryMutation = useMutation({
    mutationFn: async (data: { trackId: string }) => {
      return apiRequest('POST', '/api/track-history', data);
    }
  });
  
  // Format track duration with useMemo to avoid unnecessary recalculations
  const formattedDuration = useMemo(() => formatTime(duration), [duration]);
  const formattedCurrentTime = useMemo(() => formatTime(currentTime), [currentTime]);
  
  // Handle play/pause with useCallback to avoid recreation on each render
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    } else {
      audioRef.current?.play();
      animationRef.current = requestAnimationFrame(updateProgress);
      
      // Add to listening history
      addToHistoryMutation.mutate({ trackId });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, trackId, addToHistoryMutation]);
  
  // Update progress bar as track plays
  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);
  
  // Handle seeking in the track
  const handleSeek = useCallback((newPosition: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newPosition;
      setCurrentTime(newPosition);
    }
  }, []);
  
  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      setVolume(newVolume);
    }
  }, []);
  
  // Initialize audio element when track changes
  useEffect(() => {
    if (track?.url) {
      // Clean up previous instance
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      // Create new audio element
      const audio = new Audio(track.url);
      audio.volume = volume / 100;
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        if (onTrackComplete) {
          onTrackComplete();
        }
      });
      
      audioRef.current = audio;
      
      // Start playing if autoPlay is true
      if (autoPlay) {
        audio.play()
          .then(() => {
            setIsPlaying(true);
            animationRef.current = requestAnimationFrame(updateProgress);
          })
          .catch(err => {
            toast({
              title: "Playback Error",
              description: "Unable to autoplay. Please click play.",
              variant: "destructive"
            });
            console.error("Autoplay failed:", err);
          });
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [track, volume, autoPlay, onTrackComplete, updateProgress, toast]);
  
  // Display error state if track loading fails
  if (error) {
    return (
      <div className={`p-4 bg-red-900/20 rounded-lg ${className}`}>
        <p className="text-red-400">Error loading track. Please try again later.</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }
  
  // Display loading state
  if (isLoading) {
    return (
      <div className={`p-4 bg-gray-800/50 rounded-lg animate-pulse ${className}`}>
        <div className="h-12 bg-gray-700/50 rounded-md mb-2" />
        <div className="h-4 bg-gray-700/50 rounded-md w-3/4" />
      </div>
    );
  }
  
  return (
    <div className={`p-4 bg-gray-800/30 backdrop-blur-sm rounded-lg ${className}`}>
      {/* Track info */}
      <div className="mb-4">
        <h3 className="text-lg font-medium truncate">{track?.title || 'Unknown Track'}</h3>
        <p className="text-sm text-gray-400 truncate">{track?.artist || 'Unknown Artist'}</p>
      </div>
      
      {/* Visualizer */}
      {showVisualizer && track && audioRef.current && (
        <AudioVisualizer 
          audioElement={audioRef.current} 
          isPlaying={isPlaying}
          className="mb-4 h-32"
        />
      )}
      
      {/* Progress bar */}
      <div className="mb-3">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={(values) => handleSeek(values[0])}
          className="my-2"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{formattedCurrentTime}</span>
          <span>{formattedDuration}</span>
        </div>
      </div>
      
      {/* Playback controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => handleSeek(Math.max(0, currentTime - 10))}
          aria-label="Rewind 10 seconds"
        >
          <RewindIcon className="h-5 w-5" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={togglePlayPause}
          className="h-12 w-12 rounded-full"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
          aria-label="Forward 10 seconds"
        >
          <ForwardIcon className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Volume control */}
      <div className="flex items-center space-x-2">
        <VolumeIcon className="h-4 w-4 text-gray-400" />
        <Slider
          value={[volume]}
          min={0}
          max={100}
          step={1}
          onValueChange={(values) => handleVolumeChange(values[0])}
          className="w-24"
        />
      </div>
      
      {/* Playlist selector */}
      {enablePlaylist && track && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <PlaylistSelector 
            currentTrackId={trackId}
            onTrackSelect={(selectedTrackId) => {
              // Handle track selection from playlist
            }}
          />
        </div>
      )}
    </div>
  );
}

// Icon components
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
  </svg>
);

const RewindIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V8.688c0-1.44-1.555-2.342-2.805-1.628L12 11.03v-2.34c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
  </svg>
);

const ForwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
  </svg>
);

const VolumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
    <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
  </svg>
);

export default MusicPlayer;