import React, { useState } from 'react';
import CosmicButton from '../components/ui/cosmic-button';
import { Button } from '../components/ui/button';
import { Link } from 'wouter';
import TestNav from '../components/cosmic/TestNav';
import SacredGeometry from '../components/ui/sacred-geometry';
import Stars from '../components/cosmic/Stars';
import CosmicCard from '../components/ui/cosmic-card';
import CosmicHeading from '../components/ui/cosmic-heading';
import CosmicContainer from '../components/ui/cosmic-container';
import CosmicLink from '../components/ui/cosmic-link';
import CosmicInput from '../components/ui/cosmic-input';
import CosmicBadge from '../components/ui/cosmic-badge';
import CosmicAlert from '../components/ui/cosmic-alert';
import CosmicDrawer from '../components/ui/cosmic-drawer';
import CosmicTabs from '../components/ui/cosmic-tabs';
import CosmicAvatar from '../components/ui/cosmic-avatar';
import CosmicProgressBar from '../components/ui/cosmic-progress-bar';
import CosmicTooltip from '../components/ui/cosmic-tooltip';
import CosmicDropdown from '../components/ui/cosmic-dropdown';
import CosmicCarousel from '../components/ui/cosmic-carousel';
import CosmicModal from '../components/ui/cosmic-modal';
import { 
  CosmicTable, 
  CosmicTableContainer, 
  CosmicTableHeader,
  CosmicTableBody, 
  CosmicTableFooter,
  CosmicTableRow,
  CosmicTableCell,
  CosmicTableHeadCell 
} from '../components/ui/cosmic-table';
import {
  CosmicAccordion,
  CosmicAccordionItem,
  CosmicAccordionTrigger,
  CosmicAccordionContent
} from '../components/ui/cosmic-accordion';
import { 
  Search, Mail, Info, AlertTriangle, CheckCircle, X, 
  Settings, User, LogOut, Home, Music, Star, HelpCircle,
  ChevronRight, ChevronDown, Image, Heart, FileText, Calendar, DollarSign
} from 'lucide-react';

