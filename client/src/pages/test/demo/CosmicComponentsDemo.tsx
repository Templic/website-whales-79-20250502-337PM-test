import React, { useState } from 'react';
import CosmicButton from '../../../components/ui/cosmic-button';
import { Button } from '../../../components/ui/button';
import { Link } from 'wouter';
import TestNav from '../../../components/cosmic/TestNav';
import SacredGeometry from '../../../components/ui/sacred-geometry';
import Stars from '../../../components/cosmic/Stars';
import CosmicCard from '../../../components/ui/cosmic-card';
import CosmicHeading from '../../../components/ui/cosmic-heading';
import CosmicContainer from '../../../components/ui/cosmic-container';
import CosmicLink from '../../../components/ui/cosmic-link';
import CosmicInput from '../../../components/ui/cosmic-input';
import CosmicBadge from '../../../components/ui/cosmic-badge';
import CosmicAlert from '../../../components/ui/cosmic-alert';
import CosmicDrawer from '../../../components/ui/cosmic-drawer';
import CosmicTabs from '../../../components/ui/cosmic-tabs';
import CosmicAvatar from '../../../components/ui/cosmic-avatar';
import CosmicProgressBar from '../../../components/ui/cosmic-progress-bar';
import CosmicTooltip from '../../../components/ui/cosmic-tooltip';
import CosmicDropdown from '../../../components/ui/cosmic-dropdown';
import CosmicCarousel from '../../../components/ui/cosmic-carousel';
import CosmicModal from '../../../components/ui/cosmic-modal';
import CosmicSelect from '../../../components/ui/cosmic-select';
import CosmicCheckbox from '../../../components/ui/cosmic-checkbox';
import { CosmicRadio, CosmicRadioGroup, CosmicRadioCard } from '../../../components/ui/cosmic-radio';
import CosmicToggle from '../../../components/ui/cosmic-toggle';
import { CosmicToast, ToastManager, showSuccessToast, showErrorToast, showInfoToast, showWarningToast, showCosmicToast } from '../../../components/features/cosmic/cosmic-toast';
import { CosmicSlider } from '../../../components/ui/cosmic-slider';
import { CosmicSidebar } from '../../../components/ui/cosmic-sidebar';
import { CosmicMediaPlayer } from '../../../components/ui/cosmic-media-player';
import CosmicMarkdown from '../../../components/ui/cosmic-markdown';
import { CosmicMasonry, CosmicMasonryItem } from '../../../components/ui/cosmic-masonry';
import CosmicStepper from '../../../components/ui/cosmic-stepper';
import { 
  CosmicForm, 
  CosmicFormGroup, 
  CosmicFormLabel, 
  CosmicFormHelperText 
} from '../../../components/features/cosmic/cosmic-form';
import { 
  CosmicTable, 
  CosmicTableContainer, 
  CosmicTableHeader,
  CosmicTableBody, 
  CosmicTableFooter,
  CosmicTableRow,
  CosmicTableCell,
  CosmicTableHeadCell 
} from '../../../components/ui/cosmic-table';
import {
  CosmicAccordion,
  CosmicAccordionItem,
  CosmicAccordionTrigger,
  CosmicAccordionContent
} from '../../../components/ui/cosmic-accordion';
import { 
  Search, Mail, Info, AlertTriangle, CheckCircle, X, 
  Settings, User, LogOut, Home, Music, Star, HelpCircle,
  ChevronRight, ChevronDown, Image, Heart, FileText, Calendar, DollarSign
} from 'lucide-react';

