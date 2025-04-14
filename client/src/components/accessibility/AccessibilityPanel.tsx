import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  ZoomIn,
  ZoomOut,
  PanelTop,
  CircleOff,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function AccessibilityPanel() {
  const {
    isPanelOpen,
    textSize,
    contrast,
    reducedMotion,
    voiceEnabled,
    setTextSize,
    setContrast,
    setReducedMotion,
    setVoiceEnabled,
    togglePanel
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
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={togglePanel}
          />
          
          {/* Panel */}
          <motion.div
            className="fixed right-4 top-24 z-50 w-80 rounded-xl bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur shadow-xl border border-white/10 overflow-hidden"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <h3 className="font-medium">Accessibility Controls</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePanel}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Content */}
            <Tabs defaultValue="display" className="p-4">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="motion">Motion</TabsTrigger>
                <TabsTrigger value="sound">Sound</TabsTrigger>
              </TabsList>
              
              {/* Display Tab */}
              <TabsContent value="display" className="space-y-6">
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
                  <label className="text-sm font-medium">Color Contrast</label>
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
                
                {/* Text Preview */}
                <div className={`p-3 rounded-md bg-white/5 space-y-2 ${textSize === 'normal' ? 'text-base' : textSize === 'large' ? 'text-lg' : 'text-xl'}`}>
                  <h4 className="font-medium">Text Preview</h4>
                  <p className="text-white/80">
                    This is how your text will appear with the current settings.
                  </p>
                </div>
              </TabsContent>
              
              {/* Motion Tab */}
              <TabsContent value="motion" className="space-y-6">
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
                
                <div className="p-3 rounded-md bg-white/5">
                  {reducedMotion ? (
                    <div className="flex items-center gap-2">
                      <CircleOff className="h-5 w-5 text-white/70" />
                      <span>Animations and transitions reduced</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <PanelTop className="h-5 w-5 text-white/70" />
                        <span>Standard animations enabled</span>
                      </div>
                      <motion.div
                        className="h-2 w-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mt-2"
                        animate={{ x: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Sound Tab */}
              <TabsContent value="sound" className="space-y-6">
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
                
                <div className="p-3 rounded-md bg-white/5 flex items-center gap-3">
                  {voiceEnabled ? (
                    <>
                      <Volume2 className="h-5 w-5 text-white/70" />
                      <div className="flex-1">
                        <span className="text-sm">Voice feedback enabled</span>
                        <div className="h-1.5 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            animate={{ width: ['15%', '100%', '65%', '85%', '35%', '75%'] }}
                            transition={{ repeat: Infinity, duration: 3, repeatType: 'reverse' }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-5 w-5 text-white/70" />
                      <span className="text-sm">Voice feedback disabled</span>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Footer */}
            <div className="p-3 border-t border-white/10 flex justify-between bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
              <a
                href="/accessibility"
                onClick={togglePanel}
                className="text-xs text-indigo-300 hover:text-indigo-200"
              >
                More options
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePanel}
                className="text-xs h-7 px-2"
              >
                Close Panel
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}