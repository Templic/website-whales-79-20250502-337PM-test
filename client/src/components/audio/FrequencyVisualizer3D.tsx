
"use client"

import React, { useEffect, useRef, useState } from 'react';
// Importing THREE as a module when used
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Play, Pause, Mic, Upload, RefreshCw, Settings, ChevronDown } from 'lucide-react';

interface FrequencyVisualizer3DProps {
  audioUrl?: string;
  height?: string;
  width?: string;
  className?: string;
  autoPlay?: boolean;
  useMicrophone?: boolean;
  visualizationType?: 'bars' | 'circular' | 'wave' | 'particles';
  colorScheme?: 'rainbow' | 'cosmic' | 'monochrome' | 'fire';
}

export function FrequencyVisualizer3D({
  audioUrl,
  height = '400px',
  width = '100%',
  className,
  autoPlay = false,
  useMicrophone = false,
  visualizationType = 'bars',
  colorScheme = 'cosmic',
}: FrequencyVisualizer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameIdRef = useRef<number>(0);
  const microphoneStreamRef = useRef<MediaStream | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isUsingMic, setIsUsingMic] = useState(useMicrophone);
  const [selectedVisType, setSelectedVisType] = useState<string>(visualizationType);
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>(colorScheme);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.2);
  const [rotation, setRotation] = useState(true);
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Initialize audio and three.js
  useEffect(() => {
    if (!containerRef.current) return;

    // Create audio elements
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Handle suspended state (browser requires user interaction)
        if (audioContextRef.current.state === 'suspended') {
          const resumeAudioContext = () => {
            audioContextRef.current?.resume();
            window.removeEventListener('click', resumeAudioContext);
            window.removeEventListener('touchstart', resumeAudioContext);
            window.removeEventListener('keydown', resumeAudioContext);
          };
          
          window.addEventListener('click', resumeAudioContext);
          window.addEventListener('touchstart', resumeAudioContext);
          window.addEventListener('keydown', resumeAudioContext);
        }
        
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        gainNodeRef.current = audioContextRef.current.createGain();
        
        gainNodeRef.current.connect(audioContextRef.current.destination);
        analyserRef.current.connect(gainNodeRef.current);
      }
      
      if (!audioRef.current && (audioUrl || uploadedAudio)) {
        audioRef.current = new Audio(uploadedAudio || audioUrl);
        audioRef.current.crossOrigin = "anonymous";
        
        if (autoPlay) {
          audioRef.current.play().catch(error => {
            console.error("Auto-play failed:", error);
            setIsPlaying(false);
          });
        }
      }
    } catch (error) {
      console.error("Error initializing audio:", error);
    }

    // Initialize Three.js
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 400;
    
    // Create scene
    sceneRef.current = new THREE.Scene();
    
    // Create camera
    cameraRef.current = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current.position.z = 20;
    
    // Create renderer
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setClearColor(0x000000, 0);
    
    containerRef.current.appendChild(rendererRef.current.domElement);
    
    // Add light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1);
    sceneRef.current.add(directionalLight);
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight || 400;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start visualization
    createVisualization();
    animate();
    
    // Handle audio source selection
    if (isUsingMic) {
      setupMicrophoneInput();
    } else if (audioRef.current) {
      setupAudioInput();
    }
    
    // Clean up
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Handle changes in audio source
  useEffect(() => {
    if (isUsingMic) {
      if (sourceRef.current && !isUsingMic) {
        sourceRef.current.disconnect();
      }
      setupMicrophoneInput();
    } else {
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
      setupAudioInput();
    }
  }, [isUsingMic, uploadedAudio]);
  
  // Handle visualization type changes
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Clear existing visualization
    if (meshesRef.current.length > 0) {
      meshesRef.current.forEach(mesh => {
        sceneRef.current?.remove(mesh);
      });
      meshesRef.current = [];
    }
    
    if (particlesRef.current) {
      sceneRef.current.remove(particlesRef.current);
      particlesRef.current = null;
    }
    
    createVisualization();
  }, [selectedVisType, selectedColorScheme]);
  
  // Handle play/pause state
  useEffect(() => {
    if (!audioRef.current || isUsingMic) return;
    
    if (isPlaying) {
      audioContextRef.current?.resume();
      audioRef.current.play().catch(error => {
        console.error("Play failed:", error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);
  
  // Handle volume changes
  useEffect(() => {
    if (!gainNodeRef.current) return;
    
    const volumeValue = isMuted ? 0 : volume / 100;
    gainNodeRef.current.gain.setValueAtTime(volumeValue, audioContextRef.current?.currentTime || 0);
  }, [volume, isMuted]);
  
  // Set up audio input from file
  const setupAudioInput = () => {
    if (!audioContextRef.current || !audioRef.current || !analyserRef.current) return;
    
    // Disconnect previous source if it exists
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    sourceRef.current.connect(analyserRef.current);
  };
  
  // Set up microphone input
  const setupMicrophoneInput = async () => {
    if (!audioContextRef.current || !analyserRef.current) return;
    
    try {
      // Disconnect previous source if it exists
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      
      // Stop previous microphone stream if it exists
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsUsingMic(false);
    }
  };
  
  // Create visualization based on selected type
  const createVisualization = () => {
    if (!sceneRef.current) return;
    
    const count = 128; // Number of frequency bands to display
    
    switch (selectedVisType) {
      case 'bars':
        createBarVisualization(count);
        break;
      case 'circular':
        createCircularVisualization(count);
        break;
      case 'wave':
        createWaveVisualization(count);
        break;
      case 'particles':
        createParticleVisualization(count * 2);
        break;
      default:
        createBarVisualization(count);
    }
  };
  
  // Create bar visualization
  const createBarVisualization = (count: number) => {
    if (!sceneRef.current) return;
    
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      
      // Get color based on color scheme
      const color = getColorForIndex(i, count);
      
      const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 50,
        emissive: new THREE.Color(color).multiplyScalar(0.2),
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = (i - count / 2) * 0.7;
      
      sceneRef.current.add(mesh);
      meshesRef.current.push(mesh);
    }
  };
  
  // Create circular visualization
  const createCircularVisualization = (count: number) => {
    if (!sceneRef.current) return;
    
    const radius = 10;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      
      // Get color based on color scheme
      const color = getColorForIndex(i, count);
      
      const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 50,
        emissive: new THREE.Color(color).multiplyScalar(0.2),
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, 0, z);
      mesh.lookAt(0, 0, 0);
      
      sceneRef.current.add(mesh);
      meshesRef.current.push(mesh);
    }
  };
  
  // Create wave visualization
  const createWaveVisualization = (count: number) => {
    if (!sceneRef.current) return;
    
    const waveWidth = 20;
    
    for (let i = 0; i < count; i++) {
      const x = (i / count) * waveWidth - waveWidth / 2;
      
      const geometry = new THREE.SphereGeometry(0.25, 16, 16);
      
      // Get color based on color scheme
      const color = getColorForIndex(i, count);
      
      const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 100,
        emissive: new THREE.Color(color).multiplyScalar(0.3),
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = x;
      
      sceneRef.current.add(mesh);
      meshesRef.current.push(mesh);
    }
  };
  
  // Create particle visualization
  const createParticleVisualization = (count: number) => {
    if (!sceneRef.current) return;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const index = i * 3;
      
      // Calculate a spiral pattern
      const theta = i / count * Math.PI * 10;
      const radius = (i / count) * 10;
      
      positions[index] = Math.cos(theta) * radius;
      positions[index + 1] = 0;
      positions[index + 2] = Math.sin(theta) * radius;
      
      // Get color based on color scheme
      const color = new THREE.Color(getColorForIndex(i, count));
      
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    
    particlesRef.current = new THREE.Points(geometry, material);
    sceneRef.current.add(particlesRef.current);
  };
  
  // Get color based on color scheme and index
  const getColorForIndex = (index: number, count: number) => {
    const normalized = index / count;
    
    switch (selectedColorScheme) {
      case 'rainbow':
        return new THREE.Color().setHSL(normalized, 0.8, 0.6);
      case 'cosmic':
        // Purples and blues for cosmic theme
        return new THREE.Color().setHSL(0.7 + normalized * 0.2, 0.8, 0.5 + normalized * 0.2);
      case 'monochrome':
        // White to blue
        return new THREE.Color(normalized, normalized, 1);
      case 'fire':
        // Reds and oranges
        return new THREE.Color().setHSL(normalized * 0.1, 0.8, 0.5);
      default:
        return new THREE.Color().setHSL(normalized, 0.8, 0.6);
    }
  };
  
  // Animation loop
  const animate = () => {
    if (!analyserRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    frameIdRef.current = requestAnimationFrame(animate);
    
    // Get frequency data
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    
    // Update visualization based on type
    switch (selectedVisType) {
      case 'bars':
        updateBarVisualization(data);
        break;
      case 'circular':
        updateCircularVisualization(data);
        break;
      case 'wave':
        updateWaveVisualization(data);
        break;
      case 'particles':
        updateParticleVisualization(data);
        break;
    }
    
    // Rotate camera if rotation is enabled
    if (rotation && cameraRef.current) {
      cameraRef.current.position.x = Math.sin(Date.now() * 0.0003) * 20;
      cameraRef.current.position.z = Math.cos(Date.now() * 0.0003) * 20;
      cameraRef.current.lookAt(0, 0, 0);
    }
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };
  
  // Update bar visualization
  const updateBarVisualization = (data: Uint8Array) => {
    const count = Math.min(meshesRef.current.length, 128);
    
    for (let i = 0; i < count; i++) {
      const value = data[i] / 255;
      const mesh = meshesRef.current[i];
      
      // Apply sensitivity to height scaling
      const targetHeight = value * 15 * sensitivity;
      
      // Smooth transitions
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, targetHeight || 0.1, 0.1);
      mesh.position.y = mesh.scale.y / 2;
      
      // Update color intensity based on value
      if (mesh.material instanceof THREE.MeshPhongMaterial) {
        const emissiveIntensity = value * 0.5;
        mesh.material.emissive.setScalar(emissiveIntensity);
      }
    }
  };
  
  // Update circular visualization
  const updateCircularVisualization = (data: Uint8Array) => {
    const count = Math.min(meshesRef.current.length, 128);
    const radius = 10;
    
    for (let i = 0; i < count; i++) {
      const value = data[i] / 255;
      const mesh = meshesRef.current[i];
      
      // Apply sensitivity to height scaling
      const targetHeight = value * 10 * sensitivity;
      
      // Smooth transitions
      mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, targetHeight || 0.1, 0.1);
      
      // Scale outward from center
      const angle = (i / count) * Math.PI * 2;
      const distanceFromCenter = radius + value * 5 * sensitivity;
      
      mesh.position.x = Math.cos(angle) * distanceFromCenter;
      mesh.position.z = Math.sin(angle) * distanceFromCenter;
      mesh.position.y = mesh.scale.y / 2;
      
      mesh.lookAt(0, mesh.position.y, 0);
      
      // Update color intensity based on value
      if (mesh.material instanceof THREE.MeshPhongMaterial) {
        const emissiveIntensity = value * 0.5;
        mesh.material.emissive.setScalar(emissiveIntensity);
      }
    }
  };
  
  // Update wave visualization
  const updateWaveVisualization = (data: Uint8Array) => {
    const count = Math.min(meshesRef.current.length, 128);
    
    for (let i = 0; i < count; i++) {
      const value = data[i] / 255;
      const mesh = meshesRef.current[i];
      
      // Apply sensitivity to y position
      const targetY = value * 10 * sensitivity - 5;
      
      // Smooth transitions
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.1);
      
      // Scale based on value
      const targetScale = 0.25 + value * sensitivity;
      mesh.scale.set(targetScale, targetScale, targetScale);
      
      // Update color intensity based on value
      if (mesh.material instanceof THREE.MeshPhongMaterial) {
        const emissiveIntensity = value * 0.5;
        mesh.material.emissive.setScalar(emissiveIntensity);
      }
    }
  };
  
  // Update particle visualization
  const updateParticleVisualization = (data: Uint8Array) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.getAttribute('position');
    const count = positions.count;
    
    for (let i = 0; i < count; i++) {
      const index = i % 128;
      const value = data[index] / 255;
      
      // Calculate a spiral pattern
      const theta = i / count * Math.PI * 10;
      const radius = (i / count) * 10;
      
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      
      // Apply audio-reactive y position
      const y = value * 10 * sensitivity * Math.sin(theta * 2);
      
      positions.setXYZ(i, x, y, z);
    }
    
    positions.needsUpdate = true;
    
    // Rotate the particle system
    particlesRef.current.rotation.y += 0.002;
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Toggle microphone input
  const toggleMicrophoneInput = () => {
    setIsUsingMic(!isUsingMic);
    setIsPlaying(true);
  };
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Create object URL for the uploaded file
    const objectUrl = URL.createObjectURL(file);
    setUploadedAudio(objectUrl);
    
    // Create new audio element with the uploaded file
    if (audioRef.current) {
      audioRef.current.src = objectUrl;
      audioRef.current.load();
    } else {
      audioRef.current = new Audio(objectUrl);
    }
    
    setIsUsingMic(false);
    setIsPlaying(true);
  };
  
  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullScreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullScreen(!isFullScreen);
  };
  
  return (
    <div className={cn("flex flex-col w-full rounded-xl overflow-hidden bg-black/30 backdrop-blur-sm", className)}>
      {/* Visualization container */}
      <div 
        ref={containerRef} 
        className="relative w-full bg-gradient-to-b from-purple-900/30 to-black/60"
        style={{ height, width }}
      />
      
      {/* Controls */}
      <div className="p-4 bg-black/70 border-t border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="icon"
              className="rounded-full bg-purple-600 hover:bg-purple-700 h-10 w-10"
              onClick={togglePlay}
              disabled={isUsingMic}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            
            <Button
              variant={isUsingMic ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full gap-2",
                isUsingMic 
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-white/10 hover:bg-white/5 text-white"
              )}
              onClick={toggleMicrophoneInput}
            >
              <Mic className="h-4 w-4" />
              <span>Microphone</span>
            </Button>
            
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 hover:bg-white/5 text-white rounded-full gap-2"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
              
              {isSettingsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-black/90 border border-white/10 rounded-xl p-4 z-10 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="visType" className="text-white/80 text-xs">Visualization Type</Label>
                      <Select 
                        value={selectedVisType} 
                        onValueChange={(value) => setSelectedVisType(value)}
                      >
                        <SelectTrigger id="visType" className="bg-black/50 border-white/10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                          <SelectItem value="bars">Bars</SelectItem>
                          <SelectItem value="circular">Circular</SelectItem>
                          <SelectItem value="wave">Wave</SelectItem>
                          <SelectItem value="particles">Particles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="colorScheme" className="text-white/80 text-xs">Color Scheme</Label>
                      <Select 
                        value={selectedColorScheme} 
                        onValueChange={(value) => setSelectedColorScheme(value)}
                      >
                        <SelectTrigger id="colorScheme" className="bg-black/50 border-white/10">
                          <SelectValue placeholder="Select scheme" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                          <SelectItem value="cosmic">Cosmic</SelectItem>
                          <SelectItem value="rainbow">Rainbow</SelectItem>
                          <SelectItem value="monochrome">Monochrome</SelectItem>
                          <SelectItem value="fire">Fire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="sensitivity" className="text-white/80 text-xs">Sensitivity</Label>
                        <span className="text-white/60 text-xs">{sensitivity.toFixed(1)}x</span>
                      </div>
                      <Slider
                        id="sensitivity"
                        min={0.1}
                        max={3}
                        step={0.1}
                        value={[sensitivity]}
                        onValueChange={(values) => setSensitivity(values[0])}
                        className="cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rotation" className="text-white/80 text-xs">Camera Rotation</Label>
                      <Switch
                        id="rotation"
                        checked={rotation}
                        onCheckedChange={setRotation}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-white/10 hover:bg-white/5 text-white text-xs"
                      onClick={() => {
                        setSelectedVisType(visualizationType);
                        setSelectedColorScheme(colorScheme);
                        setSensitivity(1.2);
                        setRotation(true);
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Reset to Defaults</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input 
                type="file" 
                id="audioUpload" 
                className="absolute inset-0 opacity-0 cursor-pointer w-full" 
                accept="audio/*"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 hover:bg-white/5 text-white rounded-full gap-2 relative z-10 pointer-events-none"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Audio</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
