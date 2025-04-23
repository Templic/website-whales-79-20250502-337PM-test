import {
  HexagonContainer,
  OctagonContainer,
  PentagonContainer,
  TriangleInterlockContainer,
  AdaptiveTextContainer,
} from "@/components/ui/cosmic/sacred-geometry"

export default function SacredGeometryDemo() {
  return (
    <div className="container mx-auto py-20">
      <h1 className="text-3xl font-bold text-center mb-12">Sacred Geometry Containers</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Hexagon Container */}
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Hexagon</h2>
          <HexagonContainer className="w-full aspect-square">
            <h3 className="text-lg font-medium mb-2">Cosmic Harmony</h3>
            <p className="text-sm">
              The hexagon represents balance and harmony in the universe, connecting the physical and spiritual realms.
            </p>
          </HexagonContainer>
        </div>

        {/* Octagon Container */}
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Octagon</h2>
          <OctagonContainer className="w-full aspect-square">
            <h3 className="text-lg font-medium mb-2">Infinite Potential</h3>
            <p className="text-sm">
              The octagon symbolizes regeneration, rebirth, and the infinite potential of consciousness.
            </p>
          </OctagonContainer>
        </div>

        {/* Pentagon Container */}
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Pentagon</h2>
          <PentagonContainer className="w-full aspect-square">
            <h3 className="text-lg font-medium mb-2">Divine Proportion</h3>
            <p className="text-sm">
              The pentagon embodies the golden ratio and represents the human form in divine proportion.
            </p>
          </PentagonContainer>
        </div>

        {/* Triangle Interlock Container */}
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Triangle Interlock</h2>
          <TriangleInterlockContainer className="w-full aspect-square">
            <h3 className="text-lg font-medium mb-2">Sacred Union</h3>
            <p className="text-sm">
              Interlocking triangles symbolize the union of opposites, representing divine masculine and feminine
              energies.
            </p>
          </TriangleInterlockContainer>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center mt-16 mb-8">Text Adaptation Examples</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Short Text Example */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Short Text</h3>
          <AdaptiveTextContainer
            className="w-full aspect-square"
            clipPath="polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"
          >
            <h3 className="text-xl font-medium mb-2">Cosmic Vibration</h3>
            <p className="text-sm">A brief message about sacred geometry.</p>
          </AdaptiveTextContainer>
        </div>

        {/* Medium Text Example */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Medium Text</h3>
          <AdaptiveTextContainer
            className="w-full aspect-square"
            clipPath="polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)"
            glowColor="rgba(14, 165, 233, 0.5)"
          >
            <h3 className="text-xl font-medium mb-2">Sacred Patterns</h3>
            <p className="text-sm">
              Sacred geometry contains the visual representations of universal patterns of creation. These patterns
              reveal how energy flows and connects throughout the universe.
            </p>
          </AdaptiveTextContainer>
        </div>

        {/* Long Text Example */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Long Text</h3>
          <AdaptiveTextContainer
            className="w-full aspect-square"
            clipPath="polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"
            glowColor="rgba(217, 70, 239, 0.5)"
            maxLines={6}
          >
            <h3 className="text-xl font-medium mb-2">Universal Language</h3>
            <p className="text-sm">
              Sacred geometry is the universal language of creation, the blueprint of all existence. It represents the
              patterns that form everything from microscopic cells to the infinite cosmos. These geometric archetypes of
              creation are found in the arrangements of atoms, the proportions of human bodies, the structure of
              crystals, the spiral of galaxies, and the design of plants.
            </p>
          </AdaptiveTextContainer>
        </div>

        {/* Very Long Text Example */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Very Long Text</h3>
          <AdaptiveTextContainer
            className="w-full aspect-square"
            clipPath="polygon(50% 0%, 100% 100%, 0% 100%)"
            glowColor="rgba(20, 184, 166, 0.5)"
            maxLines={8}
          >
            <h3 className="text-xl font-medium mb-2">Cosmic Blueprint</h3>
            <p className="text-sm">
              Sacred geometry is the foundational pattern of creation that exists throughout the universe. From the
              smallest subatomic particles to the vast cosmic web of galaxies, these geometric patterns reveal the
              fundamental structure of reality. The Flower of Life, Metatron's Cube, Sri Yantra, and other sacred
              patterns have been revered across cultures for millennia as representations of divine intelligence. They
              demonstrate how energy flows, matter forms, and consciousness evolves through mathematical precision and
              harmonic resonance.
            </p>
          </AdaptiveTextContainer>
        </div>
      </div>
    </div>
  )
}

