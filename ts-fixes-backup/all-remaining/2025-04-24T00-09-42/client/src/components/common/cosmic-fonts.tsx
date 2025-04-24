/**
 * cosmic-fonts.tsx
 * 
 * Component Type: common
 * Updated to use Almendra and Cormorant Garamond font stack
 */
import React from "react";


// Removed duplicate type React import
// Font provider component to be used in layout
// This component doesn't actually load fonts anymore, it's just a wrapper
// for compatibility. Fonts are loaded via @import in index.css
export function CosmicFonts({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-serif">
      {children}
    </div>
  )
}

