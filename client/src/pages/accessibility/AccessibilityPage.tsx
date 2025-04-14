import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Type, 
  Eye, 
  Contrast, 
  Volume2, 
  MousePointer, 
  Zap,
  PlayCircle, 
  ArrowLeft, 
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { SectionHeading } from '@/components/ui/section-heading';
import { PageTransition } from '@/components/ui/page-transition';

export function AccessibilityPage() {
  const { 
    textSize, 
    setTextSize, 
    contrast, 
    setContrast, 
    reducedMotion, 
    setReducedMotion,
    voiceEnabled,
    setVoiceEnabled,
    autoHideNav,
    setAutoHideNav
  } = useAccessibility();
  
  const { toast } = useToast();
  
  const saveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your accessibility preferences have been updated.",
    });
  };
  
  const resetSettings = () => {
    setTextSize(100);
    setContrast('default');
    setReducedMotion(false);
    setVoiceEnabled(false);
    setAutoHideNav(true);
    
    toast({
      title: "Settings Reset",
      description: "Your accessibility preferences have been reset to defaults.",
    });
  };
  
  return (
    <PageTransition>
      <div className="container max-w-4xl py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-white/60 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          
          <SectionHeading
            title="Accessibility Settings"
            description="Customize your experience to suit your needs and preferences."
            align="left"
            titleClassName="text-4xl"
          />
        </div>
        
        {/* Main Content */}
        <Tabs defaultValue="visual" className="mb-8">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Visual</span>
            </TabsTrigger>
            <TabsTrigger value="motion" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              <span>Motion</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span>Audio</span>
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              <span>Navigation</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Visual Settings */}
          <TabsContent value="visual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-purple-400" />
                  Text Size
                </CardTitle>
                <CardDescription>
                  Adjust the size of text across the website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Slider
                    value={[textSize]}
                    min={75}
                    max={150}
                    step={5}
                    onValueChange={(value) => setTextSize(value[0])}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between">
                    <div className="text-sm">Smaller (75%)</div>
                    <div className="text-sm font-medium">{textSize}%</div>
                    <div className="text-sm">Larger (150%)</div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-sm font-medium mb-2">Preview:</h4>
                    <div className="p-4 bg-black/20 rounded-md space-y-3">
                      <p className="text-xl" style={{ fontSize: `${textSize * 0.01 * 1.25}rem` }}>
                        Cosmic heading text
                      </p>
                      <p style={{ fontSize: `${textSize * 0.01}rem` }}>
                        This is an example of body text at {textSize}% size. The text should be comfortable to read and properly scaled based on your preference.
                      </p>
                      <p className="text-sm" style={{ fontSize: `${textSize * 0.01 * 0.875}rem` }}>
                        This is smaller text that would appear in captions or secondary information.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Contrast className="h-5 w-5 text-purple-400" />
                  Contrast & Colors
                </CardTitle>
                <CardDescription>
                  Adjust contrast and color schemes for better visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setContrast('default')}
                      className={`p-4 rounded text-center transition-colors h-full ${
                        contrast === 'default' 
                          ? 'bg-purple-600/30 border-2 border-purple-500'
                          : 'bg-black/20 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="block mb-3 text-lg">Default</span>
                      <div className="h-20 bg-gradient-to-b from-slate-900 to-slate-800 rounded-md flex items-center justify-center mb-2">
                        <span className="text-white">Aa</span>
                      </div>
                      <span className="text-sm text-white/70">Standard cosmic theme</span>
                      {contrast === 'default' && (
                        <div className="mt-2 text-purple-400 flex items-center justify-center">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setContrast('high')}
                      className={`p-4 rounded text-center transition-colors h-full ${
                        contrast === 'high' 
                          ? 'bg-purple-600/30 border-2 border-purple-500'
                          : 'bg-black/20 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="block mb-3 text-lg">High Contrast</span>
                      <div className="h-20 bg-black rounded-md flex items-center justify-center mb-2">
                        <span className="text-white">Aa</span>
                      </div>
                      <span className="text-sm text-white/70">Maximum readability</span>
                      {contrast === 'high' && (
                        <div className="mt-2 text-purple-400 flex items-center justify-center">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setContrast('dark')}
                      className={`p-4 rounded text-center transition-colors h-full ${
                        contrast === 'dark' 
                          ? 'bg-purple-600/30 border-2 border-purple-500'
                          : 'bg-black/20 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="block mb-3 text-lg">Dark Mode</span>
                      <div className="h-20 bg-gray-900 rounded-md flex items-center justify-center mb-2">
                        <span className="text-white">Aa</span>
                      </div>
                      <span className="text-sm text-white/70">Reduced eye strain</span>
                      {contrast === 'dark' && (
                        <div className="mt-2 text-purple-400 flex items-center justify-center">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Motion Settings */}
          <TabsContent value="motion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-purple-400" />
                  Animations & Effects
                </CardTitle>
                <CardDescription>
                  Control animations and visual effects across the website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-md">
                    <div>
                      <h4 className="font-medium">Reduce Motion</h4>
                      <p className="text-sm text-white/60">Minimize animations and transitions for a more stable experience</p>
                    </div>
                    <Switch 
                      checked={reducedMotion} 
                      onCheckedChange={setReducedMotion} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-md">
                    <div>
                      <h4 className="font-medium">Reduce Cosmic Effects</h4>
                      <p className="text-sm text-white/60">Minimize particle effects, glows, and visual flourishes</p>
                    </div>
                    <Switch 
                      checked={reducedMotion} 
                      onCheckedChange={setReducedMotion} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-md">
                    <div>
                      <h4 className="font-medium">Disable Video Autoplay</h4>
                      <p className="text-sm text-white/60">Prevent videos from playing automatically</p>
                    </div>
                    <Switch 
                      checked={true} 
                      onCheckedChange={() => {
                        toast({
                          title: "Coming Soon",
                          description: "This feature will be available in a future update.",
                        })
                      }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Audio Settings */}
          <TabsContent value="audio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-purple-400" />
                  Sound & Voice
                </CardTitle>
                <CardDescription>
                  Customize audio and voice assistant features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-md">
                    <div>
                      <h4 className="font-medium">Voice Navigation</h4>
                      <p className="text-sm text-white/60">Enable voice commands for hands-free control</p>
                    </div>
                    <Switch 
                      checked={voiceEnabled} 
                      onCheckedChange={setVoiceEnabled} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-md">
                    <div>
                      <h4 className="font-medium">Screen Reader Compatibility</h4>
                      <p className="text-sm text-white/60">Optimize content for screen readers</p>
                    </div>
                    <Switch 
                      checked={true}
                      onCheckedChange={() => {}} 
                      disabled
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-md">
                    <div>
                      <h4 className="font-medium">Audio Descriptions</h4>
                      <p className="text-sm text-white/60">Add audio descriptions to visual content when available</p>
                    </div>
                    <Switch 
                      checked={false} 
                      onCheckedChange={() => {
                        toast({
                          title: "Coming Soon",
                          description: "This feature will be available in a future update.",
                        })
                      }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Navigation Settings */}
          <TabsContent value="navigation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5 text-purple-400" />
                  Navigation & Interaction
                </CardTitle>
                <CardDescription>
                  Customize how you navigate and interact with the website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-md">
                    <div>
                      <h4 className="font-medium">Auto-hide Navigation</h4>
                      <p className="text-sm text-white/60">Automatically hide the header when scrolling down</p>
                    </div>
                    <Switch 
                      checked={autoHideNav} 
                      onCheckedChange={setAutoHideNav} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-md">
                    <div>
                      <h4 className="font-medium">Focus Indicators</h4>
                      <p className="text-sm text-white/60">Show enhanced focus indicators for keyboard navigation</p>
                    </div>
                    <Switch 
                      checked={true} 
                      onCheckedChange={() => {
                        toast({
                          title: "Coming Soon",
                          description: "This feature will be available in a future update.",
                        })
                      }} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-md">
                    <div>
                      <h4 className="font-medium">Simplified Layout</h4>
                      <p className="text-sm text-white/60">Use a more straightforward layout with fewer decorative elements</p>
                    </div>
                    <Switch 
                      checked={false} 
                      onCheckedChange={() => {
                        toast({
                          title: "Coming Soon",
                          description: "This feature will be available in a future update.",
                        })
                      }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={resetSettings}
            className="px-8"
          >
            Reset Defaults
          </Button>
          
          <Button
            onClick={saveSettings}
            className="px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}

export default AccessibilityPage;