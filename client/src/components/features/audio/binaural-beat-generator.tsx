/**
 * Binaural Beat Generator Component
 * 
 * A component that generates binaural beats - different frequency tones in each ear
 * to create a perceived beat frequency that can help with focus, relaxation, etc.
 * 
 * This is the original unoptimized version.
 */

import React, { useState, useEffect, useRef } from 'react';

// Define types for oscillator wave forms
type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

// Define state interface for the timer
interface TimerState {
  duration: number;
  remaining: number;
  active: boolean;
}

// Main component
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
  
  // Canvas refs for visualization
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  // Initialize audio
  const initializeAudio = () => {
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
  };
  
  // Clean up audio
  const cleanupAudio = () => {
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
  };
  
  // Update left frequency
  const updateLeftFrequency = (newFreq: number) => {
    if (!audioInitialized || !leftOscillator.current) return;
    
    if (newFreq >= 20 && newFreq <= 500) {
      setFrequencies(prev => ({
        ...prev,
        left: newFreq,
      }));
      
      leftOscillator.current.frequency.value = newFreq;
    }
  };
  
  // Update right frequency
  const updateRightFrequency = (newFreq: number) => {
    if (!audioInitialized || !rightOscillator.current) return;
    
    if (newFreq >= 20 && newFreq <= 500) {
      setFrequencies(prev => ({
        ...prev,
        right: newFreq,
      }));
      
      rightOscillator.current.frequency.value = newFreq;
    }
  };
  
  // Update volume
  const updateVolume = (newVolume: number) => {
    if (!audioInitialized || !leftGain.current || !rightGain.current) return;
    
    if (newVolume >= 0 && newVolume <= 1) {
      setAudioSettings(prev => ({
        ...prev,
        volume: newVolume,
      }));
      
      if (!audioSettings.isMuted) {
        leftGain.current.gain.value = newVolume;
        rightGain.current.gain.value = newVolume;
      }
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (!audioInitialized || !leftGain.current || !rightGain.current) return;
    
    const newMuted = !audioSettings.isMuted;
    
    setAudioSettings(prev => ({
      ...prev,
      isMuted: newMuted,
    }));
    
    const volume = newMuted ? 0 : audioSettings.volume;
    leftGain.current.gain.value = volume;
    rightGain.current.gain.value = volume;
  };
  
  // Change wave type
  const changeWaveType = (waveType: OscillatorType) => {
    if (!audioInitialized || !leftOscillator.current || !rightOscillator.current) return;
    
    setAudioSettings(prev => ({
      ...prev,
      waveType,
    }));
    
    leftOscillator.current.type = waveType;
    rightOscillator.current.type = waveType;
  };
  
  // Update timer duration
  const updateTimerDuration = (duration: number) => {
    if (duration >= 0) {
      setTimer(prev => ({
        ...prev,
        duration,
        remaining: timer.active ? prev.remaining : duration,
      }));
    }
  };
  
  // Start/stop timer
  const toggleTimer = () => {
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
  };
  
  // Reset timer
  const resetTimer = () => {
    if (timerInterval.current !== null) {
      window.clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    
    setTimer(prev => ({
      ...prev,
      active: false,
      remaining: prev.duration,
    }));
  };
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Draw waveform visualization
  const drawWaveform = () => {
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
        switch (audioSettings.waveType) {
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
  };
  
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
        }
      };
    }
  }, [frequencies, audioSettings.waveType]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current !== null) {
        window.clearInterval(timerInterval.current);
      }
      
      cleanupAudio();
    };
  }, []);
  
  return (
    <div className="binaural-beat-generator p-4 border rounded-lg bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">Binaural Beat Generator</h2>
      
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
            <label className="block mb-1">Left Ear: {frequencies.left} Hz</label>
            <input
              type="range"
              min="20"
              max="500"
              value={frequencies.left}
              onChange={(e) => updateLeftFrequency(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="mb-3">
            <label className="block mb-1">Right Ear: {frequencies.right} Hz</label>
            <input
              type="range"
              min="20"
              max="500"
              value={frequencies.right}
              onChange={(e) => updateRightFrequency(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="mb-3">
            <label className="block mb-1">Beat Frequency: {Math.abs(frequencies.right - frequencies.left).toFixed(1)} Hz</label>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              <button
                className="bg-blue-500 text-white py-1 px-2 rounded"
                onClick={() => {
                  const beatFreq = 7.83; // Schumann resonance
                  updateRightFrequency(frequencies.left + beatFreq);
                }}
              >
                Schumann (7.83 Hz)
              </button>
              <button
                className="bg-blue-500 text-white py-1 px-2 rounded"
                onClick={() => {
                  const beatFreq = 4; // Theta
                  updateRightFrequency(frequencies.left + beatFreq);
                }}
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
            <label className="block mb-1">Volume: {Math.round(audioSettings.volume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audioSettings.volume}
              onChange={(e) => updateVolume(parseFloat(e.target.value))}
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
                    audioSettings.waveType === type
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
            <label className="block mb-1">Timer: {formatTime(timer.remaining)}</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                className={`py-1 rounded ${
                  timer.active ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                }`}
                onClick={toggleTimer}
              >
                {timer.active ? 'Stop' : 'Start'}
              </button>
              <button
                className="bg-gray-200 text-gray-800 py-1 rounded"
                onClick={resetTimer}
              >
                Reset
              </button>
              <select
                className="border rounded py-1 px-2"
                value={timer.duration}
                onChange={(e) => updateTimerDuration(parseInt(e.target.value))}
              >
                <option value="300">5 minutes</option>
                <option value="600">10 minutes</option>
                <option value="1200">20 minutes</option>
                <option value="1800">30 minutes</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Start/Stop Button */}
      <div className="mt-4 flex justify-center">
        <button
          className={`py-2 px-6 rounded-lg text-white font-bold ${
            audioInitialized ? 'bg-red-600' : 'bg-green-600'
          }`}
          onClick={() => {
            if (audioInitialized) {
              cleanupAudio();
            } else {
              initializeAudio();
            }
          }}
        >
          {audioInitialized ? 'Stop Audio' : 'Start Audio'}
        </button>
      </div>
    </div>
  );
};

export default BinauralBeatGenerator;