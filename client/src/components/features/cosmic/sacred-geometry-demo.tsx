import { 
  HexagonContainer, 
  TriangleContainer, 
  InvertedTriangleContainer,
  CircleContainer, 
  OctagonContainer,
  StarburstContainer,
  SacredGeometryCss 
} from "./ui/sacred-geometry"
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
import {
  HexagonContainer,
  OctagonContainer,
  PentagonContainer,
  TriangleInterlockContainer,
  AdaptiveTextContainer,
} from "@/components/features/cosmic/sacred-geometry"

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
function SacredGeometryDemoOriginal() {
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

      <div className="flex justify-center space-x-4 mb-8">
        <Button
          onClick={() => setCurrentText("short")}
          className={`${currentText === "short" ? "bg-cyan-600" : "bg-cyan-900"}`}
        >
          Short Text
        </Button>
        <Button
          onClick={() => setCurrentText("medium")}
          className={`${currentText === "medium" ? "bg-cyan-600" : "bg-cyan-900"}`}
        >
          Medium Text
        </Button>
        <Button
          onClick={() => setCurrentText("long")}
          className={`${currentText === "long" ? "bg-cyan-600" : "bg-cyan-900"}`}
        >
          Long Text
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="h-64">
          <HexagonContainer className="w-full h-full">
            <h3 className="text-lg font-bold mb-2">Hexagon</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </HexagonContainer>
        </div>

        <div className="h-64">
          <TriangleContainer className="w-full h-full" glowColor="rgba(6, 182, 212, 0.5)">
            <h3 className="text-lg font-bold mb-2">Triangle</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </TriangleContainer>
        </div>

        <div className="h-64">
          <InvertedTriangleContainer className="w-full h-full" glowColor="rgba(14, 165, 233, 0.5)">
            <h3 className="text-lg font-bold mb-2">Inverted Triangle</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </InvertedTriangleContainer>
        </div>

        <div className="h-64">
          <CircleContainer
            className="w-full h-full"
            glowColor="rgba(20, 184, 166, 0.5)"
            rotateSpeed={120}
          >
            <h3 className="text-lg font-bold mb-2">Circle</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </CircleContainer>
        </div>

        <div className="h-64">
          <OctagonContainer
            className="w-full h-full"
            glowColor="rgba(8, 145, 178, 0.5)"
          >
            <h3 className="text-lg font-bold mb-2">Octagon</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </OctagonContainer>
        </div>

        <div className="h-64">
          <StarburstContainer
            className="w-full h-full"
            glowColor="rgba(147, 51, 234, 0.5)"
          >
            <h3 className="text-lg font-bold mb-2">Starburst</h3>
            <p className="text-sm">{textContent[currentText]}</p>
          </StarburstContainer>
        </div>
      </div>
    </div>
  )
}