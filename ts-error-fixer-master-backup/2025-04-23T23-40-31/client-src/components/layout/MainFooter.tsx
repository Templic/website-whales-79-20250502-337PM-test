/**
 * MainFooter.tsx
 * 
 * This is the primary footer component for the website.
 * It merges the best features from existing footer components
 * based on the sitemap structure.
 * 
 * Created: 2025-04-05
 */
import React from "react";


import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Music, 
  Headphones, 
  Heart, 
  ExternalLink,
  Calendar,
  Book,
  Home,
  MoonStar,
  ShoppingBag,
  Phone,
  HelpCircle,
  Shield,
  Info,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import SacredGeometry from "@/components/ui/sacred-geometry";

// Simple FlowerOfLifePattern component for cosmic background effect
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

// Interface definitions for different types of links
interface FooterLink {
  name: string;
  path: string;
  external?: boolean;
  icon?: React.ReactNode;
}

interface SocialLink extends FooterLink {
  icon: React.ReactNode;
}

export function MainFooter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"idle" | "success" | "error">("idle");
  const { user } = useAuth();

  // Define the link categories based on the sitemap structure
  const mainLinks: FooterLink[] = [
    { name: "Home", path: "/", icon: <Home className="h-4 w-4 mr-2" /> },
    { name: "About", path: "/about", icon: <MoonStar className="h-4 w-4 mr-2" /> },
    { name: "Tour", path: "/tour", icon: <Calendar className="h-4 w-4 mr-2" /> },
    { name: "Engage", path: "/engage", icon: <Heart className="h-4 w-4 mr-2" /> },
    { name: "Shop", path: "/shop", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
  ];

  const musicLinks: FooterLink[] = [
    { name: "Music Collection", path: "/archived-music", icon: <Music className="h-4 w-4 mr-2" /> },
    { name: "Cosmic Connectivity", path: "/cosmic-connectivity", icon: <MoonStar className="h-4 w-4 mr-2" /> }
  ];

  const communityLinks: FooterLink[] = [
    { name: "Blog", path: "/blog", icon: <Book className="h-4 w-4 mr-2" /> },
    { name: "Newsletter", path: "/newsletter", icon: <Mail className="h-4 w-4 mr-2" /> },
    { name: "Community Hub", path: "/community", icon: <Heart className="h-4 w-4 mr-2" /> },
    { name: "Collaboration", path: "/collaboration", icon: <Heart className="h-4 w-4 mr-2" /> }
  ];

  const resourceLinks: FooterLink[] = [
    { name: "Frequency Guide", path: "/resources/frequency-guide", icon: <Headphones className="h-4 w-4 mr-2" /> },
    { name: "Sacred Geometry", path: "/resources/sacred-geometry", icon: <MoonStar className="h-4 w-4 mr-2" /> },
    { name: "Sound Healing", path: "/resources/sound-healing", icon: <Music className="h-4 w-4 mr-2" /> },
    { name: "Meditation Techniques", path: "/resources/meditation", icon: <Heart className="h-4 w-4 mr-2" /> }
  ];

  const shopLinks: FooterLink[] = [
    { name: "Shop Home", path: "/shop", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
    { name: "Cosmic Merchandise", path: "/cosmic-merchandise", icon: <MoonStar className="h-4 w-4 mr-2" /> },
    { name: "Group Shopping", path: "/collaborative-shopping", icon: <Heart className="h-4 w-4 mr-2" /> }
  ];

  const supportLinks: FooterLink[] = [
    { name: "Contact Us", path: "/contact", icon: <Phone className="h-4 w-4 mr-2" /> },
    { name: "FAQ", path: "/faq", icon: <HelpCircle className="h-4 w-4 mr-2" /> },
    { name: "Privacy Policy", path: "/privacy", icon: <Shield className="h-4 w-4 mr-2" /> },
    { name: "Terms of Service", path: "/terms", icon: <Shield className="h-4 w-4 mr-2" /> },
    { name: "Sitemap", path: "/sitemap", icon: <MoonStar className="h-4 w-4 mr-2" /> }
  ];

  const socialLinks: SocialLink[] = [
    { name: "Facebook", icon: <Facebook className="h-5 w-5" aria-hidden="true" />, path: "https://facebook.com/DaleTheWhale", external: true },
    { name: "Twitter", icon: <Twitter className="h-5 w-5" aria-hidden="true" />, path: "https://twitter.com/DaleTheWhale", external: true },
    { name: "Instagram", icon: <Instagram className="h-5 w-5" aria-hidden="true" />, path: "https://instagram.com/DaleTheWhale", external: true },
    { name: "YouTube", icon: <Youtube className="h-5 w-5" aria-hidden="true" />, path: "https://youtube.com/DaleTheWhale", external: true },
  ];

  // Handle email input changes
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      // Reset status when user starts typing again
      if (subscriptionStatus !== "idle") {
        setSubscriptionStatus("idle");
      }
    },
    [subscriptionStatus],
  );

  // Handle newsletter subscription
  const handleSubscribe = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setSubscriptionStatus("error");
        return;
      }

      setIsSubmitting(true);

      try {
        // API call would go here - currently just simulating
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSubscriptionStatus("success");
        setEmail("");
      } catch (error: unknown) {
        setSubscriptionStatus("error");
        console.error("Subscription error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [email],
  );

  // Get navigate function from wouter - for potential future use
  const [, navigate] = useLocation();

  // Utility function to render a list of links with consistent styling
  const renderLinkList = (links: FooterLink[], className?: string) => (
    <ul className={`space-y-2 ${className || ""}`}>
      {links.map((link) => (
        <li key={link.name}>
          {link.external ? (
            <a
              href={link.path}
              className="text-[#e8e6e3] hover:text-[#00ebd6] transition-colors text-sm flex items-center group"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.name} (opens in a new tab)`}
            >
              {link.icon && link.icon}
              {link.name}
              <ExternalLink
                className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />
            </a>
          ) : (
            <Link
              href={link.path}
              className="text-[#e8e6e3] hover:text-[#00ebd6] transition-colors text-sm flex items-center"
              onClick={() => window.scrollTo(0, 0)}
            >
              {link.icon && link.icon}
              {link.name}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <footer
      className="relative bg-gradient-to-b from-[#050f28] to-[#0a1f3c] mt-16 border-t border-[#00ebd6]/50 overflow-hidden"
      role="contentinfo"
    >
      {/* Sacred Geometry Background Elements */}
      <div className="absolute top-0 left-1/4 transform -translate-x-1/2 opacity-15">
        <SacredGeometry variant="dodecahedron" size={300} animated={true} intensity="subtle" />
      </div>
      <div className="absolute bottom-20 right-0 transform translate-x-1/3 opacity-15">
        <SacredGeometry variant="merkaba" size={240} animated={true} intensity="subtle" />
      </div>
      <div className="absolute left-0 bottom-0 opacity-10">
        <FlowerOfLifePattern className="w-full h-full" aria-hidden="true" />
      </div>

      {/* Glowing accent traces */}
      <div 
        className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0" 
        aria-hidden="true"
      ></div>
      <div 
        className="absolute top-0 right-0 w-1 h-40 bg-gradient-to-b from-purple-500/30 to-purple-500/0" 
        aria-hidden="true"
      ></div>
      <div 
        className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0" 
        aria-hidden="true"
      ></div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {/* Logo and About */}
          <div className="space-y-4">
            <Link 
              href="/" 
              className="flex items-center space-x-2 group"
              aria-label="Dale Loves Whales - Return to home page"
              onClick={() => window.scrollTo(0, 0)}
            >
              <div className="relative h-10 w-10">
                {/* Animated logo with cyan-purple gradient matching header */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">DW</span>
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300">
                Dale Loves Whales
              </span>
            </Link>
            <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/5 p-4">
              <p className="text-[#e8e6e3]/80 text-sm">
                Experience transformative sound healing through cosmic frequencies designed to balance chakras and elevate
                consciousness through the sacred geometry of sound.
              </p>
              <div className="flex space-x-4 pt-4">
                {socialLinks.map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.path}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="text-[#e8e6e3]/60 hover:text-cyan-400 transition-colors"
                    aria-label={`${link.name} (opens in a new tab)`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Main Links & Community */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/5 p-4">
              <h4 className="text-base font-semibold mb-4 text-cyan-400 flex items-center">
                <Home className="h-4 w-4 mr-2 text-cyan-400" aria-hidden="true" />
                Main Pages
              </h4>
              {renderLinkList(mainLinks)}

              <h4 className="text-base font-semibold mt-6 mb-4 text-purple-400 flex items-center">
                <Users className="h-4 w-4 mr-2 text-purple-400" aria-hidden="true" />
                Community
              </h4>
              {renderLinkList(communityLinks)}
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/5 p-4">
              <h4 className="text-base font-semibold mb-4 text-cyan-400 flex items-center">
                <Music className="h-4 w-4 mr-2 text-cyan-400" aria-hidden="true" />
                Music Experience
              </h4>
              {renderLinkList(musicLinks)}

              <h4 className="text-base font-semibold mt-6 mb-4 text-purple-400 flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2 text-purple-400" aria-hidden="true" />
                Shop
              </h4>
              {renderLinkList(shopLinks)}
            </div>
          </div>

          {/* Resources & Support */}
          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/5 p-4">
            <h4 className="text-base font-semibold mb-4 text-cyan-400 flex items-center">
              <Headphones className="h-4 w-4 mr-2 text-cyan-400" aria-hidden="true" />
              Resources
            </h4>
            {renderLinkList(resourceLinks)}

            <h4 className="text-base font-semibold mt-6 mb-4 text-purple-400 flex items-center">
              <HelpCircle className="h-4 w-4 mr-2 text-purple-400" aria-hidden="true" />
              Support
            </h4>
            {renderLinkList(supportLinks)}

            {user?.role === 'admin' || user?.role === 'super_admin' ? (
              <div className="mt-6 pt-4 border-t border-white/10">
                <Link 
                  href="/admin" 
                  className="text-[#fe0064] hover:text-cyan-400 font-semibold flex items-center"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Portal
                </Link>
              </div>
            ) : null}
          </div>

          {/* Newsletter Signup Section */}
          <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/5 p-4">
            <h4 className="text-base font-semibold mb-4 text-cyan-400 flex items-center">
              <Mail className="h-4 w-4 mr-2 text-cyan-400" aria-hidden="true" />
              Join Our Newsletter
            </h4>
            <p className="text-[#e8e6e3]/70 text-sm mb-4">
              Subscribe to receive the latest music releases, cosmic experiences, and tour updates.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3 py-2 bg-black/30 text-white placeholder:text-gray-400 border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  disabled={isSubmitting}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-md hover:from-cyan-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>

              {subscriptionStatus === "success" && (
                <p className="text-green-400 text-xs">Thank you for subscribing!</p>
              )}
              {subscriptionStatus === "error" && (
                <p className="text-red-400 text-xs">Please enter a valid email address.</p>
              )}
            </form>

            {/* Small sacred geometry element */}
            <div className="flex justify-center mt-4 opacity-30">
              <SacredGeometry variant="pentagon" size={60} animated={true} intensity="subtle" />
            </div>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <p className="text-[#e8e6e3]/50 text-sm">&copy; {new Date().getFullYear()}Language Copyright claimed                 by Dale Ham 2025</p>
             <p className="text-[#e8e6e3]/50 text-sm">&copy; {new Date().getFullYear()} Website-App Copyright                     claimed by Lee Swan 2025</p>
            <div className="flex space-x-2 text-[#e8e6e3]/30">
              <Link 
                href="/privacy" 
                className="text-xs hover:text-cyan-400 transition-colors"
                onClick={() => window.scrollTo(0, 0)}
              >
                Privacy
              </Link>
              <span>•</span>
              <Link 
                href="/terms" 
                className="text-xs hover:text-cyan-400 transition-colors"
                onClick={() => window.scrollTo(0, 0)}
              >
                Terms
              </Link>
              <span>•</span>
              <Link 
                href="/sitemap" 
                className="text-xs hover:text-cyan-400 transition-colors"
                onClick={() => window.scrollTo(0, 0)}
              >
                Sitemap
              </Link>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-[#e8e6e3]/50 text-xs italic">
              Crafted with sacred geometry for cosmic consciousness
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}