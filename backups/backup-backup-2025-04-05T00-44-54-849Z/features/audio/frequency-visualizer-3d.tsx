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
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCw, Disc, Zap, Wand2 } from "lucide-react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { cn } from "@/lib/utils"

interface FrequencyVisualizer3DProps {
  audioSrc?: string
  title?: string
  frequency?: number
  chakra?: string
  chakraColor?: string
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

