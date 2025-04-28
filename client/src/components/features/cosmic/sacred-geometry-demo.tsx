// Import utilities and base components
import { cn } from '@/lib/utils'
import React from 'react'
import { Button } from "@/components/ui/button"

/**
 * sacred-geometry-demo.tsx
 * 
 * Component Type: cosmic
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */
/**
 * sacred-geometry-demo.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState } from "react"
// Import the sacred geometry components
import {
  // Traditional containers
  HexagonContainer,
  OctagonContainer,
  PentagonContainer,
  TriangleInterlockContainer,
  TriangleContainer,
  InvertedTriangleContainer,
  CircleContainer,
  StarburstContainer,
  AdaptiveTextContainer,
  SacredGeometryCss,
  
  // Improved responsive containers
  SimpleHexagon,
  SimpleOctagon,
  SimpleTriangle,
  SimpleInvertedTriangle,
  SimpleCircle,
  SimpleStarburst
} from "@/components/ui/cosmic/sacred-geometry"

export function SacredGeometryDemo() {
  const [textContent, setTextContent] = useState({
    short: "Sacred geometry is the blueprint of creation and the genesis of all form.",
    medium:
      "Sacred geometry is the blueprint of creation and the genesis of all form. It is an ancient science that explores and explains the energy patterns that create and unify all things and reveals the precise way that the energy of creation organizes itself.",
    long: "Sacred geometry is the blueprint of creation and the genesis of all form. It is an ancient science that explores and explains the energy patterns that create and unify all things and reveals the precise way that the energy of creation organizes itself. Every natural pattern of growth or movement conforms inevitably to one or more geometric shapes. Sacred geometry is the modern bridge between science, physics and spirituality. Viewing and contemplating these sacred geometric patterns can lead to higher consciousness and awareness of the divine nature of reality.",
  })

  const [currentText, setCurrentText] = useState<"short" | "medium" | "long">("medium")

  return (
    <div className="space-y-8 py-8">
      {/* Add the global CSS for sacred geometry components */}
      <SacredGeometryCss />
      
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={() => setCurrentText("short")}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base ${currentText === "short" ? "bg-purple-600" : "bg-purple-900"}`}
        >
          Short Text
        </button>
        <button
          onClick={() => setCurrentText("medium")}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base ${currentText === "medium" ? "bg-purple-600" : "bg-purple-900"}`}
        >
          Medium Text
        </button>
        <button
          onClick={() => setCurrentText("long")}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base ${currentText === "long" ? "bg-purple-600" : "bg-purple-900"}`}
        >
          Long Text
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="h-64">
          <HexagonContainer className="w-full h-full" maxLines={4}>
            <h3 className="text-xl font-bold mb-2">Hexagon Container</h3>
            <p>{textContent[currentText]}</p>
          </HexagonContainer>
        </div>

        <div className="h-64">
          <OctagonContainer className="w-full h-full" glowColor="rgba(14, 165, 233, 0.5)" maxLines={4}>
            <h3 className="text-xl font-bold mb-2">Octagon Container</h3>
            <p>{textContent[currentText]}</p>
          </OctagonContainer>
        </div>

        <div className="h-64">
          <PentagonContainer className="w-full h-full" glowColor="rgba(217, 70, 239, 0.5)" maxLines={4}>
            <h3 className="text-xl font-bold mb-2">Pentagon Container</h3>
            <p>{textContent[currentText]}</p>
          </PentagonContainer>
        </div>

        <div className="h-64">
          <TriangleInterlockContainer className="w-full h-full" glowColor="rgba(20, 184, 166, 0.5)" maxLines={4}>
            <h3 className="text-xl font-bold mb-2">Triangle Interlock</h3>
            <p>{textContent[currentText]}</p>
          </TriangleInterlockContainer>
        </div>

        <div className="h-64 md:col-span-2">
          <AdaptiveTextContainer
            className="w-full h-full"
            clipPath="polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
            glowColor="rgba(139, 92, 246, 0.5)"
            maxLines={6}
          >
            <h3 className="text-xl font-bold mb-2">Advanced Adaptive Container</h3>
            <p>{textContent[currentText]}</p>
          </AdaptiveTextContainer>
        </div>
      </div>
    </div>
  )
}



/**
 * Original SacredGeometryDemo component merged from: client/src/components/common/sacred-geometry-demo.tsx
 * Merge date: 2025-04-05
 */
function SacredGeometryDemoOriginal() {
  const [textContent, setTextContent] = useState({
    short: "Sacred geometry is the blueprint of creation and the genesis of all form.",
    medium:
      "Sacred geometry is the blueprint of creation and the genesis of all form. It is an ancient science that explores and explains the energy patterns that create and unify all things and reveals the precise way that the energy of creation organizes itself.",
    long: "Sacred geometry is the blueprint of creation and the genesis of all form. It is an ancient science that explores and explains the energy patterns that create and unify all things and reveals the precise way that the energy of creation organizes itself. Every natural pattern of growth or movement conforms inevitably to one or more geometric shapes. Sacred geometry is the modern bridge between science, physics and spirituality. Viewing and contemplating these sacred geometric patterns can lead to higher consciousness and awareness of the divine nature of reality.",
  })

  const [currentText, setCurrentText] = useState<"short" | "medium" | "long">("medium")

  return (
    <div className="space-y-8 py-8">
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => setCurrentText("short")}
          className={`px-4 py-2 rounded-md ${currentText === "short" ? "bg-purple-600" : "bg-purple-900"}`}
        >
          Short Text
        </button>
        <button
          onClick={() => setCurrentText("medium")}
          className={`px-4 py-2 rounded-md ${currentText === "medium" ? "bg-purple-600" : "bg-purple-900"}`}
        >
          Medium Text
        </button>
        <button
          onClick={() => setCurrentText("long")}
          className={`px-4 py-2 rounded-md ${currentText === "long" ? "bg-purple-600" : "bg-purple-900"}`}
        >
          Long Text
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-64">
          <HexagonContainer className="w-full h-full">
            <h3 className="text-xl font-bold mb-2">Hexagon Container</h3>
            <p>{textContent[currentText]}</p>
          </HexagonContainer>
        </div>

        <div className="h-64">
          <OctagonContainer className="w-full h-full" glowColor="rgba(14, 165, 233, 0.5)">
            <h3 className="text-xl font-bold mb-2">Octagon Container</h3>
            <p>{textContent[currentText]}</p>
          </OctagonContainer>
        </div>

        <div className="h-64">
          <PentagonContainer className="w-full h-full" glowColor="rgba(217, 70, 239, 0.5)">
            <h3 className="text-xl font-bold mb-2">Pentagon Container</h3>
            <p>{textContent[currentText]}</p>
          </PentagonContainer>
        </div>

        <div className="h-64">
          <TriangleInterlockContainer className="w-full h-full" glowColor="rgba(20, 184, 166, 0.5)">
            <h3 className="text-xl font-bold mb-2">Triangle Interlock</h3>
            <p>{textContent[currentText]}</p>
          </TriangleInterlockContainer>
        </div>

        <div className="h-64 md:col-span-2">
          <AdaptiveTextContainer
            className="w-full h-full"
            clipPath="polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
            glowColor="rgba(139, 92, 246, 0.5)"
            maxLines={8}
          >
            <h3 className="text-xl font-bold mb-2">Advanced Adaptive Container</h3>
            <p>{textContent[currentText]}</p>
          </AdaptiveTextContainer>
        </div>
      </div>
    </div>
  )
}



/**
 * Original SacredGeometryDemo component merged from: client/src/components/cosmic/SacredGeometryDemo.tsx
 * Merge date: 2025-04-05
 */
function SacredGeometryDemoSecondOriginal() {
  const [textContent, setTextContent] = useState({
    short: "Sacred geometry is the blueprint of creation and the genesis of all form.",
    medium:
      "Sacred geometry explores and explains the energy patterns that create and unify all things.",
    long: "Sacred geometry reveals how basic building blocks of existence arise from simple geometric shapes and proportion.",
  })

  const [currentText, setCurrentText] = useState<"short" | "medium" | "long">("medium")

  return (
    <div className="space-y-8 py-8">
      <SacredGeometryCss />

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <Button
          onClick={() => setCurrentText("short")}
          size="sm"
          className={`${currentText === "short" ? "bg-cyan-600" : "bg-cyan-900"}`}
        >
          Short Text
        </Button>
        <Button
          onClick={() => setCurrentText("medium")}
          size="sm"
          className={`${currentText === "medium" ? "bg-cyan-600" : "bg-cyan-900"}`}
        >
          Medium Text
        </Button>
        <Button
          onClick={() => setCurrentText("long")}
          size="sm"
          className={`${currentText === "long" ? "bg-cyan-600" : "bg-cyan-900"}`}
        >
          Long Text
        </Button>
      </div>

      {/* First row: Original containers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="h-64">
          <HexagonContainer className="w-full h-full" maxLines={3}>
            <h3 className="text-lg font-bold mb-2">Hexagon</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </HexagonContainer>
        </div>

        <div className="h-64">
          <TriangleContainer className="w-full h-full" glowColor="rgba(6, 182, 212, 0.5)" maxLines={3}>
            <h3 className="text-lg font-bold mb-2">Triangle</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </TriangleContainer>
        </div>

        <div className="h-64">
          <InvertedTriangleContainer className="w-full h-full" glowColor="rgba(14, 165, 233, 0.5)" maxLines={3}>
            <h3 className="text-lg font-bold mb-2">Inverted Triangle</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </InvertedTriangleContainer>
        </div>
      </div>
      
      {/* Divider with title */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-lg font-medium bg-black text-white">
            Improved Responsive Containers
          </span>
        </div>
      </div>
      
      {/* Second row: New improved responsive containers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="h-64">
          <SimpleHexagon 
            className="w-full h-full" 
            glowColor="rgba(20, 184, 166, 0.5)"
            responsive={true}
          >
            <h3 className="text-lg font-bold mb-2">Improved Hexagon</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </SimpleHexagon>
        </div>

        <div className="h-64">
          <SimpleTriangle 
            className="w-full h-full" 
            glowColor="rgba(6, 182, 212, 0.5)"
            responsive={true}
          >
            <h3 className="text-lg font-bold mb-2">Improved Triangle</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </SimpleTriangle>
        </div>

        <div className="h-64">
          <SimpleInvertedTriangle 
            className="w-full h-full" 
            glowColor="rgba(14, 165, 233, 0.5)"
            responsive={true}
          >
            <h3 className="text-lg font-bold mb-2">Improved Inverted Triangle</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </SimpleInvertedTriangle>
        </div>

        <div className="h-64">
          <SimpleCircle
            className="w-full h-full"
            glowColor="rgba(20, 184, 166, 0.5)"
            rotateSpeed={120}
            responsive={true}
          >
            <h3 className="text-lg font-bold mb-2">Improved Circle</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </SimpleCircle>
        </div>

        <div className="h-64">
          <SimpleOctagon
            className="w-full h-full"
            glowColor="rgba(8, 145, 178, 0.5)"
            responsive={true}
          >
            <h3 className="text-lg font-bold mb-2">Improved Octagon</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </SimpleOctagon>
        </div>

        <div className="h-64">
          <SimpleStarburst
            className="w-full h-full"
            glowColor="rgba(147, 51, 234, 0.5)"
            responsive={true}
          >
            <h3 className="text-lg font-bold mb-2">Improved Starburst</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </SimpleStarburst>
        </div>
      </div>
    </div>
  )
}