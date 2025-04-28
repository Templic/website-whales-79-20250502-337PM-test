import React from 'react';

// Import our new components
import { 
  SimpleTriangle, 
  SimpleInvertedTriangle, 
  SimpleHexagon, 
  SimpleOctagon,
  SimpleStarburst,
  SimpleCircle
} from '../components/cosmic/SimpleGeometry';

/**
 * ResponsiveDemo2 Page
 * 
 * This page demonstrates the geometric shapes with responsive scaling.
 * Each shape properly contains its content regardless of the screen size.
 */
const ResponsiveDemo2 = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-white text-center text-3xl md:text-4xl font-bold mb-10">
          Responsive Geometric Shapes Demo
        </h1>
        
        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-12">
          These geometric shapes adapt to different screen sizes while keeping content properly contained within their boundaries.
          Resize your browser window to see how they respond.
        </p>
        
        {/* Grid layout for the shapes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Triangle */}
          <div className="w-full">
            <SimpleTriangle className="w-full max-w-[250px] mx-auto">
              <h3>Triangle</h3>
              <p>This shape scales content based on container size. Text and buttons fit properly within boundaries.</p>
              <button className="bg-blue-500 hover:bg-blue-700 text-white rounded">
                Action
              </button>
            </SimpleTriangle>
          </div>
          
          {/* Inverted Triangle */}
          <div className="w-full">
            <SimpleInvertedTriangle className="w-full max-w-[250px] mx-auto">
              <h3>Inverted Triangle</h3>
              <p>Adaptively scaling content ensures elements stay within shape boundaries at all screen sizes.</p>
              <button className="bg-green-500 hover:bg-green-700 text-white rounded">
                Learn
              </button>
            </SimpleInvertedTriangle>
          </div>
          
          {/* Hexagon */}
          <div className="w-full">
            <SimpleHexagon className="w-full max-w-[250px] mx-auto">
              <h3>Hexagon</h3>
              <p>Content adapts to container size. Text sizes and spacing adjust automatically.</p>
              <button className="bg-purple-500 hover:bg-purple-700 text-white rounded">
                Details
              </button>
            </SimpleHexagon>
          </div>
          
          {/* Octagon */}
          <div className="w-full">
            <SimpleOctagon className="w-full max-w-[250px] mx-auto">
              <h3>Octagon</h3>
              <p>Complex shapes maintain proper text containment with adaptive sizing.</p>
              <button className="bg-yellow-500 hover:bg-yellow-700 text-white rounded">
                Explore
              </button>
            </SimpleOctagon>
          </div>
          
          {/* Starburst */}
          <div className="w-full">
            <SimpleStarburst className="w-full max-w-[250px] mx-auto">
              <h3>Star</h3>
              <p>Adaptive scaling ensures content fits in this complex star shape.</p>
              <button className="bg-red-500 hover:bg-red-700 text-white rounded">
                Activate
              </button>
            </SimpleStarburst>
          </div>
          
          {/* Circle */}
          <div className="w-full">
            <SimpleCircle className="w-full max-w-[250px] mx-auto">
              <h3>Circle</h3>
              <p>Perfect content containment with responsive sizing that adapts to size.</p>
              <button className="bg-teal-500 hover:bg-teal-700 text-white rounded">
                Connect
              </button>
            </SimpleCircle>
          </div>
        </div>
        
        {/* Responsive grid - different sizes in a single row */}
        <h2 className="text-white text-center text-2xl font-bold mt-16 mb-10">
          Sizes Comparison
        </h2>
        
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {/* Small */}
          <div className="w-[100px]">
            <SimpleHexagon className="w-full">
              <h3>Small</h3>
              <p>Content adapts to fit in this tiny hexagon.</p>
              <button className="bg-blue-500 text-white rounded">
                Click
              </button>
            </SimpleHexagon>
          </div>
          
          {/* Medium */}
          <div className="w-[200px]">
            <SimpleHexagon className="w-full">
              <h3>Medium</h3>
              <p>The same content in a medium-sized hexagon, properly scaled.</p>
              <button className="bg-blue-500 text-white rounded">
                Click
              </button>
            </SimpleHexagon>
          </div>
          
          {/* Large */}
          <div className="w-[300px]">
            <SimpleHexagon className="w-full">
              <h3>Large</h3>
              <p>The same content in a large hexagon, with text that scales appropriately to fit the space.</p>
              <button className="bg-blue-500 text-white rounded">
                Click
              </button>
            </SimpleHexagon>
          </div>
        </div>
        
        {/* Disabled Adaptive Scaling */}
        <h2 className="text-white text-center text-2xl font-bold mt-16 mb-10">
          With Adaptive Scaling Disabled
        </h2>
        
        <div className="flex flex-wrap justify-center gap-8">
          {/* Adaptive enabled */}
          <div className="w-[150px]">
            <SimpleTriangle className="w-full">
              <h3>Adaptive On</h3>
              <p>Text scales to fit this smaller triangle.</p>
              <button className="bg-green-500 text-white rounded">
                Click
              </button>
            </SimpleTriangle>
          </div>
          
          {/* Adaptive disabled */}
          <div className="w-[150px]">
            <SimpleTriangle className="w-full" adaptiveScaling={false}>
              <h3>Adaptive Off</h3>
              <p>Text stays at a fixed size regardless of container width.</p>
              <button className="bg-red-500 text-white rounded">
                Click
              </button>
            </SimpleTriangle>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDemo2;