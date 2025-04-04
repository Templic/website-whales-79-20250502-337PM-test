import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import dynamic from "next/dynamic"
import { LoadingBackground } from "@/components/ui/cosmic/loading-background"
import { CosmicFooter } from "@/components/cosmic-footer"

// Dynamically import the navigation to prevent hydration mismatch
const CosmicNavigation = dynamic(
  () => import("@/components/ui/cosmic/cosmic-navigation").then((mod) => mod.CosmicNavigation),
  { ssr: true },
)

// Dynamically import the background to prevent hydration mismatch
const CosmicBackground = dynamic(
  () => import("@/components/ui/cosmic/cosmic-background").then((mod) => mod.CosmicBackground),
  { ssr: false, loading: () => <LoadingBackground /> },
)

// Dynamically import fonts to prevent layout shift
const CosmicFonts = dynamic(() => import("@/components/ui/cosmic/cosmic-fonts").then((mod) => mod.CosmicFonts), {
  ssr: true,
})

export const metadata: Metadata = {
  title: "ASTRA - Cosmic Healing Frequencies",
  description:
    "Experience transformative sound healing through cosmic frequencies designed to balance chakras and elevate consciousness.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <CosmicFonts>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <div className="relative min-h-screen bg-[#080315]">
                <CosmicBackground />
                <CosmicNavigation />
                <main className="pt-16">{children}</main>
                <CosmicFooter />
              </div>
            </AuthProvider>
          </ThemeProvider>
        </CosmicFonts>
      </body>
    </html>
  )
}

