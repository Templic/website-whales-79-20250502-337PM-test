/**
 * cosmic-icons.tsx
 * 
 * Component Type: system
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */
/**
 * cosmic-icons.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
import {
  AudioWaveformIcon as Waveform,
  Waves,
  Music,
  Headphones,
  Radio,
  Mic,
  Volume2,
  VolumeX,
  Disc,
  Sparkles,
  Star,
  Moon,
  Sun,
  Zap,
  Orbit,
  Satellite,
  Rocket,
  Atom,
} from "lucide-react"

// Icon mapping for easy reference
export const cosmicIcons = {
  // Sound-themed icons
  waveform: Waveform,
  waves: Waves,
  music: Music,
  headphones: Headphones,
  radio: Radio,
  mic: Mic,
  volume: Volume2,
  mute: VolumeX,
  disc: Disc,

  // Cosmic-themed icons
  sparkles: Sparkles,
  star: Star,
  moon: Moon,
  sun: Sun,
  zap: Zap,
  orbit: Orbit,
  satellite: Satellite,
  rocket: Rocket,
  atom: Atom,
}

interface CosmicIconProps {
  name: keyof typeof cosmicIcons
  size?: number
  className?: string
  color?: string
}

export function CosmicIcon({ name, size = 24, className, color }: CosmicIconProps) {
  const IconComponent = cosmicIcons[name]

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return <IconComponent size={size} className={className} color={color} />
}

// Custom animated sound wave icon
export function SoundWaveIcon({
  className,
  size = 24,
  animated = true,
}: { className?: string; size?: number; animated?: boolean }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`absolute bottom-0 w-[2px] bg-current rounded-full ${animated ? "animate-soundwave" : ""}`}
          style={{
            height: `${30 + Math.random() * 70}%`,
            left: `${(i - 1) * 25}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.7 + Math.random() * 0.6}s`,
          }}
        />
      ))}
    </div>
  )
}

// Frequency icon that represents sound healing
export function FrequencyIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12h2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5h6" />
      <path d="M22 12h-6a5 5 0 0 0-5 5h-2a5 5 0 0 0-5-5H2" />
    </svg>
  )
}

// Chakra icon for spiritual content
export function ChakraIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    </svg>
  )
}

