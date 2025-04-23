import * as THREE from "three";
import React from "react";

import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { RefreshCw, Upload, Mic, Settings, ChevronDown } from 'lucide-react';\n\import { Switch } from "@/components/ui/switch" '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/**
 * frequency-visualizer-3d.tsx
 * 
 * Component Type: audio
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */
/**
 * frequency-visualizer-3d.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCw, 
  Disc, Zap, Wand2, RefreshCw, Upload, Mic, Settings, ChevronDown 
} from "lucide-react"
import * as THREE from "three"
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { cn } from "@/lib/utils"

interface FrequencyVisualizer3DProps {
  audioUrl?: string;
  height?: number;
  width?: number;
  className?: string;
  visualizationType?: 'bars' | 'wave' | 'particles' | 'terrain' | 'sphere';
  colorScheme?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  useMicrophone?: boolean;
  sensitivity?: number;
  customSettings?: Record<string, any>;
}

export function FrequencyVisualizer3D({
  audioSrc = "/placeholder.mp3",
  title = "Root Chakra Alignment",
  frequency = 396,
  chakra = "Root Chakra (Muladhara)",
  chakraColor = "#ff0000",
}: FrequencyVisualizer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const frameIdRef = useRef<number>(0)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const visualizationMeshRef = useRef<THREE.Mesh | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [visualizationType, setVisualizationType] = useState<"mandala" | "chakra" | "frequency" | "particles">("chakra")
  const [rotationSpeed, setRotationSpeed] = useState(0.005)
  const [sensitivity, setSensitivity] = useState(3)
  const [colorIntensity, setColorIntensity] = useState(1.5)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 5
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controlsRef.current = controls

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Create initial visualization
    createVisualization(visualizationType)

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
      cancelAnimationFrame(frameIdRef.current)
    }
  }, [])

  // Update visualization when type changes
  useEffect(() => {
    createVisualization(visualizationType)
  }, [visualizationType])

  // Set up audio context and analyzer
  useEffect(() => {
    if (!audioRef.current) return

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048

    const source = audioContext.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    analyserRef.current = analyser
    dataArrayRef.current = dataArray

    // Start animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      updateVisualization()

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    return () => {
      cancelAnimationFrame(frameIdRef.current)
      audioContext.close()
    }
  }, [])

  // Handle audio playback
  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Audio playback failed:", error)
        setIsPlaying(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume / 100
  }, [volume])

  // Handle mute toggle
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.muted = isMuted
  }, [isMuted])

  // Handle fullscreen toggle
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err)
      })
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error attempting to exit fullscreen:", err)
      })
    }
  }

  const createVisualization = (type: string) => {
    if (!sceneRef.current) return

    // Remove existing visualization
    if (visualizationMeshRef.current) {
      sceneRef.current.remove(visualizationMeshRef.current)
      visualizationMeshRef.current = null
    }

    if (particlesRef.current) {
      sceneRef.current.remove(particlesRef.current)
      particlesRef.current = null
    }

    // Create new visualization based on type
    switch (type) {
      case "mandala":
        createMandalaVisualization()
        break
      case "chakra":
        createChakraVisualization()
        break
      case "frequency":
        createFrequencyVisualization()
        break
      case "particles":
        createParticlesVisualization()
        break
    }
  }

  const createMandalaVisualization = () => {
    if (!sceneRef.current) return

    // Create a complex mandala geometry
    const geometry = new THREE.TorusKnotGeometry(2, 0.5, 128, 32, 2, 3)

    // Create material with custom shader
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(chakraColor),
      emissive: new THREE.Color(chakraColor).multiplyScalar(0.2),
      shininess: 100,
      transparent: true,
      opacity: 0.9,
      wireframe: false,
    })

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material)
    sceneRef.current.add(mesh)
    visualizationMeshRef.current = mesh

    // Add additional decorative elements
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const radius = 3

      const smallGeometry = new THREE.SphereGeometry(0.2, 16, 16)
      const smallMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(chakraColor),
        emissive: new THREE.Color(chakraColor).multiplyScalar(0.5),
      })

      const smallMesh = new THREE.Mesh(smallGeometry, smallMaterial)
      smallMesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)

      sceneRef.current.add(smallMesh)
    }
  }

  const createChakraVisualization = () => {
    if (!sceneRef.current) return

    // Create a lotus-like geometry for chakra
    const petals = 8 // Number of petals
    const petalLength = 2
    const petalWidth = 0.8

    const group = new THREE.Group()

    // Create center sphere
    const centerGeometry = new THREE.SphereGeometry(1, 32, 32)
    const centerMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(chakraColor),
      emissive: new THREE.Color(chakraColor).multiplyScalar(0.3),
      transparent: true,
      opacity: 0.9,
    })

    const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial)
    group.add(centerMesh)

    // Create petals
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2

      const petalGeometry = new THREE.ConeGeometry(petalWidth, petalLength, 8, 1, true)
      const petalMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(chakraColor),
        emissive: new THREE.Color(chakraColor).multiplyScalar(0.2),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      })

      const petalMesh = new THREE.Mesh(petalGeometry, petalMaterial)

      // Position and rotate petal
      petalMesh.position.set(Math.cos(angle) * petalLength * 0.5, Math.sin(angle) * petalLength * 0.5, 0)

      petalMesh.rotation.z = angle + Math.PI / 2
      petalMesh.rotation.y = Math.PI / 4

      group.add(petalMesh)
    }

    sceneRef.current.add(group)
    visualizationMeshRef.current = group as any
  }

  const createFrequencyVisualization = () => {
    if (!sceneRef.current) return

    // Create a visualization based on the frequency number
    const segments = 64
    const radius = 2
    const height = 0.1

    const group = new THREE.Group()

    // Create a ring of bars
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2

      const barGeometry = new THREE.BoxGeometry(0.1, 1, 0.1)
      const barMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(chakraColor),
        emissive: new THREE.Color(chakraColor).multiplyScalar(0.2),
      })

      const bar = new THREE.Mesh(barGeometry, barMaterial)

      bar.position.set(
        Math.cos(angle) * radius,
        0.5, // Half the height
        Math.sin(angle) * radius,
      )

      bar.rotation.x = Math.PI / 2
      bar.rotation.z = angle

      group.add(bar)
    }

    // Add frequency number as floating text
    const textGeometry = new THREE.TextGeometry(`${frequency} Hz`, {
      font: new THREE.Font({}), // This would need a proper font
      size: 0.3,
      height: 0.05,
    })

    // Since we can't easily load fonts in this environment, we'll use a placeholder
    const textMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.3),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(chakraColor),
        transparent: true,
        opacity: 0.8,
      }),
    )
    textMesh.position.set(0, 0, 0)
    group.add(textMesh)

    sceneRef.current.add(group)
    visualizationMeshRef.current = group as any
  }

  const createParticlesVisualization = () => {
    if (!sceneRef.current) return

    // Create a particle system
    const particleCount = 2000
    const particles = new THREE.BufferGeometry()

    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const color = new THREE.Color(chakraColor)

    for (let i = 0; i < particleCount; i++) {
      // Position particles in a sphere
      const radius = 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Set colors
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      // Random sizes
      sizes[i] = Math.random() * 0.1 + 0.05
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particles.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    })

    // Create particle system
    const particleSystem = new THREE.Points(particles, particleMaterial)
    sceneRef.current.add(particleSystem)
    particlesRef.current = particleSystem
  }

  const updateVisualization = () => {
    if (!analyserRef.current || !dataArrayRef.current) return

    // Get frequency data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    // Calculate average frequency value for simplicity
    let sum = 0
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i]
    }
    const average = sum / dataArrayRef.current.length
    const normalizedAverage = average / 255 // Normalize to 0-1

    // Update visualization based on type
    if (visualizationType === "mandala" && visualizationMeshRef.current) {
      // Rotate mandala
      visualizationMeshRef.current.rotation.z += rotationSpeed

      // Scale based on audio
      const scale = 1 + normalizedAverage * 0.3 * sensitivity
      visualizationMeshRef.current.scale.set(scale, scale, scale)

      // Update material
      if (visualizationMeshRef.current.material instanceof THREE.MeshPhongMaterial) {
        const material = visualizationMeshRef.current.material
        material.emissiveIntensity = normalizedAverage * colorIntensity
      }
    } else if (visualizationType === "chakra" && visualizationMeshRef.current) {
      // Rotate chakra
      visualizationMeshRef.current.rotation.z += rotationSpeed

      // Pulse based on audio
      const scale = 1 + normalizedAverage * 0.2 * sensitivity
      visualizationMeshRef.current.scale.set(scale, scale, scale)

      // Update children materials
      visualizationMeshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
          child.material.emissiveIntensity = normalizedAverage * colorIntensity
        }
      })
    } else if (visualizationType === "frequency" && visualizationMeshRef.current) {
      // Rotate frequency visualization
      visualizationMeshRef.current.rotation.y += rotationSpeed

      // Update bar heights based on frequency data
      const children = visualizationMeshRef.current.children
      const barsCount = children.length - 1 // Exclude text mesh

      for (let i = 0; i < barsCount; i++) {
        const bar = children[i] as THREE.Mesh
        if (bar && bar.geometry instanceof THREE.BoxGeometry) {
          // Get frequency value for this bar
          const frequencyIndex = Math.floor((i / barsCount) * dataArrayRef.current.length)
          const frequencyValue = dataArrayRef.current[frequencyIndex]
          const normalizedValue = frequencyValue / 255

          // Update bar height
          bar.scale.y = 1 + normalizedValue * 5 * sensitivity

          // Update bar color
          if (bar.material instanceof THREE.MeshPhongMaterial) {
            bar.material.emissiveIntensity = normalizedValue * colorIntensity
          }
        }
      }
    } else if (visualizationType === "particles" && particlesRef.current) {
      // Rotate particle system
      particlesRef.current.rotation.y += rotationSpeed * 0.5

      // Update particle positions based on audio
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        // Get frequency value for this particle
        const frequencyIndex = Math.floor((i / (positions.length / 3)) * dataArrayRef.current.length)
        const frequencyValue = dataArrayRef.current[frequencyIndex]
        const normalizedValue = frequencyValue / 255

        // Pulse particles outward
        const x = positions[i * 3]
        const y = positions[i * 3 + 1]
        const z = positions[i * 3 + 2]

        const distance = Math.sqrt(x * x + y * y + z * z)
        const direction = {
          x: x / distance,
          y: y / distance,
          z: z / distance,
        }

        const pulseStrength = normalizedValue * sensitivity * 0.5
        const baseRadius = 3
        const newRadius = baseRadius + pulseStrength

        positions[i * 3] = direction.x * newRadius
        positions[i * 3 + 1] = direction.y * newRadius
        positions[i * 3 + 2] = direction.z * newRadius

        // Update particle size
        sizes[i] = 0.05 + normalizedValue * 0.1 * sensitivity
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.size.needsUpdate = true
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (value[0] === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full" style={{ backgroundColor: chakraColor }}>
            <div className="h-full w-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-white/60">
              {chakra} • {frequency} Hz
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            <span className="sr-only">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn("relative bg-gradient-to-b from-black to-purple-950/50", isFullscreen ? "h-screen" : "h-[500px]")}
      >
        <audio ref={audioRef} src={audioSrc} loop />

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
                  </Button>
                  <Slider
                    value={[volume]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>
              </div>

              <Tabs
                value={visualizationType}
                onValueChange={(value) => setVisualizationType(value as any)}
                className="bg-black/40 rounded-full p-1"
              >
                <TabsList className="bg-transparent">
                  <TabsTrigger
                    value="chakra"
                    className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <Disc className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="mandala"
                    className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <RotateCw className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="frequency"
                    className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <Zap className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="particles"
                    className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <Wand2 className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Rotation Speed</span>
                  <span>{(rotationSpeed * 1000).toFixed(1)}</span>
                </div>
                <Slider
                  value={[rotationSpeed * 1000]}
                  min={0}
                  max={20}
                  step={0.1}
                  onValueChange={(value) => setRotationSpeed(value[0] / 1000)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Sensitivity</span>
                  <span>{sensitivity.toFixed(1)}</span>
                </div>
                <Slider
                  value={[sensitivity]}
                  min={0.5}
                  max={10}
                  step={0.1}
                  onValueChange={(value) => setSensitivity(value[0])}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Color Intensity</span>
                  <span>{colorIntensity.toFixed(1)}</span>
                </div>
                <Slider
                  value={[colorIntensity]}
                  min={0.5}
                  max={5}
                  step={0.1}
                  onValueChange={(value) => setColorIntensity(value[0])}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



/**
 * Original FrequencyVisualizer3D component merged from: client/src/components/audio/FrequencyVisualizer3D.tsx
 * Merge date: 2025-04-05
 */
