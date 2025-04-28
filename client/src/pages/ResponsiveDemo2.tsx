/**
 * ResponsiveDemo2.tsx
 * 
 * A fresh implementation of responsive geometric shape containers
 * with clean styling and proper text containment within shapes.
 */

import React from 'react';
import { useOrientation } from '../hooks/use-orientation';
import { 
  SimpleTriangle,
  SimpleInvertedTriangle,
  SimpleHexagon,
  SimpleOctagon,
  SimpleStarburst,
  SimpleCircle
} from '../components/cosmic/SimpleGeometry';

export default function ResponsiveDemo2() {
  const { orientation, deviceType } = useOrientation();

  return (
    <div className="responsive-demo-page p-4 max-w-7xl mx-auto">
      <header className="text-center my-6">
        <h1 className="text-3xl font-bold mb-2">Responsive Geometric Shapes 2</h1>
        <p className="text-lg mb-4">
          Device: <strong>{deviceType}</strong>, 
          Orientation: <strong>{orientation}</strong>
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
        {/* Triangle Shape */}
        <div className="shape-demo">
          <h2 className="text-xl font-semibold mb-3">Triangle</h2>
          <SimpleTriangle>
            <h3 className="text-lg font-medium mb-2">Upward Energy</h3>
            <p>
              Triangles represent growth, harmony, and ascension. This container
              positions content properly within shape boundaries.
            </p>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-2">
              Explore
            </button>
          </SimpleTriangle>
        </div>

        {/* Inverted Triangle Shape */}
        <div className="shape-demo">
          <h2 className="text-xl font-semibold mb-3">Inverted Triangle</h2>
          <SimpleInvertedTriangle>
            <h3 className="text-lg font-medium mb-2">Flowing Energy</h3>
            <p>
              Inverted triangles symbolize water and feminine energy.
              All content remains within the geometric boundaries.
            </p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-2">
              Discover
            </button>
          </SimpleInvertedTriangle>
        </div>

        {/* Hexagon Shape */}
        <div className="shape-demo">
          <h2 className="text-xl font-semibold mb-3">Hexagon</h2>
          <SimpleHexagon>
            <h3 className="text-lg font-medium mb-2">Sacred Geometry</h3>
            <p>
              Hexagons represent balance and harmony. This container adapts
              to different screen sizes while maintaining proper containment.
            </p>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded mt-2">
              Learn More
            </button>
          </SimpleHexagon>
        </div>

        {/* Octagon Shape */}
        <div className="shape-demo">
          <h2 className="text-xl font-semibold mb-3">Octagon</h2>
          <SimpleOctagon>
            <h3 className="text-lg font-medium mb-2">Cosmic Structure</h3>
            <p>
              Octagons symbolize regeneration and rebirth. Content fits 
              perfectly within the octagonal boundaries.
            </p>
            <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded mt-2">
              Analyze
            </button>
          </SimpleOctagon>
        </div>

        {/* Starburst Shape */}
        <div className="shape-demo">
          <h2 className="text-xl font-semibold mb-3">Starburst</h2>
          <SimpleStarburst>
            <h3 className="text-lg font-medium mb-2">Radiant Energy</h3>
            <p>
              Starbursts represent expansion and outward energy.
              Text stays within shape boundaries at all screen sizes.
            </p>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded mt-2">
              Illuminate
            </button>
          </SimpleStarburst>
        </div>

        {/* Circle Shape */}
        <div className="shape-demo">
          <h2 className="text-xl font-semibold mb-3">Circle</h2>
          <SimpleCircle>
            <h3 className="text-lg font-medium mb-2">Eternal Unity</h3>
            <p>
              Circles represent unity, wholeness, and infinity.
              Content fits perfectly in this circular container.
            </p>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mt-2">
              Harmonize
            </button>
          </SimpleCircle>
        </div>
      </div>
    </div>
  );
}