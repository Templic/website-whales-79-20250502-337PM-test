/**
 * site-header.tsx
 * 
 * Component Type: layout
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */
/**
 * site-header.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, X, Music, Archive, Sparkles, Compass } from "lucide-react"

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const pathname = usePathname()

  const routes = [
    {
      name: "Cosmic Home",
      path: "/",
      icon: <Music className="h-4 w-4 mr-2" />,
    },
    {
      name: "Sound Archive",
      path: "/archive",
      icon: <Archive className="h-4 w-4 mr-2" />,
    },
    {
      name: "Experiences",
      path: "/experience",
      icon: <Sparkles className="h-4 w-4 mr-2" />,
    },
    {
      name: "Immersive Journey",
      path: "/immersive",
      icon: <Compass className="h-4 w-4 mr-2" />,
    },
    {
      name: "Music Harmonics",
      path: "/music",
      icon: <Music className="h-4 w-4 mr-2" />,
    },
  ]

  // Track scroll position for header transparency
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Calculate header opacity based on scroll position
  const headerOpacity = Math.min(scrollPosition / 200, 0.9)

  return (
    <motion.header
      className="fixed top-0 z-40 w-full border-b border-white/10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        backgroundColor: `rgba(8, 3, 21, ${headerOpacity})`,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative h-8 w-8">
              {/* Animated logo */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cosmic-sea-500 to-cosmic-sunset-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cosmic-sea-500 to-cosmic-sunset-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white">
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3z" fill="currentColor" />
                  <path d="M12 21a9 9 0 0 0 9-9h-3a6 6 0 0 1-6 6v3z" fill="currentColor" />
                </svg>
              </div>
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-cosmic-sea-400 to-cosmic-sunset-300 relative">
              ASTRA
              <span className="absolute -top-1 -right-2 h-1 w-1 rounded-full bg-cosmic-sea-400 animate-ping"></span>
            </span>
          </Link>

          <nav className="hidden md:flex gap-6">
            {routes.map((route, index) => (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "group relative flex items-center text-sm font-medium transition-colors hover:text-cosmic-sea-400",
                  pathname === route.path ? "text-cosmic-sea-400" : "text-white/70",
                )}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="flex items-center"
                >
                  {route.icon}
                  {route.name}
                </motion.div>

                {/* Animated underline */}
                <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-gradient-to-r from-cosmic-sea-400 to-cosmic-sunset-400 transition-all duration-300 group-hover:w-full"></span>

                {/* Active indicator */}
                {pathname === route.path && (
                  <motion.span
                    layoutId="activeRoute"
                    className="absolute -bottom-1 left-0 h-[2px] w-full bg-gradient-to-r from-cosmic-sea-400 to-cosmic-sunset-400"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="hidden md:flex border border-cosmic-sea-800/30 text-white hover:bg-cosmic-sea-900/20 hover:text-cosmic-sea-300 relative overflow-hidden group"
            style={{
              clipPath: "polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)",
              borderRadius: "0.5rem",
            }}
          >
            <span className="relative z-10">Connect</span>
            <span className="absolute inset-0 bg-gradient-to-r from-cosmic-sea-600/20 to-cosmic-sunset-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="absolute -inset-x-2 bottom-0 h-[1px] bg-gradient-to-r from-cosmic-sea-500 to-cosmic-sunset-500 opacity-50"></span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden relative"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile menu with animation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="container py-4 space-y-1">
              {routes.map((route, index) => (
                <motion.div
                  key={route.path}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Link
                    href={route.path}
                    className={cn(
                      "flex items-center py-3 px-2 transition-colors",
                      pathname === route.path
                        ? "bg-cosmic-sea-900/20 text-cosmic-sea-400"
                        : "text-white/70 hover:bg-cosmic-sea-900/10 hover:text-cosmic-sea-300",
                    )}
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      clipPath: "polygon(0% 0%, 100% 0%, 97% 90%, 100% 100%, 3% 100%, 0% 90%)",
                      borderRadius: "0.5rem",
                    }}
                  >
                    {route.icon}
                    {route.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: routes.length * 0.1, duration: 0.3 }}
                className="pt-2 mt-2 border-t border-cosmic-sea-900/20"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start border border-cosmic-sea-800/30 text-white hover:bg-cosmic-sea-900/20 hover:text-cosmic-sea-300 relative overflow-hidden group"
                  style={{
                    clipPath: "polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span className="relative z-10">Connect</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-cosmic-sea-600/20 to-cosmic-sunset-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