function FrequencyVisualizer3DOriginal({
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
    } catch (error: unknown) {
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

    let audioSource;
    try {
      audioSource = audioContextRef.current.createMediaElementSource(audioRef.current);
      audioSource.connect(analyserRef.current);
      sourceRef.current = audioSource;

    } catch (err: unknown) {
      console.warn('Audio source already connected, using existing connection');
    }
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
    } catch (error: unknown) {
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

/**
 * Original FrequencyVisualizer3D component merged from: client/src/components/common/frequency-visualizer-3d.tsx
 * Merge date: 2025-04-05
 */
function FrequencyVisualizer3DMuladharaOriginal({
  audioSrc = "/placeholder.mp3",
  title = "Root Chakra Alignment",
  frequency = 396,
  chakra = "Root Chakra (Muladhara)",
  chakraColor = "#ff0000",
}: FrequencyVisualizer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const frameIdRef = useRef<number>(0)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const visualizationMeshRef = useRef<THREE.Mesh | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [visualizationType, setVisualizationType] = useState<"mandala" | "chakra" | "frequency" | "particles">("chakra")
  const [rotationSpeed, setRotationSpeed] = useState(0.005)
  const [sensitivity, setSensitivity] = useState(3)
  const [colorIntensity, setColorIntensity] = useState(1.5)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Create scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 5
    cameraRef.current = camera

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controlsRef.current = controls

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Create initial visualization
    createVisualization(visualizationType)

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
      cancelAnimationFrame(frameIdRef.current)
    }
  }, [])

  // Update visualization when type changes
  useEffect(() => {
    createVisualization(visualizationType)
  }, [visualizationType])

  // Set up audio context and analyzer
  useEffect(() => {
    if (!audioRef.current) return

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048

    const source = audioContext.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    analyserRef.current = analyser
    dataArrayRef.current = dataArray

    // Start animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      updateVisualization()

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    return () => {
      cancelAnimationFrame(frameIdRef.current)
      audioContext.close()
    }
  }, [])

  // Handle audio playback
  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Audio playback failed:", error)
        setIsPlaying(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume / 100
  }, [volume])

  // Handle mute toggle
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.muted = isMuted
  }, [isMuted])

  // Handle fullscreen toggle
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err)
      })
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error attempting to exit fullscreen:", err)
      })
    }
  }

  const createVisualization = (type: string) => {
    if (!sceneRef.current) return

    // Remove existing visualization
    if (visualizationMeshRef.current) {
      sceneRef.current.remove(visualizationMeshRef.current)
      visualizationMeshRef.current = null
    }

    if (particlesRef.current) {
      sceneRef.current.remove(particlesRef.current)
      particlesRef.current = null
    }

    // Create new visualization based on type
    switch (type) {
      case "mandala":
        createMandalaVisualization()
        break
      case "chakra":
        createChakraVisualization()
        break
      case "frequency":
        createFrequencyVisualization()
        break
      case "particles":
        createParticlesVisualization()
        break
    }
  }

  const createMandalaVisualization = () => {
    if (!sceneRef.current) return

    // Create a complex mandala geometry
    const geometry = new THREE.TorusKnotGeometry(2, 0.5, 128, 32, 2, 3)

    // Create material with custom shader
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(chakraColor),
      emissive: new THREE.Color(chakraColor).multiplyScalar(0.2),
      shininess: 100,
      transparent: true,
      opacity: 0.9,
      wireframe: false,
    })

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material)
    sceneRef.current.add(mesh)
    visualizationMeshRef.current = mesh

    // Add additional decorative elements
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const radius = 3

      const smallGeometry = new THREE.SphereGeometry(0.2, 16, 16)
      const smallMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(chakraColor),
        emissive: new THREE.Color(chakraColor).multiplyScalar(0.5),
      })

      const smallMesh = new THREE.Mesh(smallGeometry, smallMaterial)
      smallMesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)

      sceneRef.current.add(smallMesh)
    }
  }

  const createChakraVisualization = () => {
    if (!sceneRef.current) return

    // Create a lotus-like geometry for chakra
    const petals = 8 // Number of petals
    const petalLength = 2
    const petalWidth = 0.8

    const group = new THREE.Group()

    // Create center sphere
    const centerGeometry = new THREE.SphereGeometry(1, 32, 32)
    const centerMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(chakraColor),
      emissive: new THREE.Color(chakraColor).multiplyScalar(0.3),
      transparent: true,
      opacity: 0.9,
    })

    const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial)
    group.add(centerMesh)

    // Create petals
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2

      const petalGeometry = new THREE.ConeGeometry(petalWidth, petalLength, 8, 1, true)
      const petalMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(chakraColor),
        emissive: new THREE.Color(chakraColor).multiplyScalar(0.2),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      })

      const petalMesh = new THREE.Mesh(petalGeometry, petalMaterial)

      // Position and rotate petal
      petalMesh.position.set(Math.cos(angle) * petalLength * 0.5, Math.sin(angle) * petalLength * 0.5, 0)

      petalMesh.rotation.z = angle + Math.PI / 2
      petalMesh.rotation.y = Math.PI / 4

      group.add(petalMesh)
    }

    sceneRef.current.add(group)
    visualizationMeshRef.current = group as any
  }

  const createFrequencyVisualization = () => {
    if (!sceneRef.current) return

    // Create a visualization based on the frequency number
    const segments = 64
    const radius = 2
    const height = 0.1

    const group = new THREE.Group()

    // Create a ring of bars
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2

      const barGeometry = new THREE.BoxGeometry(0.1, 1, 0.1)
      const barMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(chakraColor),
        emissive: new THREE.Color(chakraColor).multiplyScalar(0.2),
      })

      const bar = new THREE.Mesh(barGeometry, barMaterial)

      bar.position.set(
        Math.cos(angle) * radius,
        0.5, // Half the height
        Math.sin(angle) * radius,
      )

      bar.rotation.x = Math.PI / 2
      bar.rotation.z = angle

      group.add(bar)
    }

    // Add frequency number as floating text
    const textGeometry = new THREE.TextGeometry(`${frequency} Hz`, {
      font: new THREE.Font({}), // This would need a proper font
      size: 0.3,
      height: 0.05,
    })

    // Since we can't easily load fonts in this environment, we'll use a placeholder
    const textMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.3),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(chakraColor),
        transparent: true,
        opacity: 0.8,
      }),
    )
    textMesh.position.set(0, 0, 0)
    group.add(textMesh)

    sceneRef.current.add(group)
    visualizationMeshRef.current = group as any
  }

  const createParticlesVisualization = () => {
    if (!sceneRef.current) return

    // Create a particle system
    const particleCount = 2000
    const particles = new THREE.BufferGeometry()

    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const color = new THREE.Color(chakraColor)

    for (let i = 0; i < particleCount; i++) {
      // Position particles in a sphere
      const radius = 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Set colors
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      // Random sizes
      sizes[i] = Math.random() * 0.1 + 0.05
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particles.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    })

    // Create particle system
    const particleSystem = new THREE.Points(particles, particleMaterial)
    sceneRef.current.add(particleSystem)
    particlesRef.current = particleSystem
  }

  const updateVisualization = () => {
    if (!analyserRef.current || !dataArrayRef.current) return

    // Get frequency data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    // Calculate average frequency value for simplicity
    let sum = 0
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i]
    }
    const average = sum / dataArrayRef.current.length
    const normalizedAverage = average / 255 // Normalize to 0-1

    // Update visualization based on type
    if (visualizationType === "mandala" && visualizationMeshRef.current) {
      // Rotate mandala
      visualizationMeshRef.current.rotation.z += rotationSpeed

      // Scale based on audio
      const scale = 1 + normalizedAverage * 0.3 * sensitivity
      visualizationMeshRef.current.scale.set(scale, scale, scale)

      // Update material
      if (visualizationMeshRef.current.material instanceof THREE.MeshPhongMaterial) {
        const material = visualizationMeshRef.current.material
        material.emissiveIntensity = normalizedAverage * colorIntensity
      }
    } else if (visualizationType === "chakra" && visualizationMeshRef.current) {
      // Rotate chakra
      visualizationMeshRef.current.rotation.z += rotationSpeed

      // Pulse based on audio
      const scale = 1 + normalizedAverage * 0.2 * sensitivity
      visualizationMeshRef.current.scale.set(scale, scale, scale)

      // Update children materials
      visualizationMeshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
          child.material.emissiveIntensity = normalizedAverage * colorIntensity
        }
      })
    } else if (visualizationType === "frequency" && visualizationMeshRef.current) {
      // Rotate frequency visualization
      visualizationMeshRef.current.rotation.y += rotationSpeed

      // Update bar heights based on frequency data
      const children = visualizationMeshRef.current.children
      const barsCount = children.length - 1 // Exclude text mesh

      for (let i = 0; i < barsCount; i++) {
        const bar = children[i] as THREE.Mesh
        if (bar && bar.geometry instanceof THREE.BoxGeometry) {
          // Get frequency value for this bar
          const frequencyIndex = Math.floor((i / barsCount) * dataArrayRef.current.length)
          const frequencyValue = dataArrayRef.current[frequencyIndex]
          const normalizedValue = frequencyValue / 255

          // Update bar height
          bar.scale.y = 1 + normalizedValue * 5 * sensitivity

          // Update bar color
          if (bar.material instanceof THREE.MeshPhongMaterial) {
            bar.material.emissiveIntensity = normalizedValue * colorIntensity
          }
        }
      }
    } else if (visualizationType === "particles" && particlesRef.current) {
      // Rotate particle system
      particlesRef.current.rotation.y += rotationSpeed * 0.5

      // Update particle positions based on audio
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        // Get frequency value for this particle
        const frequencyIndex = Math.floor((i / (positions.length / 3)) * dataArrayRef.current.length)
        const frequencyValue = dataArrayRef.current[frequencyIndex]
        const normalizedValue = frequencyValue / 255

        // Pulse particles outward
        const x = positions[i * 3]
        const y = positions[i * 3 + 1]
        const z = positions[i * 3 + 2]

        const distance = Math.sqrt(x * x + y * y + z * z)
        const direction = {
          x: x / distance,
          y: y / distance,
          z: z / distance,
        }

        const pulseStrength = normalizedValue * sensitivity * 0.5
        const baseRadius = 3
        const newRadius = baseRadius + pulseStrength

        positions[i * 3] = direction.x * newRadius
        positions[i * 3 + 1] = direction.y * newRadius
        positions[i * 3 + 2] = direction.z * newRadius

        // Update particle size
        sizes[i] = 0.05 + normalizedValue * 0.1 * sensitivity
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.size.needsUpdate = true
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (value[0] === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full" style={{ backgroundColor: chakraColor }}>
            <div className="h-full w-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-white/60">
              {chakra} • {frequency} Hz
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            <span className="sr-only">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn("relative bg-gradient-to-b from-black to-purple-950/50", isFullscreen ? "h-screen" : "h-[500px]")}
      >
        <audio ref={audioRef} src={audioSrc} loop />

        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
                  </Button>
                  <Slider
                    value={[volume]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>
              </div>

              <Tabs
                value={visualizationType}
                onValueChange={(value) => setVisualizationType(value as any)}
                className="bg-black/40 rounded-full p-1"
              >
                <TabsList className="bg-transparent">
                  <TabsTrigger
                    value="chakra"
                    className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <Disc className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="mandala"
                    className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <RotateCw className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="frequency"
                    className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <Zap className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="particles"
                    className="rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <Wand2 className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Rotation Speed</span>
                  <span>{(rotationSpeed * 1000).toFixed(1)}</span>
                </div>
                <Slider
                  value={[rotationSpeed * 1000]}
                  min={0}
                  max={20}
                  step={0.1}
                  onValueChange={(value) => setRotationSpeed(value[0] / 1000)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Sensitivity</span>
                  <span>{sensitivity.toFixed(1)}</span>
                </div>
                <Slider
                  value={[sensitivity]}
                  min={0.5}
                  max={10}
                  step={0.1}
                  onValueChange={(value) => setSensitivity(value[0])}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Color Intensity</span>
                  <span>{colorIntensity.toFixed(1)}</span>
                </div>
                <Slider
                  value={[colorIntensity]}
                  min={0.5}
                  max={5}
                  step={0.1}
                  onValueChange={(value) => setColorIntensity(value[0])}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



/**
 * Original FrequencyVisualizer3D component merged from: client/src/components/features/audio/FrequencyVisualizer3D.tsx
 * Merge date: 2025-04-05
 */
function FrequencyVisualizer3DFeaturesOriginal({
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
    } catch (error: unknown) {
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

    let audioSource;
    try {
      audioSource = audioContextRef.current.createMediaElementSource(audioRef.current);
      audioSource.connect(analyserRef.current);
      sourceRef.current = audioSource;

    } catch (err: unknown) {
      console.warn('Audio source already connected, using existing connection');
    }
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
    } catch (error: unknown) {
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