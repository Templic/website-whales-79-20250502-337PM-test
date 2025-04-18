/**
 * Binaural Beat Generator Component (Optimized)
 * 
 * Optimized version of the binaural beat generator with:
 * - Memoized components and callbacks
 * - Reduced rerenders
 * - Better performance
 * - Improved null checks and error handling
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';

// Define types for oscillator wave forms
type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

// Define state interface for the timer
interface TimerState {
  duration: number;
  remaining: number;
  active: boolean;
}

// Memoized frequency control component
const FrequencyControl = memo(({
  label,
  value,
  onChange,
  min = 20,
  max = 500,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) => {
  // Use callback to avoid recreation on each render
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  }, [onChange]);
  
  return (
    <div className="mb-3">
      <label className="block mb-1">{label}: {value} Hz</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className="w-full"
      />
    </div>
  );
});

// Memoized wave type selector component
const WaveTypeSelector = memo(({
  currentType,
  onChange,
}: {
  currentType: OscillatorType;
  onChange: (type: OscillatorType) => void;
}) => {
  const waveTypes: OscillatorType[] = useMemo(() => 
    ['sine', 'square', 'sawtooth', 'triangle'], 
  []);
  
  return (
    <div className="grid grid-cols-4 gap-2">
      {waveTypes.map((type) => (
        <button
          key={type}
          className={`py-1 rounded ${
            currentType === type
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
          onClick={() => onChange(type)}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      ))}
    </div>
  );
});

// Memoized timer control component
const TimerControl = memo(({
  duration,
  remaining,
  active,
  onToggle,
  onReset,
  onDurationChange,
}: {
  duration: number;
  remaining: number;
  active: boolean;
  onToggle: () => void;
  onReset: () => void;
  onDurationChange: (duration: number) => void;
}) => {
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  const handleDurationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onDurationChange(parseInt(e.target.value, 10));
  }, [onDurationChange]);
  
  return (
    <div className="mb-3">
      <label className="block mb-1">Timer: {formatTime(remaining)}</label>
      <div className="grid grid-cols-3 gap-2">
        <button
          className={`py-1 rounded ${
            active ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}
          onClick={onToggle}
        >
          {active ? 'Stop' : 'Start'}
        </button>
        <button
          className="bg-gray-200 text-gray-800 py-1 rounded"
          onClick={onReset}
        >
          Reset
        </button>
        <select
          className="border rounded py-1 px-2"
          value={duration}
          onChange={handleDurationChange}
        >
          <option value="300">5 minutes</option>
          <option value="600">10 minutes</option>
          <option value="1200">20 minutes</option>
          <option value="1800">30 minutes</option>
        </select>
      </div>
    </div>
  );
});

// Memoized waveform visualization component
const WaveformVisualization = memo(({
  frequencies,
  waveType,
}: {
  frequencies: { left: number; right: number };
  waveType: OscillatorType;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  // Use memoized drawWaveform function to prevent unnecessary recreations
  const drawWaveform = useCallback(() => {
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
    const beatFrequency = Math.abs(frequencies.right - frequencies.left);
    
    // Draw waveforms
    const drawWave = (frequency: number, color: string, yOffset: number) => {
      const wavelength = width / (frequency / 10);
      const amplitude = height / 8;
      
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      
      for (let x = 0; x < width; x++) {
        let y = 0;
        
        // Generate waveform based on selected type
        switch (waveType) {
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
    drawWave(frequencies.left, 'rgba(0, 128, 255, 0.8)', height / 4);
    drawWave(frequencies.right, 'rgba(255, 128, 0, 0.8)', height / 2);
    drawWave(beatFrequency, 'rgba(128, 0, 255, 0.8)', (height * 3) / 4);
    
    // Add labels
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(`Left: ${frequencies.left} Hz`, 10, 15);
    ctx.fillText(`Right: ${frequencies.right} Hz`, 10, height / 2 - 10);
    ctx.fillText(`Beat: ${beatFrequency.toFixed(1)} Hz`, 10, height - 10);
    
    // Request next frame
    animationFrameId.current = requestAnimationFrame(drawWaveform);
  }, [frequencies, waveType]);
  
  // Initialize visualization
  useEffect(() => {
    if (canvasRef.current) {
      // Start animation
      animationFrameId.current = requestAnimationFrame(drawWaveform);
      
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
        
        if (animationFrameId.current !== null) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
      };
    }
    
    return undefined;
  }, [drawWaveform]);
  
  return (
    <div className="visualization-container mb-4 bg-white border rounded">
      <canvas ref={canvasRef} className="w-full h-40"></canvas>
    </div>
  );
});

// Main component (optimized)
const BinauralBeatGenerator: React.FC = () => {
  // Audio context and oscillators
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const leftOscillator = useRef<OscillatorNode | null>(null);
  const rightOscillator = useRef<OscillatorNode | null>(null);
  const leftGain = useRef<GainNode | null>(null);
  const rightGain = useRef<GainNode | null>(null);
  
  // Frequencies for each ear
  const [frequencies, setFrequencies] = useState({
    left: 200,
    right: 205, // 5 Hz difference = theta wave (relaxation)
  });
  
  // Audio settings
  const [audioSettings, setAudioSettings] = useState({
    volume: 0.5,
    isMuted: false,
    waveType: 'sine' as OscillatorType,
  });
  
  // Timer state
  const [timer, setTimer] = useState<TimerState>({
    duration: 300, // 5 minutes in seconds
    remaining: 300,
    active: false,
  });
  
  // Timer interval reference
  const timerInterval = useRef<number | null>(null);
  
  // Initialize audio (optimized with useCallback)
  const initializeAudio = useCallback(() => {
    if (audioInitialized) return;
    
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);
      
      // Create oscillators and gain nodes
      const leftOsc = context.createOscillator();
      const rightOsc = context.createOscillator();
      const leftG = context.createGain();
      const rightG = context.createGain();
      
      // Set frequencies and connect nodes
      leftOsc.frequency.value = frequencies.left;
      rightOsc.frequency.value = frequencies.right;
      
      // Connect nodes
      leftOsc.connect(leftG);
      rightOsc.connect(rightG);
      
      // Set waveform
      leftOsc.type = audioSettings.waveType;
      rightOsc.type = audioSettings.waveType;
      
      // Set volume
      leftG.gain.value = audioSettings.isMuted ? 0 : audioSettings.volume;
      rightG.gain.value = audioSettings.isMuted ? 0 : audioSettings.volume;
      
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
      
      setAudioInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }, [audioInitialized, frequencies.left, frequencies.right, audioSettings.waveType, audioSettings.volume, audioSettings.isMuted]);
  
  // Clean up audio (optimized with useCallback)
  const cleanupAudio = useCallback(() => {
    if (!audioInitialized) return;
    
    try {
      if (leftOscillator.current) {
        leftOscillator.current.stop();
        leftOscillator.current.disconnect();
      }
      
      if (rightOscillator.current) {
        rightOscillator.current.stop();
        rightOscillator.current.disconnect();
      }
      
      if (leftGain.current) {
        leftGain.current.disconnect();
      }
      
      if (rightGain.current) {
        rightGain.current.disconnect();
      }
      
      if (audioContext) {
        audioContext.close();
      }
      
      setAudioInitialized(false);
    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  }, [audioInitialized, audioContext]);
  
  // Update frequencies (optimized with useCallback)
  const updateLeftFrequency = useCallback((newFreq: number) => {
    if (newFreq >= 20 && newFreq <= 500) {
      setFrequencies(prev => ({
        ...prev,
        left: newFreq,
      }));
      
      if (audioInitialized && leftOscillator.current) {
        leftOscillator.current.frequency.value = newFreq;
      }
    }
  }, [audioInitialized]);
  
  const updateRightFrequency = useCallback((newFreq: number) => {
    if (newFreq >= 20 && newFreq <= 500) {
      setFrequencies(prev => ({
        ...prev,
        right: newFreq,
      }));
      
      if (audioInitialized && rightOscillator.current) {
        rightOscillator.current.frequency.value = newFreq;
      }
    }
  }, [audioInitialized]);
  
  // Update volume (optimized with useCallback)
  const updateVolume = useCallback((newVolume: number) => {
    if (newVolume >= 0 && newVolume <= 1) {
      setAudioSettings(prev => ({
        ...prev,
        volume: newVolume,
      }));
      
      if (audioInitialized && leftGain.current && rightGain.current && !audioSettings.isMuted) {
        leftGain.current.gain.value = newVolume;
        rightGain.current.gain.value = newVolume;
      }
    }
  }, [audioInitialized, audioSettings.isMuted]);
  
  // Toggle mute (optimized with useCallback)
  const toggleMute = useCallback(() => {
    const newMuted = !audioSettings.isMuted;
    
    setAudioSettings(prev => ({
      ...prev,
      isMuted: newMuted,
    }));
    
    if (audioInitialized && leftGain.current && rightGain.current) {
      const volume = newMuted ? 0 : audioSettings.volume;
      leftGain.current.gain.value = volume;
      rightGain.current.gain.value = volume;
    }
  }, [audioInitialized, audioSettings.isMuted, audioSettings.volume]);
  
  // Change wave type (optimized with useCallback)
  const changeWaveType = useCallback((waveType: OscillatorType) => {
    setAudioSettings(prev => ({
      ...prev,
      waveType,
    }));
    
    if (audioInitialized && leftOscillator.current && rightOscillator.current) {
      leftOscillator.current.type = waveType;
      rightOscillator.current.type = waveType;
    }
  }, [audioInitialized]);
  
  // Update timer duration (optimized with useCallback)
  const updateTimerDuration = useCallback((duration: number) => {
    if (duration >= 0) {
      setTimer(prev => ({
        ...prev,
        duration,
        remaining: prev.active ? prev.remaining : duration,
      }));
    }
  }, []);
  
  // Toggle timer (optimized with useCallback)
  const toggleTimer = useCallback(() => {
    if (timer.active) {
      // Stop timer
      if (timerInterval.current !== null) {
        window.clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      
      setTimer(prev => ({
        ...prev,
        active: false,
      }));
    } else {
      // Start timer
      const startTime = Date.now();
      const initialRemaining = timer.remaining > 0 ? timer.remaining : timer.duration;
      
      setTimer(prev => ({
        ...prev,
        active: true,
        remaining: initialRemaining,
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
          
          setTimer(prev => ({
            ...prev,
            active: false,
            remaining: 0,
          }));
          
          cleanupAudio();
        } else {
          setTimer(prev => ({
            ...prev,
            remaining: newRemaining,
          }));
        }
      }, 1000);
    }
  }, [timer.active, timer.remaining, timer.duration, cleanupAudio]);
  
  // Reset timer (optimized with useCallback)
  const resetTimer = useCallback(() => {
    if (timerInterval.current !== null) {
      window.clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    
    setTimer(prev => ({
      ...prev,
      active: false,
      remaining: prev.duration,
    }));
  }, []);
  
  // Set up presets (optimized with useCallback)
  const applyPreset = useCallback((beatFreq: number) => {
    if (frequencies.left) {
      updateRightFrequency(frequencies.left + beatFreq);
    }
  }, [frequencies.left, updateRightFrequency]);
  
  // Calculate beat frequency
  const beatFrequency = useMemo(() => 
    Math.abs(frequencies.right - frequencies.left).toFixed(1),
  [frequencies.left, frequencies.right]);
  
  // Toggle audio (Start/Stop button)
  const toggleAudio = useCallback(() => {
    if (audioInitialized) {
      cleanupAudio();
    } else {
      initializeAudio();
    }
  }, [audioInitialized, cleanupAudio, initializeAudio]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current !== null) {
        window.clearInterval(timerInterval.current);
      }
      
      cleanupAudio();
    };
  }, [cleanupAudio]);
  
  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateVolume(parseFloat(e.target.value));
  }, [updateVolume]);
  
  // Memoize preset buttons to prevent unnecessary rerenders
  const presetButtons = useMemo(() => (
    <div className="grid grid-cols-2 gap-2 text-sm mt-1">
      <button
        className="bg-blue-500 text-white py-1 px-2 rounded"
        onClick={() => applyPreset(7.83)} // Schumann resonance
      >
        Schumann (7.83 Hz)
      </button>
      <button
        className="bg-blue-500 text-white py-1 px-2 rounded"
        onClick={() => applyPreset(4)} // Theta
      >
        Theta (4 Hz)
      </button>
    </div>
  ), [applyPreset]);
  
  return (
    <div className="binaural-beat-generator p-4 border rounded-lg bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">Binaural Beat Generator (Optimized)</h2>
      
      {/* Visualization */}
      <WaveformVisualization
        frequencies={frequencies}
        waveType={audioSettings.waveType}
      />
      
      {/* Controls Section */}
      <div className="controls grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Frequency Controls */}
        <div className="frequency-controls p-3 border rounded bg-white">
          <h3 className="text-lg font-semibold mb-2">Frequency Controls</h3>
          
          <FrequencyControl
            label="Left Ear"
            value={frequencies.left}
            onChange={updateLeftFrequency}
          />
          
          <FrequencyControl
            label="Right Ear"
            value={frequencies.right}
            onChange={updateRightFrequency}
          />
          
          <div className="mb-3">
            <label className="block mb-1">Beat Frequency: {beatFrequency} Hz</label>
            {presetButtons}
          </div>
        </div>
        
        {/* Audio Controls */}
        <div className="audio-controls p-3 border rounded bg-white">
          <h3 className="text-lg font-semibold mb-2">Audio Controls</h3>
          
          <div className="mb-3">
            <label className="block mb-1">Volume: {Math.round(audioSettings.volume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audioSettings.volume}
              onChange={handleVolumeChange}
              className="w-full"
            />
          </div>
          
          <div className="mb-3">
            <label className="block mb-1">Waveform:</label>
            <WaveTypeSelector
              currentType={audioSettings.waveType}
              onChange={changeWaveType}
            />
          </div>
          
          <TimerControl
            duration={timer.duration}
            remaining={timer.remaining}
            active={timer.active}
            onToggle={toggleTimer}
            onReset={resetTimer}
            onDurationChange={updateTimerDuration}
          />
        </div>
      </div>
      
      {/* Start/Stop Button */}
      <div className="mt-4 flex justify-center">
        <button
          className={`py-2 px-6 rounded-lg text-white font-bold ${
            audioInitialized ? 'bg-red-600' : 'bg-green-600'
          }`}
          onClick={toggleAudio}
        >
          {audioInitialized ? 'Stop Audio' : 'Start Audio'}
        </button>
      </div>
    </div>
  );
};

export default BinauralBeatGenerator;