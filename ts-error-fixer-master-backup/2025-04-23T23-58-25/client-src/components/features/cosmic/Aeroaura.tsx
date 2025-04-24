/**
 * Aeroaura.tsx
 * 
 * Component Type: cosmic
 * Created: 2025-04-05
 * 
 * A combined breathwork feature that merges the functionality of BreathSyncPlayer
 * and BreathSynchronizationCeremony into a single integrated experience.
 */
import React from "react";


import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  TreesIcon as Lungs,
  Timer,
  Info,
  Wind,
  Zap,
  CloudFog as Mist,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  audioSrc: string;
  coverArt: string;
  chakra?: string;
  frequency?: number;
}

interface BreathPattern {
  id: number;
  name: string;
  description: string;
  inhale: number; // seconds
  hold1: number; // seconds
  exhale: number; // seconds
  hold2: number; // seconds
  color: string;
}

interface AeroauraProps {
  tracks?: Track[];
  defaultVolume?: number;
}

export function Aeroaura({
  tracks = [
    {
      id: 1,
      title: "Root Chakra Alignment",
      artist: "ASTRA",
      duration: "6:32",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Root",
      frequency: 396,
    },
    {
      id: 2,
      title: "Sacral Awakening",
      artist: "ASTRA",
      duration: "7:14",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Sacral",
      frequency: 417,
    },
    {
      id: 3,
      title: "Solar Plexus Activation",
      artist: "ASTRA",
      duration: "5:48",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Solar Plexus",
      frequency: 528,
    },
    {
      id: 4,
      title: "Heart Resonance",
      artist: "ASTRA",
      duration: "8:21",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Heart",
      frequency: 639,
    },
    {
      id: 5,
      title: "Throat Gateway",
      artist: "ASTRA",
      duration: "6:05",
      audioSrc: "/placeholder.mp3",
      coverArt: "/placeholder.svg?height=300&width=300",
      chakra: "Throat",
      frequency: 741,
    },
  ],
  defaultVolume = 80,
}: AeroauraProps) {
  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(tracks.length > 0 ? 0 : -1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(defaultVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Breath sync state
  const [isBreathSyncActive, setIsBreathSyncActive] = useState(false);
  const [currentBreathPhase, setCurrentBreathPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale");
  const [breathProgress, setBreathProgress] = useState(0);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customPattern, setCustomPattern] = useState<BreathPattern>({
    id: 0,
    name: "Custom",
    description: "Your custom breathing pattern",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 0,
    color: "#9333ea",
  });

  // Session state
  const [sessionDuration, setSessionDuration] = useState(5); // minutes
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(5 * 60); // seconds
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [activeView, setActiveView] = useState<"player" | "ceremony">("player");

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const breathIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Current track - safely handle empty tracks array
  const currentTrack = currentTrackIndex >= 0 && currentTrackIndex < tracks.length 
    ? tracks[currentTrackIndex]
    : null;

  // Breath patterns
  const breathPatterns: BreathPattern[] = [
    {
      id: 1,
      name: "Box Breathing",
      description: "Equal inhale, hold, exhale, hold for calm and focus",
      inhale: 4,
      hold1: 4,
      exhale: 4,
      hold2: 4,
      color: "#9333ea",
    },
    {
      id: 2,
      name: "4-7-8 Breathing",
      description: "Relaxing breath for stress reduction and sleep",
      inhale: 4,
      hold1: 7,
      exhale: 8,
      hold2: 0,
      color: "#3b82f6",
    },
    {
      id: 3,
      name: "Energizing Breath",
      description: "Quick inhales and long exhales for energy",
      inhale: 2,
      hold1: 0,
      exhale: 4,
      hold2: 0,
      color: "#f59e0b",
    },
    {
      id: 4,
      name: "Deep Relaxation",
      description: "Long, deep breaths for deep relaxation",
      inhale: 6,
      hold1: 2,
      exhale: 8,
      hold2: 0,
      color: "#10b981",
    },
    {
      id: 5,
      name: "Custom",
      description: "Your custom breathing pattern",
      inhale: customPattern.inhale,
      hold1: customPattern.hold1,
      exhale: customPattern.exhale,
      hold2: customPattern.hold2,
      color: customPattern.color,
    },
  ];

  // Current breath pattern
  const currentPattern = currentPatternIndex === 4 ? { ...customPattern } : breathPatterns[currentPatternIndex];

  // Total breath cycle duration in seconds
  const breathCycleDuration =
    currentPattern.inhale + currentPattern.hold1 + currentPattern.exhale + currentPattern.hold2;

  // Initialize audio playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Audio playback failed:", error);
          setIsPlaying(false);
        });
        startProgressTimer();
      } else {
        audioRef.current.pause();
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentTrackIndex]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Handle mute toggle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle breath sync
  useEffect(() => {
    if (isBreathSyncActive) {
      startBreathSync();
    } else {
      stopBreathSync();
    }

    return () => {
      stopBreathSync();
    };
  }, [isBreathSyncActive, currentPattern]);

  // Handle session timer
  useEffect(() => {
    if (isSessionActive && isBreathSyncActive) {
      startSessionTimer();
    } else {
      stopSessionTimer();
    }

    return () => {
      stopSessionTimer();
    };
  }, [isSessionActive, isBreathSyncActive]);

  // Update custom pattern in patterns array
  useEffect(() => {
    breathPatterns[4] = { ...customPattern };
  }, [customPattern]);

  // Start progress timer for audio
  const startProgressTimer = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        if (audioRef.current.ended) {
          nextTrack();
        } else {
          setCurrentTime(audioRef.current.currentTime);
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      }
    }, 1000);
  };

  // Start breath synchronization
  const startBreathSync = () => {
    if (breathIntervalRef.current) {
      clearInterval(breathIntervalRef.current);
    }

    // Start with inhale phase
    setCurrentBreathPhase("inhale");
    setBreathProgress(0);

    // Update every 100ms for smooth animation
    breathIntervalRef.current = setInterval(() => {
      setBreathProgress((prev) => {
        // Calculate new progress
        const increment = (0.1 / getCurrentPhaseSeconds()) * 100;
        const newProgress = prev + increment;

        // If current phase is complete, move to next phase
        if (newProgress >= 100) {
          moveToNextBreathPhase();
          return 0; // Reset progress for new phase
        }

        return newProgress;
      });
    }, 100);
  };

  // Stop breath synchronization
  const stopBreathSync = () => {
    if (breathIntervalRef.current) {
      clearInterval(breathIntervalRef.current);
      breathIntervalRef.current = null;
    }
  };

  // Start session timer
  const startSessionTimer = () => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }

    setSessionTimeRemaining(sessionDuration * 60);

    sessionIntervalRef.current = setInterval(() => {
      setSessionTimeRemaining((prev) => {
        if (prev <= 1) {
          // Session complete
          setIsSessionActive(false);
          setIsBreathSyncActive(false);
          clearInterval(sessionIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Stop session timer
  const stopSessionTimer = () => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
  };

  // Get current phase duration in seconds
  const getCurrentPhaseSeconds = () => {
    switch (currentBreathPhase) {
      case "inhale":
        return currentPattern.inhale;
      case "hold1":
        return currentPattern.hold1;
      case "exhale":
        return currentPattern.exhale;
      case "hold2":
        return currentPattern.hold2;
      default:
        return 1;
    }
  };

  // Move to next breath phase
  const moveToNextBreathPhase = () => {
    switch (currentBreathPhase) {
      case "inhale":
        if (currentPattern.hold1 > 0) {
          setCurrentBreathPhase("hold1");
        } else {
          setCurrentBreathPhase("exhale");
        }
        break;
      case "hold1":
        setCurrentBreathPhase("exhale");
        break;
      case "exhale":
        if (currentPattern.hold2 > 0) {
          setCurrentBreathPhase("hold2");
        } else {
          setCurrentBreathPhase("inhale");
          // Completed one full breath cycle
          setBreathCount((prev) => prev + 1);
        }
        break;
      case "hold2":
        setCurrentBreathPhase("inhale");
        // Completed one full breath cycle
        setBreathCount((prev) => prev + 1);
        break;
    }
  };

  // Format time for display
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle metadata loaded
  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Player controls
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1));
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev === tracks.length - 1 ? 0 : prev + 1));
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const onProgressChange = (value: number[]) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(value[0]);
      setCurrentTime(newTime);
    }
  };

  const onVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Breath sync controls
  const toggleBreathSync = () => {
    setIsBreathSyncActive(!isBreathSyncActive);
  };

  const selectBreathPattern = (index: number) => {
    setCurrentPatternIndex(index);
  };

  const toggleSession = () => {
    setIsSessionActive(!isSessionActive);
    if (!isSessionActive) {
      setBreathCount(0);
    }
  };

  // Update custom pattern
  const updateCustomPattern = (field: keyof BreathPattern, value: number) => {
    setCustomPattern((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Get chakra color
  const getChakraColor = (chakra?: string) => {
    switch (chakra) {
      case "Root":
        return "#ff0000";
      case "Sacral":
        return "#ff8c00";
      case "Solar Plexus":
        return "#ffff00";
      case "Heart":
        return "#00ff00";
      case "Throat":
        return "#00bfff";
      case "Third Eye":
        return "#0000ff";
      case "Crown":
        return "#9400d3";
      default:
        return "#9333ea";
    }
  };

  // Get breath phase instruction
  const getBreathInstruction = () => {
    switch (currentBreathPhase) {
      case "inhale":
        return "Inhale";
      case "hold1":
        return "Hold";
      case "exhale":
        return "Exhale";
      case "hold2":
        return "Hold";
    }
  };

  // Calculate circle size based on breath phase
  const getCircleSize = () => {
    if (currentBreathPhase === "inhale") {
      return 50 + (breathProgress / 100) * 50; // 50% to 100%
    } else if (currentBreathPhase === "exhale") {
      return 100 - (breathProgress / 100) * 50; // 100% to 50%
    } else {
      return 100; // Hold phases maintain full size
    }
  };

  return (
    <div ref={containerRef} className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: currentTrack ? getChakraColor(currentTrack.chakra) : "#9333ea" }}
          >
            <Lungs className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Aeroaura</h2>
            <p className="text-xs text-white/60">
              Glory in excel Deity
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView("player")}
            className={cn(
              "border-white/10 text-white hover:bg-white/5",
              activeView === "player" && "bg-white/10"
            )}
          >
            <Wind className="h-4 w-4 mr-2" />
            Player
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView("ceremony")}
            className={cn(
              "border-white/10 text-white hover:bg-white/5",
              activeView === "ceremony" && "bg-white/10"
            )}
          >
            <Mist className="h-4 w-4 mr-2" />
            Ceremony
          </Button>
          <Button
            variant={isBreathSyncActive ? "default" : "outline"}
            size="sm"
            onClick={toggleBreathSync}
            className={cn(
              isBreathSyncActive
                ? "bg-purple-500 hover:bg-purple-600 text-white"
                : "border-white/10 text-white hover:bg-white/5",
            )}
          >
            {isBreathSyncActive ? "Sync Active" : "Start Sync"}
          </Button>
        </div>
      </div>

      <div className="p-4">
        {activeView === "player" && (
          <div className="space-y-6">
            {/* Audio element */}
            {currentTrack && (
              <audio
                ref={audioRef}
                src={currentTrack.audioSrc}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={nextTrack}
                preload="metadata"
              />
            )}

            {/* Album art and track info */}
            {currentTrack && (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <div
                    className="relative rounded-lg overflow-hidden aspect-square bg-gradient-to-br from-purple-900/50 to-purple-900/10 backdrop-blur-sm border border-white/5"
                    style={{
                      boxShadow: `0 8px 32px -8px ${currentTrack && currentTrack.chakra ? getChakraColor(currentTrack.chakra) : "#9333ea"}50`,
                    }}
                  >
                    {/* Album cover */}
                    <img
                      src={currentTrack.coverArt}
                      alt={`Cover art for ${currentTrack.title}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Breath visualization overlay */}
                    {isBreathSyncActive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                          className="rounded-full bg-white/5 backdrop-blur-sm border border-white/20 transition-all duration-300"
                          style={{
                            width: `${getCircleSize()}%`,
                            height: `${getCircleSize()}%`,
                            backgroundColor: `${currentPattern.color}20`,
                            borderColor: `${currentPattern.color}40`,
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-white text-lg font-medium">
                              {getBreathInstruction()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Play/pause overlay */}
                    {!isBreathSyncActive && (
                      <div
                        className="absolute inset-0 flex items-center justify-center cursor-pointer"
                        onClick={togglePlay}
                      >
                        <div className="rounded-full bg-black/50 backdrop-blur-sm p-4">
                          {isPlaying ? (
                            <Pause className="h-6 w-6 text-white" />
                          ) : (
                            <Play className="h-6 w-6 text-white" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-2/3 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {currentTrack.title}
                    </h3>
                    <p className="text-white/60 text-sm">{currentTrack.artist}</p>

                    {currentTrack.chakra && (
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: currentTrack && currentTrack.chakra ? getChakraColor(currentTrack.chakra) : "#9333ea",
                          }}
                        ></div>
                        <p className="text-white/60 text-xs">
                          {currentTrack.chakra} Chakra • {currentTrack.frequency} Hz
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Breathing pattern selection */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white text-sm">Breathing Pattern</h4>
                      <p className="text-white/60 text-xs">
                        {currentPattern.name}
                      </p>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {breathPatterns.map((pattern, index) => (
                        <button
                          key={pattern.id}
                          onClick={() => selectBreathPattern(index)}
                          className={cn(
                            "py-1 px-2 rounded text-xs",
                            currentPatternIndex === index
                              ? "bg-white/10 text-white"
                              : "bg-transparent text-white/60 hover:bg-white/5"
                          )}
                          title={pattern.description}
                        >
                          {pattern.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-white/40 text-xs italic">
                      {currentPattern.description}
                    </p>
                  </div>

                  {/* Session timer */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white text-sm">Session Timer</h4>
                        <div className="flex items-center gap-1 text-white/60 text-xs">
                          <Timer className="h-3 w-3" />
                          {isSessionActive
                            ? `${Math.floor(sessionTimeRemaining / 60)}:${(
                                sessionTimeRemaining % 60
                              )
                                .toString()
                                .padStart(2, "0")}`
                            : `${sessionDuration}:00`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-white/60 text-xs">
                          {isSessionActive ? "Active" : "Inactive"}
                        </p>
                        <Switch
                          checked={isSessionActive}
                          onCheckedChange={toggleSession}
                          disabled={!isBreathSyncActive}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[sessionDuration]}
                        min={1}
                        max={30}
                        step={1}
                        onValueChange={(value) => setSessionDuration(value[0])}
                        disabled={isSessionActive}
                        className="w-full"
                      />
                      <span className="text-white/60 text-xs w-10">
                        {sessionDuration} min
                      </span>
                    </div>
                    {isSessionActive && (
                      <p className="text-white/60 text-xs">
                        Breath cycles completed: {breathCount}
                      </p>
                    )}
                  </div>

                  {/* Audio progress */}
                  <div className="space-y-2">
                    <Slider
                      value={[progress]}
                      min={0}
                      max={100}
                      step={0.1}
                      onValueChange={onProgressChange}
                      className="w-full"
                    />
                    <div className="flex justify-between text-white/60 text-xs">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Audio controls */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className="text-white"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Slider
                        value={[volume]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={onVolumeChange}
                        className="w-24"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevTrack}
                        className="text-white"
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="icon"
                        onClick={togglePlay}
                        className="rounded-full bg-white/10 text-white hover:bg-white/20"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextTrack}
                        className="text-white"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-24 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                        <Info className="h-4 w-4 mr-2" />
                        Info
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom pattern settings (when Custom is selected) */}
            {currentPatternIndex === 4 && (
              <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/5">
                <h4 className="text-white text-sm mb-3">Custom Pattern Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-white/60 text-xs">Inhale (sec)</label>
                      <span className="text-white/60 text-xs">{customPattern.inhale}s</span>
                    </div>
                    <Slider
                      value={[customPattern.inhale]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("inhale", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-white/60 text-xs">Hold After Inhale (sec)</label>
                      <span className="text-white/60 text-xs">{customPattern.hold1}s</span>
                    </div>
                    <Slider
                      value={[customPattern.hold1]}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("hold1", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-white/60 text-xs">Exhale (sec)</label>
                      <span className="text-white/60 text-xs">{customPattern.exhale}s</span>
                    </div>
                    <Slider
                      value={[customPattern.exhale]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("exhale", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-white/60 text-xs">Hold After Exhale (sec)</label>
                      <span className="text-white/60 text-xs">{customPattern.hold2}s</span>
                    </div>
                    <Slider
                      value={[customPattern.hold2]}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("hold2", value[0])}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === "ceremony" && (
          <div className="space-y-6">
            {/* Audio player element (hidden but functional) */}
            {currentTrack && (
              <audio
                ref={audioRef}
                src={currentTrack.audioSrc}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={nextTrack}
                preload="metadata"
              />
            )}

            {/* Breath visualization */}
            <div className="aspect-video relative rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/50 to-purple-900/10 backdrop-blur-sm border border-white/5 flex items-center justify-center">
              <div
                className={cn(
                  "absolute inset-0 opacity-10 transition-opacity duration-500",
                  isBreathSyncActive ? "opacity-20" : "opacity-10"
                )}
                style={{
                  background: `radial-gradient(circle, ${currentPattern.color}40 0%, transparent 70%)`,
                }}
              ></div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="rounded-full bg-black/20 backdrop-blur-sm border border-white/10 transition-all duration-500 flex items-center justify-center"
                  style={{
                    width: isBreathSyncActive ? `${getCircleSize()}%` : "70%",
                    height: isBreathSyncActive ? `${getCircleSize()}%` : "70%",
                    boxShadow: isBreathSyncActive
                      ? `0 0 40px 0 ${currentPattern.color}30`
                      : "none",
                    borderColor: isBreathSyncActive
                      ? `${currentPattern.color}40`
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="text-center">
                    <h3 className="text-white text-xl md:text-3xl font-bold mb-2">
                      {isBreathSyncActive ? getBreathInstruction() : "Breath Ceremony"}
                    </h3>
                    <p className="text-white/60 text-sm md:text-base">
                      {isBreathSyncActive
                        ? `${currentPattern.name} Pattern`
                        : "Click 'Start Sync' to begin"}
                    </p>                  </div>
                </div>
              </div>

              {/* Session stats overlay */}
              {isSessionActive && (
                <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10 p-3">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-white/60" />
                      <p className="text-white font-medium">
                        {Math.floor(sessionTimeRemaining / 60)}:
                        {(sessionTimeRemaining % 60).toString().padStart(2, "0")}
                      </p>
                    </div>
                    <p className="text-white/60 text-xs mt-1">
                      Breath cycles: {breathCount}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pattern selection */}
            <div className="space-y-4">
              <h4 className="text-white text-sm mb-2">Breathing Patterns</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {breathPatterns.slice(0, 4).map((pattern, index) => (
                  <button
                    key={pattern.id}
                    onClick={() => selectBreathPattern(index)}
                    className={cn(
                      "p-3 rounded-lg border text-left",
                      currentPatternIndex === index
                        ? `bg-white/5 border-${pattern.color.replace("#", "")}40 text-white`
                        : "bg-black/20 border-white/5 text-white/70 hover:bg-white/5"
                    )}
                    style={{
                      borderColor:
                        currentPatternIndex === index
                          ? `${pattern.color}40`
                          : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="h-6 w-6 rounded-full flex-shrink-0 mt-1"
                        style={{
                          background: `linear-gradient(135deg, ${pattern.color} 0%, ${pattern.color}70 100%)`,
                        }}
                      ></div>
                      <div>
                        <h5 className="text-sm font-medium">{pattern.name}</h5>
                        <p className="text-white/50 text-xs mt-1">
                          {pattern.description}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-white/40 text-xs">
                          <span>In: {pattern.inhale}s</span>
                          <span>•</span>
                          <span>Hold: {pattern.hold1}s</span>
                          <span>•</span>
                          <span>Out: {pattern.exhale}s</span>
                          {pattern.hold2 > 0 && (
                            <>
                              <span>•</span>
                              <span>Hold: {pattern.hold2}s</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {/* Custom Pattern Button */}
                <button
                  onClick={() => selectBreathPattern(4)}
                  className={cn(
                    "p-3 rounded-lg border text-left",
                    currentPatternIndex === 4
                      ? "bg-white/5 border-purple-500/40 text-white"
                      : "bg-black/20 border-white/5 text-white/70 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full flex-shrink-0 mt-1 bg-gradient-to-br from-purple-400 to-purple-600"></div>
                    <div>
                      <h5 className="text-sm font-medium">Custom Pattern</h5>
                      <p className="text-white/50 text-xs mt-1">
                        Create your own breathing pattern
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom pattern settings (when Custom is selected) */}
            {currentPatternIndex === 4 && (
              <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                <h4 className="text-white text-sm mb-3">Custom Pattern Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-white/60 text-xs">Inhale (sec)</label>
                      <span className="text-white/60 text-xs">{customPattern.inhale}s</span>
                    </div>
                    <Slider
                      value={[customPattern.inhale]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("inhale", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-white/60 text-xs">Hold After Inhale (sec)</label>
                      <span className="text-white/60 text-xs">{customPattern.hold1}s</span>
                    </div>
                    <Slider
                      value={[customPattern.hold1]}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("hold1", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-white/60 text-xs">Exhale (sec)</label>
                      <span className="text-white/60 text-xs">{customPattern.exhale}s</span>
                    </div>
                    <Slider
                      value={[customPattern.exhale]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("exhale", value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-white/60 text-xs">Hold After Exhale (sec)</label>
                      <span className="text-white/60 text-xs">{customPattern.hold2}s</span>
                    </div>
                    <Slider
                      value={[customPattern.hold2]}
                      min={0}
                      max={10}
                      step={1}
                      onValueChange={(value) => updateCustomPattern("hold2", value[0])}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Session Controls */}
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-white text-sm">Session Timer</h4>
                  <Timer className="h-4 w-4 text-white/60" />
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[sessionDuration]}
                    min={1}
                    max={30}
                    step={1}
                    onValueChange={(value) => setSessionDuration(value[0])}
                    disabled={isSessionActive}
                    className="w-40"
                  />
                  <span className="text-white/60 text-xs w-16">
                    {sessionDuration} minutes
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Button
                  variant={isSessionActive ? "destructive" : "default"}
                  size="sm"
                  onClick={toggleSession}
                  disabled={!isBreathSyncActive}
                  className={cn(
                    !isBreathSyncActive && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSessionActive ? "End Session" : "Start Session"}
                </Button>
                <p className="text-white/40 text-xs mt-1">
                  {isBreathSyncActive
                    ? "Start a timed session"
                    : "Enable breath sync first"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Aeroaura;