import React, { useEffect } from 'react';
import Stars from '../../components/cosmic/Stars';
import SacredGeometry from '../../components/ui/sacred-geometry';
import { Button } from '../../components/ui/button';
import TestNav from '../../components/cosmic/TestNav';
import '../../cosmic-styles.css';

interface TestCardProps {
  title: string;
  children: React.ReactNode;
}

const TestCard: React.FC<TestCardProps> = ({ title, children }) => {
  return (
    <div className="cosmic-glass-card p-4 mb-8">
      <h3 className="text-lg font-bold mb-4 cosmic-gradient-text">{title}</h3>
      {children}
    </div>
  );
};

const CosmicTest: React.FC = () => {
  useEffect(() => {
    // Initialize animations for elements with cosmic-animate class
    const animateElements = document.querySelectorAll('.cosmic-animate');
    animateElements.forEach((el) => {
      setTimeout(() => {
        el.classList.add('in');
      }, 100);
    });

    // Initialize staggered animations
    const staggerContainers = document.querySelectorAll('.cosmic-stagger-children');
    staggerContainers.forEach((container) => {
      setTimeout(() => {
        container.classList.add('in');
      }, 300);
    });
  }, []);

  return (
    <div className="min-h-screen bg-cosmic-dark text-cosmic-foreground relative">
      {/* Background stars */}
      <Stars />
      
      {/* Test Navigation */}
      <TestNav />

      {/* Main content */}
      <div className="container mx-auto pt-16 px-4 pb-20 relative z-10">
        <div className="cosmic-animate">
          <h1 className="text-4xl font-bold mb-2 cosmic-gradient-text">
            Cosmic Components Test
          </h1>
          <p className="text-lg mb-8 text-cosmic-light/80">
            This page demonstrates the integrated cosmic UI components from the
            Cosmic Consciousness app.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <TestCard title="Sacred Geometry Shapes">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <SacredGeometry variant="pentagon" size="sm" />
                <span className="mt-2 text-sm">Pentagon</span>
              </div>
              <div className="flex flex-col items-center">
                <SacredGeometry variant="hexagon" size="sm" intensity="vivid" />
                <span className="mt-2 text-sm">Hexagon</span>
              </div>
              <div className="flex flex-col items-center">
                <SacredGeometry variant="circle" size="sm" intensity="subtle" />
                <span className="mt-2 text-sm">Circle</span>
              </div>
              <div className="flex flex-col items-center">
                <SacredGeometry variant="triangle" size="sm" />
                <span className="mt-2 text-sm">Triangle</span>
              </div>
              <div className="flex flex-col items-center">
                <SacredGeometry variant="octagon" size="sm" intensity="medium" />
                <span className="mt-2 text-sm">Octagon</span>
              </div>
              <div className="flex flex-col items-center">
                <SacredGeometry variant="heptagon" size="sm" />
                <span className="mt-2 text-sm">Heptagon</span>
              </div>
            </div>
          </TestCard>

          <TestCard title="Animated Elements">
            <div className="flex flex-col gap-4">
              <div className="animate-cosmic-pulse p-4 bg-cosmic-primary/20 rounded-lg border border-cosmic-primary/30">
                Cosmic Pulse Animation
              </div>
              <div className="animate-float p-4 bg-cosmic-primary/20 rounded-lg border border-cosmic-primary/30">
                Floating Animation
              </div>
              <div className="animate-glow p-4 bg-cosmic-primary/20 rounded-lg">
                Glow Animation
              </div>
            </div>
          </TestCard>

          <TestCard title="Cosmic Buttons">
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="cosmic">Cosmic</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="cosmic" size="sm">Small</Button>
              <Button variant="cosmic">Medium</Button>
              <Button variant="cosmic" size="lg">Large</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="cosmic" isLoading>Loading</Button>
              <Button variant="outline" disabled>Disabled</Button>
            </div>
          </TestCard>

          <TestCard title="Text Effects">
            <p className="cosmic-text-glow mb-3 text-cosmic-light">
              This text has a subtle glow effect.
            </p>
            <p className="cosmic-gradient-text mb-3 text-xl font-bold">
              Gradient text creates visual interest.
            </p>
            <div className="cosmic-stagger-children">
              <p className="mb-2 p-2 bg-cosmic-primary/10 rounded-md">Staggered animation item 1</p>
              <p className="mb-2 p-2 bg-cosmic-primary/10 rounded-md">Staggered animation item 2</p>
              <p className="mb-2 p-2 bg-cosmic-primary/10 rounded-md">Staggered animation item 3</p>
            </div>
          </TestCard>
        </div>

        <div className="mb-12">
          <TestCard title="Sacred Geometry with Content">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <SacredGeometry variant="hexagon" size="lg" intensity="medium" animated={true} />
                <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                  <div>
                    <h3 className="cosmic-gradient-text text-xl font-bold mb-2">Universal Harmony</h3>
                    <p className="text-cosmic-light/80">Explore the interconnected patterns of the cosmos</p>
                  </div>
                </div>
              </div>
            </div>
          </TestCard>
        </div>

        <TestCard title="Glassmorphism Effects">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="cosmic-glass p-6 rounded-xl">
              <h4 className="mb-2 font-semibold">Simple Glass</h4>
              <p className="text-sm opacity-80">Basic glassmorphism effect with slight blur</p>
            </div>
            <div className="cosmic-glass-card p-6 rounded-xl">
              <h4 className="mb-2 font-semibold">Glass Card</h4>
              <p className="text-sm opacity-80">Enhanced card with depth and glow effects</p>
            </div>
            <div className="relative overflow-hidden rounded-xl">
              <div className="cosmic-glass-card p-6 cosmic-hover-glow">
                <h4 className="mb-2 font-semibold">Interactive Glass</h4>
                <p className="text-sm opacity-80">Hover to see enhanced glow effects</p>
              </div>
            </div>
          </div>
        </TestCard>

        <div className="mt-12 text-center">
          <p className="mb-6 text-cosmic-light/70">
            Press the "I" key to toggle interactive star mode
          </p>
          <Button variant="cosmic" size="lg" className="cosmic-hover-glow">
            Back to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CosmicTest;