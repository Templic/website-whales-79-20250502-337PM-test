import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Type, 
  Contrast, 
  MousePointer, 
  Eye,
  PlayCircle, 
  X 
} from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export function AccessibilityPanel() {
  const { 
    textSize, 
    setTextSize, 
    contrast, 
    setContrast, 
    reducedMotion, 
    setReducedMotion,
    isPanelOpen,
    closePanel
  } = useAccessibility();
  
  const { toast } = useToast();
  
  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
          />
          
          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full z-50 w-[420px] max-w-[95vw] shadow-xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="h-full bg-cosmic-background overflow-y-auto overflow-x-hidden shadow-lg border-l border-purple-500/20">
              <div className="p-6 bg-gradient-to-b from-purple-900/30 to-slate-900/50">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold cosmic-gradient-text">Accessibility Controls</h2>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={closePanel}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {/* Text Size */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Type className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-medium">Text Size</h3>
                    </div>
                    <div>
                      <Slider
                        value={[textSize]}
                        min={75}
                        max={150}
                        step={5}
                        onValueChange={(value) => setTextSize(value[0])}
                        className="cursor-pointer"
                      />
                      <div className="flex justify-between mt-2">
                        <div className="text-sm">Smaller</div>
                        <div className="text-sm font-medium">{textSize}%</div>
                        <div className="text-sm">Larger</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contrast */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Contrast className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-medium">Contrast</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setContrast('default')}
                        className={`p-3 rounded text-center text-sm transition-colors ${
                          contrast === 'default' 
                            ? 'bg-purple-600/30 border border-purple-500'
                            : 'bg-black/20 border border-white/10 hover:border-white/30'
                        }`}
                      >
                        Default
                      </button>
                      <button
                        onClick={() => setContrast('high')}
                        className={`p-3 rounded text-center text-sm transition-colors ${
                          contrast === 'high' 
                            ? 'bg-purple-600/30 border border-purple-500'
                            : 'bg-black/20 border border-white/10 hover:border-white/30'
                        }`}
                      >
                        High Contrast
                      </button>
                      <button
                        onClick={() => setContrast('dark')}
                        className={`p-3 rounded text-center text-sm transition-colors ${
                          contrast === 'dark' 
                            ? 'bg-purple-600/30 border border-purple-500'
                            : 'bg-black/20 border border-white/10 hover:border-white/30'
                        }`}
                      >
                        Dark Mode
                      </button>
                    </div>
                  </div>
                  
                  {/* Motion */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-medium">Motion</h3>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                      <div>
                        <h4 className="font-medium">Reduce Motion</h4>
                        <p className="text-sm text-white/60">Minimize animations and transitions</p>
                      </div>
                      <Switch 
                        checked={reducedMotion} 
                        onCheckedChange={setReducedMotion} 
                      />
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-medium">Navigation</h3>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                      <div>
                        <h4 className="font-medium">Auto-hide Navigation</h4>
                        <p className="text-sm text-white/60">Automatically hide the header when scrolling down</p>
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
                  
                  <div className="pt-4 border-t border-white/10 mt-4">
                    <Link href="/accessibility">
                      <Button 
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          closePanel();
                          toast({
                            title: "Opening accessibility page",
                            description: "View all accessibility options",
                          });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Advanced Accessibility Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AccessibilityPanel;