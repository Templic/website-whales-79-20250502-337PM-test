import React, { useState } from 'react';
import { Link } from 'wouter';
import Stars from '../../../components/cosmic/Stars';
import { CosmicHeading } from "../../../components/features/cosmic/CosmicHeading";
import { CosmicCard } from "../../../components/features/cosmic/CosmicCard";
import { CosmicButton } from "../../../components/features/cosmic/CosmicButton";
import { CosmicSection } from "../../../components/features/cosmic/CosmicSection";
import { CosmicText } from "../../../components/features/cosmic/CosmicText";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AccessibilityControls } from "../../../components/common/AccessibilityControls";
import {
  Settings, Code, Music, Palette, Filter, Sliders, Box, 
  Headphones, Compass, Layers, Aperture
} from 'lucide-react';

/**
 * ComponentsCatalog - A centralized page to navigate all component demos
 */
export default function ComponentsCatalog() {
  const [starSettings] = useState({
    count: 200,
    speed: 0.3,
    color: '#ffffff',
    backgroundColor: 'transparent',
    maxSize: 2
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950 text-white">
      <Stars 
        count={starSettings.count}
        speed={starSettings.speed}
        color={starSettings.color}
        backgroundColor={starSettings.backgroundColor}
        maxSize={starSettings.maxSize}
      />
      
      <div className="container mx-auto py-12 px-4 relative z-10">
        <CosmicHeading level={1} align="center" withAccent glow>
          Cosmic Components Catalog
        </CosmicHeading>
        
        <CosmicText className="mt-4 text-center max-w-2xl mx-auto mb-12">
          A comprehensive collection of all UI and functional components used throughout 
          the Cosmic Experience application, organized by category.
        </CosmicText>

        <div className="mb-12">
          <Tabs defaultValue="core" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="core">
                <Box className="mr-2 h-4 w-4" />
                Core UI
              </TabsTrigger>
              <TabsTrigger value="audio">
                <Headphones className="mr-2 h-4 w-4" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="new">
                <Compass className="mr-2 h-4 w-4" />
                New Features
              </TabsTrigger>
              <TabsTrigger value="experimental">
                <Aperture className="mr-2 h-4 w-4" />
                Experimental
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="core" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Core UI Components */}
                <ComponentCard 
                  title="Cosmic Components" 
                  description="Core cosmic-themed UI components and design system"
                  icon={<Palette className="h-8 w-8" />}
                  href="/cosmic-components"
                />
                
                <ComponentCard 
                  title="UI Component Tests" 
                  description="Interactive UI components with cosmic aesthetics"
                  icon={<Filter className="h-8 w-8" />}
                  href="/test/cosmic"
                />
                
                <ComponentCard 
                  title="Cosmic Test" 
                  description="Comprehensive component showcase with animations"
                  icon={<Layers className="h-8 w-8" />}
                  href="/cosmic-test"
                />
              </div>
              
              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="core-details">
                  <AccordionTrigger className="text-white">View Component Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
                      <h3 className="text-lg font-medium">Core UI Components Include:</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Buttons, Cards & Containers</li>
                        <li>Typography & Headings</li>
                        <li>Form Components & Inputs</li>
                        <li>Navigation Elements</li>
                        <li>Modal & Dialog Components</li>
                        <li>Alerts & Notifications</li>
                        <li>Animations & Transitions</li>
                        <li>Sacred Geometry Visualizations</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="audio" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Audio Components */}
                <ComponentCard 
                  title="Audio Components" 
                  description="Sound generation and audio visualization components"
                  icon={<Music className="h-8 w-8" />}
                  href="/test/audio"
                />
              </div>
              
              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="audio-details">
                  <AccordionTrigger className="text-white">View Component Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
                      <h3 className="text-lg font-medium">Audio Components Include:</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Binaural Beat Generator</li>
                        <li>Breath Sync Player</li>
                        <li>Frequency Visualizer (3D)</li>
                        <li>Spatial Audio Experience</li>
                        <li>Voice Controlled Player</li>
                        <li>Sound Meditation Tools</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="new" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* New Components */}
                <ComponentCard 
                  title="New Components" 
                  description="Recently added UI and feature components"
                  icon={<Compass className="h-8 w-8" />}
                  href="/test/new"
                />
              </div>
              
              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="new-details">
                  <AccordionTrigger className="text-white">View Component Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
                      <h3 className="text-lg font-medium">New Components Include:</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Accessibility Controls</li>
                        <li>Album Showcase</li>
                        <li>Cosmic Collectibles</li>
                        <li>Wallet Connect Integration</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="experimental" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Experimental Components */}
                <ComponentCard 
                  title="Under Development" 
                  description="Experimental components still in progress"
                  icon={<Code className="h-8 w-8" />}
                  href="#"
                  disabled
                />
              </div>
              
              <div className="p-6 text-center bg-black/20 rounded-lg mt-4">
                <p className="text-gray-400">
                  Experimental components are still under development. Check back soon for updates.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <CosmicSection variant="gradient" className="rounded-xl">
          <div className="text-center p-4">
            <CosmicHeading level={2} align="center" withAccent className="mb-4">
              Component Development Guidelines
            </CosmicHeading>
            <p className="mb-4 max-w-3xl mx-auto">
              All components are built following our cosmic design system principles.
              For developers, our components adhere to accessibility standards and
              provide consistent theming across the application.
            </p>
            <Link href="/">
              <CosmicButton variant="secondary">
                Return to Home
              </CosmicButton>
            </Link>
          </div>
        </CosmicSection>
      </div>
      
      {/* Add accessibility controls */}
      <AccessibilityControls />
    </div>
  );
}

// Helper component for component category cards
function ComponentCard({ 
  title, 
  description, 
  icon, 
  href, 
  disabled = false 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  href: string; 
  disabled?: boolean;
}) {
  return (
    <Link href={disabled ? "#" : href}>
      <CosmicCard 
        variant={disabled ? "default" : "outline"} 
        className={`h-full transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="mb-4 text-cosmic-primary">
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-300 text-sm">{description}</p>
          
          {!disabled && (
            <div className="mt-auto pt-4 text-sm text-cosmic-primary flex items-center">
              <span>View Components</span>
              <Sliders className="ml-2 h-4 w-4" />
            </div>
          )}
          
          {disabled && (
            <div className="mt-auto pt-4 text-sm text-gray-500 flex items-center">
              <span>Coming Soon</span>
              <Settings className="ml-2 h-4 w-4" />
            </div>
          )}
        </div>
      </CosmicCard>
    </Link>
  );
}