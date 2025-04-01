import { useState } from "react"
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

export function SacredGeometryDemo() {
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