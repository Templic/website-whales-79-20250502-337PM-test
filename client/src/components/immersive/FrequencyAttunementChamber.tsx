/**
 * FrequencyAttunementChamber Component
 * Interactive frequency visualization and attunement experience
 * Handles real-time audio processing and visual feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

interface FrequencyState {
  current: number;
  target: number;
  phase: 'rest' | 'attune' | 'integrate';
}

export const FrequencyAttunementChamber: React.FC = () => {
  // State management for frequency attunement
  const [frequency, setFrequency] = useState<FrequencyState>({
    current: 432,
    target: 432,
    phase: 'rest'
  });

  // Audio context and analyzer setup
  const audioContext = useRef<AudioContext | null>(null);
  const analyzer = useRef<AnalyserNode | null>(null);
  const { toast } = useToast();

  // Initialize audio context and setup analyzer
  useEffect(() => {
    audioContext.current = new AudioContext();
    analyzer.current = audioContext.current.createAnalyser();

    return () => {
      audioContext.current?.close();
    };
  }, []);

  // Handle frequency changes and transitions
  const handleFrequencyChange = (newFreq: number) => {
    setFrequency(prev => ({
      ...prev,
      target: newFreq,
      phase: 'attune'
    }));
  };

  // Update visualization on frequency changes
  useEffect(() => {
    if (frequency.phase === 'attune') {
      // Animation frame loop for smooth transitions
      let animationFrame: number;

      const updateFrequency = () => {
        setFrequency(prev => {
          const diff = prev.target - prev.current;
          if (Math.abs(diff) < 0.1) {
            return { ...prev, current: prev.target, phase: 'integrate' };
          }
          return { ...prev, current: prev.current + diff * 0.1 };
        });

        animationFrame = requestAnimationFrame(updateFrequency);
      };

      animationFrame = requestAnimationFrame(updateFrequency);

      return () => cancelAnimationFrame(animationFrame);
    }
  }, [frequency.phase]);

  return (
    <div className="relative p-8 rounded-lg bg-black/20 backdrop-blur">
      {/* Frequency display and controls */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-semibold mb-4">
          Current Frequency: {frequency.current.toFixed(1)} Hz
        </h3>
        <div className="flex gap-4 justify-center">
          <button onClick={() => handleFrequencyChange(432)}>432 Hz</button>
          <button onClick={() => handleFrequencyChange(528)}>528 Hz</button>
          <button onClick={() => handleFrequencyChange(639)}>639 Hz</button>
        </div>
      </div>

      {/* Frequency visualization canvas */}
      <div className="w-full h-64 bg-black/40 rounded-lg mb-8">
        {/* Canvas rendering handled by useEffect */}
      </div>

      {/* Phase indicator and guidance */}
      <div className="text-center">
        <p className="text-lg mb-2">Current Phase: {frequency.phase}</p>
        <p className="text-muted-foreground">
          {frequency.phase === 'rest' && 'Select a frequency to begin'}
          {frequency.phase === 'attune' && 'Attuning to new frequency...'}
          {frequency.phase === 'integrate' && 'Integrating frequency...'}
        </p>
      </div>
    </div>
  );
};