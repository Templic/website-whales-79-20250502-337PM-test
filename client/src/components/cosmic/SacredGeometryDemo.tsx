import { useState } from "react"
import { HexagonContainer, TriangleContainer, CircleContainer, SacredGeometryCss } from "./ui/sacred-geometry"
import { Button } from "@/components/ui/button"

export function SacredGeometryDemo() {
  const [textContent, setTextContent] = useState({
    short: "Sacred geometry is the blueprint of creation and the genesis of all form.",
    medium:
      "Sacred geometry explores and explains the energy patterns that create and unify all things. It reveals how the energy of creation organizes itself.",
    long: "Sacred geometry reveals the relationships between universal energy patterns. It shows how the basic building blocks of existence arise from simple geometric shapes and proportion.",
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-64">
          <HexagonContainer className="w-full h-full">
            <h3 className="text-xl font-bold mb-2">Hexagon Container</h3>
            <p>{textContent[currentText]}</p>
          </HexagonContainer>
        </div>

        <div className="h-64">
          <TriangleContainer className="w-full h-full" glowColor="rgba(6, 182, 212, 0.5)">
            <h3 className="text-xl font-bold mb-2">Triangle Container</h3>
            <p>{textContent[currentText]}</p>
          </TriangleContainer>
        </div>

        <div className="h-64 md:col-span-2">
          <CircleContainer
            className="w-full h-full"
            glowColor="rgba(20, 184, 166, 0.5)"
            rotateSpeed={120}
          >
            <h3 className="text-xl font-bold mb-2">Circle Container</h3>
            <p>{textContent[currentText]}</p>
          </CircleContainer>
        </div>
      </div>
    </div>
  )
}