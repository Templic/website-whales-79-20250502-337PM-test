import { SacredGeometryDemo } from "@/components/sacred-geometry-demo"
import { CosmicText } from "@/components/ui/cosmic/cosmic-text"

export default function SacredGeometryPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <CosmicText variant="title" className="mb-4">
          Sacred Geometry Containers
        </CosmicText>
        <CosmicText variant="subtitle" className="mb-8">
          Dynamic Text Adaptation Demo
        </CosmicText>
        <p className="max-w-2xl mx-auto text-gray-300">
          These containers automatically adjust text content to fit within their geometric boundaries. Try different
          text lengths to see how the containers adapt.
        </p>
      </div>

      <SacredGeometryDemo />
    </main>
  )
}

