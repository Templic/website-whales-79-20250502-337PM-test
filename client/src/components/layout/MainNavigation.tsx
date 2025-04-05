"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { 
  Menu, 
  X, 
  Home, 
  Info, 
  Music, 
  Calendar, 
  Heart, 
  Mail, 
  Book, 
  MoonStar, 
  Users, 
  ShoppingBag
} from "lucide-react"

interface NavItem {
  name: string
  path: string
  icon: JSX.Element
  color: string
}

export function MainNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [pathname] = useLocation()
  
  // Navigation items from the screenshots with alternating colors
  const mainNavItems: NavItem[] = [
    {
      name: "Home",
      path: "/",
      icon: <Home className="h-5 w-5" />,
      color: "text-cyan-300 border-cyan-500/30 bg-cyan-950/30"
    },
    {
      name: "About",
      path: "/about",
      icon: <Info className="h-5 w-5" />,
      color: "text-purple-300 border-purple-500/30 bg-purple-950/30"
    },
    {
      name: "New Music",
      path: "/music-release",
      icon: <Music className="h-5 w-5" />,
      color: "text-cyan-300 border-cyan-500/30 bg-cyan-950/30"
    },
    {
      name: "Archived Music",
      path: "/archived-music",
      icon: <Music className="h-5 w-5" />,
      color: "text-purple-300 border-purple-500/30 bg-purple-950/30"
    },
    {
      name: "Cosmic Experience",
      path: "/cosmic-experience",
      icon: <MoonStar className="h-5 w-5" />,
      color: "text-cyan-300 border-cyan-500/30 bg-cyan-950/30"
    },
    {
      name: "Community",
      path: "/community",
      icon: <Users className="h-5 w-5" />,
      color: "text-purple-300 border-purple-500/30 bg-purple-950/30"
    },
    {
      name: "Collaborate",
      path: "/collaboration",
      icon: <Users className="h-5 w-5" />,
      color: "text-purple-300 border-purple-500/30 bg-purple-950/30"
    },
    {
      name: "Shop",
      path: "/shop",
      icon: <ShoppingBag className="h-5 w-5" />,
      color: "text-cyan-300 border-cyan-500/30 bg-cyan-950/30"
    }
  ]

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      <header className="fixed top-0 z-[100] w-full bg-black/80 backdrop-blur-lg border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group z-10">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">DW</span>
            </div>
            <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400">
              Dale Loves Whales
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex overflow-x-auto">
            <div className="flex flex-wrap justify-center gap-2">
              {mainNavItems.slice(0, 5).map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-md text-sm transition-all duration-300 border relative",
                    pathname === route.path 
                      ? `${route.color} shadow-[0_0_15px_rgba(0,0,0,0.1)] shadow-cyan-500/30`
                      : "text-white/80 border-white/10 hover:border-white/20 hover:bg-black/30 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] hover:shadow-purple-500/20"
                  )}
                >
                  {pathname === route.path && (
                    <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-cyan-500 to-purple-600 blur-sm rounded pointer-events-none"></div>
                  )}
                  {route.icon}
                  <span className="ml-2 font-medium">{route.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isMenuOpen ? "close" : "menu"}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>

        {/* Secondary Navigation Bar */}
        <div className="hidden md:block border-t border-white/5 overflow-x-auto">
          <div className="container mx-auto px-4 py-1">
            <div className="flex justify-center space-x-4">
              {mainNavItems.slice(5).map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-md text-sm transition-all duration-300 border relative",
                    pathname === route.path 
                      ? `${route.color} shadow-[0_0_15px_rgba(0,0,0,0.1)] shadow-purple-500/30`
                      : "text-white/80 border-white/10 hover:border-white/20 hover:bg-black/30 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] hover:shadow-cyan-500/20"
                  )}
                >
                  {pathname === route.path && (
                    <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-purple-500 to-cyan-600 blur-sm rounded pointer-events-none"></div>
                  )}
                  {route.icon}
                  <span className="ml-2 font-medium">{route.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden fixed inset-0 top-16 bg-black/95 backdrop-blur-xl z-[99]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <nav className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-2 gap-3">
                  {mainNavItems.map((route) => (
                    <Link
                      key={route.path}
                      to={route.path}
                      className={cn(
                        "flex flex-col items-center justify-center space-y-2 p-4 rounded-lg transition-all duration-300 text-center border relative",
                        pathname === route.path
                          ? `${route.color} shadow-[0_0_15px_rgba(0,0,0,0.1)] shadow-cyan-500/30`
                          : "text-white/80 border-white/10 hover:border-white/20 hover:bg-black/50 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] hover:shadow-purple-500/20"
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {pathname === route.path && (
                        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-cyan-500 to-purple-600 blur-sm rounded-lg pointer-events-none"></div>
                      )}
                      {route.icon}
                      <span className="text-sm font-medium">{route.name}</span>
                    </Link>
                  ))}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      
      {/* Spacer element to prevent content from being hidden under the fixed header */}
      <div className="h-24 md:h-32"></div>
    </>
  )
}