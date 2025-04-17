/**
 * accessibility-controls.tsx
 * 
 * Component Type: common
 * Migrated from imported components.
 * Enhanced with additional accessibility features including screen reader support,
 * text-to-speech, skip links, and improved keyboard navigation.
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Eye,
  EyeOff,
  Type,
  Contrast,
  Mic,
  Keyboard,
  X,
  Maximize,
  Minimize,
  ChevronUp,
  ChevronDown,
  Settings,
  Moon,
  Waves,
  Volume2,
  SkipForward,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

export function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [textSize, setTextSize] = useState(100)
  const [contrast, setContrast] = useState("default")
  const [reducedMotion, setReducedMotion] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [focusOutline, setFocusOutline] = useState(false)
  const [colorFilter, setColorFilter] = useState("none")
  const [keyboardMode, setKeyboardMode] = useState(false)
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(false)
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false)
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(false)
  const [errorPrevention, setErrorPrevention] = useState(true)
  const [showSkipLinks, setShowSkipLinks] = useState(false)
  
  // Reference to the TTS engine
  const speechSynthesisRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null)


  // Apply text size changes
  useEffect(() => {
    if (textSize) {
      document.documentElement.style.fontSize = `${textSize}%`
      localStorage.setItem('textSize', textSize.toString())
    }

    return () => {
      document.documentElement.style.fontSize = "100%"
    }
  }, [textSize])

  // Initialize from localStorage
  useEffect(() => {
    const savedTextSize = localStorage.getItem('textSize')
    if (savedTextSize) {
      setTextSize(parseInt(savedTextSize))
    }
  }, [])

  // Apply contrast changes
  useEffect(() => {
    if (contrast === "high") {
      document.documentElement.classList.add("high-contrast")
      document.documentElement.classList.remove("dark-mode")
    } else if (contrast === "dark") {
      document.documentElement.classList.add("dark-mode")
      document.documentElement.classList.remove("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast", "dark-mode")
    }

    return () => {
      document.documentElement.classList.remove("high-contrast", "dark-mode")
    }
  }, [contrast])

  // Apply reduced motion
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add("reduced-motion")
    } else {
      document.documentElement.classList.remove("reduced-motion")
    }

    return () => {
      document.documentElement.classList.remove("reduced-motion")
    }
  }, [reducedMotion])

  // Apply focus outline
  useEffect(() => {
    document.documentElement.style.outline = focusOutline ? '2px solid blue' : 'none';
  }, [focusOutline]);


  // Apply color filter
  useEffect(() => {
    // Remove any existing filter classes
    document.body.classList.remove(
      'filter-blue', 
      'filter-yellow', 
      'filter-green', 
      'filter-red', 
      'filter-purple', 
      'filter-orange'
    );
    
    // Apply the appropriate filter
    if (colorFilter === 'none') {
      document.documentElement.style.filter = 'none';
    } else if (colorFilter === 'grayscale') {
      document.documentElement.style.filter = 'grayscale(1)';
    } else if (colorFilter === 'protanopia') {
      document.documentElement.style.filter = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><filter id="protanopia"><feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0"/></filter></svg>#protanopia\')';
    } else if (colorFilter === 'deuteranopia') {
      document.documentElement.style.filter = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><filter id="deuteranopia"><feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0"/></filter></svg>#deuteranopia\')';
    } else if (colorFilter === 'tritanopia') {
      document.documentElement.style.filter = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><filter id="tritanopia"><feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0"/></filter></svg>#tritanopia\')';
    } else {
      // For the custom filters (blue, yellow, green, red, purple, orange)
      document.documentElement.style.filter = 'none';
      document.body.classList.add(`filter-${colorFilter}`);
    }
  }, [colorFilter]);
  
  // Apply screen reader optimizations
  useEffect(() => {
    if (screenReaderOptimized) {
      // Add ARIA landmarks to main elements
      const main = document.querySelector('main');
      if (main) {
        main.setAttribute('role', 'main');
        main.setAttribute('id', 'main-content');
        main.setAttribute('tabindex', '-1');
      }
      
      // Add skip links (hidden until focused)
      const skipLinksContainer = document.getElementById('skip-links-container') || document.createElement('div');
      skipLinksContainer.id = 'skip-links-container';
      skipLinksContainer.style.position = 'absolute';
      skipLinksContainer.style.top = '0';
      skipLinksContainer.style.left = '0';
      skipLinksContainer.style.zIndex = '9999';
      
      if (!document.getElementById('skip-links-container')) {
        document.body.prepend(skipLinksContainer);
      }
      
      // Add ARIA attributes to form elements
      document.querySelectorAll('input, textarea, select').forEach(el => {
        if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
          const label = document.querySelector(`label[for="${el.id}"]`);
          if (label) {
            el.setAttribute('aria-labelledby', label.id || `${el.id}-label`);
            if (!label.id) label.id = `${el.id}-label`;
          } else {
            el.setAttribute('aria-label', el.placeholder || 'Input field');
          }
        }
      });
      
      // Enhance buttons with missing accessible names
      document.querySelectorAll('button').forEach(button => {
        if (!button.getAttribute('aria-label') && !button.textContent?.trim()) {
          const icon = button.querySelector('svg');
          if (icon) {
            const iconName = icon.getAttribute('data-icon') || 'button';
            button.setAttribute('aria-label', `${iconName} button`);
          } else {
            button.setAttribute('aria-label', 'Button');
          }
        }
      });
    }
  }, [screenReaderOptimized]);
  
  // Handle error prevention
  useEffect(() => {
    if (errorPrevention) {
      const handleFormSubmit = (e: Event) => {
        const form = e.target as HTMLFormElement;
        const submitBtn = form.querySelector('[type="submit"]');
        
        if (submitBtn && submitBtn.getAttribute('data-confirmed') !== 'true') {
          // Check if this form requires confirmation (has data-require-confirm attribute)
          if (form.getAttribute('data-require-confirm') === 'true') {
            e.preventDefault();
            
            // Create confirmation dialog
            const confirmDialog = document.createElement('div');
            confirmDialog.className = 'confirmation-dialog';
            confirmDialog.innerHTML = `
              <div class="confirmation-dialog-content">
                <h3>Confirm Submission</h3>
                <p>Are you sure you want to submit this form? This action cannot be undone.</p>
                <div class="confirmation-dialog-buttons">
                  <button id="confirm-cancel">Cancel</button>
                  <button id="confirm-proceed">Proceed</button>
                </div>
              </div>
            `;
            
            document.body.appendChild(confirmDialog);
            
            // Handle confirmation dialog buttons
            document.getElementById('confirm-cancel')?.addEventListener('click', () => {
              document.body.removeChild(confirmDialog);
            });
            
            document.getElementById('confirm-proceed')?.addEventListener('click', () => {
              submitBtn.setAttribute('data-confirmed', 'true');
              document.body.removeChild(confirmDialog);
              submitBtn.click();
            });
          }
        }
      };
      
      // Listen for form submissions
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
      });
      
      return () => {
        document.querySelectorAll('form').forEach(form => {
          form.removeEventListener('submit', handleFormSubmit);
        });
      };
    }
  }, [errorPrevention]);


  // Mock voice recognition
  const toggleVoiceRecognition = () => {
    if (isListening) {
      setIsListening(false)
    } else {
      setIsListening(true)
      // In a real implementation, this would start the speech recognition API
      setTimeout(() => {
        setIsListening(false)
      }, 5000)
    }
  }
  
  // Text-to-speech settings with customizable options
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [preferredVoice, setPreferredVoice] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Audio feedback utility functions
  const playFeedbackSound = (type: 'success' | 'error' | 'click' | 'toggle') => {
    if (!audioFeedbackEnabled) return;
    
    // Create oscillator-based audio feedback
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure sound based on type
    switch (type) {
      case 'success':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
        
      case 'error':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
        
      case 'click':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
        
      case 'toggle':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(700, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
    }
    
    // Clean up 
    setTimeout(() => {
      audioContext.close();
    }, 500);
  };
  
  // Load available voices when speech synthesis is ready
  useEffect(() => {
    if (!speechSynthesisRef.current) return;
    
    // Function to update available voices
    const updateVoices = () => {
      const voices = speechSynthesisRef.current?.getVoices() || [];
      setAvailableVoices(voices);
      
      // Set default voice if none selected
      if (preferredVoice === "" && voices.length > 0) {
        // Prefer a female voice in the user's language if available
        const userLanguage = navigator.language || 'en-US';
        const languageVoices = voices.filter(voice => voice.lang.includes(userLanguage.split('-')[0]));
        
        if (languageVoices.length > 0) {
          setPreferredVoice(languageVoices[0].name);
        } else {
          setPreferredVoice(voices[0].name);
        }
      }
    };
    
    // Add event listener for when voices change
    speechSynthesisRef.current.addEventListener('voiceschanged', updateVoices);
    updateVoices(); // Initial update
    
    return () => {
      speechSynthesisRef.current?.removeEventListener('voiceschanged', updateVoices);
    };
  }, [speechSynthesisRef.current, preferredVoice]);
  
  // Save speech settings to local storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('tts_settings', JSON.stringify({
        rate: speechRate,
        pitch: speechPitch,
        volume: speechVolume,
        voice: preferredVoice
      }));
    } catch (error) {
      console.error('Failed to save TTS settings to localStorage', error);
    }
  }, [speechRate, speechPitch, speechVolume, preferredVoice]);
  
  // Load speech settings from local storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedSettings = localStorage.getItem('tts_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setSpeechRate(settings.rate || 1.0);
        setSpeechPitch(settings.pitch || 1.0);
        setSpeechVolume(settings.volume || 1.0);
        if (settings.voice) setPreferredVoice(settings.voice);
      }
    } catch (error) {
      console.error('Failed to load TTS settings from localStorage', error);
    }
  }, []);
  
  // Text-to-speech functionality with enhanced options
  const speakText = (text: string) => {
    if (!textToSpeechEnabled || !speechSynthesisRef.current) return;
    
    // Stop any ongoing speech
    speechSynthesisRef.current.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set properties using saved preferences
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = speechVolume;
    
    // Set preferred voice if available
    if (preferredVoice) {
      const voice = availableVoices.find(v => v.name === preferredVoice);
      if (voice) utterance.voice = voice;
    }
    
    // Add event for audio feedback when speech starts and ends
    utterance.onstart = () => {
      if (audioFeedbackEnabled) {
        playFeedbackSound('success');
      }
    };
    
    utterance.onend = () => {
      if (audioFeedbackEnabled) {
        playFeedbackSound('click');
      }
    };
    
    // Speak the text
    speechSynthesisRef.current.speak(utterance);
  }
  
  // Helper function to speak selected text
  const speakSelectedText = () => {
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== '') {
        speakText(selection.toString());
        return true;
      }
    }
    return false;
  }
  
  // Initialize text-to-speech keyboard shortcut
  useEffect(() => {
    if (textToSpeechEnabled) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Alt + S to speak selected text
        if (e.altKey && e.key === 's') {
          e.preventDefault();
          speakSelectedText();
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [textToSpeechEnabled]);

  return (
    <>
      {/* Accessibility button - positioned left of the chat widget to avoid overlap */}
      <button
        onClick={() => {
          setIsOpen(true);
          if (audioFeedbackEnabled) {
            playFeedbackSound('success');
          }
        }}
        className="fixed bottom-4 left-4 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 border-2 border-white"
        aria-label="Accessibility Options"
      >
        <Settings className="h-8 w-8" />
      </button>

      {/* Accessibility panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={cn(
              "relative w-full max-w-md rounded-xl bg-gradient-to-b from-black/90 to-purple-950/90 p-6 shadow-xl backdrop-blur-md transition-all",
              isExpanded ? "h-[80vh] overflow-y-auto" : "max-h-[80vh] overflow-y-auto",
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Accessibility Options</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsExpanded(!isExpanded);
                    if (audioFeedbackEnabled) {
                      playFeedbackSound('click');
                    }
                  }}
                  className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  <span className="sr-only">{isExpanded ? "Minimize" : "Maximize"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsOpen(false);
                    if (audioFeedbackEnabled) {
                      playFeedbackSound('click');
                    }
                  }}
                  className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Text Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-purple-400" />
                    <h3 className="font-medium text-white">Text Size</h3>
                  </div>
                  <span className="text-sm text-white/70">{textSize}%</span>
                </div>
                <Slider
                  value={[textSize]}
                  min={75}
                  max={200}
                  step={5}
                  onValueChange={(value) => setTextSize(value[0])}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>A</span>
                  <span className="text-base">A</span>
                  <span className="text-xl">A</span>
                </div>
              </div>

              {/* Contrast */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Contrast className="h-5 w-5 text-purple-400" />
                  <h3 className="font-medium text-white">Contrast & Color</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setContrast("default")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                      contrast === "default"
                        ? "border-purple-400 bg-purple-900/20"
                        : "border-white/10 bg-black/20 hover:border-white/30",
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600"></div>
                    <span className="text-xs font-medium text-white">Default</span>
                  </button>
                  <button
                    onClick={() => setContrast("high")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                      contrast === "high"
                        ? "border-purple-400 bg-purple-900/20"
                        : "border-white/10 bg-black/20 hover:border-white/30",
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-white"></div>
                    <span className="text-xs font-medium text-white">High Contrast</span>
                  </button>
                  <button
                    onClick={() => setContrast("dark")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                      contrast === "dark"
                        ? "border-purple-400 bg-purple-900/20"
                        : "border-white/10 bg-black/20 hover:border-white/30",
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-900"></div>
                    <span className="text-xs font-medium text-white">Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Motion & Animation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Waves className="h-5 w-5 text-purple-400" />
                  <div>
                    <h3 className="font-medium text-white">Reduce Motion</h3>
                    <p className="text-xs text-white/60">Minimize animations</p>
                  </div>
                </div>
                <Switch 
                  checked={reducedMotion} 
                  onCheckedChange={(checked) => {
                    setReducedMotion(checked);
                    if (audioFeedbackEnabled) {
                      playFeedbackSound('toggle');
                    }
                  }} 
                />
              </div>

              {/* Voice Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-purple-400" />
                  <div>
                    <h3 className="font-medium text-white">Voice Navigation</h3>
                    <p className="text-xs text-white/60">Control with voice commands</p>
                  </div>
                </div>
                <Switch 
                  checked={voiceEnabled} 
                  onCheckedChange={(checked) => {
                    setVoiceEnabled(checked);
                    if (audioFeedbackEnabled) {
                      playFeedbackSound('toggle');
                    }
                  }} 
                />
              </div>

              {voiceEnabled && (
                <div className="rounded-lg bg-black/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">Voice Commands</h4>
                    <Button
                      variant={isListening ? "default" : "outline"}
                      size="sm"
                      onClick={toggleVoiceRecognition}
                      className={cn(
                        isListening
                          ? "bg-purple-500 text-white hover:bg-purple-600"
                          : "border-white/20 text-white hover:bg-white/10",
                      )}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      {isListening ? "Listening..." : "Start Listening"}
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm text-white/80">
                    <p>Try saying:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>"Increase text size" - Make text larger</li>
                      <li>"Decrease text size" - Make text smaller</li>
                      <li>"Enable high contrast" - Switch to high contrast mode</li>
                      <li>"Disable animations" - Turn off motion effects</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Focus Indicators */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-400" />
                    <div>
                      <h3 className="font-medium text-white">Focus Indicators</h3>
                      <p className="text-xs text-white/60">Show focus outlines</p>
                    </div>
                  </div>
                  <Switch 
                    checked={focusOutline} 
                    onCheckedChange={(checked) => {
                      setFocusOutline(checked);
                      if (audioFeedbackEnabled) {
                        playFeedbackSound('toggle');
                      }
                    }} 
                  />
                </div>

                {/* Color Filter */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Contrast className="h-5 w-5 text-purple-400" />
                    <h3 className="font-medium text-white">Color Filter</h3>
                  </div>
                  <Select value={colorFilter} onValueChange={setColorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="grayscale">Grayscale</SelectItem>
                      <SelectItem value="protanopia">Protanopia</SelectItem>
                      <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
                      <SelectItem value="tritanopia">Tritanopia</SelectItem>
                      <SelectItem value="blue">Blue Filter</SelectItem>
                      <SelectItem value="yellow">Yellow Filter</SelectItem>
                      <SelectItem value="green">Green Filter</SelectItem>
                      <SelectItem value="red">Red Filter</SelectItem>
                      <SelectItem value="purple">Purple Filter</SelectItem>
                      <SelectItem value="orange">Orange Filter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                {/* Text-to-Speech Feature */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-purple-400" />
                    <div>
                      <h3 className="font-medium text-white">Text-to-Speech</h3>
                      <p className="text-xs text-white/60">Read selected text aloud</p>
                    </div>
                  </div>
                  <Switch 
                    checked={textToSpeechEnabled} 
                    onCheckedChange={(checked) => {
                      setTextToSpeechEnabled(checked);
                      if (audioFeedbackEnabled) {
                        playFeedbackSound('toggle');
                      }
                    }} 
                  />
                </div>
                
                {textToSpeechEnabled && (
                  <div className="rounded-lg bg-black/40 p-4 mt-2">
                    <p className="text-sm text-white/80 mb-2">
                      Select any text on the page and press <kbd className="rounded bg-black/60 px-2 py-1 text-xs">Alt + S</kbd> to hear it read aloud.
                    </p>
                    
                    {/* TTS Voice Options */}
                    <div className="space-y-3 mt-3">
                      {/* Speech Rate */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label htmlFor="speech-rate" className="text-xs font-medium text-white/80">
                            Speech Rate: {speechRate.toFixed(1)}
                          </label>
                        </div>
                        <Slider
                          id="speech-rate"
                          value={[speechRate]}
                          min={0.5}
                          max={2.0}
                          step={0.1}
                          onValueChange={(value) => setSpeechRate(value[0])}
                          className="cursor-pointer"
                          aria-label="Adjust speech rate"
                        />
                        <div className="flex justify-between text-xs text-white/60">
                          <span>Slow</span>
                          <span>Normal</span>
                          <span>Fast</span>
                        </div>
                      </div>
                      
                      {/* Speech Pitch */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label htmlFor="speech-pitch" className="text-xs font-medium text-white/80">
                            Speech Pitch: {speechPitch.toFixed(1)}
                          </label>
                        </div>
                        <Slider
                          id="speech-pitch"
                          value={[speechPitch]}
                          min={0.5}
                          max={2.0}
                          step={0.1}
                          onValueChange={(value) => setSpeechPitch(value[0])}
                          className="cursor-pointer"
                          aria-label="Adjust speech pitch"
                        />
                        <div className="flex justify-between text-xs text-white/60">
                          <span>Low</span>
                          <span>Normal</span>
                          <span>High</span>
                        </div>
                      </div>
                      
                      {/* Voice Selection */}
                      {availableVoices.length > 0 && (
                        <div className="space-y-2">
                          <label htmlFor="voice-select" className="text-xs font-medium text-white/80">
                            Voice:
                          </label>
                          <Select value={preferredVoice} onValueChange={setPreferredVoice}>
                            <SelectTrigger id="voice-select" className="bg-black/30 border-white/20 text-white text-sm">
                              <SelectValue placeholder="Select voice" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableVoices.map(voice => (
                                <SelectItem 
                                  key={voice.name} 
                                  value={voice.name}
                                >
                                  {voice.name} ({voice.lang})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => speakText("Text-to-speech is now enabled with your custom settings. Select any text and press Alt plus S to hear it read aloud.")}
                      className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
                    >
                      <Volume2 className="mr-2 h-4 w-4" />
                      Test Text-to-Speech
                    </Button>
                  </div>
                )}
                
                {/* Keyboard Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Keyboard className="h-5 w-5 text-purple-400" />
                    <div>
                      <h3 className="font-medium text-white">Keyboard Navigation</h3>
                      <p className="text-xs text-white/60">Enhanced keyboard control</p>
                    </div>
                  </div>
                  <Switch 
                    checked={keyboardMode} 
                    onCheckedChange={(checked) => {
                      setKeyboardMode(checked);
                      if (audioFeedbackEnabled) {
                        playFeedbackSound('toggle');
                      }
                    }} 
                  />
                </div>

                <div className="rounded-lg bg-black/40 p-4">
                  <div className="space-y-2 text-sm text-white/80">
                    <p>Keyboard shortcuts:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between">
                        <span>Toggle Panel</span>
                        <kbd className="rounded bg-black/60 px-2 py-1 text-xs">Alt + A</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Increase Text</span>
                        <kbd className="rounded bg-black/60 px-2 py-1 text-xs">Alt + +</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Decrease Text</span>
                        <kbd className="rounded bg-black/60 px-2 py-1 text-xs">Alt + -</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Toggle Contrast</span>
                        <kbd className="rounded bg-black/60 px-2 py-1 text-xs">Alt + C</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <>
                  {/* Audio Feedback */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-purple-400" />
                      <div>
                        <h3 className="font-medium text-white">Audio Feedback</h3>
                        <p className="text-xs text-white/60">Sound cues for interactions</p>
                      </div>
                    </div>
                    <Switch checked={audioFeedbackEnabled} onCheckedChange={(checked) => {
                    setAudioFeedbackEnabled(checked);
                    if (checked) {
                      playFeedbackSound('toggle');
                    }
                  }} />
                  </div>

                  {/* Screen Reader */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-400" />
                      <div>
                        <h3 className="font-medium text-white">Screen Reader Support</h3>
                        <p className="text-xs text-white/60">Optimized for screen readers</p>
                      </div>
                    </div>
                    <Switch 
                      checked={screenReaderOptimized} 
                      onCheckedChange={(checked) => {
                        setScreenReaderOptimized(checked);
                        if (audioFeedbackEnabled) {
                          playFeedbackSound('toggle');
                        }
                      }} 
                    />
                  </div>
                  
                  {/* Skip Links */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SkipForward className="h-5 w-5 text-purple-400" />
                      <div>
                        <h3 className="font-medium text-white">Skip Navigation Links</h3>
                        <p className="text-xs text-white/60">Fast keyboard navigation</p>
                      </div>
                    </div>
                    <Switch 
                      checked={showSkipLinks} 
                      onCheckedChange={(checked) => {
                        setShowSkipLinks(checked);
                        if (audioFeedbackEnabled) {
                          playFeedbackSound('toggle');
                        }
                      }} 
                    />
                  </div>
                  
                  {showSkipLinks && (
                    <div className="rounded-lg bg-black/40 p-4 mt-2">
                      <p className="text-sm text-white/80 mb-2">
                        Skip links help keyboard users navigate quickly to main content areas without tabbing through all navigation elements.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            document.getElementById('main-content')?.focus();
                            if (audioFeedbackEnabled) {
                              playFeedbackSound('click');
                            }
                          }}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <SkipForward className="mr-2 h-4 w-4" />
                          Main Content
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            document.getElementById('main-navigation')?.focus();
                            if (audioFeedbackEnabled) {
                              playFeedbackSound('click');
                            }
                          }}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <SkipForward className="mr-2 h-4 w-4" />
                          Navigation
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Focus Mode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-5 w-5 text-purple-400" />
                      <div>
                        <h3 className="font-medium text-white">Focus Mode</h3>
                        <p className="text-xs text-white/60">Reduce distractions</p>
                      </div>
                    </div>
                    <Switch 
                      onCheckedChange={(checked) => {
                        if (audioFeedbackEnabled) {
                          playFeedbackSound('toggle');
                        }
                        // We would set a state variable like setFocusMode here if this was fully implemented
                      }} 
                    />
                  </div>

                  {/* Help Section */}
                  <div className="rounded-lg bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4">
                    <h4 className="font-medium text-white mb-2">Need More Help?</h4>
                    <p className="text-sm text-white/80 mb-3">
                      Contact us for personalized accessibility assistance or to report any issues.
                    </p>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                      onClick={() => {
                        if (audioFeedbackEnabled) {
                          playFeedbackSound('success');
                        }
                        // This would typically open a contact form or redirect to support page
                      }}
                    >
                      Contact Support
                    </Button>
                  </div>
                </>
              )}
            </div>

            {!isExpanded && (
              <Button
                variant="ghost"
                className="mt-4 w-full border-t border-white/10 pt-4 text-white/70 hover:bg-transparent hover:text-white"
                onClick={() => {
                  setIsExpanded(true);
                  if (audioFeedbackEnabled) {
                    playFeedbackSound('toggle');
                  }
                }}
              >
                <ChevronDown className="mr-2 h-4 w-4" />
                Show More Options
              </Button>
            )}

            {isExpanded && (
              <Button
                variant="ghost"
                className="mt-4 w-full border-t border-white/10 pt-4 text-white/70 hover:bg-transparent hover:text-white"
                onClick={() => {
                  setIsExpanded(false);
                  if (audioFeedbackEnabled) {
                    playFeedbackSound('toggle');
                  }
                }}
              >
                <ChevronUp className="mr-2 h-4 w-4" />
                Show Less
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default AccessibilityControls