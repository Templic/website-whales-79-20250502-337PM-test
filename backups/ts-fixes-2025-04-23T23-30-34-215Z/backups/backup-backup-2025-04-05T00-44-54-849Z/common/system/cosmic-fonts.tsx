/**
 * cosmic-fonts.tsx
 * 
 * Component Type: system
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */
/**
 * cosmic-fonts.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import type React from "react"

import { Space_Grotesk, Orbitron, Inter } from "next/font/google"
import localFont from "next/font/local"

// Primary display font for headings and featured text
export const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
})

// Secondary font for body text with cosmic feel
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

// Base font for general UI and readability
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

// Custom nebula font for special elements
export const nebulaFont = localFont({
  src: [
    {
      path: "../public/fonts/Nebula-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Nebula-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-nebula",
  display: "swap",
})

// Font provider component to be used in layout
export function CosmicFonts({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${orbitron.variable} ${spaceGrotesk.variable} ${inter.variable} ${nebulaFont.variable}`}>
      {children}
    </div>
  )
}