export default function CosmicComponentsDemo() {
  const [starSettings, setStarSettings] = useState({
    count: 200,
    speed: 0.3,
    color: '#ffffff',
    backgroundColor: 'transparent',
    maxSize: 2
  });
  
  // State for interactive components
  const [inputValue, setInputValue] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModal, setCurrentModal] = useState<'default' | 'cosmic' | 'glow' | 'frosted' | 'nebula'>('default');

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
        
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Containers
          </CosmicHeading>
          <div className="space-y-8">
            <CosmicContainer variant="default" className="p-4">
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Default Container</CosmicHeading>
              <p className="text-sm">Basic container with standard styling</p>
            </CosmicContainer>

            <CosmicContainer variant="cosmic" className="p-4">
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Cosmic Container</CosmicHeading>
              <p className="text-sm">Cosmic nebula background with blur effect</p>
            </CosmicContainer>

            <CosmicContainer variant="nebula" className="p-4">
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Nebula Container</CosmicHeading>
              <p className="text-sm">Gradient background with cosmic border</p>
            </CosmicContainer>

            <CosmicContainer variant="minimal" className="p-4">
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Minimal Container</CosmicHeading>
              <p className="text-sm">Subtle minimal styling with just a light border</p>
            </CosmicContainer>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Links
          </CosmicHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Standard Link Styles</CosmicHeading>
                <div className="flex flex-col gap-3">
                  <CosmicLink href="#" variant="default">Default Link</CosmicLink>
                  <CosmicLink href="#" variant="subtle">Subtle Link</CosmicLink>
                  <CosmicLink href="#" variant="glow">Glowing Link</CosmicLink>
                  <CosmicLink href="#" variant="nav">Navigation Link</CosmicLink>
                  <CosmicLink href="#" variant="nav-active">Active Navigation Link</CosmicLink>
                  <CosmicLink href="#" variant="footer">Footer Link</CosmicLink>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Link Variations</CosmicHeading>
                <div className="flex flex-col gap-3">
                  <CosmicLink href="#" variant="default" underline>Underlined Link</CosmicLink>
                  <CosmicLink href="https://replit.com" variant="glow" external>External Link</CosmicLink>
                  <CosmicLink href="#" variant="default" onClick={() => alert('Clicked!')}>Link with Click Handler</CosmicLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Inputs
          </CosmicHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Input Variants</CosmicHeading>
              
              <div className="space-y-4">
                <CosmicInput 
                  placeholder="Default input" 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)} 
                  variant="default"
                />
                
                <CosmicInput 
                  placeholder="Filled input" 
                  variant="filled"
                />
                
                <CosmicInput 
                  placeholder="Outline input" 
                  variant="outline"
                />
                
                <CosmicInput 
                  placeholder="Cosmic input" 
                  variant="cosmic"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Special Input Features</CosmicHeading>
              
              <div className="space-y-4">
                <CosmicInput 
                  placeholder="Input with icon" 
                  icon={<Search size={16} />}
                />
                
                <CosmicInput 
                  placeholder="Email input" 
                  type="email" 
                  icon={<Mail size={16} />}
                />
                
                <CosmicInput 
                  placeholder="Glowing input" 
                  glowing
                  variant="cosmic"
                />
                
                <CosmicInput 
                  placeholder="Input with error" 
                  error 
                  errorMessage="This field is required"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Badges
          </CosmicHeading>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-3">Badge Variants</CosmicHeading>
              <div className="flex flex-wrap gap-2">
                <CosmicBadge variant="default">Default</CosmicBadge>
                <CosmicBadge variant="primary">Primary</CosmicBadge>
                <CosmicBadge variant="secondary">Secondary</CosmicBadge>
                <CosmicBadge variant="success">Success</CosmicBadge>
                <CosmicBadge variant="warning">Warning</CosmicBadge>
                <CosmicBadge variant="danger">Danger</CosmicBadge>
                <CosmicBadge variant="cosmic">Cosmic</CosmicBadge>
              </div>
            </div>
            
            <div>
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-3">Badge Sizes</CosmicHeading>
              <div className="flex flex-wrap items-center gap-2">
                <CosmicBadge variant="cosmic" size="sm">Small</CosmicBadge>
                <CosmicBadge variant="cosmic" size="md">Medium</CosmicBadge>
                <CosmicBadge variant="cosmic" size="lg">Large</CosmicBadge>
              </div>
            </div>
            
            <div>
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-3">Special Features</CosmicHeading>
              <div className="flex flex-wrap gap-2">
                <CosmicBadge variant="primary" pill>Pill Shape</CosmicBadge>
                <CosmicBadge variant="cosmic" glow>Glowing Effect</CosmicBadge>
                <CosmicBadge variant="success" icon={<CheckCircle size={12} />}>With Icon</CosmicBadge>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Alerts
          </CosmicHeading>
          
          <div className="space-y-4">
            {showAlert && (
              <CosmicAlert 
                variant="cosmic"
                title="Cosmic Alert"
                icon={<Info size={20} />}
                dismissible
                onDismiss={() => setShowAlert(false)}
              >
                This is a cosmic themed alert that can be dismissed.
              </CosmicAlert>
            )}
            
            <CosmicAlert 
              variant="info"
              title="Information"
              icon={<Info size={20} />}
            >
              This is an informational alert with an icon.
            </CosmicAlert>
            
            <CosmicAlert 
              variant="success"
              title="Success"
              icon={<CheckCircle size={20} />}
            >
              Your action was completed successfully.
            </CosmicAlert>
            
            <CosmicAlert 
              variant="warning"
              title="Warning"
              icon={<AlertTriangle size={20} />}
            >
              Be careful, this action might have consequences.
            </CosmicAlert>
            
            <CosmicAlert 
              variant="error"
              title="Error"
              icon={<X size={20} />}
            >
              Something went wrong. Please try again.
            </CosmicAlert>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Tabs
          </CosmicHeading>
          
          <div className="space-y-12">
            <div>
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-3">Default Tabs</CosmicHeading>
              <CosmicTabs 
                tabs={[
                  {
                    id: 'tab1',
                    label: 'Overview',
                    content: (
                      <div className="p-4">
                        <CosmicHeading as="h4" size="base" weight="medium" className="mb-2">Overview Tab</CosmicHeading>
                        <p className="text-sm">This is the content for the overview tab.</p>
                      </div>
                    )
                  },
                  {
                    id: 'tab2',
                    label: 'Features',
                    content: (
                      <div className="p-4">
                        <CosmicHeading as="h4" size="base" weight="medium" className="mb-2">Features Tab</CosmicHeading>
                        <p className="text-sm">This is the content for the features tab.</p>
                      </div>
                    )
                  },
                  {
                    id: 'tab3',
                    label: 'Settings',
                    content: (
                      <div className="p-4">
                        <CosmicHeading as="h4" size="base" weight="medium" className="mb-2">Settings Tab</CosmicHeading>
                        <p className="text-sm">This is the content for the settings tab.</p>
                      </div>
                    )
                  }
                ]}
              />
            </div>
            
            <div>
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-3">Cosmic Style Tabs</CosmicHeading>
              <CosmicTabs 
                variant="cosmic"
                tabs={[
                  {
                    id: 'cosmic1',
                    label: 'Stars',
                    icon: <span className="text-yellow-400">★</span>,
                    content: (
                      <div className="p-4">
                        <CosmicHeading as="h4" size="base" weight="medium" className="mb-2">Stars Content</CosmicHeading>
                        <p className="text-sm">Cosmic content about stars.</p>
                      </div>
                    )
                  },
                  {
                    id: 'cosmic2',
                    label: 'Planets',
                    icon: <span className="text-blue-400">○</span>,
                    content: (
                      <div className="p-4">
                        <CosmicHeading as="h4" size="base" weight="medium" className="mb-2">Planets Content</CosmicHeading>
                        <p className="text-sm">Cosmic content about planets.</p>
                      </div>
                    )
                  },
                  {
                    id: 'cosmic3',
                    label: 'Galaxies',
                    icon: <span className="text-purple-400">✧</span>,
                    content: (
                      <div className="p-4">
                        <CosmicHeading as="h4" size="base" weight="medium" className="mb-2">Galaxies Content</CosmicHeading>
                        <p className="text-sm">Cosmic content about galaxies.</p>
                      </div>
                    )
                  }
                ]}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Drawer
          </CosmicHeading>
          
          <div className="flex justify-center">
            <CosmicButton variant="cosmic" onClick={() => setIsDrawerOpen(true)}>
              Open Cosmic Drawer
            </CosmicButton>
          </div>
          
          <CosmicDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            position="right"
            size="md"
            title="Cosmic Drawer"
          >
            <div className="space-y-4">
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-4">
                Drawer Content
              </CosmicHeading>
              
              <p className="text-sm">
                This is a cosmic drawer component that slides in from the side. 
                It can be used for additional content, settings, or navigation.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-6">
                <CosmicButton variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                  Cancel
                </CosmicButton>
                <CosmicButton variant="primary" size="sm" onClick={() => setIsDrawerOpen(false)}>
                  Apply
                </CosmicButton>
              </div>
            </div>
          </CosmicDrawer>
        </div>

        {/* Cosmic Avatar Component */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Avatar
          </CosmicHeading>
          <div className="flex flex-wrap gap-8 justify-center">
            <div className="flex flex-col items-center gap-2">
              <CosmicAvatar 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                alt="Avatar 1"
                variant="default"
                size="lg"
              />
              <span className="text-sm">Circular Large</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CosmicAvatar 
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                alt="Avatar 2"
                variant="glow"
                size="md"
                animation="pulse"
              />
              <span className="text-sm">Rounded Medium (Glow)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CosmicAvatar 
                alt="Avatar 3"
                variant="nebula"
                size="sm"
                initials="AB"
              />
              <span className="text-sm">Squared Small (Icon)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CosmicAvatar 
                src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                alt="Avatar 4"
                variant="cosmic"
                size="xl"
                animation="cosmic"
              />
              <span className="text-sm">Cosmic XL (Border)</span>
            </div>
          </div>
        </div>

        {/* Cosmic Progress Bar Component */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Progress Bar
          </CosmicHeading>
          <div className="space-y-8">
            <div>
              <p className="mb-2">Default Progress Bar (45%)</p>
              <CosmicProgressBar progress={45} />
            </div>
            <div>
              <p className="mb-2">Gradient Progress Bar (70%)</p>
              <CosmicProgressBar progress={70} barVariant="cosmic" />
            </div>
            <div>
              <p className="mb-2">Cosmic Progress Bar (90%)</p>
              <CosmicProgressBar progress={90} variant="cosmic" />
            </div>
            <div>
              <p className="mb-2">Animated Progress Bar (60%)</p>
              <CosmicProgressBar progress={60} animation="pulse" />
            </div>
            <div>
              <p className="mb-2">Custom Size and Style (80%)</p>
              <CosmicProgressBar 
                progress={80} 
                size="lg"
                barVariant="rainbow" 
                showPercentage
                border="thin"
              />
            </div>
          </div>
        </div>

        {/* Cosmic Tooltip Component */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Tooltip
          </CosmicHeading>
          <div className="flex flex-wrap gap-8 justify-center">
            <CosmicTooltip content="Default tooltip style">
              <Button>Hover Me (Default)</Button>
            </CosmicTooltip>
            
            <CosmicTooltip 
              content="Cosmic styled tooltip with gradient background"
              variant="cosmic"
              showDelay={200}
              hideDelay={500}
            >
              <Button>Hover Me (Cosmic)</Button>
            </CosmicTooltip>
            
            <CosmicTooltip 
              content={
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Rich content tooltip</span>
                </div>
              }
              variant="nebula"
              effect="glow"
              maxWidth="200px"
            >
              <Button>Hover Me (Rich Content)</Button>
            </CosmicTooltip>
            
            <CosmicTooltip 
              content="Click me to toggle the tooltip"
              variant="frosted"
              trigger="click"
            >
              <Button>Click Me (Toggle)</Button>
            </CosmicTooltip>
            
            <CosmicTooltip 
              content="This tooltip is always visible"
              variant="dark"
              effect="pulse"
              always
            >
              <Button>Always Visible</Button>
            </CosmicTooltip>
          </div>
        </div>

        {/* Cosmic Dropdown Component */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Dropdown
          </CosmicHeading>
          <div className="flex flex-wrap gap-8 justify-center">
            <CosmicDropdown 
              buttonText="Menu"
              buttonVariant="default"
              items={[
                { id: '1', label: 'Profile', icon: <User className="h-4 w-4" />, onClick: () => console.log('Profile clicked') },
                { id: '2', label: 'Settings', icon: <Settings className="h-4 w-4" />, onClick: () => console.log('Settings clicked') },
                { id: '3', label: 'Logout', icon: <LogOut className="h-4 w-4" />, onClick: () => console.log('Logout clicked') }
              ]}
            />
            
            <CosmicDropdown 
              buttonText="Cosmic Menu"
              buttonVariant="cosmic"
              variant="cosmic"
              showArrow
              items={[
                { id: '1', label: 'Home', icon: <Home className="h-4 w-4" />, onClick: () => console.log('Home clicked') },
                { id: '2', label: 'Music', icon: <Music className="h-4 w-4" />, onClick: () => console.log('Music clicked') },
                { id: '3', label: 'Favorites', icon: <Star className="h-4 w-4" />, onClick: () => console.log('Favorites clicked') }
              ]}
            />
            
            <CosmicDropdown 
              buttonIcon={<HelpCircle className="h-4 w-4" />}
              buttonVariant="outline"
              buttonSize="icon"
              variant="cosmic"
              items={[
                { id: '1', label: 'FAQ', onClick: () => console.log('FAQ clicked') },
                { id: '2', label: 'Support', onClick: () => console.log('Support clicked') },
                { id: '3', label: 'About', onClick: () => console.log('About clicked') }
              ]}
            />
          </div>
        </div>

        {/* Cosmic Carousel Component */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Carousel
          </CosmicHeading>
          <CosmicCarousel 
            variant="cosmic"
            items={[
              { 
                id: '1', 
                content: (
                  <CosmicCard variant="glow" className="h-40 flex items-center justify-center">
                    <div className="text-center">
                      <Image className="h-8 w-8 mx-auto mb-2" />
                      <h3 className="text-lg font-medium">Cosmic Images</h3>
                    </div>
                  </CosmicCard>
                ) 
              },
              { 
                id: '2', 
                content: (
                  <CosmicCard variant="frosted" className="h-40 flex items-center justify-center">
                    <div className="text-center">
                      <Music className="h-8 w-8 mx-auto mb-2" />
                      <h3 className="text-lg font-medium">Cosmic Music</h3>
                    </div>
                  </CosmicCard>
                ) 
              },
              { 
                id: '3', 
                content: (
                  <CosmicCard variant="highlighted" className="h-40 flex items-center justify-center">
                    <div className="text-center">
                      <Star className="h-8 w-8 mx-auto mb-2" />
                      <h3 className="text-lg font-medium">Cosmic Stars</h3>
                    </div>
                  </CosmicCard>
                ) 
              },
              { 
                id: '4', 
                content: (
                  <CosmicCard variant="interactive" className="h-40 flex items-center justify-center">
                    <div className="text-center">
                      <Heart className="h-8 w-8 mx-auto mb-2" />
                      <h3 className="text-lg font-medium">Cosmic Love</h3>
                    </div>
                  </CosmicCard>
                ) 
              }
            ]}
            autoPlay
            interval={3000}
            pauseOnHover
            loop
            showArrows
            showDots
            arrowSize="md"
            dotSize="sm"
          />
        </div>

        {/* Cosmic Modal Component */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Modal
          </CosmicHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CosmicButton 
              variant="cosmic" 
              onClick={() => {
                setCurrentModal('default');
                setIsModalOpen(true);
              }}
            >
              Open Default Modal
            </CosmicButton>
            
            <CosmicButton 
              variant="primary" 
              onClick={() => {
                setCurrentModal('cosmic');
                setIsModalOpen(true);
              }}
            >
              Open Cosmic Modal
            </CosmicButton>
            
            <CosmicButton 
              variant="secondary" 
              onClick={() => {
                setCurrentModal('glow');
                setIsModalOpen(true);
              }}
            >
              Open Glowing Modal
            </CosmicButton>
            
            <CosmicButton 
              variant="outline" 
              onClick={() => {
                setCurrentModal('frosted');
                setIsModalOpen(true);
              }}
            >
              Open Frosted Modal
            </CosmicButton>
            
            <CosmicButton 
              variant="ghost" 
              onClick={() => {
                setCurrentModal('nebula');
                setIsModalOpen(true);
              }}
            >
              Open Nebula Modal
            </CosmicButton>
          </div>

          {/* Default Modal */}
          <CosmicModal
            isOpen={isModalOpen && currentModal === 'default'}
            onClose={() => setIsModalOpen(false)}
            variant="default"
            overlay="dark"
            animation="fade"
            size="md"
            position="center"
            rounded="lg"
          >
            <div className="p-6">
              <CosmicHeading as="h3" size="lg" className="mb-4">Default Modal</CosmicHeading>
              <p className="mb-4">This is a default styled modal with a dark overlay and fade animation.</p>
              <div className="flex justify-end">
                <CosmicButton variant="primary" onClick={() => setIsModalOpen(false)}>
                  Close Modal
                </CosmicButton>
              </div>
            </div>
          </CosmicModal>

          {/* Cosmic Modal */}
          <CosmicModal
            isOpen={isModalOpen && currentModal === 'cosmic'}
            onClose={() => setIsModalOpen(false)}
            variant="cosmic"
            overlay="cosmic"
            animation="zoom"
            size="md"
            position="center"
            rounded="lg"
          >
            <div className="p-6">
              <CosmicHeading as="h3" size="lg" variant="gradient" className="mb-4">Cosmic Modal</CosmicHeading>
              <p className="mb-4">This modal has a cosmic theme with a special overlay and zoom animation.</p>
              <div className="flex justify-end">
                <CosmicButton variant="cosmic" onClick={() => setIsModalOpen(false)}>
                  Close Modal
                </CosmicButton>
              </div>
            </div>
          </CosmicModal>

          {/* Glow Modal */}
          <CosmicModal
            isOpen={isModalOpen && currentModal === 'glow'}
            onClose={() => setIsModalOpen(false)}
            variant="glow"
            overlay="nebula"
            animation="slide"
            size="md"
            position="center"
            rounded="xl"
          >
            <div className="p-6">
              <CosmicHeading as="h3" size="lg" variant="glow" className="mb-4">Glowing Modal</CosmicHeading>
              <p className="mb-4">This modal has a glowing border with nebula overlay and slide animation.</p>
              <div className="flex justify-end">
                <CosmicButton variant="cosmic" onClick={() => setIsModalOpen(false)}>
                  Close Modal
                </CosmicButton>
              </div>
            </div>
          </CosmicModal>

          {/* Frosted Modal */}
          <CosmicModal
            isOpen={isModalOpen && currentModal === 'frosted'}
            onClose={() => setIsModalOpen(false)}
            variant="frosted"
            overlay="blur"
            animation="fade"
            size="md"
            position="center"
            rounded="lg"
          >
            <div className="p-6">
              <CosmicHeading as="h3" size="lg" className="mb-4">Frosted Modal</CosmicHeading>
              <p className="mb-4">This modal has a frosted glass effect with blur overlay.</p>
              <div className="flex justify-end">
                <CosmicButton variant="primary" onClick={() => setIsModalOpen(false)}>
                  Close Modal
                </CosmicButton>
              </div>
            </div>
          </CosmicModal>

          {/* Nebula Modal */}
          <CosmicModal
            isOpen={isModalOpen && currentModal === 'nebula'}
            onClose={() => setIsModalOpen(false)}
            variant="nebula"
            overlay="nebula"
            animation="zoom"
            size="md"
            position="center"
            rounded="lg"
          >
            <div className="p-6">
              <CosmicHeading as="h3" size="lg" variant="cosmic" animate className="mb-4">Nebula Modal</CosmicHeading>
              <p className="mb-4">This modal has a nebula gradient background with matching overlay.</p>
              <div className="flex justify-end">
                <CosmicButton variant="cosmic" onClick={() => setIsModalOpen(false)}>
                  Close Modal
                </CosmicButton>
              </div>
            </div>
          </CosmicModal>
        </div>

        {/* Cosmic Table Component */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Table
          </CosmicHeading>
          
          <CosmicTableContainer variant="cosmic" padding="md" maxHeight="md" className="mb-8">
            <CosmicTable variant="cosmic" textAlign="left" size="md">
              <CosmicTableHeader variant="cosmic" sticky>
                <CosmicTableRow>
                  <CosmicTableHeadCell>Name</CosmicTableHeadCell>
                  <CosmicTableHeadCell>Type</CosmicTableHeadCell>
                  <CosmicTableHeadCell>Date</CosmicTableHeadCell>
                  <CosmicTableHeadCell>Value</CosmicTableHeadCell>
                </CosmicTableRow>
              </CosmicTableHeader>
              <CosmicTableBody>
                <CosmicTableRow variant="cosmic">
                  <CosmicTableCell>Cosmic Harmony</CosmicTableCell>
                  <CosmicTableCell>Music</CosmicTableCell>
                  <CosmicTableCell>2025-04-01</CosmicTableCell>
                  <CosmicTableCell>$120.00</CosmicTableCell>
                </CosmicTableRow>
                <CosmicTableRow variant="cosmic">
                  <CosmicTableCell>Astral Projection</CosmicTableCell>
                  <CosmicTableCell>Experience</CosmicTableCell>
                  <CosmicTableCell>2025-04-15</CosmicTableCell>
                  <CosmicTableCell>$250.00</CosmicTableCell>
                </CosmicTableRow>
                <CosmicTableRow variant="cosmic">
                  <CosmicTableCell>Galaxy Art</CosmicTableCell>
                  <CosmicTableCell>Visual</CosmicTableCell>
                  <CosmicTableCell>2025-05-01</CosmicTableCell>
                  <CosmicTableCell>$180.00</CosmicTableCell>
                </CosmicTableRow>
                <CosmicTableRow variant="cosmic">
                  <CosmicTableCell>Meditation Journey</CosmicTableCell>
                  <CosmicTableCell>Practice</CosmicTableCell>
                  <CosmicTableCell>2025-05-10</CosmicTableCell>
                  <CosmicTableCell>$75.00</CosmicTableCell>
                </CosmicTableRow>
              </CosmicTableBody>
              <CosmicTableFooter>
                <CosmicTableRow>
                  <CosmicTableCell colSpan={3}>Total</CosmicTableCell>
                  <CosmicTableCell>$625.00</CosmicTableCell>
                </CosmicTableRow>
              </CosmicTableFooter>
            </CosmicTable>
          </CosmicTableContainer>
          
          <CosmicTableContainer variant="frosted" padding="md" className="mb-8">
            <CosmicTable variant="default" textAlign="center" size="sm">
              <CosmicTableHeader variant="gradient" sticky>
                <CosmicTableRow>
                  <CosmicTableHeadCell>Icon</CosmicTableHeadCell>
                  <CosmicTableHeadCell>Feature</CosmicTableHeadCell>
                  <CosmicTableHeadCell>Description</CosmicTableHeadCell>
                  <CosmicTableHeadCell>Status</CosmicTableHeadCell>
                </CosmicTableRow>
              </CosmicTableHeader>
              <CosmicTableBody>
                <CosmicTableRow variant="stripedCosmic">
                  <CosmicTableCell><Music className="h-5 w-5 mx-auto" /></CosmicTableCell>
                  <CosmicTableCell>Cosmic Audio</CosmicTableCell>
                  <CosmicTableCell>Immersive spatial audio experience</CosmicTableCell>
                  <CosmicTableCell><CosmicBadge variant="success">Active</CosmicBadge></CosmicTableCell>
                </CosmicTableRow>
                <CosmicTableRow variant="stripedCosmic">
                  <CosmicTableCell><FileText className="h-5 w-5 mx-auto" /></CosmicTableCell>
                  <CosmicTableCell>Documentation</CosmicTableCell>
                  <CosmicTableCell>Comprehensive cosmic knowledge base</CosmicTableCell>
                  <CosmicTableCell><CosmicBadge variant="primary">In Progress</CosmicBadge></CosmicTableCell>
                </CosmicTableRow>
                <CosmicTableRow variant="stripedCosmic">
                  <CosmicTableCell><Calendar className="h-5 w-5 mx-auto" /></CosmicTableCell>
                  <CosmicTableCell>Events</CosmicTableCell>
                  <CosmicTableCell>Cosmic community gatherings</CosmicTableCell>
                  <CosmicTableCell><CosmicBadge variant="warning">Upcoming</CosmicBadge></CosmicTableCell>
                </CosmicTableRow>
                <CosmicTableRow variant="stripedCosmic">
                  <CosmicTableCell><DollarSign className="h-5 w-5 mx-auto" /></CosmicTableCell>
                  <CosmicTableCell>Cosmic Shop</CosmicTableCell>
                  <CosmicTableCell>Purchase cosmic merchandise</CosmicTableCell>
                  <CosmicTableCell><CosmicBadge variant="secondary">Planned</CosmicBadge></CosmicTableCell>
                </CosmicTableRow>
              </CosmicTableBody>
            </CosmicTable>
          </CosmicTableContainer>
        </div>
        
        {/* Cosmic Accordion Component */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Accordion
          </CosmicHeading>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-4">
                Default Accordion
              </CosmicHeading>
              
              <CosmicAccordion variant="default">
                <CosmicAccordionItem value="item-1">
                  <CosmicAccordionTrigger variant="default">
                    What is Cosmic Consciousness?
                  </CosmicAccordionTrigger>
                  <CosmicAccordionContent variant="default">
                    Cosmic Consciousness is an elevated state of awareness that transcends ordinary perception,
                    allowing individuals to experience a profound connection with the universe and all of existence.
                  </CosmicAccordionContent>
                </CosmicAccordionItem>
                
                <CosmicAccordionItem value="item-2">
                  <CosmicAccordionTrigger variant="default">
                    How can I experience Cosmic energies?
                  </CosmicAccordionTrigger>
                  <CosmicAccordionContent variant="default">
                    Experiencing cosmic energies often involves practices like meditation, mindfulness, energy work,
                    and connecting with nature. Regular practice can help you become more sensitive to subtle energies.
                  </CosmicAccordionContent>
                </CosmicAccordionItem>
                
                <CosmicAccordionItem value="item-3">
                  <CosmicAccordionTrigger variant="default">
                    What is Sacred Geometry?
                  </CosmicAccordionTrigger>
                  <CosmicAccordionContent variant="default">
                    Sacred geometry involves geometric patterns found throughout nature that are believed to be the
                    fundamental templates for all creation. These patterns reveal the mathematical principles that
                    govern the universe and can be used for spiritual and creative purposes.
                  </CosmicAccordionContent>
                </CosmicAccordionItem>
              </CosmicAccordion>
            </div>
            
            <div>
              <CosmicHeading as="h3" size="base" weight="medium" className="mb-4">
                Cosmic Styled Accordion
              </CosmicHeading>
              
              <CosmicAccordion variant="cosmicBordered" allowMultiple>
                <CosmicAccordionItem value="cosmic-1" variant="cosmic">
                  <CosmicAccordionTrigger variant="cosmicGradient">
                    Cosmic Music Experience
                  </CosmicAccordionTrigger>
                  <CosmicAccordionContent variant="cosmic" animation="fade">
                    Our cosmic music is specially designed to resonate with the frequencies of the universe,
                    creating an immersive experience that can help elevate consciousness and promote deep relaxation.
                    Each composition is carefully crafted to align with specific cosmic energies.
                  </CosmicAccordionContent>
                </CosmicAccordionItem>
                
                <CosmicAccordionItem value="cosmic-2" variant="cosmic">
                  <CosmicAccordionTrigger variant="cosmicGradient">
                    Galactic Light Language
                  </CosmicAccordionTrigger>
                  <CosmicAccordionContent variant="cosmic" animation="fade">
                    Galactic Light Language is a form of communication that transcends ordinary language,
                    using sounds, tones, and vibrations to convey information directly to the soul.
                    It activates dormant DNA and facilitates healing on multiple levels.
                  </CosmicAccordionContent>
                </CosmicAccordionItem>
                
                <CosmicAccordionItem value="cosmic-3" variant="cosmic">
                  <CosmicAccordionTrigger variant="cosmicGradient">
                    Starseed Origins
                  </CosmicAccordionTrigger>
                  <CosmicAccordionContent variant="cosmic" animation="fade">
                    Starseeds are believed to be souls who have experienced life on other planets or star systems
                    before incarnating on Earth. Their purpose often involves bringing higher consciousness
                    and specialized knowledge to assist humanity during times of transformation.
                  </CosmicAccordionContent>
                </CosmicAccordionItem>
              </CosmicAccordion>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Link to="/">
            <span className="text-cosmic-primary hover:text-cosmic-primary/80 cursor-pointer">← Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}