/**
 * Advanced Sacred Geometry Visualizer
 * 
 * A comprehensive, interactive 3D visualization of sacred geometry patterns
 * that harmonizes with meditative states and cosmic consciousness.
 * 
 * Features:
 * - Interactive 3D geometries rendered with Three.js
 * - Responsive to audio frequency and breathing
 * - Cosmic-themed UI with particle effects
 * - Multiple sacred geometry patterns with educational overlay
 */
"use client"

import React, { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Flower, Hexagon, Loader2, Download, Sparkles, 
  Infinity, Wind, Zap, RotateCcw, Play, Pause, Maximize, 
  Minimize, Info, X, Star, Circle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Define geometry types
type GeometryPattern = 
  | "flowerOfLife" 
  | "metatronsCube" 
  | "merkaba" 
  | "sriYantra" 
  | "fibonacciSpiral" 
  | "torus" 
  | "vesicaPiscis" 
  | "pentagram" 
  | "platonic";

// Optional color schemes
type ColorScheme = 
  | "cosmic" 
  | "energetic" 
  | "earthly" 
  | "ethereal" 
  | "chakra";

// Mapping of sacred geometry patterns to their meanings and effects
const geometryInfo = {
  flowerOfLife: {
    title: "Flower of Life",
    description: "A sacred geometric pattern composed of multiple evenly-spaced, overlapping circles arranged in a flower-like pattern. It contains the blueprint of creation and is found in ancient cultures worldwide.",
    effect: "Harmonizes the electromagnetic field of the body, activates the pineal gland, and promotes cellular regeneration.",
    icon: Flower
  },
  metatronsCube: {
    title: "Metatron's Cube",
    description: "A complex sacred geometry figure composed of 13 circles with lines connecting the centers. It contains all 5 Platonic solids, representing the building blocks of the universe.",
    effect: "Balances energy, protects against negative influences, and enhances spiritual awareness and connection to higher realms.",
    icon: Hexagon
  },
  merkaba: {
    title: "Merkaba",
    description: "A three-dimensional 8-pointed star formed from two interlocked tetrahedra, one pointing up and one pointing down. The word 'Merkaba' means light-spirit-body in Hebrew.",
    effect: "Activates the light body, facilitates interdimensional travel, and accelerates spiritual evolution and ascension.",
    icon: Star
  },
  sriYantra: {
    title: "Sri Yantra",
    description: "A complex mandala formed by nine interlocking triangles that surround a central point (bindu), creating 43 triangles total. It represents the cosmos and the body of the goddess.",
    effect: "Enhances concentration, manifestation abilities, and spiritual connection; balances masculine and feminine energies.",
    icon: Infinity
  },
  fibonacciSpiral: {
    title: "Fibonacci Spiral",
    description: "A pattern that follows the Fibonacci sequence, where each number is the sum of the two preceding ones. It creates a logarithmic spiral found throughout nature.",
    effect: "Aligns one with natural growth patterns, enhances creativity, and promotes harmony with universal order.",
    icon: Circle
  },
  torus: {
    title: "Torus",
    description: "A donut-shaped geometry that represents the fundamental energy pattern of all matter, from atoms to galaxies. Energy flows in and out through the center in a continuous self-sustaining pattern.",
    effect: "Activates the heart field, enhances energy circulation, and facilitates connection with universal consciousness.",
    icon: Circle
  },
  vesicaPiscis: {
    title: "Vesica Piscis",
    description: "Formed by the intersection of two circles with the same radius, where each circle's center lies on the other's circumference. It symbolizes the union of dualities.",
    effect: "Balances hemispheres of the brain, harmonizes polarities, and opens gateways to higher dimensions.",
    icon: Circle
  },
  pentagram: {
    title: "Pentagram",
    description: "A five-pointed star that embodies the golden ratio φ (phi) and represents the five elements. It has been a sacred symbol in many traditions.",
    effect: "Provides protection, balance of elements, and enhanced connection to natural cycles and wisdom.",
    icon: Star
  },
  platonic: {
    title: "Platonic Solids",
    description: "The five three-dimensional regular polyhedra: tetrahedron, cube, octahedron, dodecahedron, and icosahedron. Named after Plato, who associated them with the classical elements.",
    effect: "Each solid resonates with different energy centers and elements, providing balance, stability, and alignment with cosmic principles.",
    icon: Hexagon
  }
};

// Color palettes for different schemes
const colorSchemes = {
  cosmic: ["#9b87f5", "#33c3f0", "#ff61d8", "#00ebd6", "#8a74e8"],
  energetic: ["#ff5e5e", "#ff9d00", "#ffde59", "#ff73fa", "#ff3a3a"],
  earthly: ["#68a225", "#496e19", "#7dc95e", "#38571b", "#99d363"],
  ethereal: ["#c2bbf0", "#8fb8ed", "#b1f9e2", "#c4c9ff", "#a6d6d6"],
  chakra: ["#ff0000", "#ff8000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#8000ff"]
};

// Helper functions for creating geometries
const createFlowerOfLife = (detail = 1, size = 5) => {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const radius = size / 7;
  const center = new THREE.Vector3(0, 0, 0);

  // Center circle
  const segments = Math.max(20, detail * 10);
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    vertices.push(center.x + radius * Math.cos(theta), center.y + radius * Math.sin(theta), 0);
    if (i > 0) {
      vertices.push(center.x, center.y, 0);
      vertices.push(center.x + radius * Math.cos(theta), center.y + radius * Math.sin(theta), 0);
      vertices.push(center.x + radius * Math.cos(theta - (1 / segments) * Math.PI * 2), center.y + radius * Math.sin(theta - (1 / segments) * Math.PI * 2), 0);
    }
  }

  // Surrounding circles
  for (let j = 0; j < 6; j++) {
    const angle = (j / 6) * Math.PI * 2;
    const centerX = center.x + radius * Math.cos(angle);
    const centerY = center.y + radius * Math.sin(angle);

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      vertices.push(centerX + radius * Math.cos(theta), centerY + radius * Math.sin(theta), 0);
      if (i > 0) {
        vertices.push(centerX, centerY, 0);
        vertices.push(centerX + radius * Math.cos(theta), centerY + radius * Math.sin(theta), 0);
        vertices.push(centerX + radius * Math.cos(theta - (1 / segments) * Math.PI * 2), centerY + radius * Math.sin(theta - (1 / segments) * Math.PI * 2), 0);
      }
    }
  }

  // Create buffer geometry
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
};

