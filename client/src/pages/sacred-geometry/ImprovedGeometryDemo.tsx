import React from 'react';
import { SacredGeometryCss } from '@/components/ui/cosmic/sacred-geometry';
import { 
  SimpleTriangle, 
  SimpleInvertedTriangle, 
  SimpleHexagon, 
  SimpleOctagon,
  SimpleStarburst,
  SimpleCircle
} from '@/components/ui/cosmic/sacred-geometry';

/**
 * ImprovedGeometryDemo showcases the responsive geometric shapes
 * that automatically adjust text to fit their unique shape outlines.
 * These components can be used throughout the application.
 */
const ImprovedGeometryDemo: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Include the global CSS for sacred geometry shapes */}
      <SacredGeometryCss />
      
      <header className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
          Improved Sacred Geometry Containers
        </h1>
        <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-80">
          These responsive containers intelligently adapt text to fit the shape boundaries, 
          creating visually harmonious content that respects the natural flow of sacred geometry.
        </p>
      </header>

      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">Triangle-Based Shapes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-80">
            <SimpleTriangle
              className="w-full h-full"
              glowColor="rgba(6, 182, 212, 0.7)"
              responsive={true}
            >
              <h3 className="text-xl font-bold mb-2">Triangle</h3>
              <p>
                The triangle represents the divine trinity, the union of body, mind, and spirit.
                Its ascending shape symbolizes growth, transformation, and spiritual evolution.
                Notice how the text adapts to the triangular shape.
              </p>
              <button className="cosmic-btn mt-4">Explore</button>
            </SimpleTriangle>
          </div>
          <div className="h-80">
            <SimpleInvertedTriangle
              className="w-full h-full"
              glowColor="rgba(124, 58, 237, 0.7)"
              responsive={true}
            >
              <h3 className="text-xl font-bold mb-2">Inverted Triangle</h3>
              <p>
                The inverted triangle symbolizes feminine energy, water and flow.
                Its downward-facing point represents the descent of consciousness into matter.
                Text automatically adjusts to the shape, wider at top, narrower at bottom.
              </p>
              <button className="cosmic-btn mt-4">Explore</button>
            </SimpleInvertedTriangle>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">Polygon Shapes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-80">
            <SimpleHexagon
              className="w-full h-full"
              glowColor="rgba(16, 185, 129, 0.7)"
              responsive={true}
            >
              <h3 className="text-xl font-bold mb-2">Hexagon</h3>
              <p>
                The hexagon represents harmony and balance in the universe.
                Found throughout nature, from honeycomb to snowflakes,
                it demonstrates perfect efficiency and cosmic order.
                Text precisely follows the hexagonal constraints.
              </p>
              <button className="cosmic-btn mt-4">Explore</button>
            </SimpleHexagon>
          </div>
          <div className="h-80">
            <SimpleOctagon
              className="w-full h-full"
              glowColor="rgba(79, 70, 229, 0.7)"
              responsive={true}
            >
              <h3 className="text-xl font-bold mb-2">Octagon</h3>
              <p>
                The octagon symbolizes rebirth, regeneration and renewal.
                It bridges the circle and square, uniting heaven and earth.
                Text is carefully contained within the octagonal boundaries.
              </p>
              <button className="cosmic-btn mt-4">Explore</button>
            </SimpleOctagon>
          </div>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">Complex Shapes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-80">
            <SimpleStarburst
              className="w-full h-full"
              glowColor="rgba(236, 72, 153, 0.7)"
              responsive={true}
            >
              <h3 className="text-xl font-bold mb-2">Starburst</h3>
              <p>
                The starburst shape represents divine illumination and cosmic energy.
                It symbolizes the expansion of consciousness and enlightenment.
                Text is carefully positioned to maintain clarity and flow.
              </p>
              <button className="cosmic-btn mt-4">Explore</button>
            </SimpleStarburst>
          </div>
          <div className="h-80">
            <SimpleCircle
              className="w-full h-full"
              glowColor="rgba(239, 68, 68, 0.7)"
              responsive={true}
              rotateSpeed={120}
            >
              <h3 className="text-xl font-bold mb-2">Circle</h3>
              <p>
                The circle represents unity, wholeness, and the infinite cycle of life.
                It has no beginning or end, symbolizing eternity and divine perfection.
                Notice the rotating boundary line with perfectly contained text.
              </p>
              <button className="cosmic-btn mt-4">Explore</button>
            </SimpleCircle>
          </div>
        </div>
      </div>

      <div className="text-center mt-12 mb-8">
        <h2 className="text-2xl font-semibold mb-4">How To Use These Components</h2>
        <div className="max-w-3xl mx-auto bg-black bg-opacity-30 p-6 rounded-lg">
          <pre className="text-left text-sm md:text-base overflow-x-auto">
{`import { 
  SimpleTriangle, 
  SimpleHexagon 
} from '@/components/ui/cosmic/sacred-geometry';

// In your component:
<SimpleHexagon className="w-64 h-64" responsive={true}>
  <h3>Title</h3>
  <p>Content text...</p>
  <button>Action</button>
</SimpleHexagon>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ImprovedGeometryDemo;