import React, { useState } from 'react';
import CosmicButton from '../components/ui/cosmic-button';
import { Button } from '../components/ui/button';
import { Link } from 'wouter';
import TestNav from '../components/cosmic/TestNav';
import SacredGeometry from '../components/ui/sacred-geometry';
import Stars from '../components/cosmic/Stars';

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
        <h1 className="text-4xl font-bold mb-8 animate-cosmic">Cosmic Components Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Cosmic Button Component</h2>
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
            <h2 className="text-2xl font-bold mb-4">Original Button Component</h2>
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
          <h2 className="text-2xl font-bold mb-4">Sacred Geometry</h2>
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
          <h2 className="text-2xl font-bold mb-4">Stars Background</h2>
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
        
        <div className="flex justify-center">
          <Link href="/">
            <a className="text-cosmic-primary hover:text-cosmic-primary/80">← Back to Home</a>
          </Link>
        </div>
      </div>
    </div>
  );
}