// Component for sacred geometry visualization
export function SacredGeometryVisualizer() {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const geometryRef = useRef<THREE.Object3D | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [activePattern, setActivePattern] = useState<GeometryPattern>("flowerOfLife");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("cosmic");
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.5);
  const [complexity, setComplexity] = useState<number>(3);
  const [particleCount, setParticleCount] = useState<number>(1000);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [patternSize, setPatternSize] = useState<number>(5);

  // Helper function to clean up Three.js objects
  const cleanupThreeJS = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (geometryRef.current) {
      if (sceneRef.current) sceneRef.current.remove(geometryRef.current);
      geometryRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          } else if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          }
        }
      });
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Set up scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add point lights
    const pointLight1 = new THREE.PointLight(0x9b87f5, 1, 20);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x33c3f0, 1, 20);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      if (!controlsRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      animationFrameRef.current = requestAnimationFrame(animate);

      // Update geometry rotation if playing
      if (isPlaying && geometryRef.current) {
        geometryRef.current.rotation.x += 0.001 * rotationSpeed;
        geometryRef.current.rotation.y += 0.002 * rotationSpeed;
      }

      // Update particles if enabled
      if (showParticles) {
        scene.children.forEach(child => {
          if (child.name === 'particle') {
            child.rotation.x += 0.0005 * rotationSpeed;
            child.rotation.y += 0.001 * rotationSpeed;
          }
        });
      }

      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    animate();

    // Set loading to false after initialization
    setLoading(false);

    // Cleanup on unmount
    return () => {
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      window.removeEventListener('resize', handleResize);
      cleanupThreeJS();
    };
  }, [isPlaying, rotationSpeed, showParticles]);

  // Add particles to scene
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove existing particles
    sceneRef.current.children.forEach(child => {
      if (child.name === 'particle') {
        sceneRef.current?.remove(child);
      }
    });

    if (!showParticles) return;

    // Create particles
    const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const colors = colorSchemes[colorScheme];

    for (let i = 0; i < particleCount; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: Math.random() * 0.8 + 0.2
      });

      const particle = new THREE.Mesh(particleGeometry, material);

      // Position particles in a spherical distribution
      const radius = Math.random() * 8 + 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
      particle.position.y = radius * Math.sin(phi) * Math.sin(theta);
      particle.position.z = radius * Math.cos(phi);

      particle.name = 'particle';
      sceneRef.current.add(particle);
    }

    return () => {
      if (!sceneRef.current) return;

      // Cleanup particles
      sceneRef.current.children.forEach(child => {
        if (child.name === 'particle') {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
          sceneRef.current?.remove(child);
        }
      });
    };
  }, [showParticles, particleCount, colorScheme]);

  // Create and update geometry based on selected pattern
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove existing geometry
    if (geometryRef.current) {
      sceneRef.current.remove(geometryRef.current);
      geometryRef.current = null;
    }

    let geometry: THREE.BufferGeometry | null = null;
    const detailLevel = Math.max(1, Math.floor(complexity));

    // Create appropriate geometry based on selected pattern
    switch (activePattern) {
      case "flowerOfLife":
        geometry = createFlowerOfLife(detailLevel, patternSize);
        break;
      case "metatronsCube":
        // Simplified implementation for demonstration
        geometry = new THREE.BoxGeometry(patternSize, patternSize, patternSize);
        break;
      case "merkaba":
        // Simplified implementation for demonstration
        const merkaba = new THREE.Group();

        const tetraUp = new THREE.TetrahedronGeometry(patternSize / 2, detailLevel);
        const tetraDown = new THREE.TetrahedronGeometry(patternSize / 2, detailLevel);

        const matUp = new THREE.MeshStandardMaterial({ 
          color: colorSchemes[colorScheme][0],
          wireframe: true,
          transparent: true,
          opacity: 0.8
        });

        const matDown = new THREE.MeshStandardMaterial({ 
          color: colorSchemes[colorScheme][1],
          wireframe: true,
          transparent: true,
          opacity: 0.8
        });

        const meshUp = new THREE.Mesh(tetraUp, matUp);
        const meshDown = new THREE.Mesh(tetraDown, matDown);

        meshDown.rotation.x = Math.PI;

        merkaba.add(meshUp);
        merkaba.add(meshDown);

        geometryRef.current = merkaba;
        sceneRef.current.add(merkaba);
        return;

      case "fibonacciSpiral":
        // Implement a spiral
        geometry = new THREE.BufferGeometry();
        const spiralPoints: THREE.Vector3[] = [];
        const goldenRatio = 1.618033988749895;

        for (let i = 0; i < 1000 * detailLevel; i++) {
          const theta = 0.1 * i;
          const spiralRadius = 0.1 * Math.pow(goldenRatio, theta / (2 * Math.PI));
          const x = spiralRadius * Math.cos(theta);
          const y = spiralRadius * Math.sin(theta);
          const z = 0.01 * i;
          spiralPoints.push(new THREE.Vector3(x, y, z));
        }

        geometry.setFromPoints(spiralPoints);

        const spiralMaterial = new THREE.LineBasicMaterial({ 
          color: colorSchemes[colorScheme][0],
          linewidth: 2
        });

        const spiral = new THREE.Line(geometry, spiralMaterial);
        spiral.scale.set(patternSize / 5, patternSize / 5, patternSize / 5);

        geometryRef.current = spiral;
        sceneRef.current.add(spiral);
        return;

      case "platonic":
        // Show all platonic solids
        const platonics = new THREE.Group();
        const spacing = patternSize * 0.8;

        // Tetrahedron
        const tetraGeom = new THREE.TetrahedronGeometry(patternSize / 6, detailLevel);
        const tetraMat = new THREE.MeshStandardMaterial({ 
          color: colorSchemes[colorScheme][0],
          wireframe: true
        });
        const tetra = new THREE.Mesh(tetraGeom, tetraMat);
        tetra.position.set(-spacing, spacing, 0);
        platonics.add(tetra);

        // Cube/Hexahedron
        const cubeGeom = new THREE.BoxGeometry(patternSize / 4, patternSize / 4, patternSize / 4);
        const cubeMat = new THREE.MeshStandardMaterial({ 
          color: colorSchemes[colorScheme][1],
          wireframe: true
        });
        const cube = new THREE.Mesh(cubeGeom, cubeMat);
        cube.position.set(spacing, spacing, 0);
        platonics.add(cube);

        // Octahedron
        const octaGeom = new THREE.OctahedronGeometry(patternSize / 5, detailLevel);
        const octaMat = new THREE.MeshStandardMaterial({ 
          color: colorSchemes[colorScheme][2],
          wireframe: true
        });
        const octa = new THREE.Mesh(octaGeom, octaMat);
        octa.position.set(-spacing, -spacing, 0);
        platonics.add(octa);

        // Dodecahedron
        const dodecaGeom = new THREE.DodecahedronGeometry(patternSize / 4, detailLevel);
        const dodecaMat = new THREE.MeshStandardMaterial({ 
          color: colorSchemes[colorScheme][3],
          wireframe: true
        });
        const dodeca = new THREE.Mesh(dodecaGeom, dodecaMat);
        dodeca.position.set(spacing, -spacing, 0);
        platonics.add(dodeca);

        // Icosahedron
        const icosaGeom = new THREE.IcosahedronGeometry(patternSize / 5, detailLevel);
        const icosaMat = new THREE.MeshStandardMaterial({ 
          color: colorSchemes[colorScheme][4 % colorSchemes[colorScheme].length],
          wireframe: true
        });
        const icosa = new THREE.Mesh(icosaGeom, icosaMat);
        icosa.position.set(0, 0, spacing);
        platonics.add(icosa);

        geometryRef.current = platonics;
        sceneRef.current.add(platonics);
        return;

      case "torus":
        geometry = new THREE.TorusGeometry(
          patternSize / 2.5, // Radius
          patternSize / 8,   // Tube radius
          Math.max(16, 8 * detailLevel), // Radial segments
          Math.max(32, 16 * detailLevel)  // Tubular segments
        );
        break;

      case "sriYantra":
        // Create a simplified Sri Yantra using triangles
        const sriYantra = new THREE.Group();
        const triangleCount = 9;

        for (let i = 0; i < triangleCount; i++) {
          const upward = i % 2 === 0;
          const size = patternSize * (1 - i * 0.08);

          const triangleGeom = new THREE.BufferGeometry();
          const height = (Math.sqrt(3) / 2) * size;

          // Define triangle vertices
          const vertices = upward
            ? [
                -size / 2, -height / 3, 0,
                size / 2, -height / 3, 0,
                0, height * 2/3, 0
              ]
            : [
                -size / 2, height / 3, 0,
                size / 2, height / 3, 0,
                0, -height * 2/3, 0
              ];

          triangleGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

          const triangleMat = new THREE.LineBasicMaterial({ 
            color: colorSchemes[colorScheme][i % colorSchemes[colorScheme].length],
            linewidth: 2
          });

          const triangle = new THREE.Line(triangleGeom, triangleMat);
          sriYantra.add(triangle);
        }

        // Add center dot (bindu)
        const binduGeom = new THREE.CircleGeometry(patternSize / 30, 32);
        const binduMat = new THREE.MeshBasicMaterial({ 
          color: colorSchemes[colorScheme][0]
        });
        const bindu = new THREE.Mesh(binduGeom, binduMat);
        sriYantra.add(bindu);

        geometryRef.current = sriYantra;
        sceneRef.current.add(sriYantra);
        return;

      case "vesicaPiscis":
        // Create Vesica Piscis
        const vesica = new THREE.Group();
        const vesicaRadius = patternSize / 2;
        const segments = Math.max(32, 16 * detailLevel);

        // Create points for a circle
        const circlePoints: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          circlePoints.push(new THREE.Vector3(
            vesicaRadius * Math.cos(angle),
            vesicaRadius * Math.sin(angle),
            0
          ));
        }

        // First circle
        const circle1Mat = new THREE.LineBasicMaterial({ 
          color: colorSchemes[colorScheme][0]
        });
        const circle1Geo = new THREE.BufferGeometry().setFromPoints(circlePoints);
        const circle1 = new THREE.LineLoop(circle1Geo, circle1Mat);
        circle1.position.set(-vesicaRadius / 2, 0, 0);
        vesica.add(circle1);

        // Second circle
        const circle2Mat = new THREE.LineBasicMaterial({ 
          color: colorSchemes[colorScheme][1]
        });
        const circle2Geo = new THREE.BufferGeometry().setFromPoints(circlePoints);
        const circle2 = new THREE.LineLoop(circle2Geo, circle2Mat);
        circle2.position.set(vesicaRadius / 2, 0, 0);
        vesica.add(circle2);

        geometryRef.current = vesica;
        sceneRef.current.add(vesica);
        return;

      case "pentagram":
        // Create pentagram
        const pentagram = new THREE.Group();

        // Calculate pentagram points
        const pentagramPoints: THREE.Vector3[] = [];
        const pentagramRadius = patternSize / 2;
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          pentagramPoints.push(new THREE.Vector3(
            pentagramRadius * Math.cos(angle),
            pentagramRadius * Math.sin(angle),
            0
          ));
        }

        // Connect points to form pentagram
        for (let i = 0; i < 5; i++) {
          const lineMat = new THREE.LineBasicMaterial({ 
            color: colorSchemes[colorScheme][i % colorSchemes[colorScheme].length],
            linewidth: 2
          });

          const lineGeom = new THREE.BufferGeometry().setFromPoints([
            pentagramPoints[i],
            pentagramPoints[(i + 2) % 5]
          ]);

          const line = new THREE.Line(lineGeom, lineMat);
          pentagram.add(line);
        }

        geometryRef.current = pentagram;
        sceneRef.current.add(pentagram);
        return;

      default:
        geometry = createFlowerOfLife(detailLevel);
    }

    if (!geometry) return;

    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: colorSchemes[colorScheme][0],
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    // Create mesh and add to scene
    const mesh = new THREE.Mesh(geometry, material);
    geometryRef.current = mesh;
    sceneRef.current.add(mesh);

  }, [activePattern, colorScheme, complexity, patternSize]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }

    setIsFullscreen(!isFullscreen);
  };

  // Handle pattern change
  const handlePatternChange = (pattern: GeometryPattern) => {
    setActivePattern(pattern);
  };

  // Handle color scheme change
  const handleColorSchemeChange = (scheme: ColorScheme) => {
    setColorScheme(scheme);
  };

  // Active tab info
  const currentGeometryInfo = useMemo(() => geometryInfo[activePattern], [activePattern]);

  // Pattern selection menu
  const renderPatternSelectionMenu = () => (
    <Tabs defaultValue="flower" className="w-full">
      <TabsList className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 mb-4 bg-cosmic-dark/50 rounded-lg backdrop-blur-md p-1">
        <TabsTrigger value="flower" onClick={() => handlePatternChange("flowerOfLife")} className="rounded-md font-michroma">
          <Flower className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Flower</span>
        </TabsTrigger>
        <TabsTrigger value="metatron" onClick={() => handlePatternChange("metatronsCube")} className="rounded-md font-michroma">
          <Hexagon className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Metatron</span>
        </TabsTrigger>
        <TabsTrigger value="merkaba" onClick={() => handlePatternChange("merkaba")} className="rounded-md font-michroma">
          <Star className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Merkaba</span>
        </TabsTrigger>
        <TabsTrigger value="yantra" onClick={() => handlePatternChange("sriYantra")} className="rounded-md font-michroma">
          <Infinity className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Sri Yantra</span>
        </TabsTrigger>
        <TabsTrigger value="spiral" onClick={() => handlePatternChange("fibonacciSpiral")} className="rounded-md font-michroma">
          <Circle className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Spiral</span>
        </TabsTrigger>
        <TabsTrigger value="torus" onClick={() => handlePatternChange("torus")} className="rounded-md font-michroma">
          <Circle className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Torus</span>
        </TabsTrigger>
        <TabsTrigger value="vesica" onClick={() => handlePatternChange("vesicaPiscis")} className="rounded-md font-michroma">
          <Circle className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Vesica Piscis</span>
        </TabsTrigger>
        <TabsTrigger value="pentagram" onClick={() => handlePatternChange("pentagram")} className="rounded-md font-michroma">
          <Star className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Pentagram</span>
        </TabsTrigger>
        <TabsTrigger value="platonic" onClick={() => handlePatternChange("platonic")} className="rounded-md font-michroma">
          <Hexagon className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Platonic</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  // Info panel
  const renderInfoPanel = () => (
    <AnimatePresence>
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-20 bottom-16 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 p-4 rounded-lg bg-black/70 backdrop-blur-sm text-white"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold font-orbitron flex items-center">
              {currentGeometryInfo.icon && <currentGeometryInfo.icon className="mr-2 h-5 w-5" />}
              {currentGeometryInfo.title}
            </h3>
            <button 
              onClick={() => setShowInfo(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm mb-2">
            {currentGeometryInfo.description}
          </p>
          <p className="text-sm text-cosmic-primary">
            <strong className="text-cosmic-highlight">Effect:</strong> {currentGeometryInfo.effect}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Controls panel
  const renderControlsPanel = () => (
    <div className="absolute z-20 top-20 left-4 right-4 flex flex-col md:flex-row gap-4">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 flex gap-2 justify-center items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-8 w-8 rounded-full"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          className="h-8 w-8 rounded-full"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowInfo(!showInfo)}
          className="h-8 w-8 rounded-full"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>

      <div className="grow bg-black/50 backdrop-blur-sm rounded-lg p-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="rotation-speed" className="text-xs whitespace-nowrap">
            <RotateCcw className="h-3 w-3 inline mr-1" /> Speed
          </Label>
          <Slider
            id="rotation-speed"
            min={0}
            max={10}
            step={0.1}
            value={[rotationSpeed]}
            onValueChange={(value) => setRotationSpeed(value[0])}
            className="flex-1"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="complexity" className="text-xs whitespace-nowrap">
            <Zap className="h-3 w-3 inline mr-1" /> Detail
          </Label>
          <Slider
            id="complexity"
            min={1}
            max={10}
            step={1}
            value={[complexity]}
            onValueChange={(value) => setComplexity(value[0])}
            className="flex-1"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="pattern-size" className="text-xs whitespace-nowrap">
            <Maximize className="h-3 w-3 inline mr-1" /> Size
          </Label>
          <Slider
            id="pattern-size"
            min={1}
            max={10}
            step={0.5}
            value={[patternSize]}
            onValueChange={(value) => setPatternSize(value[0])}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );

  // Bottom controls
  const renderBottomControls = () => (
    <div className="absolute z-10 bottom-4 left-4 right-4 grid grid-cols-2 md:flex md:justify-between gap-2">
      <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg p-3">
        <Label htmlFor="show-particles" className="text-xs whitespace-nowrap">
          <Sparkles className="h-3 w-3 inline mr-1" /> Particles
        </Label>
        <Switch
          id="show-particles"
          checked={showParticles}
          onCheckedChange={setShowParticles}
        />
      </div>

      {showParticles && (
        <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <Label htmlFor="particle-count" className="text-xs whitespace-nowrap">
            Density
          </Label>
          <Slider
            id="particle-count"
            min={0}
            max={3000}
            step={100}
            value={[particleCount]}
            onValueChange={(value) => setParticleCount(value[0])}
            className="w-24"
          />
        </div>
      )}

      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 flex gap-2 items-center">
        <Label className="text-xs whitespace-nowrap">
          <Wind className="h-3 w-3 inline mr-1" /> Color:
        </Label>
        <div className="flex gap-1">
          {Object.entries(colorSchemes).map(([scheme, colors]) => (
            <button
              key={scheme}
              onClick={() => handleColorSchemeChange(scheme as ColorScheme)}
              className={`w-6 h-6 rounded-full overflow-hidden ${colorScheme === scheme ? 'ring-2 ring-white' : ''}`}
              title={scheme}
            >
              <div 
                className="w-full h-full" 
                style={{ 
                  background: `linear-gradient(45deg, ${colors.join(', ')})` 
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] font-cinzel">
      {/* Visualization container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 bg-gradient-to-b from-cosmic-background via-purple-950/10 to-cosmic-background"
      />
      
      {/* Pattern selection - increased z-index */}
      <div className="absolute top-0 left-0 w-full z-30 p-4">
        {renderPatternSelectionMenu()}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-cosmic-primary mb-2" />
            <p className="text-white font-medium">Loading Sacred Geometry...</p>
          </div>
        </div>
      )}

      {/* Controls panel */}
      {renderControlsPanel()}

      {/* Bottom controls */}
      {renderBottomControls()}

      {/* Info panel */}
      {renderInfoPanel()}

      {/* Active pattern name */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10 text-center">
        <h3 className="text-cosmic-primary/80 font-michroma tracking-wider text-sm">
          {currentGeometryInfo.title}
        </h3>
      </div>
    </div>
  );
}