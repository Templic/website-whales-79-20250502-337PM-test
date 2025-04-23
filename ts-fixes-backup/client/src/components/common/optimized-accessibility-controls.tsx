/**
 * @file optimized-accessibility-controls.tsx
 * @description An optimized version of the AccessibilityControls component with improved performance through memoization and proper callback usage
 * @author Replit AI Agent
 * @created 2025-04-15
 * @updated 2025-04-15
 * @status Active
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * AccessibilityControls
 * 
 * A component that provides accessibility options for users to customize 
 * their experience including text size, contrast, motion reduction, and
 * voice navigation.
 * 
 * This is an optimized version that uses proper hooks for improved performance.
 * 
 * @example
 * ```tsx
 * <AccessibilityControls />
 * ```
 */
export function AccessibilityControls() {
  // State management with useState hooks
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [textSize, setTextSize] = useState(100)
  const [contrast, setContrast] = useState("default")
  const [reducedMotion, setReducedMotion] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [focusMode, setFocusMode] = useState(false)

  // Memoized values for classNames to avoid recalculating on each render
  const panelClassName = useMemo(() => 
    cn(
      "relative w-full max-w-md rounded-xl bg-gradient-to-b from-black/90 to-purple-950/90 p-6 shadow-xl backdrop-blur-md transition-all",
      isExpanded ? "h-[80vh] overflow-y-auto" : "max-h-[80vh] overflow-y-auto",
    ), 
    [isExpanded]
  )

  /**
   * Apply text size changes
   */
  useEffect(() => {
    document.documentElement.style.fontSize = `${textSize}%`

    return () => {
      document.documentElement.style.fontSize = "100%"
    }
  }, [textSize])

  /**
   * Apply contrast changes
   */
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

  /**
   * Apply reduced motion
   */
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

  /**
   * Apply focus mode
   */
  useEffect(() => {
    if (focusMode) {
      document.documentElement.classList.add("focus-mode")
    } else {
      document.documentElement.classList.remove("focus-mode")
    }

    return () => {
      document.documentElement.classList.remove("focus-mode")
    }
  }, [focusMode])

  /**
   * Handle opening the accessibility panel
   */
  const handleOpenPanel = useCallback(() => {
    setIsOpen(true)
  }, [])

  /**
   * Handle closing the accessibility panel
   */
  const handleClosePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  /**
   * Toggle expanded view
   */
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prevExpanded => !prevExpanded)
  }, [])

  /**
   * Mock voice recognition toggle
   */
  const toggleVoiceRecognition = useCallback(() => {
    if (isListening) {
      setIsListening(false)
    } else {
      setIsListening(true)
      // In a real implementation, this would start the speech recognition API
      setTimeout(() => {
        setIsListening(false)
      }, 5000)
    }
  }, [isListening])

  /**
   * Handle text size change
   */
  const handleTextSizeChange = useCallback((value: number[]) => {
    setTextSize(value[0])
  }, [])

  /**
   * Handle contrast option selection
   */
  const handleContrastChange = useCallback((newContrast: string) => {
    setContrast(newContrast)
  }, [])

  /**
   * Handle reduced motion toggle
   */
  const handleReducedMotionChange = useCallback((checked: boolean) => {
    setReducedMotion(checked)
  }, [])

  /**
   * Handle voice navigation toggle
   */
  const handleVoiceEnabledChange = useCallback((checked: boolean) => {
    setVoiceEnabled(checked)
  }, [])

  /**
   * Handle focus mode toggle
   */
  const handleFocusModeChange = useCallback((checked: boolean) => {
    setFocusMode(checked)
  }, [])

  /**
   * Button class for contrast options - memoized to prevent recreation on each render
   */
  const getContrastButtonClass = useCallback((buttonContrast: string) => {
    return cn(
      "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
      contrast === buttonContrast
        ? "border-purple-400 bg-purple-900/20"
        : "border-white/10 bg-black/20 hover:border-white/30",
    )
  }, [contrast])

  /**
   * Voice recognition button class - memoized
   */
  const voiceButtonClass = useMemo(() => {
    return cn(
      isListening
        ? "bg-purple-500 text-white hover:bg-purple-600"
        : "border-white/20 text-white hover:bg-white/10",
    )
  }, [isListening])

  // Render the component
  return (
    <>
      {/* Accessibility button */}
      <button
        onClick={handleOpenPanel}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
        aria-label="Accessibility Options"
      >
        <Settings className="h-6 w-6" />
      </button>

      {/* Accessibility panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={panelClassName}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Accessibility Options</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleExpanded}
                  className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  <span className="sr-only">{isExpanded ? "Minimize" : "Maximize"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClosePanel}
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
                  onValueChange={handleTextSizeChange}
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
                    onClick={() => handleContrastChange("default")}
                    className={getContrastButtonClass("default")}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600"></div>
                    <span className="text-xs font-medium text-white">Default</span>
                  </button>
                  <button
                    onClick={() => handleContrastChange("high")}
                    className={getContrastButtonClass("high")}
                  >
                    <div className="h-8 w-8 rounded-full bg-white"></div>
                    <span className="text-xs font-medium text-white">High Contrast</span>
                  </button>
                  <button
                    onClick={() => handleContrastChange("dark")}
                    className={getContrastButtonClass("dark")}
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-900"></div>
                    <span className="text-xs font-medium text-white">Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Motion & Animation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={20}
                    height={20}
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
                  <div>
                    <h3 className="font-medium text-white">Reduce Motion</h3>
                    <p className="text-xs text-white/60">Minimize animations</p>
                  </div>
                </div>
                <Switch checked={reducedMotion} onCheckedChange={handleReducedMotionChange} />
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
                <Switch checked={voiceEnabled} onCheckedChange={handleVoiceEnabledChange} />
              </div>

              {voiceEnabled && (
                <div className="rounded-lg bg-black/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">Voice Commands</h4>
                    <Button
                      variant={isListening ? "default" : "outline"}
                      size="sm"
                      onClick={toggleVoiceRecognition}
                      className={voiceButtonClass}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      {isListening ? "Listening..." : "Start Listening"}
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm text-white/80">
                    <p>Try saying:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>"Play music" - Start playing the current track</li>
                      <li>"Next track" - Skip to the next track</li>
                      <li>"Show merchandise" - Navigate to the merchandise page</li>
                      <li>"Increase volume" - Turn up the volume</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Keyboard Navigation */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-purple-400" />
                  <h3 className="font-medium text-white">Keyboard Navigation</h3>
                </div>
                <div className="rounded-lg bg-black/40 p-4">
                  <div className="space-y-2 text-sm text-white/80">
                    <p>Keyboard shortcuts:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between">
                        <span>Play/Pause</span>
                        <kbd className="rounded bg-black/60 px-2 py-1 text-xs">Space</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Next Track</span>
                        <kbd className="rounded bg-black/60 px-2 py-1 text-xs">→</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Previous Track</span>
                        <kbd className="rounded bg-black/60 px-2 py-1 text-xs">←</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Volume Up</span>
                        <kbd className="rounded bg-black/60 px-2 py-1 text-xs">↑</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Volume Down</span>
                        <kbd className="rounded bg-black/60 px-2 py-1 text-xs">↓</kbd>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Mute</span>
                        <kbd className="rounded bg-black/60 px-2 py-1 text-xs">M</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <>
                  {/* Screen Reader */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-400" />
                      <div>
                        <h3 className="font-medium text-white">Screen Reader Support</h3>
                        <p className="text-xs text-white/60">Optimized for screen readers</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-400">Active</span>
                  </div>

                  {/* Focus Mode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-5 w-5 text-purple-400" />
                      <div>
                        <h3 className="font-medium text-white">Focus Mode</h3>
                        <p className="text-xs text-white/60">Reduce distractions</p>
                      </div>
                    </div>
                    <Switch checked={focusMode} onCheckedChange={handleFocusModeChange} />
                  </div>

                  {/* Additional Settings */}
                  <div className="rounded-lg bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4">
                    <h4 className="font-medium text-white mb-2">Need More Help?</h4>
                    <p className="text-sm text-white/80 mb-3">
                      Contact us for personalized accessibility assistance or to report any issues.
                    </p>
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                      Contact Support
                    </Button>
                  </div>
                </>
              )}
            </div>

            {!isExpanded ? (
              <Button
                variant="ghost"
                className="mt-4 w-full border-t border-white/10 pt-4 text-white/70 hover:bg-transparent hover:text-white"
                onClick={toggleExpanded}
              >
                <ChevronDown className="mr-2 h-4 w-4" />
                Show More Options
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="mt-4 w-full border-t border-white/10 pt-4 text-white/70 hover:bg-transparent hover:text-white"
                onClick={toggleExpanded}
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