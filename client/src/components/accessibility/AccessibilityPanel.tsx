import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { 
  ChevronRight, 
  X, 
  Type, 
  PanelTop, 
  Eye, 
  Volume2, 
  Sparkles, 
  Moon,
  Sun,
  Minimize,
  Maximize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function AccessibilityPanel() {
  const {
    textSize,
    highContrast,
    reducedMotion,
    voiceEnabled,
    soundEnabled,
    customColors,
    darkMode,
    isAccessibilityPanelOpen,
    setTextSize,
    setHighContrast,
    setReducedMotion,
    setVoiceEnabled,
    setSoundEnabled,
    setCustomColors,
    setDarkMode,
    toggleAccessibilityPanel,
    applyDefaultSettings,
    applyHighContrastSettings,
    applyEasierReadingSettings,
    applyReducedMotionSettings
  } = useAccessibility();

  // Handle text size changes
  const handleTextSizeChange = (size: number) => {
    setTextSize(size);
  };

  if (!isAccessibilityPanelOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
      className="fixed right-0 top-0 h-full w-[320px] bg-slate-900 text-white shadow-xl border-l border-white/10 z-50 overflow-auto"
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-indigo-900/40">
        <h2 className="text-xl font-semibold">Accessibility Settings</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleAccessibilityPanel}
          aria-label="Close accessibility panel"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Text Size */}
        <section>
          <div className="flex items-center mb-2">
            <Type className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Text Size</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleTextSizeChange(0.85)}
              className={`p-2 rounded ${
                textSize === 0.85
                  ? 'bg-purple-700 text-white'
                  : 'bg-slate-800 text-white/70 hover:bg-slate-700'
              } text-sm`}
            >
              Small
            </button>
            <button
              onClick={() => handleTextSizeChange(1)}
              className={`p-2 rounded ${
                textSize === 1
                  ? 'bg-purple-700 text-white'
                  : 'bg-slate-800 text-white/70 hover:bg-slate-700'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => handleTextSizeChange(1.15)}
              className={`p-2 rounded ${
                textSize === 1.15
                  ? 'bg-purple-700 text-white'
                  : 'bg-slate-800 text-white/70 hover:bg-slate-700'
              } text-lg`}
            >
              Large
            </button>
            <button
              onClick={() => handleTextSizeChange(1.3)}
              className={`p-2 rounded ${
                textSize === 1.3
                  ? 'bg-purple-700 text-white'
                  : 'bg-slate-800 text-white/70 hover:bg-slate-700'
              } text-xl`}
            >
              X-Large
            </button>
          </div>
        </section>

        {/* Display */}
        <section>
          <div className="flex items-center mb-2">
            <Eye className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Display</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <span>Dark Mode</span>
              </label>
              <div 
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                  darkMode ? 'bg-purple-700' : 'bg-slate-700'
                }`}
                onClick={() => setDarkMode(!darkMode)}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
                <span className="ml-2 text-xs">
                  {darkMode ? <Moon className="h-3 w-3 text-white" /> : <Sun className="h-3 w-3 text-white" />}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <span>High Contrast</span>
              </label>
              <div 
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                  highContrast ? 'bg-purple-700' : 'bg-slate-700'
                }`}
                onClick={() => setHighContrast(!highContrast)}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                    highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <span>Custom Colors</span>
              </label>
              <div 
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                  customColors ? 'bg-purple-700' : 'bg-slate-700'
                }`}
                onClick={() => setCustomColors(!customColors)}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                    customColors ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Motion */}
        <section>
          <div className="flex items-center mb-2">
            <Minimize className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Motion</h3>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <span>Reduced Motion</span>
            </label>
            <div 
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                reducedMotion ? 'bg-purple-700' : 'bg-slate-700'
              }`}
              onClick={() => setReducedMotion(!reducedMotion)}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                  reducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </section>

        {/* Sound */}
        <section>
          <div className="flex items-center mb-2">
            <Volume2 className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Sound & Voice</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <span>Enable Sound Effects</span>
              </label>
              <div 
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                  soundEnabled ? 'bg-purple-700' : 'bg-slate-700'
                }`}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <span>Text-to-Speech</span>
              </label>
              <div 
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                  voiceEnabled ? 'bg-purple-700' : 'bg-slate-700'
                }`}
                onClick={() => setVoiceEnabled(!voiceEnabled)}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                    voiceEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Presets */}
        <section>
          <div className="flex items-center mb-2">
            <Sparkles className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Presets</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={applyDefaultSettings}
              className="border-white/10 bg-slate-800 hover:bg-slate-700"
            >
              Default
            </Button>
            <Button
              variant="outline"
              onClick={applyHighContrastSettings}
              className="border-white/10 bg-slate-800 hover:bg-slate-700"
            >
              High Contrast
            </Button>
            <Button
              variant="outline"
              onClick={applyEasierReadingSettings}
              className="border-white/10 bg-slate-800 hover:bg-slate-700"
            >
              Easy Reading
            </Button>
            <Button
              variant="outline"
              onClick={applyReducedMotionSettings}
              className="border-white/10 bg-slate-800 hover:bg-slate-700"
            >
              Reduced Motion
            </Button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}