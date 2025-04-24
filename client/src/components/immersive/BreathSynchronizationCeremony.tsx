"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer, Leaf, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function BreathSynchronizationCeremony() {
  // Breath sync state
  const [isBreathSyncActive, setIsBreathSyncActive] = useState(false);
  const [currentBreathPhase, setCurrentBreathPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale");
  const [breathProgress, setBreathProgress] = useState(0);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [customPattern, setCustomPattern] = useState<BreathPattern>({
    id: 0,
    name: "Custom",
    description: "Your custom breathing pattern",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 0,
    color: "#00e6e6",
  });
  
  // Session state
  const [sessionDuration, setSessionDuration] = useState(5); // minutes
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(5 * 60); // seconds
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [breathCount, setBreathCount] = useState(0);

  // Refs
  const breathIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      color: "#00e6e6",
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
          if (sessionIntervalRef.current) {
            clearInterval(sessionIntervalRef.current);
          }
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
    <div className="bg-black/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Leaf className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Breath Synchronization</h2>
            <p className="text-xs text-white/60">
              {isBreathSyncActive
                ? `${currentPattern.name} • ${getBreathInstruction()}`
                : "Align your breath with cosmic rhythms"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isBreathSyncActive ? "default" : "outline"}
            size="sm"
            onClick={toggleBreathSync}
            className={cn(
              isBreathSyncActive
                ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                : "border-white/10 text-white hover:bg-white/5",
            )}
          >
            {isBreathSyncActive ? "Breathing Active" : "Start Breathing"}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        <div className="p-6 border-r border-white/10">
          <div className="space-y-6">
            {/* Breath Visualization */}
            <div
              className="relative aspect-square rounded-lg overflow-hidden bg-black/40 flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${currentPattern.color}40 0%, rgba(0,0,0,0.8) 70%)`,
              }}
            >
              {/* Breathing circle */}
              <div
                className="rounded-full flex items-center justify-center transition-all duration-100"
                style={{
                  width: `${getCircleSize()}%`,
                  height: `${getCircleSize()}%`,
                  backgroundColor: `${currentPattern.color}20`,
                  boxShadow: `0 0 30px ${currentPattern.color}40`,
                  border: `2px solid ${currentPattern.color}80`,
                }}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{getBreathInstruction()}</div>
                  {currentBreathPhase !== "inhale" && currentBreathPhase !== "exhale" && (
                    <div className="text-sm text-white/60">
                      {getCurrentPhaseSeconds() - Math.floor((breathProgress / 100) * getCurrentPhaseSeconds())}s
                    </div>
                  )}
                </div>
              </div>

              {/* Breath phase indicator */}
              <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                {currentBreathPhase === "inhale"
                  ? "Breathe in..."
                  : currentBreathPhase === "exhale"
                  ? "Breathe out..."
                  : currentBreathPhase === "hold1"
                  ? "Hold breath..."
                  : "Hold breath..."}
              </div>

              {/* Timer and count if active */}
              {isSessionActive && (
                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center">
                  <Timer className="h-3 w-3 mr-1" />
                  {formatTime(sessionTimeRemaining)} | {breathCount} cycles
                </div>
              )}
            </div>

            {/* Pattern Info */}
            <div className="rounded-lg bg-black/40 p-4">
              <h3 className="text-lg font-medium text-white mb-2">{currentPattern.name}</h3>
              <p className="text-sm text-white/80 mb-3">{currentPattern.description}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-white/60 text-xs">Inhale</div>
                  <div className="text-white font-medium">{currentPattern.inhale}s</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs">Hold</div>
                  <div className="text-white font-medium">{currentPattern.hold1}s</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs">Exhale</div>
                  <div className="text-white font-medium">{currentPattern.exhale}s</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs">Hold</div>
                  <div className="text-white font-medium">{currentPattern.hold2}s</div>
                </div>
              </div>
            </div>

            {/* Session Controls */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Session Duration: {sessionDuration} min</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => sessionDuration > 1 && setSessionDuration(sessionDuration - 1)}
                    className="h-7 w-7 rounded-full"
                    disabled={sessionDuration <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSessionDuration(sessionDuration + 1)}
                    className="h-7 w-7 rounded-full"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Button
                variant={isSessionActive ? "default" : "outline"}
                size="sm"
                onClick={toggleSession}
                disabled={!isBreathSyncActive}
                className={cn(
                  isSessionActive
                    ? "bg-cyan-600 hover:bg-cyan-700"
                    : "border-white/10 text-white hover:bg-white/5"
                )}
              >
                <Timer className="mr-2 h-4 w-4" />
                {isSessionActive ? `Session Active: ${formatTime(sessionTimeRemaining)}` : "Start Timed Session"}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="patterns" className="space-y-4">
            <TabsList className="grid grid-cols-2 bg-black/40">
              <TabsTrigger value="patterns">Breathing Patterns</TabsTrigger>
              <TabsTrigger value="custom">Custom Pattern</TabsTrigger>
            </TabsList>

            <TabsContent value="patterns" className="space-y-4">
              <div className="grid gap-3">
                {breathPatterns.slice(0, 4).map((pattern, index) => (
                  <div
                    key={pattern.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors",
                      currentPatternIndex === index && "bg-cyan-950/30 border border-cyan-500/20"
                    )}
                    onClick={() => selectBreathPattern(index)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pattern.color }} />
                      <h4 className="font-medium text-white">{pattern.name}</h4>
                      <div className="ml-auto text-xs text-white/60">
                        {pattern.inhale}-{pattern.hold1}-{pattern.exhale}-{pattern.hold2}
                      </div>
                    </div>
                    <p className="text-xs text-white/60 mt-1 ml-5">{pattern.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-white">Inhale: {customPattern.inhale}s</label>
                  </div>
                  <Slider
                    value={[customPattern.inhale]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => updateCustomPattern("inhale", value[0])}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-white">Hold after inhale: {customPattern.hold1}s</label>
                  </div>
                  <Slider
                    value={[customPattern.hold1]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => updateCustomPattern("hold1", value[0])}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-white">Exhale: {customPattern.exhale}s</label>
                  </div>
                  <Slider
                    value={[customPattern.exhale]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => updateCustomPattern("exhale", value[0])}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-white">Hold after exhale: {customPattern.hold2}s</label>
                  </div>
                  <Slider
                    value={[customPattern.hold2]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={(value) => updateCustomPattern("hold2", value[0])}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectBreathPattern(4)}
                  className={cn(
                    "w-full mt-2",
                    currentPatternIndex === 4 && "bg-cyan-950/30 border border-cyan-500/20"
                  )}
                >
                  Apply Custom Pattern
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4 p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
            <p className="text-sm text-white/80">
              <span className="text-cyan-400 font-semibold">Benefits:</span> Regular breathwork practice can reduce stress, improve focus, increase energy, and enhance overall well-being. Different patterns provide unique benefits to your nervous system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}