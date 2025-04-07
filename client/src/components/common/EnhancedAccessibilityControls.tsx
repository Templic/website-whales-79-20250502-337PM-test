/**
 * EnhancedAccessibilityControls.tsx
 * 
 * Component for accessibility controls with cosmic theming
 * Provides options for text size, contrast, motion reduction, and voice controls
 */

import { useState, useEffect } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import SacredGeometry from "@/components/cosmic/SacredGeometry";

export function EnhancedAccessibilityControls() {
  const { 
    textSize, 
    setTextSize,
    contrast,
    setContrast, 
    reducedMotion, 
    setReducedMotion,
    voiceEnabled,
    setVoiceEnabled
  } = useAccessibility();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Helper functions to modify textSize
  const increaseTextSize = () => {
    if (textSize < 150) {
      setTextSize(textSize + 25);
    }
  };
  
  const decreaseTextSize = () => {
    if (textSize > 75) {
      setTextSize(textSize - 25);
    }
  };
  
  // Helper functions for toggles
  const toggleHighContrast = () => {
    setContrast(contrast === 'high' ? 'default' : 'high');
  };
  
  const toggleReducedMotion = () => {
    setReducedMotion(!reducedMotion);
  };
  
  const toggleVoiceEnabled = () => {
    setVoiceEnabled(!voiceEnabled);
  };
  
  // Control visibility with delay for animations
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isOpen) {
      setIsVisible(true);
    } else {
      timeout = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match transition duration
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 md:bottom-8 right-6 md:right-8 z-50">
      {/* Accessibility Panel */}
      {isVisible && (
        <div 
          className={`cosmic-accessibility-panel bg-gradient-to-br from-[rgba(0,235,214,0.15)] to-[rgba(91,120,255,0.05)] backdrop-blur-md border border-[#00ebd6]/20 rounded-xl p-4 md:p-6 mb-4 w-[280px] transition-all duration-300 ${isOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}
          aria-hidden={!isOpen}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#00ebd6] font-bold text-lg flex items-center gap-2">
              <SacredGeometry type="flower-of-life" className="w-5 h-5" />
              <span>Accessibility</span>
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label="Close accessibility panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Text Size Controls */}
            <div className="accessibility-control">
              <div className="flex justify-between items-center mb-2">
                <label className="text-white flex items-center gap-2">
                  <SacredGeometry type="pentagon-star" className="w-4 h-4 text-[#5b78ff]" />
                  <span>Text Size</span>
                </label>
                <span className="text-[#00ebd6] text-sm">
                  {textSize === 75 ? 'Small' : textSize === 100 ? 'Medium' : 'Large'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={decreaseTextSize}
                  disabled={textSize <= 75}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${textSize <= 75 ? 'border-white/20 text-white/30' : 'border-[#00ebd6]/40 text-white hover:border-[#00ebd6] hover:bg-[#00ebd6]/10 transition-colors'}`}
                  aria-label="Decrease text size"
                >
                  <span className="text-lg">-</span>
                </button>
                <div className="flex-grow h-2 bg-[#050f28] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00ebd6] to-[#5b78ff] transition-all duration-300"
                    style={{ width: textSize === 75 ? '33%' : textSize === 100 ? '66%' : '100%' }}
                  ></div>
                </div>
                <button
                  onClick={increaseTextSize}
                  disabled={textSize >= 150}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${textSize >= 150 ? 'border-white/20 text-white/30' : 'border-[#00ebd6]/40 text-white hover:border-[#00ebd6] hover:bg-[#00ebd6]/10 transition-colors'}`}
                  aria-label="Increase text size"
                >
                  <span className="text-lg">+</span>
                </button>
              </div>
            </div>

            {/* High Contrast Toggle */}
            <div className="accessibility-control">
              <div className="flex justify-between items-center">
                <label className="text-white flex items-center gap-2" htmlFor="high-contrast-toggle">
                  <SacredGeometry type="vesica-piscis" className="w-4 h-4 text-[#5b78ff]" />
                  <span>High Contrast</span>
                </label>
                <button
                  id="high-contrast-toggle"
                  onClick={toggleHighContrast}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${contrast === 'high' ? 'bg-[#00ebd6]' : 'bg-[#050f28] border border-white/20'}`}
                  aria-pressed={contrast === 'high'}
                  aria-label="Toggle high contrast mode"
                >
                  <span 
                    className={`block w-4 h-4 rounded-full transition-transform ${contrast === 'high' ? 'bg-[#050f28] transform translate-x-6' : 'bg-white transform translate-x-0'}`}
                  ></span>
                </button>
              </div>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="accessibility-control">
              <div className="flex justify-between items-center">
                <label className="text-white flex items-center gap-2" htmlFor="reduced-motion-toggle">
                  <SacredGeometry type="hexagon" className="w-4 h-4 text-[#5b78ff]" />
                  <span>Reduced Motion</span>
                </label>
                <button
                  id="reduced-motion-toggle"
                  onClick={toggleReducedMotion}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${reducedMotion ? 'bg-[#00ebd6]' : 'bg-[#050f28] border border-white/20'}`}
                  aria-pressed={reducedMotion}
                  aria-label="Toggle reduced motion"
                >
                  <span 
                    className={`block w-4 h-4 rounded-full transition-transform ${reducedMotion ? 'bg-[#050f28] transform translate-x-6' : 'bg-white transform translate-x-0'}`}
                  ></span>
                </button>
              </div>
            </div>

            {/* Voice Controls Toggle */}
            <div className="accessibility-control">
              <div className="flex justify-between items-center">
                <label className="text-white flex items-center gap-2" htmlFor="voice-enabled-toggle">
                  <SacredGeometry type="golden-spiral" className="w-4 h-4 text-[#5b78ff]" />
                  <span>Voice Controls</span>
                </label>
                <button
                  id="voice-enabled-toggle"
                  onClick={toggleVoiceEnabled}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${voiceEnabled ? 'bg-[#00ebd6]' : 'bg-[#050f28] border border-white/20'}`}
                  aria-pressed={voiceEnabled}
                  aria-label="Toggle voice controls"
                >
                  <span 
                    className={`block w-4 h-4 rounded-full transition-transform ${voiceEnabled ? 'bg-[#050f28] transform translate-x-6' : 'bg-white transform translate-x-0'}`}
                  ></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group bg-gradient-to-br from-[#00ebd6] to-[#5b78ff] hover:from-[#00ebd6] hover:to-[#7c3aed] p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
        aria-expanded={isOpen}
        aria-label="Accessibility controls"
      >
        <span className="sr-only">Accessibility Options</span>
        
        {/* Visual pulse effect */}
        <span className="absolute inset-0 rounded-full bg-[#00ebd6] opacity-20 group-hover:scale-110 transition-transform duration-500"></span>
        
        {/* Accessibility icon */}
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#050f28]">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="10" r="3"></circle>
            <path d="M12 13a5 5 0 0 0-5 5"></path>
            <path d="M12 13a5 5 0 0 1 5 5"></path>
          </svg>
          
          {/* Decorative geometry */}
          <div className="absolute -right-1 -top-1 opacity-70">
            <SacredGeometry type="pentagon-star" className="w-3 h-3 text-[#050f28]" />
          </div>
        </div>
      </button>
    </div>
  );
}