import React, { useState } from 'react';
import { usePageHeader } from '../hooks/use-page-header';
import { Button } from '@/components/ui/button';
import { Settings, HelpCircle, Sparkles, Download, Share2 } from 'lucide-react';

const HeaderDemoPage: React.FC = () => {
  const [headerVariant, setHeaderVariant] = useState<'default' | 'transparent' | 'minimal'>('default');
  
  // Use our custom hook to set the header configuration
  usePageHeader({
    title: 'Header Demo',
    actions: [
      { 
        label: 'Settings', 
        icon: <Settings className="h-4 w-4" />, 
        onClick: () => alert('Settings clicked') 
      },
      { 
        label: 'Help', 
        icon: <HelpCircle className="h-4 w-4" />, 
        onClick: () => alert('Help clicked') 
      },
      { 
        label: 'Special Feature', 
        icon: <Sparkles className="h-4 w-4" />, 
        onClick: () => alert('Special Feature clicked') 
      }
    ],
    showSearch: true,
    showLogo: true,
    variant: headerVariant,
    className: '',
  });

  // Handler for changing the header variant
  const changeHeaderVariant = (variant: 'default' | 'transparent' | 'minimal') => {
    setHeaderVariant(variant);
  };

  return (
    <div className="container pt-16">
      <h1 className="text-3xl font-bold mb-8">Header System Demo</h1>
      
      <div className="bg-card rounded-lg p-6 mb-8 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Header Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            variant={headerVariant === 'default' ? 'default' : 'outline'} 
            onClick={() => changeHeaderVariant('default')}
          >
            Default Header
          </Button>
          <Button 
            variant={headerVariant === 'transparent' ? 'default' : 'outline'} 
            onClick={() => changeHeaderVariant('transparent')}
          >
            Transparent Header
          </Button>
          <Button 
            variant={headerVariant === 'minimal' ? 'default' : 'outline'} 
            onClick={() => changeHeaderVariant('minimal')}
          >
            Minimal Header
          </Button>
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
  showSearch: true,  // Optional
  variant: 'default' // Optional
});`}
          </pre>
        </div>
      </div>
      
      <div className="bg-card rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Header in Different Contexts</h2>
        <p className="mb-4">
          The unified header system allows for context-appropriate header configurations:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="font-medium mb-2">Music Pages</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Headers with music-specific controls like play/pause buttons
            </p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm">View Example</Button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="font-medium mb-2">Shop Pages</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Headers with cart icons and product search
            </p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm">View Example</Button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="font-medium mb-2">Admin Pages</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Headers with advanced admin controls and settings
            </p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm">View Example</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderDemoPage;