"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Menu, X, Home, Archive, Sparkles, Compass, Music, Heart, Calendar, Mail, Book } from "lucide-react"

interface NavItem {
  name: string
  path: string
  icon: JSX.Element
  description: string
}

export function CosmicNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

  const routes: NavItem[] = [
    {
      name: "Home",
      path: "/",
      icon: <Home className="h-5 w-5" />,
      description: "Return to the main portal",
    },
    {
      name: "New Music",
      path: "/music",
      icon: <Music className="h-5 w-5" />,
      description: "Latest sonic creations",
    },
    {
      name: "Tour",
      path: "/tour",
      icon: <Calendar className="h-5 w-5" />,
      description: "Live performances and events",
    },
    {
      name: "About",
      path: "/about",
      icon: <Archive className="h-5 w-5" />,
      description: "Learn more about Dale",
    },
    {
      name: "Engage",
      path: "/engage",
      icon: <Heart className="h-5 w-5" />,
      description: "Connect with the community",
    },
    {
      name: "Newsletter",
      path: "/newsletter",
      icon: <Mail className="h-5 w-5" />,
      description: "Stay updated with the latest news",
    },
    {
      name: "Blog",
      path: "/blog",
      icon: <Book className="h-5 w-5" />,
      description: "Read the latest stories",
    }
  ]

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const headerOpacity = Math.min(scrollPosition / 200, 0.95)

  return (
    <motion.header
      ref={navRef}
      className="fixed top-0 z-50 w-full"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        backgroundColor: `rgba(8, 3, 21, ${headerOpacity})`,
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group z-10">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold">DW</span>
          </div>
          <span className="hidden sm:inline-block font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
            Dale Loves Whales
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-1">
          <div className="bg-black/20 backdrop-blur-sm rounded-full border border-white/5 px-4 py-2">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "relative inline-flex items-center px-3 py-2 rounded-full transition-colors",
                  pathname === route.path ? "text-white" : "text-white/70 hover:text-white"
                )}
              >
                {route.icon}
                <span className="ml-2">{route.name}</span>
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
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 top-16 bg-black/90 backdrop-blur-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="container mx-auto px-4 py-6">
              <div className="flex flex-col space-y-2">
                {routes.map((route) => (
                  <Link
                    key={route.path}
                    href={route.path}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg transition-colors",
                      pathname === route.path
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {route.icon}
                    <div>
                      <div className="font-medium">{route.name}</div>
                      <div className="text-sm text-white/60">{route.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}