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
import { AccessibilityControls } from "../../../components/common/accessibility-controls";
import {
  Settings, Code, Music, Palette, Filter, Sliders, Box, 
  Headphones, Compass, Layers, Aperture, LayoutGrid, Database,
  SlidersHorizontal, ShoppingBag, PanelLeft, Sparkles, FileText,
  Users, BookOpen, Maximize, Eye, Zap, LifeBuoy, Server,
  Shield, Globe, BellRing, Store, MessageCircle, Brain, Fingerprint,
  Key, Lock, BarChart
} from 'lucide-react';

/**
 * ComponentsCatalog - A centralized repository for navigating all app components
 * This serves as the main index to access all component demos and archives
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
          Component Repository Central
        </CosmicHeading>
        
        <CosmicText className="mt-4 text-center max-w-2xl mx-auto mb-12">
          The centralized archive of all UI and functional components in the Cosmic Experience 
          application, organized by category for easy reference and testing.
        </CosmicText>

        <div className="mb-12">
          <Tabs defaultValue="core" className="w-full">
            <TabsList className="grid grid-cols-6 mb-8">
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
              <TabsTrigger value="shop">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Shop
              </TabsTrigger>
              <TabsTrigger value="pages">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Page Patterns
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
                  title="Cosmic UI Components" 
                  description="Core cosmic-themed UI components and complete design system"
                  icon={<Palette className="h-8 w-8" />}
                  href="/cosmic-components"
                />
                
                <ComponentCard 
                  title="UI Component Tests" 
                  description="Interactive UI components with cosmic aesthetics and animations"
                  icon={<Filter className="h-8 w-8" />}
                  href="/test/cosmic"
                />
                
                <ComponentCard 
                  title="Cosmic Showcase" 
                  description="Complete interactive component showcase with visual effects"
                  icon={<Layers className="h-8 w-8" />}
                  href="/cosmic-test"
                />

                <ComponentCard 
                  title="Form Components" 
                  description="Specialized form inputs, validation, and submission components"
                  icon={<FileText className="h-8 w-8" />}
                  href="/cosmic-components#forms"
                />

                <ComponentCard 
                  title="Navigation Elements" 
                  description="Headers, footers, menus, and navigation patterns"
                  icon={<PanelLeft className="h-8 w-8" />}
                  href="/cosmic-components#navigation"
                />

                <ComponentCard 
                  title="Layout Systems" 
                  description="Grid layouts, containers, responsive designs and spacing systems"
                  icon={<LayoutGrid className="h-8 w-8" />}
                  href="/cosmic-components#layouts"
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
                        <li>Cosmic-Themed Styling Guidelines</li>
                        <li>Responsive Design Patterns</li>
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

                <ComponentCard 
                  title="Binaural Components" 
                  description="Frequency and binaural beat generators with visualization"
                  icon={<Zap className="h-8 w-8" />}
                  href="/test/audio#binaural"
                />

                <ComponentCard 
                  title="Album Collection" 
                  description="Music album display, interaction, and playback components"
                  icon={<BookOpen className="h-8 w-8" />}
                  href="/test/audio#albums"
                />
                
                <ComponentCard 
                  title="Sound Visualization" 
                  description="Audio frequency and waveform visualization tools"
                  icon={<BarChart className="h-8 w-8" />}
                  href="/test/audio#visualization"
                />
                
                <ComponentCard 
                  title="Interactive Audio" 
                  description="User-controlled audio experiences with interaction models"
                  icon={<Headphones className="h-8 w-8" />}
                  href="/test/audio#interactive"
                />
                
                <ComponentCard 
                  title="Sound Healing" 
                  description="Therapeutic sound frequencies and healing audio tools"
                  icon={<Brain className="h-8 w-8" />}
                  href="/test/audio#healing"
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
                        <li>Frequency Presets Library</li>
                        <li>Sound Healing Components</li>
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

                <ComponentCard 
                  title="Accessibility Suite" 
                  description="Complete accessibility control panel with user preferences"
                  icon={<Eye className="h-8 w-8" />}
                  href="/test/new#accessibility"
                />

                <ComponentCard 
                  title="Digital Collectibles" 
                  description="NFT and digital collectible interface components"
                  icon={<Sparkles className="h-8 w-8" />}
                  href="/test/new#collectibles"
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
                        <li>Voice Navigation System</li>
                        <li>Immersive Experience Controls</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="shop" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Shop Components */}
                <ComponentCard 
                  title="Product Components" 
                  description="Product cards, grids, and display components"
                  icon={<ShoppingBag className="h-8 w-8" />}
                  href="/cosmic-components#products"
                />

                <ComponentCard 
                  title="Cart System" 
                  description="Shopping cart and checkout components"
                  icon={<SlidersHorizontal className="h-8 w-8" />}
                  href="/cosmic-components#cart"
                />

                <ComponentCard 
                  title="Product Data" 
                  description="Product data management and display components"
                  icon={<Database className="h-8 w-8" />}
                  href="/cosmic-components#product-data"
                />
              </div>
              
              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="shop-details">
                  <AccordionTrigger className="text-white">View Component Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
                      <h3 className="text-lg font-medium">Shop Components Include:</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Product Cards and Grids</li>
                        <li>Product Detail Views</li>
                        <li>Shopping Cart Interface</li>
                        <li>Checkout Forms</li>
                        <li>Payment Processing UI</li>
                        <li>Order Confirmation Components</li>
                        <li>Product Filtering Systems</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="pages" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Page Pattern Components */}
                <ComponentCard 
                  title="Landing Patterns" 
                  description="Home page and landing page template components"
                  icon={<Maximize className="h-8 w-8" />}
                  href="/cosmic-components#landing"
                />

                <ComponentCard 
                  title="Community Templates" 
                  description="User community and forum UI patterns"
                  icon={<Users className="h-8 w-8" />}
                  href="/cosmic-components#community"
                />

                <ComponentCard 
                  title="Support Layouts" 
                  description="Help, FAQ, and support page components"
                  icon={<LifeBuoy className="h-8 w-8" />}
                  href="/cosmic-components#support"
                />
              </div>
              
              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="pages-details">
                  <AccordionTrigger className="text-white">View Component Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
                      <h3 className="text-lg font-medium">Page Pattern Components Include:</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Hero Sections and Banners</li>
                        <li>Feature Showcases</li>
                        <li>Testimonial Layouts</li>
                        <li>Pricing Tables</li>
                        <li>FAQ Accordions</li>
                        <li>Contact Forms</li>
                        <li>Blog and Article Layouts</li>
                        <li>User Profile Layouts</li>
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
                  title="API Integration" 
                  description="Components for connecting to external data sources and APIs"
                  icon={<Server className="h-8 w-8" />}
                  href="/cosmic-components#api"
                />
                
                <ComponentCard 
                  title="Security Components" 
                  description="Authentication, authorization, and data protection components"
                  icon={<Shield className="h-8 w-8" />}
                  href="/cosmic-components#security"
                />
                
                <ComponentCard 
                  title="Global Data" 
                  description="Components for managing global state and application data"
                  icon={<Globe className="h-8 w-8" />}
                  href="/cosmic-components#global-data"
                />
                
                <ComponentCard 
                  title="Notification System" 
                  description="Alert, toast, and notification management components"
                  icon={<BellRing className="h-8 w-8" />}
                  href="/cosmic-components#notifications"
                />
                
                <ComponentCard 
                  title="Analytics Dashboard" 
                  description="Components for data visualization and metrics reporting"
                  icon={<BarChart className="h-8 w-8" />}
                  href="/cosmic-components#analytics"
                />
                
                <ComponentCard 
                  title="AI Integration" 
                  description="Components that integrate with AI and ML services"
                  icon={<Brain className="h-8 w-8" />}
                  href="/cosmic-components#ai"
                />
              </div>
              
              <div className="border-t border-indigo-800/30 pt-8 mt-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Shield className="h-6 w-6 mr-3 text-indigo-400" />
                  Security & API Components
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ComponentCard 
                    title="Authentication" 
                    description="User authentication flow components with multi-factor options"
                    icon={<Fingerprint className="h-8 w-8" />}
                    href="/cosmic-components#auth"
                  />
                  
                  <ComponentCard 
                    title="API Integration" 
                    description="Components for external API connections and data management"
                    icon={<Globe className="h-8 w-8" />}
                    href="/cosmic-components#api-integration"
                  />
                  
                  <ComponentCard 
                    title="Data Encryption" 
                    description="End-to-end encryption components for sensitive data"
                    icon={<Lock className="h-8 w-8" />}
                    href="/cosmic-components#encryption"
                  />
                  
                  <ComponentCard 
                    title="Key Management" 
                    description="API key and token management components"
                    icon={<Key className="h-8 w-8" />}
                    href="/cosmic-components#key-management"
                  />
                  
                  <ComponentCard 
                    title="Data Visualization" 
                    description="Interactive charts and data display components"
                    icon={<BarChart className="h-8 w-8" />}
                    href="/cosmic-components#data-viz"
                  />
                  
                  <ComponentCard 
                    title="Real-time Updates" 
                    description="WebSocket and real-time data synchronization"
                    icon={<MessageCircle className="h-8 w-8" />}
                    href="/cosmic-components#realtime"
                  />
                </div>
              </div>
              
              <Accordion type="single" collapsible className="mt-8">
                <AccordionItem value="experimental-details">
                  <AccordionTrigger className="text-white">View Component Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 bg-black/20 rounded-lg">
                      <h3 className="text-lg font-medium">Experimental Components Include:</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>API Connection & Data Fetching</li>
                        <li>JWT Authentication Flow</li>
                        <li>Two-Factor Authentication</li>
                        <li>Biometric Authentication</li>
                        <li>Real-time Data Visualization</li>
                        <li>AI-Powered Content Generation</li>
                        <li>WebSocket Communication</li>
                        <li>Push Notification System</li>
                        <li>Multi-tenant Architecture</li>
                        <li>Event-driven Components</li>
                        <li>End-to-End Encryption</li>
                        <li>API Key Rotation</li>
                        <li>OAuth Integration</li>
                        <li>Data Visualization Libraries</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </div>
        
        <CosmicSection variant="gradient" className="rounded-xl">
          <div className="text-center p-4">
            <CosmicHeading level={2} align="center" withAccent className="mb-4">
              Component Documentation
            </CosmicHeading>
            <p className="mb-4 max-w-3xl mx-auto">
              All components follow our cosmic design system principles with consistent theming,
              accessibility standards, and responsive design. Use this catalog as your central 
              reference for all available components in the application.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/">
                <CosmicButton variant="secondary">
                  Return to Home
                </CosmicButton>
              </Link>
              <Link href="/cosmic-components">
                <CosmicButton variant="primary">
                  View All Components
                </CosmicButton>
              </Link>
            </div>
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