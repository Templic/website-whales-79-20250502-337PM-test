/**
 * MainFooter.tsx
 * 
 * This is the primary footer component for the website.
 * It merges the best features from existing footer components
 * based on the sitemap structure.
 * 
 * Created: 2025-04-05
 */

import { useState, useCallback } from "react";
import { Link } from "wouter";
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
  Shield
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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
    { name: "Blog", path: "/blog", icon: <Book className="h-4 w-4 mr-2" /> },
  ];

  const musicLinks: FooterLink[] = [
    { name: "New Music", path: "/music-release", icon: <Music className="h-4 w-4 mr-2" /> },
    { name: "Archived Music", path: "/archived-music", icon: <Music className="h-4 w-4 mr-2" /> },
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
      } catch (error) {
        setSubscriptionStatus("error");
        console.error("Subscription error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [email],
  );

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
      className="relative bg-[#0a325c] mt-16 border-t border-[#00ebd6] overflow-hidden"
      role="contentinfo"
    >
      {/* Sacred Geometry Background */}
      <FlowerOfLifePattern className="absolute inset-0 opacity-5" aria-hidden="true" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="space-y-4">
            <Link 
              href="/" 
              className="flex items-center space-x-2 group"
              aria-label="Dale Loves Whales - Return to home page"
            >
              <div className="relative h-10 w-10">
                {/* Animated logo */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold">DW</span>
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
                Dale Loves Whales
              </span>
            </Link>
            <p className="text-[#e8e6e3]/70 text-sm">
              Experience transformative sound healing through cosmic frequencies designed to balance chakras and elevate
              consciousness.
            </p>
            <div className="flex space-x-4 pt-2">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.path}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="text-[#e8e6e3]/60 hover:text-white transition-colors"
                  aria-label={`${link.name} (opens in a new tab)`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Main Links & Community */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4 text-[#00ebd6] flex items-center">
                <Home className="h-4 w-4 mr-2 text-[#00ebd6]" aria-hidden="true" />
                Main Pages
              </h4>
              {renderLinkList(mainLinks)}

              <h4 className="text-lg font-semibold mt-6 mb-4 text-[#00ebd6] flex items-center">
                <Heart className="h-4 w-4 mr-2 text-[#00ebd6]" aria-hidden="true" />
                Community
              </h4>
              {renderLinkList(communityLinks)}
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-[#00ebd6] flex items-center">
                <Music className="h-4 w-4 mr-2 text-[#00ebd6]" aria-hidden="true" />
                Music Experience
              </h4>
              {renderLinkList(musicLinks)}

              <h4 className="text-lg font-semibold mt-6 mb-4 text-[#00ebd6] flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2 text-[#00ebd6]" aria-hidden="true" />
                Shop
              </h4>
              {renderLinkList(shopLinks)}
            </div>
          </div>

          {/* Resources & Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#00ebd6] flex items-center">
              <Headphones className="h-4 w-4 mr-2 text-[#00ebd6]" aria-hidden="true" />
              Resources
            </h4>
            {renderLinkList(resourceLinks)}

            <h4 className="text-lg font-semibold mt-6 mb-4 text-[#00ebd6] flex items-center">
              <HelpCircle className="h-4 w-4 mr-2 text-[#00ebd6]" aria-hidden="true" />
              Support
            </h4>
            {renderLinkList(supportLinks)}

            {user?.role === 'admin' || user?.role === 'super_admin' ? (
              <div className="mt-4 pt-4 border-t border-[#00ebd6]/20">
                <Link 
                  href="/admin" 
                  className="text-[#fe0064] hover:text-[#00ebd6] font-semibold flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Portal
                </Link>
              </div>
            ) : null}
          </div>

          {/* Newsletter Signup Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#00ebd6] flex items-center">
              <Mail className="h-4 w-4 mr-2 text-[#00ebd6]" aria-hidden="true" />
              Join Our Newsletter
            </h4>
            <p className="text-[#e8e6e3]/70 text-sm mb-4">
              Subscribe to receive the latest music releases, cosmic experiences, and tour updates.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                required
                className="w-full px-3 py-2 bg-[#303436] text-[#e8e6e3] border border-[#00ebd6] rounded-md"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#00ebd6] text-[#303436] rounded-md hover:bg-[#00c4b6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="mt-12 pt-6 border-t border-[#00ebd6]/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-[#e8e6e3]/50 text-sm">&copy; {new Date().getFullYear()} Dale Loves Whales. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <p className="text-[#e8e6e3]/50 text-xs">Crafted with sacred geometry for cosmic consciousness</p>
          </div>
        </div>
      </div>

      {/* Sacred Geometry Accent */}
      <div
        className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00ebd6]/30 via-purple-500/30 to-indigo-500/30"
        aria-hidden="true"
      ></div>
    </footer>
  );
}