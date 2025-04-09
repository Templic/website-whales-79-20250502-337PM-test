/**
 * MainFooter.tsx
 * 
 * Site-wide footer component
 * Contains navigation groups, social links, and newsletter signup
 * Organized in sections for different types of content
 */
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Book, Mail, Heart, ShoppingBag, Music, MoonStar, Headphones, Facebook, Twitter, Instagram, Youtube, ExternalLink, Shield } from 'lucide-react';
import { motion } from "framer-motion";
import { useMockAuth } from "../../hooks/use-auth";
import SacredGeometry from "@/components/ui/sacred-geometry";
import FlowerOfLifePattern from "@/components/ui/sacred-geometry"; // Assuming this is defined elsewhere


export const MainFooter: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"idle" | "success" | "error">("idle");
  const { user } = useMockAuth();

  const communityLinks = [
    { name: "Blog", path: "/blog", icon: <Book className="h-4 w-4 mr-2" /> },
    { name: "Newsletter", path: "/newsletter", icon: <Mail className="h-4 w-4 mr-2" /> },
    { name: "Community Hub", path: "/community", icon: <Heart className="h-4 w-4 mr-2" /> },
    { name: "Collaboration", path: "/collaboration", icon: <Heart className="h-4 w-4 mr-2" /> }
  ];

  const resourceLinks = [
    { name: "Frequency Guide", path: "/resources/frequency-guide", icon: <Headphones className="h-4 w-4 mr-2" /> },
    { name: "Sacred Geometry", path: "/resources/sacred-geometry", icon: <MoonStar className="h-4 w-4 mr-2" /> },
    { name: "Sound Healing", path: "/resources/sound-healing", icon: <Music className="h-4 w-4 mr-2" /> },
    { name: "Meditation", path: "/resources/meditation", icon: <Heart className="h-4 w-4 mr-2" /> }
  ];

  const shopLinks = [
    { name: "Shop Home", path: "/shop", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
    { name: "Cosmic Merchandise", path: "/cosmic-merchandise", icon: <MoonStar className="h-4 w-4 mr-2" /> },
    { name: "Group Shopping", path: "/collaborative-shopping", icon: <Heart className="h-4 w-4 mr-2" /> }
  ];

  const socialLinks = [
    { name: "Facebook", icon: <Facebook className="h-5 w-5" aria-hidden="true" />, path: "https://facebook.com/DaleTheWhale", external: true },
    { name: "Twitter", icon: <Twitter className="h-5 w-5" aria-hidden="true" />, path: "https://twitter.com/DaleTheWhale", external: true },
    { name: "Instagram", icon: <Instagram className="h-5 w-5" aria-hidden="true" />, path: "https://instagram.com/DaleTheWhale", external: true },
    { name: "YouTube", icon: <Youtube className="h-5 w-5" aria-hidden="true" />, path: "https://youtube.com/DaleTheWhale", external: true },
  ];

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      if (subscriptionStatus !== "idle") {
        setSubscriptionStatus("idle");
      }
    },
    [subscriptionStatus],
  );

  const handleSubscribe = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setSubscriptionStatus("error");
        return;
      }
      setIsSubmitting(true);
      try {
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


  const renderLinkList = (links: any[]) => (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.name}>
          {link.external ? (
            <a href={link.path} className="text-gray-400 hover:text-white flex items-center group" target="_blank" rel="noopener noreferrer">
              {link.icon} {link.name} <ExternalLink className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </a>
          ) : (
            <Link href={link.path} className="text-gray-400 hover:text-white flex items-center" >
              {link.icon} {link.name}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="bg-black/80 text-white py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center space-x-2 group" aria-label="Dale Loves Whales - Return to home page">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-md opacity-50 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"></div>
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">DW</span>
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300">
                Dale Loves Whales
              </span>
            </Link>
            <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-white/5 p-4 mt-4">
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

          <div>
            <h4 className="text-xl font-semibold mb-4">Community</h4>
            {renderLinkList(communityLinks)}
          </div>

          <div>
            <h4 className="text-xl font-semibold mb-4">Resources</h4>
            {renderLinkList(resourceLinks)}
          </div>

          <div>
            <h4 className="text-xl font-semibold mb-4">Shop</h4>
            {renderLinkList(shopLinks)}
            {user?.role === 'admin' || user?.role === 'super_admin' ? (
              <div className="mt-6 pt-4 border-t border-white/10">
                <Link href="/admin" className="text-[#fe0064] hover:text-cyan-400 font-semibold flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Portal
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2025 Cosmic Vibrations. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;