/**
 * cosmic-footer.tsx
 * 
 * Component Type: common
 * Migrated from imported components.
 * 
 * @deprecated This component is deprecated. Please use MainFooter.tsx in the layout folder instead.
 * This file will be removed in a future update.
 */
import React from "react";

/**
 * cosmic-footer.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

// Removed duplicate type React import
import { useState, useCallback } from "react"
import { Link } from "wouter"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Facebook, Twitter, Instagram, Youtube, Mail, Music, Headphones, Heart, ExternalLink } from "lucide-react"

// Simple stand-in for the original FlowerOfLifePattern component
const FlowerOfLifePattern: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div className={cn("relative w-full h-full", className)} {...props}>
      <div className="absolute inset-0 grid grid-cols-6 gap-4 opacity-10">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="relative">
            <div className="absolute inset-0 border border-white/20 rounded-full"></div>
            <div className="absolute inset-1 border border-white/10 rounded-full"></div>
            <div className="absolute inset-2 border border-white/5 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface FooterLink {
  name: string
  path: string
  external?: boolean
}

interface SocialLink extends FooterLink {
  icon: React.ReactNode
}

export function CosmicFooter() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<"idle" | "success" | "error">("idle")

  const mainLinks: FooterLink[] = [
    { name: "Cosmic Gateway", path: "/" },
    { name: "Sonic Archives", path: "/archive" },
    { name: "Frequency Experiences", path: "/experience" },
    { name: "Cosmic Connectivity", path: "/experience/cosmic-connectivity" },
    { name: "Music Harmonics", path: "/music" },
  ]

  const resourceLinks: FooterLink[] = [
    { name: "Frequency Guide", path: "#", external: true },
    { name: "Sacred Geometry", path: "#", external: true },
    { name: "Sound Healing", path: "#", external: true },
    { name: "Meditation Techniques", path: "#", external: true },
  ]

  const supportLinks: FooterLink[] = [
    { name: "Contact Us", path: "#" },
    { name: "FAQ", path: "#" },
    { name: "Privacy Policy", path: "#" },
    { name: "Terms of Service", path: "#" },
  ]

  const socialLinks: SocialLink[] = [
    { name: "Facebook", icon: <Facebook className="h-5 w-5" aria-hidden="true" />, path: "#", external: true },
    { name: "Twitter", icon: <Twitter className="h-5 w-5" aria-hidden="true" />, path: "#", external: true },
    { name: "Instagram", icon: <Instagram className="h-5 w-5" aria-hidden="true" />, path: "#", external: true },
    { name: "YouTube", icon: <Youtube className="h-5 w-5" aria-hidden="true" />, path: "#", external: true },
  ]

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value)
      // Reset status when user starts typing again
      if (subscriptionStatus !== "idle") {
        setSubscriptionStatus("idle")
      }
    },
    [subscriptionStatus],
  )

  const handleSubscribe = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setSubscriptionStatus("error")
        return
      }

      setIsSubmitting(true)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setSubscriptionStatus("success")
        setEmail("")
      } catch (error: unknown) {
        setSubscriptionStatus("error")
        console.error("Subscription error:", error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [email],
  )

  const renderLinkList = (links: FooterLink[], className?: string) => (
    <ul className={`space-y-2 ${className || ""}`}>
      {links.map((link) => (
        <li key={link.name}>
          {link.external ? (
            <a
              href={link.path}
              className="text-white/70 hover:text-cosmic-sea-400 transition-colors text-sm flex items-center group"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.name} (opens in a new tab)`}
            >
              {link.name}
              <ExternalLink
                className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />
            </a>
          ) : (
            <Link
              href={link.path}
              className="text-white/70 hover:text-cosmic-sea-400 transition-colors text-sm flex items-center"
            >
              {link.name}
            </Link>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <footer
      className="relative border-t border-white/10 bg-black/40 backdrop-blur-lg overflow-hidden"
      role="contentinfo"
    >
      {/* Sacred Geometry Background */}
      <FlowerOfLifePattern className="absolute inset-0 opacity-5" aria-hidden="true" />

      <div className="container px-4 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo and About */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 group" aria-label="ASTRA - Return to home page">
              <div className="relative h-10 w-10">
                {/* Animated logo */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" aria-hidden="true">
                    <circle cx={12} cy={12} r="3" fill="currentColor" />
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
            <p className="text-white/70 text-sm">
              Experience transformative sound healing through cosmic frequencies designed to balance chakras and elevate
              consciousness.
            </p>
            <div className="flex space-x-4 pt-2">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.path}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label={`${link.name} (opens in a new tab)`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-white font-medium mb-4 flex items-center">
              <Music className="h-4 w-4 mr-2 text-cosmic-purple-400" aria-hidden="true" />
              Navigation
            </h4>
            {renderLinkList(mainLinks)}
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-medium mb-4 flex items-center">
              <Headphones className="h-4 w-4 mr-2 text-cosmic-sea-400" aria-hidden="true" />
              Resources
            </h4>
            {renderLinkList(resourceLinks)}
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-medium mb-4 flex items-center">
              <Heart className="h-4 w-4 mr-2 text-cosmic-sunset-400" aria-hidden="true" />
              Support
            </h4>
            {renderLinkList(supportLinks)}

            {/* Newsletter */}
            <div className="mt-6">
              <h5 className="text-white text-sm font-medium mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-cosmic-sea-400" aria-hidden="true" />
                Subscribe to our frequency
              </h5>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="bg-black/30 border border-white/10 rounded-l-lg px-3 py-1 text-sm text-white w-full focus:outline-none focus:border-cosmic-sea-400"
                    value={email}
                    onChange={handleEmailChange}
                    aria-label="Email address"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    className="bg-cosmic-sea-500 hover:bg-cosmic-sea-600 text-white px-3 py-1 rounded-r-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      clipPath: "polygon(0% 0%, 100% 0%, 95% 100%, 0% 100%)",
                     }}
                    disabled={isSubmitting}
                    aria-label="Subscribe to newsletter"
                  >
                    {isSubmitting ? "..." : "Join"}
                  </button>
                </div>
                {subscriptionStatus === "success" && (
                  <p className="text-green-400 text-xs">Thank you for subscribing!</p>
                )}
                {subscriptionStatus === "error" && (
                  <p className="text-red-400 text-xs">Please enter a valid email address.</p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/50 text-sm">© {new Date().getFullYear()} ASTRA. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <p className="text-white/50 text-xs">Crafted with sacred geometry for cosmic consciousness</p>
          </div>
        </div>
      </div>

      {/* Sacred Geometry Accent */}
      <div
        className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cosmic-sea-500/30 via-cosmic-purple-500/30 to-cosmic-sunset-500/30"
        aria-hidden="true"
      ></div>
    </footer>
  )
}



