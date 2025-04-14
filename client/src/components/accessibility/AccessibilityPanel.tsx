import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Type, 
  Moon,
  Sun,
  Eye,
  Volume2, 
  ZoomIn,
  ZoomOut,
  SunMoon,
  RefreshCw
} from 'lucide-react';
import { Link } from 'wouter';

export default function AccessibilityPanel() {
  const { 
    isPanelOpen,
    toggleAccessibilityPanel,
    textSize,
    setTextSize,
    darkMode,
    setDarkMode,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    soundEnabled,
    setSoundEnabled,
    applyDefaultSettings
  } = useAccessibility();

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-0">
            <motion.div
              className="relative bg-gradient-to-b from-purple-950 to-black border border-white/10 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, delay: 0.05 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <h2 className="text-xl font-semibold">Accessibility Settings</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAccessibilityPanel}
                  aria-label="Close accessibility panel"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Text Size */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Type className="h-5 w-5 mr-2 text-purple-400" />
                    <h3 className="text-base font-medium">Text Size</h3>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full w-8 h-8 p-0 flex items-center justify-center"
                      onClick={() => setTextSize(Math.max(0.85, textSize - 0.15))}
                      aria-label="Decrease text size"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full"
                        style={{ 
                          width: `${Math.round(((textSize - 0.85) / 0.45) * 100)}%` 
                        }}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full w-8 h-8 p-0 flex items-center justify-center"
                      onClick={() => setTextSize(Math.min(1.3, textSize + 0.15))}
                      aria-label="Increase text size"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-white/60 flex justify-between">
                    <span>Smaller</span>
                    <span>Larger</span>
                  </div>
                </div>
                
                {/* Quick Settings Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Dark Mode */}
                  <Button
                    variant="outline"
                    className={`flex items-center justify-start p-3 h-auto ${
                      darkMode ? 'bg-purple-900/30 border-purple-600/50' : ''
                    }`}
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    <div className="mr-3 p-2 rounded-full bg-black/20">
                      {darkMode ? (
                        <Moon className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Dark Mode</div>
                      <div className="text-xs text-white/60">{darkMode ? 'On' : 'Off'}</div>
                    </div>
                  </Button>
                  
                  {/* High Contrast */}
                  <Button
                    variant="outline"
                    className={`flex items-center justify-start p-3 h-auto ${
                      highContrast ? 'bg-purple-900/30 border-purple-600/50' : ''
                    }`}
                    onClick={() => setHighContrast(!highContrast)}
                  >
                    <div className="mr-3 p-2 rounded-full bg-black/20">
                      <SunMoon className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">High Contrast</div>
                      <div className="text-xs text-white/60">{highContrast ? 'On' : 'Off'}</div>
                    </div>
                  </Button>
                  
                  {/* Reduced Motion */}
                  <Button
                    variant="outline"
                    className={`flex items-center justify-start p-3 h-auto ${
                      reducedMotion ? 'bg-purple-900/30 border-purple-600/50' : ''
                    }`}
                    onClick={() => setReducedMotion(!reducedMotion)}
                  >
                    <div className="mr-3 p-2 rounded-full bg-black/20">
                      <RefreshCw className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Reduced Motion</div>
                      <div className="text-xs text-white/60">{reducedMotion ? 'On' : 'Off'}</div>
                    </div>
                  </Button>
                  
                  {/* Sound */}
                  <Button
                    variant="outline"
                    className={`flex items-center justify-start p-3 h-auto ${
                      soundEnabled ? 'bg-purple-900/30 border-purple-600/50' : ''
                    }`}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    <div className="mr-3 p-2 rounded-full bg-black/20">
                      <Volume2 className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Sound</div>
                      <div className="text-xs text-white/60">{soundEnabled ? 'On' : 'Off'}</div>
                    </div>
                  </Button>
                </div>
                
                {/* Reset Button */}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center"
                    onClick={applyDefaultSettings}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Default Settings
                  </Button>
                </div>
              </div>
              
              {/* Footer */}
              <div className="border-t border-white/10 p-4 bg-black/20">
                <Link href="/accessibility">
                  <a 
                    className="text-sm text-white/70 hover:text-white flex items-center justify-center"
                    onClick={toggleAccessibilityPanel}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View all accessibility options
                  </a>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}