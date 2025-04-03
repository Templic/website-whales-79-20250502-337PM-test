import React, { useState } from 'react';
import CosmicButton from '../components/ui/cosmic-button';
import { Button } from '../components/ui/button';
import { Link } from 'wouter';
import TestNav from '../components/cosmic/TestNav';
import SacredGeometry from '../components/ui/sacred-geometry';
import Stars from '../components/cosmic/Stars';
import CosmicCard from '../components/ui/cosmic-card';
import CosmicHeading from '../components/ui/cosmic-heading';

export default function CosmicComponentsDemo() {
  const [starSettings, setStarSettings] = useState({
    count: 200,
    speed: 0.3,
    color: '#ffffff',
    backgroundColor: 'transparent',
    maxSize: 2
  });

  return (
    <div className="bg-gradient-to-b from-black to-gray-900 min-h-screen text-white p-8">
      <Stars 
        count={starSettings.count}
        speed={starSettings.speed}
        color={starSettings.color}
        backgroundColor={starSettings.backgroundColor}
        maxSize={starSettings.maxSize}
      />
      <TestNav />
      
      <div className="max-w-4xl mx-auto">
        <CosmicHeading as="h1" variant="cosmic" size="4xl" animate className="mb-8 text-center">
          Cosmic Components Demo
        </CosmicHeading>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10">
            <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
              Cosmic Button Component
            </CosmicHeading>
            <div className="space-y-4">
              <CosmicButton variant="default">Default Button</CosmicButton>
              <CosmicButton variant="primary">Primary Button</CosmicButton>
              <CosmicButton variant="secondary">Secondary Button</CosmicButton>
              <CosmicButton variant="outline">Outline Button</CosmicButton>
              <CosmicButton variant="ghost">Ghost Button</CosmicButton>
              <CosmicButton variant="link">Link Button</CosmicButton>
              <CosmicButton variant="cosmic">Cosmic Button</CosmicButton>
              <CosmicButton variant="destructive">Destructive Button</CosmicButton>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10">
            <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
              Original Button Component
            </CosmicHeading>
            <div className="space-y-4">
              <Button variant="default">Default Button</Button>
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
              {/* @ts-ignore */}
              <Button variant="cosmic">Cosmic Button</Button>
              {/* @ts-ignore */}
              <Button variant="destructive">Destructive Button</Button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Sacred Geometry
          </CosmicHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {SacredGeometry && (
              <>
                <div className="flex flex-col items-center">
                  <SacredGeometry type="cube" className="w-32 h-32 text-cosmic-primary" />
                  <p className="mt-2">Cube</p>
                </div>
                <div className="flex flex-col items-center">
                  <SacredGeometry type="tetrahedron" className="w-32 h-32 text-cosmic-secondary" />
                  <p className="mt-2">Tetrahedron</p>
                </div>
                <div className="flex flex-col items-center">
                  <SacredGeometry type="octahedron" className="w-32 h-32 text-cosmic-accent" />
                  <p className="mt-2">Octahedron</p>
                </div>
                <div className="flex flex-col items-center">
                  <SacredGeometry type="icosahedron" className="w-32 h-32 text-cosmic-highlight" />
                  <p className="mt-2">Icosahedron</p>
                </div>
                <div className="flex flex-col items-center">
                  <SacredGeometry type="dodecahedron" className="w-32 h-32 text-purple-400" />
                  <p className="mt-2">Dodecahedron</p>
                </div>
                <div className="flex flex-col items-center">
                  <SacredGeometry type="merkaba" className="w-32 h-32 text-cyan-400" />
                  <p className="mt-2">Merkaba</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Stars Background
          </CosmicHeading>
          <p className="mb-4">Adjust the star background settings:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Star Count: {starSettings.count}
              </label>
              <input
                type="range"
                min="50"
                max="500"
                value={starSettings.count}
                onChange={(e) => setStarSettings({...starSettings, count: Number(e.target.value)})}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Star Speed: {starSettings.speed}
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={starSettings.speed}
                onChange={(e) => setStarSettings({...starSettings, speed: Number(e.target.value)})}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Star Color
              </label>
              <input
                type="color"
                value={starSettings.color}
                onChange={(e) => setStarSettings({...starSettings, color: e.target.value})}
                className="w-full h-10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Star Size: {starSettings.maxSize}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={starSettings.maxSize}
                onChange={(e) => setStarSettings({...starSettings, maxSize: Number(e.target.value)})}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Headings
          </CosmicHeading>
          <div className="space-y-6">
            <CosmicHeading as="h1" variant="default" size="4xl">
              Default Heading (H1)
            </CosmicHeading>
            
            <CosmicHeading as="h2" variant="gradient" size="3xl">
              Gradient Heading (H2)
            </CosmicHeading>
            
            <CosmicHeading as="h3" variant="glow" size="2xl">
              Glow Effect Heading (H3)
            </CosmicHeading>
            
            <CosmicHeading as="h4" variant="outlined" size="xl">
              Outlined Heading (H4)
            </CosmicHeading>
            
            <CosmicHeading as="h5" variant="cosmic" size="lg" animate>
              Cosmic Animated Heading (H5)
            </CosmicHeading>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <CosmicHeading as="h6" align="left" size="base">
                Left Aligned
              </CosmicHeading>
              
              <CosmicHeading as="h6" align="center" size="base">
                Center Aligned
              </CosmicHeading>
              
              <CosmicHeading as="h6" align="right" size="base">
                Right Aligned
              </CosmicHeading>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Cards
          </CosmicHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <CosmicCard variant="default" className="h-48 flex flex-col items-center justify-center">
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Default Card</CosmicHeading>
              <p className="text-sm text-center">Basic cosmic card with standard styling</p>
            </CosmicCard>

            <CosmicCard variant="glow" animate={true} className="h-48 flex flex-col items-center justify-center">
              <CosmicHeading as="h3" size="base" weight="medium" variant="glow" className="mb-2">Glowing Card</CosmicHeading>
              <p className="text-sm text-center">Animated glowing effect around the card</p>
            </CosmicCard>

            <CosmicCard variant="frosted" className="h-48 flex flex-col items-center justify-center">
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Frosted Card</CosmicHeading>
              <p className="text-sm text-center">Frosted glass effect with backdrop blur</p>
            </CosmicCard>

            <CosmicCard variant="highlighted" className="h-48 flex flex-col items-center justify-center">
              <CosmicHeading as="h3" size="base" weight="medium" variant="gradient" className="mb-2">Highlighted Card</CosmicHeading>
              <p className="text-sm text-center">Special highlighted border and styling</p>
            </CosmicCard>

            <CosmicCard variant="interactive" className="h-48 flex flex-col items-center justify-center">
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Interactive Card</CosmicHeading>
              <p className="text-sm text-center">Hover over to see the interactive effect</p>
            </CosmicCard>

            <CosmicCard 
              variant="glow" 
              glowColor="cosmic-accent" 
              borderRadius="lg" 
              padding="lg"
              elevation="lg"
              className="h-48 flex flex-col items-center justify-center"
            >
              <CosmicHeading as="h3" size="base" weight="medium" variant="cosmic" animate className="mb-2">Custom Card</CosmicHeading>
              <p className="text-sm text-center">Customized styling and properties</p>
            </CosmicCard>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Link href="/">
            <span className="text-cosmic-primary hover:text-cosmic-primary/80 cursor-pointer">← Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}