/**
 * Original CosmicFooter component merged from: client/src/components/layout/cosmic-footer.tsx
 * Merge date: 2025-04-05
 */
function CosmicFooterOriginal() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<"idle" | "success" | "error">("idle")

  const mainLinks: FooterLink[] = [
    { name: "Cosmic Gateway", path: "/" },
    { name: "Sonic Archives", path: "/archive" },
    { name: "Frequency Experiences", path: "/experience" },
    { name: "Cosmic Connectivity", path: "/experience/cosmic-connectivity" },
    { name: "Music Harmonics", path: "/music" },
  ]

  const resourceLinks: FooterLink[] = [
    { name: "Frequency Guide", path: "#", external: true },
    { name: "Sacred Geometry", path: "#", external: true },
    { name: "Sound Healing", path: "#", external: true },
    { name: "Meditation Techniques", path: "#", external: true },
  ]

  const supportLinks: FooterLink[] = [
    { name: "Contact Us", path: "#" },
    { name: "FAQ", path: "#" },
    { name: "Privacy Policy", path: "#" },
    { name: "Terms of Service", path: "#" },
  ]

  const socialLinks: SocialLink[] = [
    { name: "Facebook", icon: <Facebook className="h-5 w-5" aria-hidden="true" />, path: "#", external: true },
    { name: "Twitter", icon: <Twitter className="h-5 w-5" aria-hidden="true" />, path: "#", external: true },
    { name: "Instagram", icon: <Instagram className="h-5 w-5" aria-hidden="true" />, path: "#", external: true },
    { name: "YouTube", icon: <Youtube className="h-5 w-5" aria-hidden="true" />, path: "#", external: true },
  ]

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value)
      // Reset status when user starts typing again
      if (subscriptionStatus !== "idle") {
        setSubscriptionStatus("idle")
      }
    },
    [subscriptionStatus],
  )

  const handleSubscribe = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setSubscriptionStatus("error")
        return
      }

      setIsSubmitting(true)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setSubscriptionStatus("success")
        setEmail("")
      } catch (error: unknown) {
        setSubscriptionStatus("error")
        console.error("Subscription error:", error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [email],
  )

  const renderLinkList = (links: FooterLink[], className?: string) => (
    <ul className={`space-y-2 ${className || ""}`}>
      {links.map((link) => (
        <li key={link.name}>
          {link.external ? (
            <a
              href={link.path}
              className="text-white/70 hover:text-cosmic-sea-400 transition-colors text-sm flex items-center group"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.name} (opens in a new tab)`}
            >
              {link.name}
              <ExternalLink
                className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />
            </a>
          ) : (
            <Link
              href={link.path}
              className="text-white/70 hover:text-cosmic-sea-400 transition-colors text-sm flex items-center"
            >
              {link.name}
            </Link>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <footer
      className="relative border-t border-white/10 bg-black/40 backdrop-blur-lg overflow-hidden"
      role="contentinfo"
    >
      {/* Sacred Geometry Background */}
      <FlowerOfLifePattern className="absolute inset-0 opacity-5" aria-hidden="true" />

      <div className="container px-4 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo and About */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 group" aria-label="ASTRA - Return to home page">
              <div className="relative h-10 w-10">
                {/* Animated logo */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" aria-hidden="true">
                    <circle cx={12} cy={12} r="3" fill="currentColor" />
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
            <p className="text-white/70 text-sm">
              Experience transformative sound healing through cosmic frequencies designed to balance chakras and elevate
              consciousness.
            </p>
            <div className="flex space-x-4 pt-2">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.path}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label={`${link.name} (opens in a new tab)`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-white font-medium mb-4 flex items-center">
              <Music className="h-4 w-4 mr-2 text-cosmic-purple-400" aria-hidden="true" />
              Navigation
            </h4>
            {renderLinkList(mainLinks)}
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-medium mb-4 flex items-center">
              <Headphones className="h-4 w-4 mr-2 text-cosmic-sea-400" aria-hidden="true" />
              Resources
            </h4>
            {renderLinkList(resourceLinks)}
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-medium mb-4 flex items-center">
              <Heart className="h-4 w-4 mr-2 text-cosmic-sunset-400" aria-hidden="true" />
              Support
            </h4>
            {renderLinkList(supportLinks)}

            {/* Newsletter */}
            <div className="mt-6">
              <h5 className="text-white text-sm font-medium mb-2 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-cosmic-sea-400" aria-hidden="true" />
                Subscribe to our frequency
              </h5>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="bg-black/30 border border-white/10 rounded-l-lg px-3 py-1 text-sm text-white w-full focus:outline-none focus:border-cosmic-sea-400"
                    value={email}
                    onChange={handleEmailChange}
                    aria-label="Email address"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="submit"
                    className="bg-cosmic-sea-500 hover:bg-cosmic-sea-600 text-white px-3 py-1 rounded-r-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      clipPath: "polygon(0% 0%, 100% 0%, 95% 100%, 0% 100%)",
                     }}
                    disabled={isSubmitting}
                    aria-label="Subscribe to newsletter"
                  >
                    {isSubmitting ? "..." : "Join"}
                  </button>
                </div>
                {subscriptionStatus === "success" && (
                  <p className="text-green-400 text-xs">Thank you for subscribing!</p>
                )}
                {subscriptionStatus === "error" && (
                  <p className="text-red-400 text-xs">Please enter a valid email address.</p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/50 text-sm">© {new Date().getFullYear()} ASTRA. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <p className="text-white/50 text-xs">Crafted with sacred geometry for cosmic consciousness</p>
          </div>
        </div>
      </div>

      {/* Sacred Geometry Accent */}
      <div
        className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cosmic-sea-500/30 via-cosmic-purple-500/30 to-cosmic-sunset-500/30"
        aria-hidden="true"
      ></div>
    </footer>
  )
}

