/**
 * ResponsiveDemo.tsx
 * 
 * A page that demonstrates the improved responsive geometric shape containers
 * across different device types and orientations.
 */

import React from 'react';
import { OrientationContainer } from '../components/ui/OrientationLayout';
import { useOrientation } from '../hooks/use-orientation';
import { 
  HexagonContainer, 
  TriangleContainer, 
  InvertedTriangleContainer,
  OctagonContainer,
  StarburstContainer,
  CircleContainer
} from '../components/cosmic/ui/sacred-geometry';

export default function ResponsiveDemo() {
  const { orientation, deviceType } = useOrientation();

  return (
    <div className="responsive-demo-page">
      <OrientationContainer>
        <header className="text-center my-6">
          <h1 className="text-3xl font-bold mb-2">Responsive Geometric Shapes</h1>
          <p className="text-lg">
            Current device: <strong>{deviceType}</strong>, 
            Orientation: <strong>{orientation}</strong>
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
          {/* Hexagon Shape Demo */}
          <div className="shape-demo">
            <h2 className="text-xl font-semibold mb-3">Hexagon Container</h2>
            <HexagonContainer>
              <h3 className="text-lg font-medium mb-2">Sacred Geometry</h3>
              <p>
                This hexagon contains text that will adapt to different screen sizes and orientations.
                Notice how the text flows properly and buttons are sized correctly.
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-2">
                Learn More
              </button>
            </HexagonContainer>
          </div>

          {/* Triangle Shape Demo */}
          <div className="shape-demo">
            <h2 className="text-xl font-semibold mb-3">Triangle Container</h2>
            <TriangleContainer>
              <h3 className="text-lg font-medium mb-2">Upward Energy</h3>
              <p>
                Triangles represent growth, harmony, and ascension. This responsive container
                adjusts content position to utilize space efficiently.
              </p>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-2">
                Explore
              </button>
            </TriangleContainer>
          </div>

          {/* Inverted Triangle Shape Demo */}
          <div className="shape-demo">
            <h2 className="text-xl font-semibold mb-3">Inverted Triangle</h2>
            <InvertedTriangleContainer>
              <h3 className="text-lg font-medium mb-2">Manifesting Form</h3>
              <p>
                The inverted triangle symbolizes water and the feminine principle.
                Text adapts to preserve meaning in different layouts.
              </p>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded mt-2">
                Discover
              </button>
            </InvertedTriangleContainer>
          </div>

          {/* Octagon Shape Demo */}
          <div className="shape-demo">
            <h2 className="text-xl font-semibold mb-3">Octagon Container</h2>
            <OctagonContainer>
              <h3 className="text-lg font-medium mb-2">Balanced Structure</h3>
              <p>
                The octagon represents transition, regeneration and rebirth. 
                Notice how text fills the space efficiently, reducing empty areas.
              </p>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded mt-2">
                Energize
              </button>
            </OctagonContainer>
          </div>

          {/* Starburst Shape Demo */}
          <div className="shape-demo">
            <h2 className="text-xl font-semibold mb-3">Starburst Container</h2>
            <StarburstContainer>
              <h3 className="text-center mt-4 mb-0 font-serif text-xl font-normal">
                The<br />Long<br />Title
              </h3>
              <p className="text-center text-xs">
                the extra long paragraph conforming to shape contours<br />
                the continuation of the paragraph<br />
                contouring the text with<br />
                the shape edges
              </p>
              <button className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-1 px-6 rounded my-1 text-xl">
                button
              </button>
            </StarburstContainer>
          </div>

          {/* Circle Shape Demo */}
          <div className="shape-demo">
            <h2 className="text-xl font-semibold mb-3">Circle Container</h2>
            <CircleContainer>
              <h3 className="text-lg font-medium mb-2">Eternal Wholeness</h3>
              <p>
                The circle represents unity, wholeness and infinity.
                Content stays properly sized regardless of screen orientation.
              </p>
              <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded mt-2">
                Connect
              </button>
            </CircleContainer>
          </div>
        </div>

        <div className="p-6 my-6 bg-gray-800 rounded-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Implementation Details</h2>
          <ul className="list-disc pl-6 space-y-3">
            <li>All geometric containers use CSS custom properties for responsive sizing</li>
            <li>Text flow is optimized with proper line height and spacing</li>
            <li>Mobile portrait view increases content width to avoid one-word-per-line issues</li>
            <li>Buttons are sized appropriately for each device type and orientation</li>
            <li>Custom CSS rules target specific data-shape attributes for fine-tuned adjustments</li>
          </ul>
        </div>
      </OrientationContainer>
    </div>
  );
}