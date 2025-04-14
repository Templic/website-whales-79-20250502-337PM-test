import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Type, 
  Contrast, 
  Mic, 
  Keyboard,
  Eye, 
  EyeOff, 
  MousePointer, 
  Languages, 
  Volume2, 
  Palette, 
  Clock, 
  Save, 
  RotateCcw 
} from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { cn } from '@/lib/utils';

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
  
  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="space-y-4 mb-8">
        <h1 className="text-4xl font-bold cosmic-gradient-text">Accessibility Settings</h1>
        <p className="text-lg text-white/80">
          Customize your cosmic experience to suit your accessibility needs. All settings are saved automatically and will persist across your visits.
        </p>
      </div>
      
      <Tabs defaultValue="display" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Display</span>
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            <span>Controls</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span>Audio & Media</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Display Tab */}
        <TabsContent value="display" className="space-y-6 mt-6">
          {/* Text Size */}
          <Card className="cosmic-glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-purple-400" />
                <CardTitle>Text Size</CardTitle>
              </div>
              <CardDescription>
                Adjust the size of text throughout the site for better readability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Slider
                    value={[textSize]}
                    min={75}
                    max={200}
                    step={5}
                    onValueChange={(value) => setTextSize(value[0])}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between mt-2">
                    <div className="text-sm">Smaller ({textSize < 100 ? textSize : 75}%)</div>
                    <div className="text-sm font-medium">Current: {textSize}%</div>
                    <div className="text-sm">Larger ({textSize > 100 ? textSize : 200}%)</div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-white/10 mt-4">
                  <div className="text-sm font-medium mb-2">Preview</div>
                  <div className="p-3 rounded-md bg-black/20 space-y-2">
                    <h3 className="text-lg font-medium">Cosmic Vibrations</h3>
                    <p className="text-white/70">Experience the rhythm of the universe with our curated collection of cosmic sounds.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Contrast & Colors */}
          <Card className="cosmic-glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Contrast className="h-5 w-5 text-purple-400" />
                <CardTitle>Contrast & Colors</CardTitle>
              </div>
              <CardDescription>
                Choose a contrast mode that works best for your vision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setContrast("default")}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-lg border p-4 transition-colors",
                    contrast === "default"
                      ? "border-purple-400 bg-purple-900/20"
                      : "border-white/10 bg-black/20 hover:border-white/30",
                  )}
                >
                  <div className="h-16 w-16 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600"></div>
                  <span className="font-medium">Default</span>
                  <p className="text-xs text-white/60 text-center">Original cosmic theme with rich colors and gradients</p>
                </button>
                
                <button
                  onClick={() => setContrast("high")}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-lg border p-4 transition-colors",
                    contrast === "high"
                      ? "border-purple-400 bg-purple-900/20"
                      : "border-white/10 bg-black/20 hover:border-white/30",
                  )}
                >
                  <div className="h-16 w-16 rounded-md bg-white border border-gray-200"></div>
                  <span className="font-medium">High Contrast</span>
                  <p className="text-xs text-white/60 text-center">Maximum contrast for better visibility and readability</p>
                </button>
                
                <button
                  onClick={() => setContrast("dark")}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-lg border p-4 transition-colors",
                    contrast === "dark"
                      ? "border-purple-400 bg-purple-900/20"
                      : "border-white/10 bg-black/20 hover:border-white/30",
                  )}
                >
                  <div className="h-16 w-16 rounded-md bg-gray-900 border border-gray-800"></div>
                  <span className="font-medium">Dark Mode</span>
                  <p className="text-xs text-white/60 text-center">Lower light emission for reduced eye strain</p>
                </button>
              </div>
            </CardContent>
          </Card>
          
          {/* Motion & Animation */}
          <Card className="cosmic-glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-400"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                <CardTitle>Motion & Animation</CardTitle>
              </div>
              <CardDescription>
                Control the amount of movement and animation effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Reduce Motion</h3>
                  <p className="text-sm text-white/60">Minimize animations and motion effects</p>
                </div>
                <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
              </div>
              
              <div className="mt-6 p-3 rounded-md bg-black/20">
                <p className="text-sm text-white/70">
                  When enabled, this setting reduces or eliminates animations, transitions, and automatic movements throughout the site. This can help prevent discomfort for users with vestibular disorders or motion sensitivity.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-6 mt-6">
          {/* Navigation Controls */}
          <Card className="cosmic-glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-purple-400" />
                <CardTitle>Navigation Controls</CardTitle>
              </div>
              <CardDescription>
                Customize how you navigate through the site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto-hide Navigation</h3>
                  <p className="text-sm text-white/60">Automatically hide the navigation bar when scrolling</p>
                </div>
                <Switch checked={autoHideNav} onCheckedChange={setAutoHideNav} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Voice Navigation</h3>
                  <p className="text-sm text-white/60">Control the site using voice commands</p>
                </div>
                <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
              </div>
              
              {voiceEnabled && (
                <div className="rounded-md bg-black/20 p-4">
                  <h3 className="font-medium mb-2">Voice Commands</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>"Go to home"</span>
                      <span className="text-purple-300">Navigates to home page</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>"Open shop"</span>
                      <span className="text-purple-300">Opens the shop page</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>"Play music"</span>
                      <span className="text-purple-300">Plays the current track</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>"Search for [term]"</span>
                      <span className="text-purple-300">Searches the site</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Keyboard Navigation */}
          <Card className="cosmic-glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-purple-400" />
                <CardTitle>Keyboard Navigation</CardTitle>
              </div>
              <CardDescription>
                Keyboard shortcuts for efficient navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm mb-4">The following keyboard shortcuts are available throughout the site:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex items-center justify-between">
                    <span>Skip to Content</span>
                    <kbd className="px-2 py-1 bg-black/30 rounded border border-white/10">Tab</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Search</span>
                    <kbd className="px-2 py-1 bg-black/30 rounded border border-white/10">/ (Slash)</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Open Accessibility Menu</span>
                    <kbd className="px-2 py-1 bg-black/30 rounded border border-white/10">Alt + A</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Home Page</span>
                    <kbd className="px-2 py-1 bg-black/30 rounded border border-white/10">Alt + H</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Play/Pause Music</span>
                    <kbd className="px-2 py-1 bg-black/30 rounded border border-white/10">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Track</span>
                    <kbd className="px-2 py-1 bg-black/30 rounded border border-white/10">→</kbd>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Audio & Media Tab */}
        <TabsContent value="audio" className="space-y-6 mt-6">
          {/* Audio Settings */}
          <Card className="cosmic-glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-purple-400" />
                <CardTitle>Audio Settings</CardTitle>
              </div>
              <CardDescription>
                Control sound and audio playback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto-play Media</h3>
                  <p className="text-sm text-white/60">Allow media to play automatically</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Background Sounds</h3>
                  <p className="text-sm text-white/60">Enable ambient sound effects</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Audio Volume</h3>
                <Slider
                  defaultValue={[80]}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs">Mute</span>
                  <span className="text-xs">Max</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Media Captions */}
          <Card className="cosmic-glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-purple-400" />
                <CardTitle>Media Captions</CardTitle>
              </div>
              <CardDescription>
                Control captions and subtitles for audio and video content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Show Captions</h3>
                  <p className="text-sm text-white/60">Display captions for video content</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Caption Size</h3>
                <Slider
                  defaultValue={[100]}
                  min={75}
                  max={150}
                  step={5}
                  className="cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs">Small</span>
                  <span className="text-xs">Large</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Caption Style</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-2 border border-purple-400 bg-purple-900/20 rounded-md text-center text-sm">
                    Default
                  </button>
                  <button className="p-2 border border-white/10 bg-black/20 hover:border-white/30 rounded-md text-center text-sm">
                    Outlined
                  </button>
                  <button className="p-2 border border-white/10 bg-black/20 hover:border-white/30 rounded-md text-center text-sm">
                    Shadow
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6 mt-6">
          {/* Screen Reader Support */}
          <Card className="cosmic-glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-400" />
                <CardTitle>Screen Reader Support</CardTitle>
              </div>
              <CardDescription>
                Optimize content for screen readers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enhanced Descriptions</h3>
                  <p className="text-sm text-white/60">Provide more detailed descriptions for screen readers</p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Focus Mode</h3>
                  <p className="text-sm text-white/60">Enhance focus indicators for better navigation</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              
              <div className="mt-4 p-3 rounded-md bg-black/20">
                <p className="text-sm text-white/70">
                  Our site is optimized for screen readers including JAWS, NVDA, and VoiceOver. If you encounter any accessibility issues, please contact us through our support form.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Session Timing */}
          <Card className="cosmic-glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                <CardTitle>Session Timing</CardTitle>
              </div>
              <CardDescription>
                Control timeouts and session durations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Extended Timeouts</h3>
                  <p className="text-sm text-white/60">Extend form and session timeout periods</p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Session Warning</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-2 border border-white/10 bg-black/20 hover:border-white/30 rounded-md text-center text-sm">
                    30 seconds
                  </button>
                  <button className="p-2 border border-purple-400 bg-purple-900/20 rounded-md text-center text-sm">
                    60 seconds
                  </button>
                  <button className="p-2 border border-white/10 bg-black/20 hover:border-white/30 rounded-md text-center text-sm">
                    2 minutes
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Reset Settings */}
          <Card className="cosmic-glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-purple-400" />
                <CardTitle>Reset Settings</CardTitle>
              </div>
              <CardDescription>
                Restore default accessibility settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-white/70">
                If you wish to return to the default accessibility settings, you can reset all settings at once.
              </p>
              
              <div className="mt-4 flex justify-end">
                <Button variant="destructive" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset All Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 flex justify-center">
        <Button className="gap-2 cosmic-button">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

export default AccessibilityPage;