import React from 'react';
import Layout from '@/components/layout';
import ButtonShowcase from '@/components/demo/ButtonShowcase';
import SacredGeometry from '@/components/cosmic/SacredGeometry';
import { CosmicShapeGroup } from '@/components/cosmic/CosmicShapesFixed';

const ButtonDemo: React.FC = () => {
  return (
    <Layout>
      <div className="relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#030113] to-[#050118] opacity-90"></div>
          <SacredGeometry 
            type="flower-of-life" 
            className="absolute top-10 right-0 w-96 h-96 opacity-10" 
            color="#7c3aed"
          />
          <SacredGeometry 
            type="merkaba" 
            className="absolute bottom-0 left-20 w-80 h-80 opacity-10" 
            color="#00ebd6"
          />
          <CosmicShapeGroup
            shapes={[
              { 
                type: 'circle', 
                size: 300, 
                color: '#7c3aed', 
                glowColor: 'rgba(124, 58, 237, 0.2)', 
                fillOpacity: 0.02,
                position: { top: '-120px', right: '-100px' } 
              },
              { 
                type: 'starburst', 
                size: 200, 
                color: '#00ebd6', 
                glowColor: 'rgba(0, 235, 214, 0.2)', 
                fillOpacity: 0.03,
                position: { bottom: '50px', left: '-80px' } 
              },
              { 
                type: 'polygon', 
                size: 150, 
                sides: 5,
                color: '#e15554', 
                glowColor: 'rgba(225, 85, 84, 0.2)', 
                fillOpacity: 0.03,
                position: { bottom: '20%', right: '10%' } 
              },
            ]}
            containerClassName="absolute inset-0 pointer-events-none"
          />
        </div>

        <div className="relative z-10">
          <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-4xl font-orbitron mb-8 text-center cosmic-text-gradient">Cosmic Buttons Demo</h1>
            <p className="text-gray-300 mb-12 text-center max-w-2xl mx-auto">
              This page showcases the updated button designs with cosmic theme styling. These buttons include glowing effects, animations, and space-inspired color schemes based on the "Feels So Good" album palette.
            </p>
            
            <div className="backdrop-blur-md bg-[#080810]/40 border border-[#7c3aed]/20 rounded-lg overflow-hidden">
              <ButtonShowcase />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ButtonDemo;