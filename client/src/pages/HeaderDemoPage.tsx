import React, { useState, useCallback, useEffect } from 'react';
import { usePageHeader } from '../hooks/use-page-header';
import { Button } from '@/components/ui/button';
import { 
  Settings, HelpCircle, Sparkles, Eye, EyeOff, 
  Sun, Moon, Layers, PanelTop, ArrowUp, ArrowDown,
  Palette, Paintbrush, Droplets, SunDim, SquareStack
} from 'lucide-react';

// Add more header configuration options for comprehensive customization
interface HeaderCustomization {
  variant: 'default' | 'transparent' | 'minimal';
  showLogo: boolean;
  showSearch: boolean;
  backgroundColor: string;
  backgroundOpacity: number;
  textColor: string;
  shadowEffect: 'none' | 'light' | 'medium' | 'heavy';
  borderBottom: boolean;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  borderColor: string;
  blur: number;
  isScrollBehaviorEnabled: boolean;
  hideOnScroll: boolean;
  shrinkOnScroll: boolean;
  blurOnScroll: boolean;
  backdropBlur: boolean;
  glassmorphism: boolean;
}

const HeaderDemoPage: React.FC = () => {
  // State for all header customization options
  const [customization, setCustomization] = useState<HeaderCustomization>({
    variant: 'default',
    showLogo: true,
    showSearch: true,
    backgroundColor: '#1e3a8a', // Dark blue
    backgroundOpacity: 0.8,
    textColor: '#ffffff',
    shadowEffect: 'medium',
    borderBottom: true,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    blur: 5,
    isScrollBehaviorEnabled: true,
    hideOnScroll: false,
    shrinkOnScroll: true,
    blurOnScroll: true,
    backdropBlur: true,
    glassmorphism: true
  });
  
  // Simple callbacks that don't change
  const handleSettingsClick = useCallback(() => alert('Settings clicked'), []);
  const handleHelpClick = useCallback(() => alert('Help clicked'), []);
  const handleSpecialFeatureClick = useCallback(() => alert('Special Feature clicked'), []);
  
  // Helper function to get the correct className based on customization
  const getHeaderClassName = useCallback(() => {
    const classes = [];
    
    // Border class if enabled
    if (customization.borderBottom) {
      classes.push(`border-b border-${customization.borderStyle}`);
    }
    
    // Shadow class based on selection
    switch (customization.shadowEffect) {
      case 'light':
        classes.push('shadow-sm');
        break;
      case 'medium':
        classes.push('shadow-md');
        break;
      case 'heavy':
        classes.push('shadow-lg');
        break;
      default:
        // No shadow class
        break;
    }
    
    return classes.join(' ');
  }, [customization.borderBottom, customization.borderStyle, customization.shadowEffect]);
  
  // Create inline style for custom elements that can't be handled by className
  const getHeaderStyle = useCallback(() => {
    return {
      backgroundColor: `${customization.backgroundColor}${Math.round(customization.backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
      color: customization.textColor,
      borderColor: customization.borderColor,
      backdropFilter: customization.backdropBlur ? `blur(${customization.blur}px)` : 'none',
      WebkitBackdropFilter: customization.backdropBlur ? `blur(${customization.blur}px)` : 'none',
    };
  }, [
    customization.backgroundColor, 
    customization.backgroundOpacity, 
    customization.textColor, 
    customization.borderColor,
    customization.blur,
    customization.backdropBlur
  ]);
  
  // Apply the header configuration
  usePageHeader({
    title: 'Header Customization Demo',
    actions: [
      { 
        label: 'Settings', 
        icon: <Settings className="h-4 w-4" />, 
        onClick: handleSettingsClick 
      },
      { 
        label: 'Help', 
        icon: <HelpCircle className="h-4 w-4" />, 
        onClick: handleHelpClick 
      },
      { 
        label: 'Special Feature', 
        icon: <Sparkles className="h-4 w-4" />, 
        onClick: handleSpecialFeatureClick 
      }
    ],
    showSearch: customization.showSearch,
    showLogo: customization.showLogo,
    variant: customization.variant,
    className: getHeaderClassName(),
    style: getHeaderStyle(),
    isScrollBehaviorEnabled: customization.isScrollBehaviorEnabled,
    hideOnScroll: customization.hideOnScroll,
    shrinkOnScroll: customization.shrinkOnScroll,
    blurOnScroll: customization.blurOnScroll,
    backdropBlur: customization.backdropBlur,
    glassmorphism: customization.glassmorphism
  });

  // Handler for changing a specific customization property
  const updateCustomization = <K extends keyof HeaderCustomization>(
    key: K, 
    value: HeaderCustomization[K]
  ) => {
    setCustomization(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="container pt-16 pb-32">
      <h1 className="text-3xl font-bold mb-8">Header System Demo</h1>
      
      {/* Header Variant Selection */}
      <div className="bg-card rounded-lg p-6 mb-8 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Header Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            variant={customization.variant === 'default' ? 'default' : 'outline'} 
            onClick={() => updateCustomization('variant', 'default')}
          >
            Default Header
          </Button>
          <Button 
            variant={customization.variant === 'transparent' ? 'default' : 'outline'} 
            onClick={() => updateCustomization('variant', 'transparent')}
          >
            Transparent Header
          </Button>
          <Button 
            variant={customization.variant === 'minimal' ? 'default' : 'outline'} 
            onClick={() => updateCustomization('variant', 'minimal')}
          >
            Minimal Header
          </Button>
        </div>
      </div>
      
      {/* Basic Appearance Controls */}
      <div className="bg-card rounded-lg p-6 mb-8 shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          <Palette className="inline-block mr-2 h-5 w-5" />
          Appearance Controls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">Background Color</h3>
              <div className="flex space-x-2 items-center">
                <input 
                  type="color" 
                  value={customization.backgroundColor}
                  onChange={(e) => updateCustomization('backgroundColor', e.target.value)}
                  className="w-10 h-10 cursor-pointer"
                />
                <input 
                  type="text" 
                  value={customization.backgroundColor}
                  onChange={(e) => updateCustomization('backgroundColor', e.target.value)}
                  className="w-24 px-2 py-1 border rounded"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Background Opacity</h3>
              <div className="flex items-center">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={customization.backgroundOpacity}
                  onChange={(e) => updateCustomization('backgroundOpacity', parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="ml-2 w-12 text-right">{Math.round(customization.backgroundOpacity * 100)}%</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Text Color</h3>
              <div className="flex space-x-2 items-center">
                <input 
                  type="color" 
                  value={customization.textColor}
                  onChange={(e) => updateCustomization('textColor', e.target.value)}
                  className="w-10 h-10 cursor-pointer"
                />
                <input 
                  type="text" 
                  value={customization.textColor}
                  onChange={(e) => updateCustomization('textColor', e.target.value)}
                  className="w-24 px-2 py-1 border rounded"
                />
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-2">Blur Effect</h3>
              <div className="flex items-center">
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  value={customization.blur}
                  onChange={(e) => updateCustomization('blur', parseInt(e.target.value))}
                  className="w-full" 
                  disabled={!customization.backdropBlur}
                />
                <span className="ml-2 w-12 text-right">{customization.blur}px</span>
              </div>
              <div className="mt-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={customization.backdropBlur}
                    onChange={(e) => updateCustomization('backdropBlur', e.target.checked)}
                    className="mr-2"
                  />
                  Enable Backdrop Blur
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Shadow Effect</h3>
              <select
                value={customization.shadowEffect}
                onChange={(e) => updateCustomization('shadowEffect', e.target.value as 'none' | 'light' | 'medium' | 'heavy')}
                className="w-full p-2 border rounded"
              >
                <option value="none">None</option>
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Border Style</h3>
              <div className="flex items-center mb-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={customization.borderBottom}
                    onChange={(e) => updateCustomization('borderBottom', e.target.checked)}
                    className="mr-2"
                  />
                  Show Border
                </label>
              </div>
              <select
                value={customization.borderStyle}
                onChange={(e) => updateCustomization('borderStyle', e.target.value as 'solid' | 'dashed' | 'dotted' | 'none')}
                className="w-full p-2 border rounded"
                disabled={!customization.borderBottom}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Advanced Scroll Behavior */}
      <div className="bg-card rounded-lg p-6 mb-8 shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          <ArrowDown className="inline-block mr-2 h-5 w-5" />
          Scroll Behavior
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center mb-3">
              <input 
                type="checkbox" 
                checked={customization.isScrollBehaviorEnabled}
                onChange={(e) => updateCustomization('isScrollBehaviorEnabled', e.target.checked)}
                className="mr-2"
              />
              <span className="font-medium">Enable Scroll Effects</span>
            </label>
            
            <label className="flex items-center mb-3 ml-6">
              <input 
                type="checkbox" 
                checked={customization.hideOnScroll}
                onChange={(e) => updateCustomization('hideOnScroll', e.target.checked)}
                disabled={!customization.isScrollBehaviorEnabled}
                className="mr-2"
              />
              <span>Hide on Scroll Down</span>
            </label>
            
            <label className="flex items-center mb-3 ml-6">
              <input 
                type="checkbox" 
                checked={customization.shrinkOnScroll}
                onChange={(e) => updateCustomization('shrinkOnScroll', e.target.checked)}
                disabled={!customization.isScrollBehaviorEnabled}
                className="mr-2"
              />
              <span>Shrink on Scroll</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center mb-3">
              <input 
                type="checkbox" 
                checked={customization.blurOnScroll}
                onChange={(e) => updateCustomization('blurOnScroll', e.target.checked)}
                disabled={!customization.isScrollBehaviorEnabled}
                className="mr-2"
              />
              <span>Increase Blur on Scroll</span>
            </label>
            
            <label className="flex items-center mb-3">
              <input 
                type="checkbox" 
                checked={customization.glassmorphism}
                onChange={(e) => updateCustomization('glassmorphism', e.target.checked)}
                className="mr-2"
              />
              <span>Glassmorphism Effect</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Component Controls */}
      <div className="bg-card rounded-lg p-6 mb-8 shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          <Layers className="inline-block mr-2 h-5 w-5" />
          Component Controls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center mb-3">
              <input 
                type="checkbox" 
                checked={customization.showLogo}
                onChange={(e) => updateCustomization('showLogo', e.target.checked)}
                className="mr-2"
              />
              <span className="font-medium">Show Logo</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center mb-3">
              <input 
                type="checkbox" 
                checked={customization.showSearch}
                onChange={(e) => updateCustomization('showSearch', e.target.checked)}
                className="mr-2"
              />
              <span className="font-medium">Show Search</span>
            </label>
          </div>
        </div>
      </div>
    
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <p className="mb-4">
            This demo showcases the unified header system that adapts to different pages.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Headers adapt to different page contexts</li>
            <li>Use <code>usePageHeader</code> hook to configure your page's header</li>
            <li>Special actions can be added dynamically</li>
            <li>Headers respect responsive layouts</li>
          </ul>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Example Code</h2>
          <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
            {`usePageHeader({
  title: 'My Page Title',
  actions: [
    { 
      label: 'Action Label', 
      onClick: () => doSomething(),
      icon: <Icon /> // Optional
    }
  ],
  showSearch: true,
  variant: 'default',
  style: {
    backgroundColor: '#1e3a8acc',
    color: '#ffffff'
  }
});`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default HeaderDemoPage;