// Placeholder component - replace with actual implementation
const SacredGeometryDemo = () => <div>Sacred Geometry Demo Component</div>;

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

  // State for form components
  const [checkboxValue, setCheckboxValue] = useState<boolean>(false);
  const [radioValue, setRadioValue] = useState<string>('option1');
  const [radioCardValue, setRadioCardValue] = useState<string>('card1');
  const [toggleValue, setToggleValue] = useState<boolean>(false);
  const [selectValue, setSelectValue] = useState<string>('');
  const [formTermsValue, setFormTermsValue] = useState<boolean>(false);
  const [formNewsletterValue, setFormNewsletterValue] = useState<boolean>(false);

  // State for toast
  const [toastOpen, setToastOpen] = useState<boolean>(false);

  // State for slider
  const [sliderValue, setSliderValue] = useState<number[]>([50]);
  const [rangeSliderValue, setRangeSliderValue] = useState<number[]>([75]);
  const [volumeValue, setVolumeValue] = useState<number[]>([5.0]);

  // State for sidebar
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // State for stepper
  const [currentStep, setCurrentStep] = useState<number>(0);

  // State for media player
  const [demoTracks] = useState([
    {
      id: '1',
      title: 'Cosmic Dreams',
      artist: 'Stellar Vibrations',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      artwork: 'https://via.placeholder.com/300/6366f1/ffffff?text=Cosmic+Dreams',
    },
    {
      id: '2',
      title: 'Astral Journey',
      artist: 'Nebula Explorers',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      artwork: 'https://via.placeholder.com/300/8b5cf6/ffffff?text=Astral+Journey',
    },
    {
      id: '3',
      title: 'Quantum Waves',
      artist: 'Galaxy Collective',
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      artwork: 'https://via.placeholder.com/300/ec4899/ffffff?text=Quantum+Waves',
    }
  ]);

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
              <Button variant="primary" onClick={() => window.location.href = '/music-release'}>Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link" onClick={() => window.open('/faq', '_blank')}>Link Button</Button>
              {/* @ts-ignore */}
              <Button variant="cosmic">Cosmic Button</Button>
              {/* @ts-ignore */}
              <Button variant="destructive">Destructive Button</Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Sacred Geometry Visualizations
          </CosmicHeading>
          <p className="text-gray-300 mb-6">
            Sacred geometry patterns reveal the mathematical principles that govern our universe. Explore these interactive containers shaped in various sacred forms.
          </p>
          <div className="bg-gradient-to-br from-black/80 via-purple-900/20 to-black/80 backdrop-blur-md rounded-xl p-6 shadow-xl border border-purple-500/10 mb-8">
            <SacredGeometryDemo />
          </div>

          <CosmicHeading as="h3" variant="gradient" size="lg" className="mb-4">
            Basic Sacred Geometry Shapes
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
                  <CosmicLink href="/about" variant="default">Default Link</CosmicLink>
                  <CosmicLink href="/music-release" variant="subtle">Subtle Link</CosmicLink>
                  <CosmicLink href="/cosmic-experience" variant="glow">Glowing Link</CosmicLink>
                  <CosmicLink href="/community" variant="nav">Navigation Link</CosmicLink>
                  <CosmicLink href="/shop" variant="nav-active">Active Navigation Link</CosmicLink>
                  <CosmicLink href="/contact" variant="footer">Footer Link</CosmicLink>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <CosmicHeading as="h3" size="base" weight="medium" className="mb-2">Link Variations</CosmicHeading>
                <div className="flex flex-col gap-3">
                  <CosmicLink href="/faq" variant="default" underline>Underlined Link</CosmicLink>
                  <CosmicLink href="https://replit.com" variant="glow" external>External Link</CosmicLink>
                  <CosmicLink href="/collaborative-shopping" variant="default" onClick={() => alert('Clicked!')}>Link with Click Handler</CosmicLink>
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

        {/* Form Components Section */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
          <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
            Cosmic Form Components
          </CosmicHeading>

          <div className="space-y-12">
            {/* Form Container Demo */}
            <div>
              <CosmicHeading as="h3" size="lg" weight="medium" className="mb-4">Form Containers</CosmicHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CosmicForm variant="default" className="border border-gray-700 p-4 rounded-md">
                  <CosmicHeading as="h4" size="base" weight="medium" className="mb-3">Default Form</CosmicHeading>
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="name-1">Name</CosmicFormLabel>
                    <CosmicInput id="name-1" placeholder="Enter your name" />
                  </CosmicFormGroup>
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="email-1">Email</CosmicFormLabel>
                    <CosmicInput id="email-1" type="email" placeholder="Enter your email" />
                  </CosmicFormGroup>
                  <CosmicButton variant="primary" className="mt-2">Submit</CosmicButton>
                </CosmicForm>

                <CosmicForm variant="cosmic">
                  <CosmicHeading as="h4" size="base" weight="medium" className="mb-3">Cosmic Form</CosmicHeading>
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="name-2" variant="cosmic" required>Name</CosmicFormLabel>
                    <CosmicInput id="name-2" placeholder="Enter your name" variant="cosmic" />
                    <CosmicFormHelperText>Enter your full name</CosmicFormHelperText>
                  </CosmicFormGroup>
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="email-2" variant="cosmic" required>Email</CosmicFormLabel>
                    <CosmicInput id="email-2" type="email" placeholder="Enter your email" variant="cosmic" />
                    <CosmicFormHelperText>We'll never share your email</CosmicFormHelperText>
                  </CosmicFormGroup>
                  <CosmicButton variant="cosmic" className="mt-2">Submit</CosmicButton>
                </CosmicForm>
              </div>
            </div>

            {/* Form States Demo */}
            <div>
              <CosmicHeading as="h3" size="lg" weight="medium" className="mb-4">Form States</CosmicHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <CosmicForm variant="default" className="border border-gray-700 p-4 rounded-md">
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="normal">Normal Input</CosmicFormLabel>
                    <CosmicInput id="normal" placeholder="Normal state" />
                  </CosmicFormGroup>
                </CosmicForm>

                <CosmicForm variant="default" className="border border-gray-700 p-4 rounded-md">
                  <CosmicFormGroup error="This field is required">
                    <CosmicFormLabel htmlFor="error">Error Input</CosmicFormLabel>
                    <CosmicInput id="error" placeholder="Error state" error />
                  </CosmicFormGroup>
                </CosmicForm>

                <CosmicForm variant="default" className="border border-gray-700 p-4 rounded-md">
                  <CosmicFormGroup success="Looks good!">
                    <CosmicFormLabel htmlFor="success">Success Input</CosmicFormLabel>
                    <CosmicInput id="success" placeholder="Success state" success />
                  </CosmicFormGroup>
                </CosmicForm>
              </div>
            </div>

            {/* Select Component Demo */}
            <div>
              <CosmicHeading as="h3" size="lg" weight="medium" className="mb-4">Cosmic Select</CosmicHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <CosmicFormLabel htmlFor="select-default">Default Select</CosmicFormLabel>
                  <CosmicSelect 
                    id="select-default"
                    value={selectValue}
                    onChange={(e) => setSelectValue(e.target.value)}
                  >
                    <option value="">Select an option</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                  </CosmicSelect>
                  <p className="mt-2 text-sm text-gray-400">Selected option: {selectValue || 'None'}</p>
                </div>

                <div>
                  <CosmicFormLabel htmlFor="select-cosmic" variant="cosmic">Cosmic Select</CosmicFormLabel>
                  <CosmicSelect id="select-cosmic" variant="cosmic">
                    <option value="">Select an option</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                  </CosmicSelect>
                </div>

                <div>
                  <CosmicFormLabel htmlFor="select-frosted">Frosted Select</CosmicFormLabel>
                  <CosmicSelect 
                    id="select-frosted" 
                    variant="frosted" 
                    icon={<Search className="h-4 w-4 text-gray-400" />}
                  >
                    <option value="">Select an option</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                  </CosmicSelect>
                </div>
              </div>
            </div>

            {/* Checkbox Component Demo */}
            <div>
              <CosmicHeading as="h3" size="lg" weight="medium" className="mb-4">Cosmic Checkbox</CosmicHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <CosmicCheckbox 
                    id="checkbox-default" 
                    label="Default Checkbox"
                    checked={checkboxValue}
                    onChange={(e) => setCheckboxValue(e.target.checked)}
                  />

                  <CosmicCheckbox 
                    id="checkbox-cosmic" 
                    label="Cosmic Checkbox" 
                    variant="cosmic"
                    labelVariant="cosmic"
                  />

                  <CosmicCheckbox 
                    id="checkbox-filled" 
                    label="Filled Checkbox" 
                    variant="filled"
                  />

                  <CosmicCheckbox 
                    id="checkbox-glow" 
                    label="Animated Checkbox" 
                    variant="cosmic"
                    animation="glow"
                  />

                  <p className="text-sm text-gray-400">Checkbox state: {checkboxValue ? 'Checked' : 'Unchecked'}</p>
                </div>

                <div className="space-y-4">
                  <CosmicCheckbox 
                    id="checkbox-disabled" 
                    label="Disabled Checkbox" 
                    disabled
                  />

                  <CosmicCheckbox 
                    id="checkbox-error" 
                    label="Error Checkbox" 
                    error
                  />

                  <CosmicCheckbox 
                    id="checkbox-success" 
                    label="Success Checkbox" 
                    success
                  />

                  <CosmicCheckbox 
                    id="checkbox-reversed" 
                    label="Reversed Direction" 
                    direction="rowReverse"
                  />
                </div>
              </div>
            </div>

            {/* Radio Component Demo */}
            <div>
              <CosmicHeading as="h3" size="lg" weight="medium" className="mb-4">Cosmic Radio</CosmicHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <CosmicHeading as="h4" size="base" weight="medium" className="mb-3">Radio Buttons</CosmicHeading>
                  <CosmicRadioGroup 
                    value={radioValue} 
                    onChange={(value) => setRadioValue(value)} 
                    name="radio-demo"
                  >
                    <CosmicRadio 
                      value="option1" 
                      label="Default Radio Option" 
                    />

                    <CosmicRadio 
                      value="option2" 
                      label="Cosmic Radio Option" 
                      variant="cosmic"
                      labelVariant="cosmic"
                    />

                    <CosmicRadio 
                      value="option3" 
                      label="Filled Radio Option" 
                      variant="filled"
                    />

                    <CosmicRadio 
                      value="option4" 
                      label="Disabled Radio Option" 
                      disabled
                    />
                  </CosmicRadioGroup>
                  <p className="mt-2 text-sm text-gray-400">Selected value: {radioValue}</p>
                </div>

                <div>
                  <CosmicHeading as="h4" size="base" weight="medium" className="mb-3">Radio Cards</CosmicHeading>
                  <CosmicRadioGroup 
                    variant="card" 
                    value={radioCardValue} 
                    onChange={(value) => setRadioCardValue(value)} 
                    name="radio-card-demo"
                  >
                    <CosmicRadioCard
                      value="card1"
                      label="Default Radio Card"
                      description="This is a radio option presented as a card"
                    />

                    <CosmicRadioCard
                      value="card2"
                      label="Cosmic Radio Card"
                      description="Cosmic styled radio card option"
                      variant="cosmic"
                    />
                  </CosmicRadioGroup>
                  <p className="mt-2 text-sm text-gray-400">Selected card: {radioCardValue}</p>
                </div>
              </div>
            </div>

            {/* Toggle Component Demo */}
            <div>
              <CosmicHeading as="h3" size="lg" weight="medium" className="mb-4">Cosmic Toggle</CosmicHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <CosmicToggle 
                    id="toggle-default" 
                    label="Default Toggle"
                    checked={toggleValue}
                    onChange={(e) => setToggleValue(e.target.checked)}
                  />

                  <CosmicToggle 
                    id="toggle-cosmic" 
                    label="Cosmic Toggle" 
                    variant="cosmic"
                    labelVariant="cosmic"
                  />

                  <CosmicToggle 
                    id="toggle-minimal" 
                    label="Minimal Toggle" 
                    variant="minimal"
                  />

                  <CosmicToggle 
                    id="toggle-frosted" 
                    label="Frosted Toggle" 
                    variant="frosted"
                  />

                  <p className="text-sm text-gray-400">Toggle state: {toggleValue ? 'On' : 'Off'}</p>
                </div>

                <div className="space-y-6">
                  <CosmicToggle 
                    id="toggle-disabled" 
                    label="Disabled Toggle" 
                    disabled
                  />

                  <CosmicToggle 
                    id="toggle-glow" 
                    label="Glowing Toggle" 
                    variant="cosmic"
                    animation="glow"
                    thumbGlow
                  />

                  <CosmicToggle 
                    id="toggle-error" 
                    label="Error Toggle" 
                    error
                  />

                  <CosmicToggle 
                    id="toggle-left" 
                    label="Label on Left" 
                    labelPosition="left"
                  />
                </div>
              </div>
            </div>

            {/* Complete Form Example */}
            <div><div>
              <CosmicHeading as="h3" size="lg" weight="medium" className="mb-4">Complete Form Example</CosmicHeading>
              <CosmicForm variant="cosmic">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="full-name" variant="cosmic" required>Full Name</CosmicFormLabel>
                    <CosmicInput id="full-name" placeholder="Enter your name" variant="cosmic" />
                  </CosmicFormGroup>

                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="contact-email" variant="cosmic" required>Email Address</CosmicFormLabel>
                    <CosmicInput id="contact-email" type="email" placeholder="Enter your email" variant="cosmic" icon={<Mail className="h-4 w-4 text-gray-400" />} />
                  </CosmicFormGroup>
                </div>

                <CosmicFormGroup>
                  <CosmicFormLabel htmlFor="subject" variant="cosmic">Subject</CosmicFormLabel>
                  <CosmicSelect id="subject" variant="cosmic">
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </CosmicSelect>
                </CosmicFormGroup>

                <CosmicFormGroup>
                  <CosmicFormLabel htmlFor="message" variant="cosmic" required>Message</CosmicFormLabel>
                  <textarea 
                    id="message" 
                    rows={4} 
                    className="w-full bg-gray-900 border border-cosmic-primary/30 text-white rounded-md focus:outline-none focus:border-cosmic-primary focus:ring-1 focus:ring-cosmic-primary/50 p-3"
                    placeholder="Enter your message"
                  ></textarea>
                </CosmicFormGroup>

                <div className="mt-4 space-y-4">
                  <CosmicCheckbox
                    id="terms"
                    label="I agree to the terms and conditions"
                    variant="cosmic"
                    checked={formTermsValue}
                    onChange={(e) => setFormTermsValue(e.target.checked)}
                  />

                  <CosmicToggle
                    id="newsletter"
                    label="Subscribe to newsletter"
                    variant="cosmic"
                    checked={formNewsletterValue}
                    onChange={(e) => setFormNewsletterValue(e.target.checked)}
                  />

                  <p className="text-sm text-gray-400">
                    Form state: 
                    {formTermsValue ? ' Agreed to terms' : ' Not agreed to terms'}, 
                    {formNewsletterValue ? ' Subscribed to newsletter' : ' Not subscribed to newsletter'}
                  </p>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                  <CosmicButton 
                    variant="outline"
                    onClick={() => {
                      setFormTermsValue(false);
                      setFormNewsletterValue(false);
                    }}
                  >
                    Cancel
                  </CosmicButton>

                  <CosmicButton 
                    variant="cosmic"
                    onClick={() => {
                      if (!formTermsValue) {
                        alert('Please agree to the terms and conditions');
                      } else {
                        alert('Form submitted successfully! Newsletter subscription: ' + 
                          (formNewsletterValue ? 'Yes' : 'No'));
                      }
                    }}
                  >
                    Submit Form
                  </CosmicButton>
                </div>
              </CosmicForm>
            </div>
          </div>

          {/* Toast Component */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
            <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
              Cosmic Toast
            </CosmicHeading>
            <div className="space-y-4">
              <p className="text-sm mb-4">
                The CosmicToast component provides feedback to users through non-intrusive messages.
              </p>

              {/* Toast Demos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <CosmicHeading as="h3" size="lg" className="mb-2">Toast Variants</CosmicHeading>
                  <div className="flex flex-wrap gap-3">
                    <CosmicButton variant="default" onClick={() => showSuccessToast('Operation completed successfully')}>
                      Success Toast
                    </CosmicButton>
                    <CosmicButton variant="default" onClick={() => showErrorToast('An error occurred')}>
                      Error Toast
                    </CosmicButton>
                    <CosmicButton variant="default" onClick={() => showWarningToast('Proceed with caution')}>
                      Warning Toast
                    </CosmicButton>
                    <CosmicButton variant="default" onClick={() => showInfoToast('For your information')}>
                      Info Toast
                    </CosmicButton>
                    <CosmicButton variant="cosmic" onClick={() => showCosmicToast('Cosmic energy detected')}>
                      Cosmic Toast
                    </CosmicButton>
                  </div>
                </div>

                <div className="space-y-3">
                  <CosmicHeading as="h3" size="lg" className="mb-2">Custom Toast</CosmicHeading>
                  <div className="space-y-3">
                    <CosmicToast
                      open={toastOpen}
                      onClose={() => setToastOpen(false)}
                      variant="cosmic"
                      title="Custom Toast"
                      message="This is a custom toast with configurable options"
                      showProgress
                      duration={5000}
                      position="bottom-right"
                      animation="slide"
                    />
                    <CosmicButton variant="cosmic" onClick={() => setToastOpen(true)}>
                      Show Custom Toast
                    </CosmicButton>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <CosmicHeading as="h3" size="lg" className="mb-2">Toast Manager</CosmicHeading>
                <p className="text-sm mb-2">
                  The ToastManager component handles multiple toasts and their positioning.
                </p>
                <ToastManager position="top-right" autoClose />
              </div>
            </div>
          </div>

          {/* Slider Component */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
            <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
              Cosmic Slider
            </CosmicHeading>
            <div className="space-y-6">
              <p className="text-sm mb-4">
                The CosmicSlider component allows users to select a value within a specified range.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <CosmicHeading as="h3" size="lg" className="mb-2">Basic Sliders</CosmicHeading>

                  <div className="space-y-8">
                    <div>
                      <CosmicSlider
                        variant="default"
                        min={0}
                        max={100}
                        step={1}
                        value={sliderValue}
                        onChange={(value) => setSliderValue(value)}
                        label="Default Slider"
                        showValue
                      />
                    </div>

                    <div>
                      <CosmicSlider
                        variant="cosmic"
                        thumbVariant="glowing"
                        min={0}
                        max={100}
                        step={1}
                        value={rangeSliderValue}
                        onChange={(value) => setRangeSliderValue(value)}
                        label="Cosmic Slider"
                        showValue
                        valueSuffix="%"
                        trackHeight="thick"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <CosmicHeading as="h3" size="lg" className="mb-2">Advanced Sliders</CosmicHeading>

                  <div className="space-y-8">
                    <div>
                      <CosmicSlider
                        variant="nebula"
                        thumbVariant="cosmic"
                        min={0}
                        max={100}
                        step={10}
                        value={sliderValue}
                        onChange={(value) => setSliderValue(value)}
                        label="Slider with Ticks"
                        showValue
                        valueSuffix=" units"
                        showTicks
                        ticks={[0, 25, 50, 75, 100]}
                        tickLabels={['Min', '25%', 'Half', '75%', 'Max']}
                      />
                    </div>

                    <div>
                      <CosmicSlider
                        variant="glow"
                        thumbVariant="pulsing"
                        min={0}
                        max={100}
                        step={1}
                        value={rangeSliderValue}
                        onChange={(value) => setRangeSliderValue(value)}
                        label="Glowing Slider with Tooltip"
                        showTooltip
                        tooltipPosition="top"
                        formatValue={(value) => `${value}% complete`}
                      />
                    </div>

                    <div>
                      <CosmicSlider
                        variant="nebula"
                        thumbVariant="nebula"
                        min={0}
                        max={10}
                        step={0.1}
                        value={volumeValue}
                        onChange={(value) => setVolumeValue(value)}
                        label="Nebula Volume Control"
                        showValue
                        valuePrefix="Vol: "
                        formatValue={(value) => value[0].toFixed(1)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-400">
                  Basic slider value: {sliderValue}, Advanced slider value: {rangeSliderValue}, Volume: {volumeValue[0]?.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Component */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
            <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
              Cosmic Sidebar
            </CosmicHeading>
            <div className="space-y-4">
              <p className="text-sm mb-4">
                The CosmicSidebar component provides navigation and organizational structure.
              </p>

              <div className="flex justify-center">
                <CosmicButton 
                  variant="cosmic" 
                  onClick={() => setSidebarOpen(true)}
                >
                  Open Cosmic Sidebar
                </CosmicButton>
              </div>

              <CosmicSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                variant="cosmic"
                title="Cosmic Navigation"
                logo={<SacredGeometry type="merkaba" className="w-8 h-8 text-cosmic-primary" />}
                sections={[
                  {
                    title: "Main Navigation",
                    items: [
                      {
                        id: "home",
                        label: "Home",
                        icon: <Home className="w-5 h-5" />,
                        href: "#"
                      },
                      {
                        id: "music",
                        label: "Music",
                        icon: <Music className="w-5 h-5" />,
                        href: "#",
                        badge: "New"
                      },
                      {
                        id: "settings",
                        label: "Settings",
                        icon: <Settings className="w-5 h-5" />,
                        items: [
                          {
                            id: "profile",
                            label: "Profile Settings",
                            icon: <User className="w-5 h-5" />,
                            href: "#"
                          },
                          {
                            id: "account",
                            label: "Account Settings",
                            icon: <Settings className="w-5 h-5" />,
                            href: "#"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    title: "Media",
                    items: [
                      {
                        id: "albums",
                        label: "Albums",
                        icon: <Music className="w-5 h-5" />,
                        href: "#"
                      },
                      {
                        id: "photos",
                        label: "Photos",
                        icon: <Image className="w-5 h-5" />,
                        href: "#"
                      },
                      {
                        id: "favorites",
                        label: "Favorites",
                        icon: <Heart className="w-5 h-5" />,
                        href: "#",
                        badge: "5",
                        badgeColor: "bg-cosmic-secondary/20 text-cosmic-secondary"
                      }
                    ]
                  }
                ]}
                footer={
                  <div className="flex items-center justify-between">
                    <CosmicButton variant="ghost" size="sm">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </CosmicButton>
                    <CosmicButton variant="ghost" size="sm">
                      <HelpCircle className="w-4 h-4" />
                    </CosmicButton>
                  </div>
                }
                activeItemId="home"
                collapsible
                closeOnNavigation
              />
            </div>
          </div>

          {/* Media Player Component */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
            <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
              Cosmic Media Player
            </CosmicHeading>
            <div className="space-y-6">
              <p className="text-sm mb-4">
                The CosmicMediaPlayer component provides audio playback with cosmic styling.
              </p>

              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                  <CosmicHeading as="h3" size="lg" className="mb-2">Default Media Player</CosmicHeading>
                  <CosmicMediaPlayer
                    tracks={demoTracks}
                    initialTrackIndex={0}
                    variant="cosmic"
                    showPlaylist
                    showControls
                    showVolumeControl
                    allowDownload
                    allowSharing
                    visualizer
                  />
                </div>

                <div className="space-y-4">
                  <CosmicHeading as="h3" size="lg" className="mb-2">Compact Media Player</CosmicHeading>
                  <CosmicMediaPlayer
                    tracks={demoTracks}
                    initialTrackIndex={1}
                    variant="default"
                    compact
                    hideArtwork
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Component */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
            <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
              Cosmic Stepper
            </CosmicHeading>
            <div className="space-y-6">
              <p className="text-sm mb-4">
                The CosmicStepper component provides a multi-step interface with cosmic styling.
              </p>

              <div className="space-y-12">
                <div>
                  <CosmicHeading as="h3" size="lg" className="mb-4">Default Stepper</CosmicHeading>
                  <CosmicStepper
                    variant="default"
                    currentStep={currentStep}
                    onStepChange={setCurrentStep}
                    steps={[
                      {
                        id: 'step1',
                        title: 'Personal Info',
                        description: 'Basic personal information',
                        content: (
                          <div>
                            <p className="mb-4">This is the content for step 1.</p>
                            <CosmicInput 
                              placeholder="Your name" 
                              className="mb-2"
                            />
                            <CosmicInput 
                              placeholder="Your email" 
                              type="email"
                            />
                          </div>
                        ),
                      },
                      {
                        id: 'step2',
                        title: 'Account Details',
                        description: 'Setup your account',
                        content: (
                          <div>
                            <p className="mb-4">This is the content for step 2.</p>
                            <CosmicInput 
                              placeholder="Choose a username" 
                              className="mb-2"
                            />
                            <CosmicInput 
                              placeholder="Password" 
                              type="password"
                            />
                          </div>
                        ),
                      },
                      {
                        id: 'step3',
                        title: 'Preferences',
                        description: 'Set your preferences',
                        content: (
                          <div>
                            <p className="mb-4">This is the content for step 3.</p>
                            <CosmicToggle 
                              label="Receive notifications" 
                              checked={true}
                              className="mb-2"
                            />
                            <CosmicToggle 
                              label="Dark mode" 
                              checked={true}
                            />
                          </div>
                        ),
                      },
                      {
                        id: 'step4',
                        title: 'Confirmation',
                        description: 'Complete setup',
                        content: (
                          <div>
                            <p className="mb-4">This is the content for step 4.</p>
                            <p>All steps have been completed successfully!</p>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>

                <div>
                  <CosmicHeading as="h3" size="lg" className="mb-4">Cosmic Stepper</CosmicHeading>
                  <CosmicStepper
                    variant="cosmic"
                    currentStep={0}
                    orientation="horizontal"
                    layout="expanded"
                    steps={[
                      {
                        id: 'cosmic1',
                        title: 'Connect',
                        description: 'Connect to cosmic energy',
                        content: (
                          <div>
                            <p className="mb-4">Begin your journey by connecting to cosmic energy.</p>
                          </div>
                        ),
                      },
                      {
                        id: 'cosmic2',
                        title: 'Explore',
                        description: 'Explore the cosmic realms',
                        content: (
                          <div>
                            <p className="mb-4">Explore the vast cosmic realms and discover new insights.</p>
                          </div>
                        ),
                      },
                      {
                        id: 'cosmic3',
                        title: 'Transform',
                        description: 'Transform your consciousness',
                        content: (
                          <div>
                            <p className="mb-4">Transform your consciousness through cosmic awareness.</p>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>

                <div>
                  <CosmicHeading as="h3" size="lg" className="mb-4">Vertical Nebula Stepper</CosmicHeading>
                  <CosmicStepper
                    variant="nebula"
                    orientation="vertical"
                    currentStep={1}
                    steps={[
                      {
                        id: 'nebula1',
                        title: 'Star Birth',
                        content: (
                          <div>
                            <p className="mb-4">The birth of stars in cosmic nebulae.</p>
                          </div>
                        ),
                      },
                      {
                        id: 'nebula2',
                        title: 'Galactic Formation',
                        content: (
                          <div>
                            <p className="mb-4">The formation of galaxies from cosmic dust.</p>
                          </div>
                        ),
                      },
                      {
                        id: 'nebula3',
                        title: 'Universal Expansion',
                        content: (
                          <div>
                            <p className="mb-4">The expansion of the universe through cosmic time.</p>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Masonry Grid Component */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-white/10 mb-12">
            <CosmicHeading as="h2" variant="gradient" size="xl" className="mb-4">
              Cosmic Masonry
            </CosmicHeading>
            <div className="space-y-6">
              <p className="text-sm mb-4">
                The CosmicMasonry component provides responsive grid layouts with cosmic styling.
              </p>

              <div className="space-y-8">
                <div>
                  <CosmicHeading as="h3" size="lg" className="mb-4">Default Masonry</CosmicHeading>
                  <CosmicMasonry variant="default" columns={3} className="mb-8">
                    <CosmicMasonryItem className="p-4 bg-gray-800/50 rounded-lg">
                      <CosmicHeading as="h4" size="sm" className="mb-2">Item 1</CosmicHeading>
                      <p className="text-sm">This is a basic masonry item with default styling.</p>
                    </CosmicMasonryItem>

                    <CosmicMasonryItem className="p-4 bg-gray-800/50 rounded-lg">
                      <CosmicHeading as="h4" size="sm" className="mb-2">Item 2</CosmicHeading>
                      <p className="text-sm">Masonry automatically handles different size items.</p>
                      <div className="mt-4 rounded bg-gray-700/50 h-32"></div>
                    </CosmicMasonryItem>

                    <CosmicMasonryItem className="p-4 bg-gray-800/50 rounded-lg">
                      <CosmicHeading as="h4" size="sm" className="mb-2">Item 3</CosmicHeading>
                      <p className="text-sm">Items will flow into available space based on their size.</p>
                    </CosmicMasonryItem>

                    <CosmicMasonryItem className="p-4 bg-gray-800/50 rounded-lg">
                      <CosmicHeading as="h4" size="sm" className="mb-2">Item 4</CosmicHeading>
                      <p className="text-sm">Responsive grid adapts to different screen sizes.</p>
                      <div className="mt-4 rounded bg-gray-700/50 h-16"></div>
                    </CosmicMasonryItem>
                  </CosmicMasonry>
                </div>

                <div>
                  <CosmicHeading as="h3" size="lg" className="mb-4">Cosmic Variant</CosmicHeading>
                  <CosmicMasonry variant="cosmic" columns={3} animated className="mb-8">
                    <CosmicMasonryItem variant="cosmic" animated hoverable>
                      <CosmicHeading as="h4" size="sm" className="mb-2">Cosmic Item</CosmicHeading>
                      <p className="text-sm">Items can have the cosmic styling variant.</p>
                    </CosmicMasonryItem>

                    <CosmicMasonryItem variant="cosmic" animated hoverable>
                      <CosmicHeading as="h4" size="sm" className="mb-2">Interactive</CosmicHeading>
                      <p className="text-sm">These items have hover and animation effects.</p>
                      <div className="mt-4 rounded bg-cosmic-primary/10 h-24"></div>
                    </CosmicMasonryItem>

                    <CosmicMasonryItem variant="cosmic" animated hoverable>
                      <CosmicHeading as="h4" size="sm" className="mb-2">Cosmic Glow</CosmicHeading>
                      <p className="text-sm">Hover over to see the subtle glow effect.</p>
                    </CosmicMasonryItem>
                  </CosmicMasonry>
                </div>

                <div>
                  <CosmicHeading as="h3" size="lg" className="mb-4">Nebula Variant</CosmicHeading>
                  <CosmicMasonry variant="nebula" columns={4} animated className="mb-8">
                    <CosmicMasonryItem variant="nebula" animated hoverable>
                      <CosmicHeading as="h4" size="sm" variant="gradient" className="mb-2">Nebula Item</CosmicHeading>
                      <p className="text-sm">The nebula variant has a purple to pink gradient.</p>
                    </CosmicMasonryItem>

                    <CosmicMasonryItem variant="nebula" animated hoverable>
                      <CosmicHeading as="h4" size="sm" variant="gradient" className="mb-2">Gallery Item</CosmicHeading>
                      <div className="mt-2 rounded bg-cosmic-secondary/20 h-40"></div>
                    </CosmicMasonryItem>

                    <CosmicMasonryItem variant="nebula" animated hoverable>
                      <CosmicHeading as="h4" size="sm" variant="gradient" className="mb-2">Content Card</CosmicHeading>
                      <p className="text-sm">Perfect for image galleries or content cards.</p>
                      <div className="mt-2 rounded bg-cosmic-accent/20 h-20"></div>
                    </CosmicMasonryItem>

                    <CosmicMasonryItem variant="nebula" animated hoverable>
                      <CosmicHeading as="h4" size="sm" variant="gradient" className="mb-2">Responsive</CosmicHeading>
                      <p className="text-sm">The grid automatically adjusts based on screen size.</p>
                    </CosmicMasonryItem>
                  </CosmicMasonry>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}