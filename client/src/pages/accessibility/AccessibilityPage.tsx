import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Eye,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  PanelTop,
  CircleOff,
  Volume2,
  VolumeX,
  Settings,
  MousePointer,
  Monitor,
  Languages,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function AccessibilityPage() {
  const {
    textSize,
    contrast,
    reducedMotion,
    voiceEnabled,
    setTextSize,
    setContrast,
    setReducedMotion,
    setVoiceEnabled
  } = useAccessibility();
  
  const { toast } = useToast();
  
  const handleContrastChange = (value: 'default' | 'high' | 'inverted') => {
    setContrast(value);
    toast({
      title: "Contrast Updated",
      description: `Display contrast set to ${value}`,
    });
  };
  
  const handleTextSizeChange = (value: 'normal' | 'large' | 'larger') => {
    setTextSize(value);
    toast({
      title: "Text Size Updated",
      description: `Text size set to ${value}`,
    });
  };
  
  const handleReducedMotionChange = (checked: boolean) => {
    setReducedMotion(checked);
    toast({
      title: checked ? "Reduced Motion Enabled" : "Reduced Motion Disabled",
      description: checked
        ? "Animations will be minimized for a better experience"
        : "Standard animations have been restored",
    });
  };
  
  const handleVoiceEnabledChange = (checked: boolean) => {
    setVoiceEnabled(checked);
    toast({
      title: checked ? "Voice Feedback Enabled" : "Voice Feedback Disabled",
      description: checked
        ? "AI responses will be spoken aloud when available"
        : "AI responses will be text-only",
    });
  };
  
  // Size mapping for the text size slider
  const textSizeValue = {
    normal: 1,
    large: 2,
    larger: 3,
  }[textSize];
  
  // Text size labels for display
  const textSizeLabels = {
    normal: 'Normal',
    large: 'Large',
    larger: 'Larger',
  };
  
  // Contrast labels for display
  const contrastLabels = {
    default: 'Default',
    high: 'High Contrast',
    inverted: 'Inverted Colors',
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-4">Accessibility Settings</h1>
            <p className="text-white/70">
              Customize your experience on our platform with these accessibility options.
              Your preferences will be saved for future visits.
            </p>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Quick Settings Card */}
            <div className="md:col-span-1">
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Settings
                  </CardTitle>
                  <CardDescription>
                    Adjust your most important preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Text Size */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Text Size</label>
                      <span className="text-xs text-white/70">
                        {textSizeLabels[textSize]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ZoomOut className="h-4 w-4 text-white/70" />
                      <Slider
                        min={1}
                        max={3}
                        step={1}
                        value={[textSizeValue]}
                        onValueChange={(value) => {
                          const sizeMap = {
                            1: 'normal',
                            2: 'large',
                            3: 'larger',
                          } as const;
                          handleTextSizeChange(sizeMap[value[0] as 1 | 2 | 3]);
                        }}
                        className="flex-1"
                      />
                      <ZoomIn className="h-4 w-4 text-white/70" />
                    </div>
                  </div>
                  
                  {/* Contrast */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Contrast</label>
                      <span className="text-xs text-white/70">
                        {contrastLabels[contrast]}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={contrast === 'default' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleContrastChange('default')}
                        className="w-full"
                      >
                        Default
                      </Button>
                      <Button
                        variant={contrast === 'high' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleContrastChange('high')}
                        className="w-full"
                      >
                        High
                      </Button>
                      <Button
                        variant={contrast === 'inverted' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleContrastChange('inverted')}
                        className="w-full"
                      >
                        Inverted
                      </Button>
                    </div>
                  </div>
                  
                  {/* Reduced Motion */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Reduce Motion</h4>
                      <p className="text-xs text-white/70 mt-1">
                        Minimize animations and transitions
                      </p>
                    </div>
                    <Switch
                      checked={reducedMotion}
                      onCheckedChange={handleReducedMotionChange}
                    />
                  </div>
                  
                  {/* Voice Feedback */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Voice Feedback</h4>
                      <p className="text-xs text-white/70 mt-1">
                        Enable AI spoken responses
                      </p>
                    </div>
                    <Switch
                      checked={voiceEnabled}
                      onCheckedChange={handleVoiceEnabledChange}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Detailed Settings Tabs */}
            <div className="md:col-span-2">
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Detailed Accessibility Options
                  </CardTitle>
                  <CardDescription>
                    Fine-tune your experience with these additional settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="display" className="w-full">
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="display">Display</TabsTrigger>
                      <TabsTrigger value="motion">Motion & Interaction</TabsTrigger>
                      <TabsTrigger value="audio">Audio & Speech</TabsTrigger>
                    </TabsList>
                    
                    {/* Display Tab */}
                    <TabsContent value="display" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Monitor className="h-5 w-5" />
                          Display Settings
                        </h3>
                        
                        {/* Theme Preference */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Theme Preference</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center justify-center gap-2"
                            >
                              <Sun className="h-4 w-4" />
                              <span>Light</span>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full flex items-center justify-center gap-2"
                            >
                              <Moon className="h-4 w-4" />
                              <span>Dark</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              System
                            </Button>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Advanced Text Settings */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Advanced Text Options</h4>
                          <div className="bg-white/5 p-4 rounded-md grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm">Font Family</label>
                              <select className="w-full py-2 px-3 bg-black/20 border border-white/10 rounded-md text-sm">
                                <option>Default (System UI)</option>
                                <option>Sans-serif</option>
                                <option>Serif</option>
                                <option>Monospace</option>
                                <option>Open Dyslexic</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm">Letter Spacing</label>
                              <select className="w-full py-2 px-3 bg-black/20 border border-white/10 rounded-md text-sm">
                                <option>Default</option>
                                <option>Relaxed</option>
                                <option>Wide</option>
                                <option>Very Wide</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm">Line Spacing</label>
                              <select className="w-full py-2 px-3 bg-black/20 border border-white/10 rounded-md text-sm">
                                <option>Default</option>
                                <option>Relaxed</option>
                                <option>Loose</option>
                                <option>Very Loose</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm">Paragraph Spacing</label>
                              <select className="w-full py-2 px-3 bg-black/20 border border-white/10 rounded-md text-sm">
                                <option>Default</option>
                                <option>Increased</option>
                                <option>Double</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        {/* Text Preview */}
                        <div className={`p-4 rounded-md bg-white/5 space-y-2 ${textSize === 'normal' ? 'text-base' : textSize === 'large' ? 'text-lg' : 'text-xl'}`}>
                          <h4 className="font-medium">Text Preview</h4>
                          <p className="text-white/80">
                            This is how your text will appear with the current settings.
                            Adjust the options above to find what works best for you.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Motion & Interaction Tab */}
                    <TabsContent value="motion" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <MousePointer className="h-5 w-5" />
                          Motion & Interaction Settings
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Motion Settings */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Animation Control</h4>
                            <div className="bg-white/5 p-4 rounded-md space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm">Reduced Motion</span>
                                  <p className="text-xs text-white/70">Minimize all animations</p>
                                </div>
                                <Switch
                                  checked={reducedMotion}
                                  onCheckedChange={handleReducedMotionChange}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm">Reduce Background Effects</span>
                                  <p className="text-xs text-white/70">Simplify visual backgrounds</p>
                                </div>
                                <Switch />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm">Hide Decorative Elements</span>
                                  <p className="text-xs text-white/70">Remove non-essential graphics</p>
                                </div>
                                <Switch />
                              </div>
                            </div>
                          </div>
                          
                          {/* Interaction Settings */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Input Preferences</h4>
                            <div className="bg-white/5 p-4 rounded-md space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm">Keyboard Navigation</span>
                                  <p className="text-xs text-white/70">Enhanced keyboard focus</p>
                                </div>
                                <Switch defaultChecked />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm">Focus Indicators</span>
                                  <p className="text-xs text-white/70">High visibility focus rings</p>
                                </div>
                                <Switch defaultChecked />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm">Longer Click Timeout</span>
                                  <p className="text-xs text-white/70">Additional time for interactions</p>
                                </div>
                                <Switch />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Animation Preview */}
                        <div className="p-4 rounded-md bg-white/5 space-y-2">
                          <h4 className="font-medium">Animation Preview</h4>
                          <div className="h-12 bg-black/20 rounded-md overflow-hidden relative">
                            {reducedMotion ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <CircleOff className="h-5 w-5 text-white/50 mr-2" />
                                <span className="text-sm text-white/50">Animations disabled</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0">
                                <div className="relative h-full">
                                  <motion.div
                                    className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded"
                                    animate={{ x: ["0%", "200%", "0%"] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Audio & Speech Tab */}
                    <TabsContent value="audio" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Volume2 className="h-5 w-5" />
                          Audio & Speech Settings
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Audio Settings */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Audio Controls</h4>
                            <div className="bg-white/5 p-4 rounded-md space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm">Voice Feedback</span>
                                  <p className="text-xs text-white/70">Text-to-speech for AI responses</p>
                                </div>
                                <Switch
                                  checked={voiceEnabled}
                                  onCheckedChange={handleVoiceEnabledChange}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm">Background Audio</span>
                                  <p className="text-xs text-white/70">Music and ambient sounds</p>
                                </div>
                                <Switch />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-sm">Sound Effects</span>
                                  <p className="text-xs text-white/70">Interface sounds and alerts</p>
                                </div>
                                <Switch />
                              </div>
                            </div>
                          </div>
                          
                          {/* Speech Settings */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Voice Preferences</h4>
                            <div className="bg-white/5 p-4 rounded-md space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm">Voice Type</label>
                                <select className="w-full py-2 px-3 bg-black/20 border border-white/10 rounded-md text-sm" disabled={!voiceEnabled}>
                                  <option>Default</option>
                                  <option>Female 1</option>
                                  <option>Female 2</option>
                                  <option>Male 1</option>
                                  <option>Male 2</option>
                                </select>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm">Speech Rate</label>
                                  <span className="text-xs text-white/70">Normal</span>
                                </div>
                                <Slider
                                  min={0.5}
                                  max={2}
                                  step={0.1}
                                  defaultValue={[1]}
                                  disabled={!voiceEnabled}
                                  className="flex-1"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm">Speech Pitch</label>
                                  <span className="text-xs text-white/70">Normal</span>
                                </div>
                                <Slider
                                  min={0.5}
                                  max={2}
                                  step={0.1}
                                  defaultValue={[1]}
                                  disabled={!voiceEnabled}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Voice Preview */}
                        <div className="p-4 rounded-md bg-white/5 space-y-2">
                          <h4 className="font-medium">Voice Preview</h4>
                          <div className="flex items-center gap-3">
                            {voiceEnabled ? (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() => {
                                    if (window.speechSynthesis) {
                                      const speech = new SpeechSynthesisUtterance("This is a preview of the text-to-speech voice that will be used for AI responses.");
                                      window.speechSynthesis.speak(speech);
                                    }
                                  }}
                                >
                                  <Volume2 className="h-4 w-4" />
                                  Play Sample
                                </Button>
                                <div className="flex-1">
                                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                      animate={{ width: ['15%', '100%', '65%', '85%', '35%', '75%'] }}
                                      transition={{ repeat: Infinity, duration: 3, repeatType: 'reverse' }}
                                    />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-white/50">
                                <VolumeX className="h-5 w-5" />
                                <span>Voice feedback is currently disabled</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="border-t border-white/10 pt-4 flex justify-between">
                  <div className="flex items-center text-xs text-white/50">
                    <Languages className="h-4 w-4 mr-1" />
                    More language options coming soon
                  </div>
                  <div className="flex items-center text-xs text-white/50">
                    <Keyboard className="h-4 w-4 mr-1" />
                    Keyboard shortcuts: Alt+A to open panel
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
          
          {/* Additional Resources */}
          <div className="mt-12">
            <h2 className="text-xl font-medium mb-4">Additional Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Support</CardTitle>
                  <CardDescription>
                    Need assistance with accessibility? Our team is here to help.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">Contact Us</Button>
                </CardFooter>
              </Card>
              
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Accessibility Statement</CardTitle>
                  <CardDescription>
                    Learn about our commitment to accessibility and ongoing improvements.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">Read More</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}