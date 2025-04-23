/**
 * Binaural Beat Generator Component (Optimized)
 * 
 * This is an optimized version of the binaural beat generator that implements:
 * 1. Performance tracking with useRenderCount and measureExecutionTime
 * 2. Render optimization with useSkipRenderIfInvisible
 * 3. Proper memory management with useEffect cleanup
 * 4. Memoization of expensive calculations and event handlers
 * 5. Reduced re-renders through proper state management
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  useRenderCount,
  measureExecutionTime,
  debounce,
  useSkipRenderIfInvisible,
  useInView,
  PerformanceProfiler
} from '../../../lib/performance';
import { useMemoryTracker } from '../../../lib/memory-leak-detector';

// Define types for oscillator wave forms
type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

// Define state interface for the timer
interface TimerState {
  duration: number;
  remaining: number;
  active: boolean;
}

interface BinauralBeatState {
  frequencies: {
    left: number;
    right: number;
  };
  audioSettings: {
    volume: number;
    isMuted: boolean;
    waveType: OscillatorType;
  };
  timer: TimerState;
  audioInitialized: boolean;
}

// Main component
const BinauralBeatGenerator: React.FC = () => {
  // Track component render count
  const renderCount = useRenderCount('BinauralBeatGenerator');
  
  // Track memory for leaks
  useMemoryTracker('BinauralBeatGenerator');
  
  // Check if component is in viewport to optimize rendering
  const [inViewRef, isInView] = useInView({ threshold: 0.1 });
  
  // Ref for container to skip renders when not visible
  const containerRef = useSkipRenderIfInvisible(isInView);
  
  // Audio context and oscillators (kept in refs to reduce re-renders)
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillator = useRef<OscillatorNode | null>(null);
  const rightOscillator = useRef<OscillatorNode | null>(null);
  const leftGain = useRef<GainNode | null>(null);
  const rightGain = useRef<GainNode | null>(null);
  
  // Consolidated state to reduce re-renders
  const [state, setState] = useState<BinauralBeatState>({
    frequencies: {
      left: 200,
      right: 205, // 5 Hz difference = theta wave (relaxation)
    },
    audioSettings: {
      volume: 0.5,
      isMuted: false,
      waveType: 'sine' as OscillatorType,
    },
    timer: {
      duration: 300, // 5 minutes in seconds
      remaining: 300,
      active: false,
    },
    audioInitialized: false
  });
  
  // Timer interval reference
  const timerInterval = useRef<number | null>(null);
  
  // Canvas refs for visualization
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  // Only run visualization when component is visible
  const isRunningAnimation = useRef(false);
  
  // Initialize audio - wrapped with performance measurement
  const initializeAudio = useCallback(measureExecutionTime(
    () => {
      if (state.audioInitialized) return;
      
      try {
        // Create audio context
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
        
        // Create oscillators and gain nodes
        const leftOsc = context.createOscillator();
        const rightOsc = context.createOscillator();
        const leftG = context.createGain();
        const rightG = context.createGain();
        
        // Set frequencies and connect nodes
        leftOsc.frequency.value = state.frequencies.left;
        rightOsc.frequency.value = state.frequencies.right;
        
        // Connect nodes
        leftOsc.connect(leftG);
        rightOsc.connect(rightG);
        
        // Set waveform
        leftOsc.type = state.audioSettings.waveType;
        rightOsc.type = state.audioSettings.waveType;
        
        // Set volume
        leftG.gain.value = state.audioSettings.isMuted ? 0 : state.audioSettings.volume;
        rightG.gain.value = state.audioSettings.isMuted ? 0 : state.audioSettings.volume;
        
        // Connect to left and right speakers
        const merger = context.createChannelMerger(2);
        leftG.connect(merger, 0, 0);
        rightG.connect(merger, 0, 1);
        merger.connect(context.destination);
        
        // Store references
        leftOscillator.current = leftOsc;
        rightOscillator.current = rightOsc;
        leftGain.current = leftG;
        rightGain.current = rightG;
        
        // Start oscillators
        leftOsc.start();
        rightOsc.start();
        
        setState(prev => ({
          ...prev,
          audioInitialized: true
        }));
      } catch (error: unknown) {
        console.error('Failed to initialize audio:', error);
      }
    },
    'initializeAudio',
    20 // Log if it takes more than 20ms
  ), [state.audioInitialized, state.frequencies, state.audioSettings]);
  
  // Clean up audio - wrapped with performance measurement
  const cleanupAudio = useCallback(measureExecutionTime(
    () => {
      if (!state.audioInitialized) return;
      
      try {
        // Stop animation frame if running
        if (animationFrameId.current !== null) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
        
        // Clean up oscillators
        if (leftOscillator.current) {
          leftOscillator.current.stop();
          leftOscillator.current.disconnect();
          leftOscillator.current = null;
        }
        
        if (rightOscillator.current) {
          rightOscillator.current.stop();
          rightOscillator.current.disconnect();
          rightOscillator.current = null;
        }
        
        // Clean up gain nodes
        if (leftGain.current) {
          leftGain.current.disconnect();
          leftGain.current = null;
        }
        
        if (rightGain.current) {
          rightGain.current.disconnect();
          rightGain.current = null;
        }
        
        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        setState(prev => ({
          ...prev,
          audioInitialized: false
        }));
      } catch (error: unknown) {
        console.error('Error cleaning up audio:', error);
      }
    },
    'cleanupAudio',
    10
  ), [state.audioInitialized]);
  
  // Update left frequency - debounced to reduce audio updates
  const updateLeftFrequency = useCallback(debounce(
    (newFreq: number) => {
      if (!state.audioInitialized || !leftOscillator.current) return;
      
      if (newFreq >= 20 && newFreq <= 500) {
        setState(prev => ({
          ...prev,
          frequencies: {
            ...prev.frequencies,
            left: newFreq
          }
        }));
        
        leftOscillator.current.frequency.value = newFreq;
      }
    },
    100 // 100ms debounce
  ), [state.audioInitialized]);
  
  // Update right frequency - debounced to reduce audio updates
  const updateRightFrequency = useCallback(debounce(
    (newFreq: number) => {
      if (!state.audioInitialized || !rightOscillator.current) return;
      
      if (newFreq >= 20 && newFreq <= 500) {
        setState(prev => ({
          ...prev,
          frequencies: {
            ...prev.frequencies,
            right: newFreq
          }
        }));
        
        rightOscillator.current.frequency.value = newFreq;
      }
    },
    100 // 100ms debounce
  ), [state.audioInitialized]);
  
  // Update volume - debounced to reduce audio updates
  const updateVolume = useCallback(debounce(
    (newVolume: number) => {
      if (!state.audioInitialized || !leftGain.current || !rightGain.current) return;
      
      if (newVolume >= 0 && newVolume <= 1) {
        setState(prev => ({
          ...prev,
          audioSettings: {
            ...prev.audioSettings,
            volume: newVolume
          }
        }));
        
        if (!state.audioSettings.isMuted) {
          leftGain.current.gain.value = newVolume;
          rightGain.current.gain.value = newVolume;
        }
      }
    },
    100 // 100ms debounce
  ), [state.audioInitialized, state.audioSettings.isMuted]);
  
  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!state.audioInitialized || !leftGain.current || !rightGain.current) return;
    
    const newMuted = !state.audioSettings.isMuted;
    
    setState(prev => ({
      ...prev,
      audioSettings: {
        ...prev.audioSettings,
        isMuted: newMuted
      }
    }));
    
    const volume = newMuted ? 0 : state.audioSettings.volume;
    leftGain.current.gain.value = volume;
    rightGain.current.gain.value = volume;
  }, [state.audioInitialized, state.audioSettings]);
  
  // Change wave type
  const changeWaveType = useCallback((waveType: OscillatorType) => {
    if (!state.audioInitialized || !leftOscillator.current || !rightOscillator.current) return;
    
    setState(prev => ({
      ...prev,
      audioSettings: {
        ...prev.audioSettings,
        waveType
      }
    }));
    
    leftOscillator.current.type = waveType;
    rightOscillator.current.type = waveType;
  }, [state.audioInitialized]);
  
  // Update timer duration
  const updateTimerDuration = useCallback((duration: number) => {
    if (duration >= 0) {
      setState(prev => ({
        ...prev,
        timer: {
          ...prev.timer,
          duration,
          remaining: prev.timer.active ? prev.timer.remaining : duration
        }
      }));
    }
  }, []);
  
  // Start/stop timer
  const toggleTimer = useCallback(() => {
    if (state.timer.active) {
      // Stop timer
      if (timerInterval.current !== null) {
        window.clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      setState(prev => ({
        ...prev,
        timer: {
          ...prev.timer,
          active: false
        }
      }));
    } else {
      // Start timer
      const startTime = Date.now();
      const initialRemaining = state.timer.remaining > 0 ? state.timer.remaining : state.timer.duration;
      
      setState(prev => ({
        ...prev,
        timer: {
          ...prev.timer,
          active: true,
          remaining: initialRemaining
        }
      }));
      
      timerInterval.current = window.setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const newRemaining = initialRemaining - elapsedSeconds;
        
        if (newRemaining <= 0) {
          // Timer completed
          if (timerInterval.current !== null) {
            window.clearInterval(timerInterval.current);
            timerInterval.current = null;
          }
          
          setState(prev => ({
            ...prev,
            timer: {
              ...prev.timer,
              active: false,
              remaining: 0
            }
          }));
          
          cleanupAudio();
        } else {
          setState(prev => ({
            ...prev,
            timer: {
              ...prev.timer,
              remaining: newRemaining
            }
          }));
        }
      }, 1000);
    }
  }, [state.timer, cleanupAudio]);
  
  // Reset timer
  const resetTimer = useCallback(() => {
    if (timerInterval.current !== null) {
      window.clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    
    setState(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        active: false,
        remaining: prev.timer.duration
      }
    }));
  }, []);
  
  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Draw waveform visualization - optimized and measured
  const drawWaveform = useCallback(measureExecutionTime(
    () => {
      // Skip if component not visible
      if (!isInView || !isRunningAnimation.current) {
        return;
      }
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Canvas dimensions
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Calculate difference frequency
      const beatFrequency = Math.abs(state.frequencies.right - state.frequencies.left);
      
      // Draw waveforms
      const drawWave = (frequency: number, color: string, yOffset: number) => {
        const wavelength = width / (frequency / 10);
        const amplitude = height / 8;
        
        ctx.beginPath();
        ctx.moveTo(0, yOffset);
        
        // Optimization: Draw fewer points for better performance
        const step = Math.max(1, Math.floor(width / 200)); // Max 200 points
        
        for (let x = 0; x < width; x += step) {
          let y = 0;
          
          // Generate waveform based on selected type
          switch (state.audioSettings.waveType) {
            case 'sine':
              y = amplitude * Math.sin((x / wavelength) * Math.PI * 2);
              break;
            case 'square':
              y = amplitude * (Math.sin((x / wavelength) * Math.PI * 2) >= 0 ? 1 : -1);
              break;
            case 'sawtooth':
              y = amplitude * ((x % wavelength) / wavelength * 2 - 1);
              break;
            case 'triangle':
              const phase = (x % wavelength) / wavelength;
              y = amplitude * (phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase);
              break;
          }
          
          ctx.lineTo(x, yOffset + y);
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      
      // Draw the three waveforms (left, right, and beat)
      drawWave(state.frequencies.left, 'rgba(0, 128, 255, 0.8)', height / 4);
      drawWave(state.frequencies.right, 'rgba(255, 128, 0, 0.8)', height / 2);
      drawWave(beatFrequency, 'rgba(128, 0, 255, 0.8)', (height * 3) / 4);
      
      // Add labels - only if canvas is large enough
      if (width > 150) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#333';
        ctx.fillText(`Left: ${state.frequencies.left} Hz`, 10, 15);
        ctx.fillText(`Right: ${state.frequencies.right} Hz`, 10, height / 2 - 10);
        ctx.fillText(`Beat: ${beatFrequency.toFixed(1)} Hz`, 10, height - 10);
      }
      
      // Request next frame only if still running
      if (isRunningAnimation.current) {
        animationFrameId.current = requestAnimationFrame(drawWaveform);
      }
    },
    'drawWaveform',
    8 // Log if frame takes more than 8ms (targeting 120fps)
  ), [isInView, state.frequencies, state.audioSettings.waveType]);
  
  // Control visualization based on visibility
  useEffect(() => {
    if (isInView && canvasRef.current) {
      // Only start animation if not already running
      if (!isRunningAnimation.current) {
        isRunningAnimation.current = true;
        animationFrameId.current = requestAnimationFrame(drawWaveform);
      }
      
      // Initialize audio when in view
      if (!state.audioInitialized) {
        initializeAudio();
      }
      
      // Resize canvas to match container
      const resizeCanvas = () => {
        if (canvasRef.current) {
          const container = canvasRef.current.parentElement;
          if (container) {
            canvasRef.current.width = container.clientWidth;
            canvasRef.current.height = 200;
          }
        }
      };
      
      // Initial resize
      resizeCanvas();
      
      // Listen for window resize
      window.addEventListener('resize', resizeCanvas);
      
      // Clean up
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    } else {
      // Pause animation when not in view to save resources
      isRunningAnimation.current = false;
      
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      // Optionally pause audio when not in view
      // Uncomment the following to pause audio when out of view
      // if (state.audioInitialized && !state.audioSettings.isMuted) {
      //   toggleMute();
      // }
    }
  }, [isInView, drawWaveform, state.audioInitialized, initializeAudio]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningAnimation.current = false;
      
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      if (timerInterval.current !== null) {
        window.clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      cleanupAudio();
    };
  }, [cleanupAudio]);
  
  // Event handlers for UI elements
  const handleLeftFrequencyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateLeftFrequency(parseInt(e.target.value));
  }, [updateLeftFrequency]);
  
  const handleRightFrequencyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateRightFrequency(parseInt(e.target.value));
  }, [updateRightFrequency]);
  
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateVolume(parseFloat(e.target.value));
  }, [updateVolume]);
  
  const handleSchumannPreset = useCallback(() => {
    const beatFreq = 7.83; // Schumann resonance
    updateRightFrequency(state.frequencies.left + beatFreq);
  }, [state.frequencies.left, updateRightFrequency]);
  
  const handleThetaPreset = useCallback(() => {
    const beatFreq = 4; // Theta
    updateRightFrequency(state.frequencies.left + beatFreq);
  }, [state.frequencies.left, updateRightFrequency]);
  
  // Render with performance tracking
  return (
    <PerformanceProfiler id="BinauralBeatGenerator">
      <div 
        className="binaural-beat-generator p-4 border rounded-lg bg-gray-50"
        ref={(el) => {
          // Combine refs
          if (el) {
            (containerRef as React.MutableRefObject<HTMLDivElement>).current = el;
            (inViewRef as React.MutableRefObject<HTMLDivElement>).current = el;
          }
        }}
      >
        <h2 className="text-2xl font-bold mb-4">
          Binaural Beat Generator (Optimized)
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs ml-2 text-gray-500">
              Renders: {renderCount}
            </span>
          )}
        </h2>
        
        {/* Visualization */}
        <div className="visualization-container mb-4 bg-white border rounded">
          <canvas ref={canvasRef} className="w-full h-40"></canvas>
        </div>
        
        {/* Controls Section */}
        <div className="controls grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Frequency Controls */}
          <div className="frequency-controls p-3 border rounded bg-white">
            <h3 className="text-lg font-semibold mb-2">Frequency Controls</h3>
            
            <div className="mb-3">
              <label className="block mb-1">Left Ear: {state.frequencies.left} Hz</label>
              <input
                type="range"
                min="20"
                max="500"
                value={state.frequencies.left}
                onChange={handleLeftFrequencyChange}
                className="w-full"
              />
            </div>
            
            <div className="mb-3">
              <label className="block mb-1">Right Ear: {state.frequencies.right} Hz</label>
              <input
                type="range"
                min="20"
                max="500"
                value={state.frequencies.right}
                onChange={handleRightFrequencyChange}
                className="w-full"
              />
            </div>
            
            <div className="mb-3">
              <label className="block mb-1">
                Beat Frequency: {Math.abs(state.frequencies.right - state.frequencies.left).toFixed(1)} Hz
              </label>
              <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                <button
                  className="bg-blue-500 text-white py-1 px-2 rounded"
                  onClick={handleSchumannPreset}
                >
                  Schumann (7.83 Hz)
                </button>
                <button
                  className="bg-blue-500 text-white py-1 px-2 rounded"
                  onClick={handleThetaPreset}
                >
                  Theta (4 Hz)
                </button>
              </div>
            </div>
          </div>
          
          {/* Audio Controls */}
          <div className="audio-controls p-3 border rounded bg-white">
            <h3 className="text-lg font-semibold mb-2">Audio Controls</h3>
            
            <div className="mb-3">
              <label className="block mb-1">Volume: {Math.round(state.audioSettings.volume * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.audioSettings.volume}
                onChange={handleVolumeChange}
                className="w-full"
              />
            </div>
            
            <div className="mb-3">
              <label className="block mb-1">Waveform:</label>
              <div className="grid grid-cols-4 gap-2">
                {['sine', 'square', 'sawtooth', 'triangle'].map((type) => (
                  <button
                    key={type}
                    className={`py-1 rounded ${
                      state.audioSettings.waveType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                    onClick={() => changeWaveType(type as OscillatorType)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block mb-1">Timer: {formatTime(state.timer.remaining)}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className={`py-1 rounded ${
                    state.timer.active ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  }`}
                  onClick={toggleTimer}
                >
                  {state.timer.active ? 'Stop' : 'Start'}
                </button>
                <button
                  className="bg-gray-200 text-gray-800 py-1 rounded"
                  onClick={resetTimer}
                >
                  Reset
                </button>
                <button
                  className="bg-gray-200 text-gray-800 py-1 rounded"
                  onClick={toggleMute}
                >
                  {state.audioSettings.isMuted ? 'Unmute' : 'Mute'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls for session duration */}
        <div className="duration-controls p-3 border rounded bg-white mt-4">
          <h3 className="text-lg font-semibold mb-2">Session Duration</h3>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 30].map((mins) => (
              <button
                key={mins}
                className={`py-1 rounded ${
                  state.timer.duration === mins * 60
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
                onClick={() => updateTimerDuration(mins * 60)}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="action-buttons mt-4 grid grid-cols-2 gap-2">
          <button
            className="bg-blue-600 text-white py-2 rounded"
            onClick={initializeAudio}
            disabled={state.audioInitialized}
          >
            {state.audioInitialized ? 'Audio Running' : 'Initialize Audio'}
          </button>
          <button
            className="bg-red-600 text-white py-2 rounded"
            onClick={cleanupAudio}
            disabled={!state.audioInitialized}
          >
            Stop & Cleanup
          </button>
        </div>
      </div>
    </PerformanceProfiler>
  );
};

// Memoize the component to prevent unnecessary renders from parent components
export default memo(BinauralBeatGenerator);

// Named export for flexibility
export { BinauralBeatGenerator };