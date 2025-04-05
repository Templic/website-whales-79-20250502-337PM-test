/**
 * cosmic-navigation.tsx
 * 
 * Component Type: common
 * Migrated from imported components.
 */
/**
 * cosmic-navigation.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Menu, X, Home, Archive, Sparkles, Compass, Headphones } from "lucide-react"
import type { JSX } from "react"

interface NavItem {
  name: string
  path: string
  icon: JSX.Element
  description: string
}

export function CosmicNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [isHoveringMenu, setIsHoveringMenu] = useState(false)
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

  const routes: NavItem[] = [
    {
      name: "Cosmic Gateway",
      path: "/",
      icon: <Home className="h-5 w-5" />,
      description: "Return to the central portal of cosmic frequencies",
    },
    {
      name: "Sonic Archives",
      path: "/archive",
      icon: <Archive className="h-5 w-5" />,
      description: "Explore the collection of healing vibrations",
    },
    {
      name: "Frequency Experiences",
      path: "/experience",
      icon: <Sparkles className="h-5 w-5" />,
      description: "Interactive tools for consciousness expansion",
    },
    {
      name: "Immersive Journeys",
      path: "/immersive",
      icon: <Compass className="h-5 w-5" />,
      description: "Deep cosmic experiences for transformation",
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

  // Set active item based on pathname
  useEffect(() => {
    const currentRoute = routes.find((route) => route.path === pathname)
    if (currentRoute) {
      setActiveItem(currentRoute.path)
    }
  }, [pathname, routes])

  // Calculate header opacity based on scroll position
  const headerOpacity = Math.min(scrollPosition / 200, 0.95)

  // Handle menu item hover
  const handleItemHover = (path: string) => {
    setActiveItem(path)
  }

  // Handle menu item leave
  const handleItemLeave = () => {
    if (!isHoveringMenu) {
      const currentRoute = routes.find((route) => route.path === pathname)
      if (currentRoute) {
        setActiveItem(currentRoute.path)
      }
    }
  }

  return (
    <motion.header
      ref={navRef}
      className="fixed top-0 z-50 w-full border-b border-white/5"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        backgroundColor: `rgba(8, 3, 21, ${headerOpacity})`,
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group z-10">
          <div className="relative h-9 w-9">
            {/* Animated logo */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white">
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <path d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3z" fill="currentColor" />
                <path d="M12 21a9 9 0 0 0 9-9h-3a6 6 0 0 1-6 6v3z" fill="currentColor" />
              </svg>
            </div>
          </div>
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300 relative">
            ASTRA
            <span className="absolute -top-1 -right-2 h-1 w-1 rounded-full bg-purple-400 animate-ping"></span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div
          className="hidden md:block absolute left-1/2 transform -translate-x-1/2"
          onMouseEnter={() => setIsHoveringMenu(true)}
          onMouseLeave={() => {
            setIsHoveringMenu(false)
            handleItemLeave()
          }}
        >
          <nav className="relative">
            {/* Navigation Background */}
            <div className="absolute inset-0 -inset-x-6 -inset-y-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/5"></div>

            {/* Navigation Items */}
            <ul className="relative flex space-x-1 px-1 py-1">
              {routes.map((route, index) => (
                <li key={route.path}>
                  <Link
                    href={route.path}
                    className={cn(
                      "relative flex items-center justify-center px-4 py-2 rounded-full transition-colors",
                      pathname === route.path ? "text-white" : "text-white/70 hover:text-white",
                    )}
                    onMouseEnter={() => handleItemHover(route.path)}
                    onMouseLeave={handleItemLeave}
                  >
                    <span className="relative z-10">{route.name}</span>

                    {/* Active/Hover Background */}
                    {activeItem === route.path && (
                      <motion.div
                        layoutId="navBackground"
                        className="absolute inset-0 bg-white/10 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Description Tooltip */}
            <AnimatePresence>
              {activeItem && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-xs text-white/80 whitespace-nowrap"
                >
                  {routes.find((route) => route.path === activeItem)?.description}
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 z-10">
          {/* Connect Button (Desktop) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            <Headphones className="h-4 w-4" />
            <span>Connect</span>
          </motion.button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
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
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 top-16 bg-black/70 backdrop-blur-lg z-40"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container py-8 px-4 h-full flex flex-col">
              <nav className="flex-1">
                <ul className="space-y-4">
                  {routes.map((route, index) => (
                    <motion.li
                      key={route.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Link
                        href={route.path}
                        className={cn(
                          "flex items-center gap-3 p-4 transition-colors",
                          pathname === route.path
                            ? "bg-cosmic-sea-500/20 text-white border border-cosmic-sea-400/20"
                            : "text-white/70 hover:bg-cosmic-sea-500/10 hover:text-white",
                        )}
                        onClick={() => setIsMenuOpen(false)}
                        style={{
                          clipPath: "polygon(0% 0%, 100% 0%, 97% 90%, 100% 100%, 3% 100%, 0% 90%)",
                          borderRadius: "0.5rem",
                        }}
                      >
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-cosmic-sea-500/10">
                          {route.icon}
                        </div>
                        <div>
                          <div className="font-medium">{route.name}</div>
                          <div className="text-xs text-white/60">{route.description}</div>
                        </div>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: routes.length * 0.1, duration: 0.3 }}
                className="mt-auto pt-6 border-t border-white/10"
              >
                <button
                  className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-cosmic-sea-500 to-cosmic-sunset-600 text-white hover:from-cosmic-sea-600 hover:to-cosmic-sunset-700 transition-colors"
                  style={{
                    clipPath: "polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)",
                    borderRadius: "0.5rem",
                  }}
                >
                  <Headphones className="h-5 w-5" />
                  <span>Connect</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}



/**
 * Original CosmicNavigation component merged from: client/src/components/layout/cosmic-navigation.tsx
 * Merge date: 2025-04-05
 */
function CosmicNavigationOriginal() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [isHoveringMenu, setIsHoveringMenu] = useState(false)
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

  const routes: NavItem[] = [
    {
      name: "Cosmic Gateway",
      path: "/",
      icon: <Home className="h-5 w-5" />,
      description: "Return to the central portal of cosmic frequencies",
    },
    {
      name: "Sonic Archives",
      path: "/archive",
      icon: <Archive className="h-5 w-5" />,
      description: "Explore the collection of healing vibrations",
    },
    {
      name: "Frequency Experiences",
      path: "/experience",
      icon: <Sparkles className="h-5 w-5" />,
      description: "Interactive tools for consciousness expansion",
    },
    {
      name: "Immersive Journeys",
      path: "/immersive",
      icon: <Compass className="h-5 w-5" />,
      description: "Deep cosmic experiences for transformation",
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

  // Set active item based on pathname
  useEffect(() => {
    const currentRoute = routes.find((route) => route.path === pathname)
    if (currentRoute) {
      setActiveItem(currentRoute.path)
    }
  }, [pathname, routes])

  // Calculate header opacity based on scroll position
  const headerOpacity = Math.min(scrollPosition / 200, 0.95)

  // Handle menu item hover
  const handleItemHover = (path: string) => {
    setActiveItem(path)
  }

  // Handle menu item leave
  const handleItemLeave = () => {
    if (!isHoveringMenu) {
      const currentRoute = routes.find((route) => route.path === pathname)
      if (currentRoute) {
        setActiveItem(currentRoute.path)
      }
    }
  }

  return (
    <motion.header
      ref={navRef}
      className="fixed top-0 z-50 w-full border-b border-white/5"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        backgroundColor: `rgba(8, 3, 21, ${headerOpacity})`,
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group z-10">
          <div className="relative h-9 w-9">
            {/* Animated logo */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white">
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <path d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3z" fill="currentColor" />
                <path d="M12 21a9 9 0 0 0 9-9h-3a6 6 0 0 1-6 6v3z" fill="currentColor" />
              </svg>
            </div>
          </div>
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300 relative">
            ASTRA
            <span className="absolute -top-1 -right-2 h-1 w-1 rounded-full bg-purple-400 animate-ping"></span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div
          className="hidden md:block absolute left-1/2 transform -translate-x-1/2"
          onMouseEnter={() => setIsHoveringMenu(true)}
          onMouseLeave={() => {
            setIsHoveringMenu(false)
            handleItemLeave()
          }}
        >
          <nav className="relative">
            {/* Navigation Background */}
            <div className="absolute inset-0 -inset-x-6 -inset-y-3 bg-black/20 backdrop-blur-sm rounded-full border border-white/5"></div>

            {/* Navigation Items */}
            <ul className="relative flex space-x-1 px-1 py-1">
              {routes.map((route, index) => (
                <li key={route.path}>
                  <Link
                    href={route.path}
                    className={cn(
                      "relative flex items-center justify-center px-4 py-2 rounded-full transition-colors",
                      pathname === route.path ? "text-white" : "text-white/70 hover:text-white",
                    )}
                    onMouseEnter={() => handleItemHover(route.path)}
                    onMouseLeave={handleItemLeave}
                  >
                    <span className="relative z-10">{route.name}</span>

                    {/* Active/Hover Background */}
                    {activeItem === route.path && (
                      <motion.div
                        layoutId="navBackground"
                        className="absolute inset-0 bg-white/10 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Description Tooltip */}
            <AnimatePresence>
              {activeItem && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-xs text-white/80 whitespace-nowrap"
                >
                  {routes.find((route) => route.path === activeItem)?.description}
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 z-10">
          {/* Connect Button (Desktop) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            <Headphones className="h-4 w-4" />
            <span>Connect</span>
          </motion.button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
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
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 top-16 bg-black/70 backdrop-blur-lg z-40"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container py-8 px-4 h-full flex flex-col">
              <nav className="flex-1">
                <ul className="space-y-4">
                  {routes.map((route, index) => (
                    <motion.li
                      key={route.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Link
                        href={route.path}
                        className={cn(
                          "flex items-center gap-3 p-4 transition-colors",
                          pathname === route.path
                            ? "bg-cosmic-sea-500/20 text-white border border-cosmic-sea-400/20"
                            : "text-white/70 hover:bg-cosmic-sea-500/10 hover:text-white",
                        )}
                        onClick={() => setIsMenuOpen(false)}
                        style={{
                          clipPath: "polygon(0% 0%, 100% 0%, 97% 90%, 100% 100%, 3% 100%, 0% 90%)",
                          borderRadius: "0.5rem",
                        }}
                      >
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-cosmic-sea-500/10">
                          {route.icon}
                        </div>
                        <div>
                          <div className="font-medium">{route.name}</div>
                          <div className="text-xs text-white/60">{route.description}</div>
                        </div>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: routes.length * 0.1, duration: 0.3 }}
                className="mt-auto pt-6 border-t border-white/10"
              >
                <button
                  className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-cosmic-sea-500 to-cosmic-sunset-600 text-white hover:from-cosmic-sea-600 hover:to-cosmic-sunset-700 transition-colors"
                  style={{
                    clipPath: "polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)",
                    borderRadius: "0.5rem",
                  }}
                >
                  <Headphones className="h-5 w-5" />
                  <span>Connect</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

