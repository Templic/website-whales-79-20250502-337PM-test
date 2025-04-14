import React from 'react';
import { Link } from 'wouter';
import MainLayout from '../../components/layout/MainLayout';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import {
  Type,
  Eye,
  Volume2,
  Minimize,
  Maximize,
  RefreshCw,
  Info,
  ExternalLink,
  Moon,
  Sun,
  SunMoon,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AccessibilityPage() {
  const {
    textSize,
    highContrast,
    reducedMotion,
    voiceEnabled,
    soundEnabled,
    customColors,
    darkMode,
    setTextSize,
    setHighContrast,
    setReducedMotion,
    setVoiceEnabled,
    setSoundEnabled,
    setCustomColors,
    setDarkMode,
    applyDefaultSettings,
    applyHighContrastSettings,
    applyEasierReadingSettings,
    applyReducedMotionSettings
  } = useAccessibility();

  // Handle text size changes
  const handleTextSizeChange = (size: number) => {
    setTextSize(size);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Accessibility Settings</h1>
            <p className="text-lg text-white/70 mb-6">
              Customize your experience to make our site work better for you
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={applyDefaultSettings} variant="outline" className="border-white/10">
                Default Settings
              </Button>
              <Button onClick={applyHighContrastSettings} variant="outline" className="border-white/10">
                High Contrast
              </Button>
              <Button onClick={applyEasierReadingSettings} variant="outline" className="border-white/10">
                Easier Reading
              </Button>
              <Button onClick={applyReducedMotionSettings} variant="outline" className="border-white/10">
                Reduced Motion
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Text Size */}
            <div className="bg-black/20 rounded-lg border border-white/10 p-6">
              <div className="flex items-center mb-4">
                <Type className="h-6 w-6 mr-3 text-purple-400" />
                <h2 className="text-xl font-semibold">Text Size</h2>
              </div>
              <p className="text-white/70 mb-6">
                Adjust the size of text throughout the website to improve readability
              </p>
              <div className="space-y-4">
                <div 
                  className={`p-4 rounded-md border cursor-pointer ${
                    textSize === 0.85 
                      ? 'bg-purple-900/50 border-purple-600' 
                      : 'bg-black/20 border-white/10 hover:bg-black/30'
                  }`}
                  onClick={() => handleTextSizeChange(0.85)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Small</span>
                    <span className="text-xs px-2 py-1 rounded bg-black/20">0.85x</span>
                  </div>
                </div>

                <div 
                  className={`p-4 rounded-md border cursor-pointer ${
                    textSize === 1 
                      ? 'bg-purple-900/50 border-purple-600' 
                      : 'bg-black/20 border-white/10 hover:bg-black/30'
                  }`}
                  onClick={() => handleTextSizeChange(1)}
                >
                  <div className="flex items-center justify-between">
                    <span>Normal</span>
                    <span className="text-xs px-2 py-1 rounded bg-black/20">1x</span>
                  </div>
                </div>

                <div 
                  className={`p-4 rounded-md border cursor-pointer ${
                    textSize === 1.15 
                      ? 'bg-purple-900/50 border-purple-600' 
                      : 'bg-black/20 border-white/10 hover:bg-black/30'
                  }`}
                  onClick={() => handleTextSizeChange(1.15)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">Large</span>
                    <span className="text-xs px-2 py-1 rounded bg-black/20">1.15x</span>
                  </div>
                </div>

                <div 
                  className={`p-4 rounded-md border cursor-pointer ${
                    textSize === 1.3 
                      ? 'bg-purple-900/50 border-purple-600' 
                      : 'bg-black/20 border-white/10 hover:bg-black/30'
                  }`}
                  onClick={() => handleTextSizeChange(1.3)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">X-Large</span>
                    <span className="text-xs px-2 py-1 rounded bg-black/20">1.3x</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-white/50 text-sm">
                <p>Current size: {textSize === 0.85 ? 'Small' : textSize === 1 ? 'Normal' : textSize === 1.15 ? 'Large' : 'X-Large'}</p>
              </div>
            </div>

            {/* Display & Theme */}
            <div className="bg-black/20 rounded-lg border border-white/10 p-6">
              <div className="flex items-center mb-4">
                <Eye className="h-6 w-6 mr-3 text-purple-400" />
                <h2 className="text-xl font-semibold">Display & Theme</h2>
              </div>
              <p className="text-white/70 mb-6">
                Adjust contrast, colors, and theme to reduce eye strain and improve visibility
              </p>
              <div className="space-y-5">
                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 p-2 rounded-full bg-black/20">
                      {darkMode ? (
                        <Moon className="h-5 w-5 text-purple-400" />
                      ) : (
                        <Sun className="h-5 w-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-white/60">
                        {darkMode ? 'Currently using dark theme' : 'Currently using light theme'}
                      </p>
                    </div>
                  </div>
                  <div 
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                      darkMode ? 'bg-purple-700' : 'bg-slate-700'
                    }`}
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                        darkMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 p-2 rounded-full bg-black/20">
                      <SunMoon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">High Contrast</p>
                      <p className="text-sm text-white/60">
                        Increase contrast for better readability
                      </p>
                    </div>
                  </div>
                  <div 
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                      highContrast ? 'bg-purple-700' : 'bg-slate-700'
                    }`}
                    onClick={() => setHighContrast(!highContrast)}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                        highContrast ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 p-2 rounded-full bg-black/20">
                      <Zap className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">Custom Colors</p>
                      <p className="text-sm text-white/60">
                        Allows specialized color schemes
                      </p>
                    </div>
                  </div>
                  <div 
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                      customColors ? 'bg-purple-700' : 'bg-slate-700'
                    }`}
                    onClick={() => setCustomColors(!customColors)}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                        customColors ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="p-4 rounded-md bg-black/20 border border-white/10">
                    <div className="flex items-center">
                      <Info className="h-4 w-4 text-white/60 mr-2" />
                      <p className="text-sm text-white/60">
                        These settings may override some website styles to improve visibility and contrast
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Motion & Animation */}
            <div className="bg-black/20 rounded-lg border border-white/10 p-6">
              <div className="flex items-center mb-4">
                <Minimize className="h-6 w-6 mr-3 text-purple-400" />
                <h2 className="text-xl font-semibold">Motion & Animation</h2>
              </div>
              <p className="text-white/70 mb-6">
                Reduce or disable motion effects and animations
              </p>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="mr-3 p-2 rounded-full bg-black/20">
                    <motion.div 
                      animate={{ rotate: reducedMotion ? 0 : 360 }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                    >
                      <RefreshCw className="h-5 w-5 text-purple-400" />
                    </motion.div>
                  </div>
                  <div>
                    <p className="font-medium">Reduced Motion</p>
                    <p className="text-sm text-white/60">
                      Minimize animations and motion effects
                    </p>
                  </div>
                </div>
                <div 
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                    reducedMotion ? 'bg-purple-700' : 'bg-slate-700'
                  }`}
                  onClick={() => setReducedMotion(!reducedMotion)}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                      reducedMotion ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
              
              <div className="p-4 rounded-md bg-black/20 border border-white/10">
                <div className="flex items-center">
                  <Info className="h-4 w-4 text-white/60 mr-2" />
                  <p className="text-sm text-white/60">
                    Reduced motion settings help people with vestibular disorders and can reduce motion sickness and disorientation
                  </p>
                </div>
              </div>
            </div>

            {/* Sound & Voice */}
            <div className="bg-black/20 rounded-lg border border-white/10 p-6">
              <div className="flex items-center mb-4">
                <Volume2 className="h-6 w-6 mr-3 text-purple-400" />
                <h2 className="text-xl font-semibold">Sound & Voice</h2>
              </div>
              <p className="text-white/70 mb-6">
                Control audio features and text-to-speech capabilities
              </p>
              
              <div className="space-y-5 mb-6">
                {/* Sound Effects */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 p-2 rounded-full bg-black/20">
                      <Volume2 className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">Sound Effects</p>
                      <p className="text-sm text-white/60">
                        Enable background music and sound effects
                      </p>
                    </div>
                  </div>
                  <div 
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                      soundEnabled ? 'bg-purple-700' : 'bg-slate-700'
                    }`}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* Text to Speech */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 p-2 rounded-full bg-black/20">
                      <Volume2 className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">Text-to-Speech</p>
                      <p className="text-sm text-white/60">
                        Enable voice reading for compatible content
                      </p>
                    </div>
                  </div>
                  <div 
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                      voiceEnabled ? 'bg-purple-700' : 'bg-slate-700'
                    }`}
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                        voiceEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-md bg-black/20 border border-white/10">
                <p className="text-sm text-white/60 mb-2">
                  Text-to-speech requires browser support. If you don't hear anything, your browser may not support this feature.
                </p>
                <div className="flex">
                  <a href="https://support.google.com/accessibility/answer/9871700" target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:text-purple-300 inline-flex items-center">
                    Learn more about browser accessibility
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Resources */}
          <div className="mt-12 bg-black/20 rounded-lg border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
            <p className="text-white/70 mb-6">
              Learn more about web accessibility and how to improve your browsing experience
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="https://www.w3.org/WAI/fundamentals/accessibility-intro/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex p-4 rounded-md border border-white/10 bg-black/20 hover:bg-black/30 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Introduction to Web Accessibility</h3>
                  <p className="text-sm text-white/60">Learn the basics of making the web accessible to everyone</p>
                </div>
                <ExternalLink className="h-5 w-5 text-white/40" />
              </a>
              
              <a 
                href="https://www.w3.org/WAI/people-use-web/tools-techniques/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex p-4 rounded-md border border-white/10 bg-black/20 hover:bg-black/30 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Tools & Techniques</h3>
                  <p className="text-sm text-white/60">Discover tools that can help you browse the web more effectively</p>
                </div>
                <ExternalLink className="h-5 w-5 text-white/40" />
              </a>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button
              onClick={applyDefaultSettings}
              variant="outline"
              className="border-white/10 bg-black/20 hover:bg-black/30"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Default Settings
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}