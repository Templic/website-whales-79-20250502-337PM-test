/**
 * SitemapPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import React from "react";

import { useEffect } from "react";
import { Link } from "wouter";

export default function SitemapPage() {
  useEffect(() => {
    document.title = "Sitemap - Dale Loves Whales";
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-4xl font-bold mb-8">Sitemap</h1>

      <div className="grid gap-8 md:grid-cols-3">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Main Pages</h2>
          <ul className="space-y-2">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/tour">Tour</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/engage">Engage</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Music Experience</h2>
          <ul className="space-y-2">
            <li><Link href="/archived-music">Music Collection</Link></li>
            <li><Link href="/cosmic-connectivity">Cosmic Connectivity</Link></li>
            <li><Link href="/cosmic-experience-immersive">Cosmic Experience & Immersive (Legacy)</Link></li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-2 text-gray-400">Archive Legacy Pages</h3>
          <ul className="space-y-2 text-gray-400">
            <li><Link href="/music-release">New Music (Legacy)</Link></li>
            <li><Link href="/legacy/archived-music">Archived Music (Legacy)</Link></li>
            <li><Link href="/legacy/cosmic-experience">Cosmic Experience (Legacy)</Link></li>
            <li><Link href="/legacy/immersive">Immersive Experience (Legacy)</Link></li>
            <li><Link href="/cosmic-experience-immersive">Cosmic Experience & Immersive (Legacy)</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Resources</h2>
          <ul className="space-y-2">
            <li><Link href="/resources">Resources Home</Link></li>
            <li><Link href="/resources/frequency-guide">Frequency Guide</Link></li>
            <li><Link href="/resources/sacred-geometry">Sacred Geometry</Link></li>
            <li><Link href="/resources/sound-healing">Sound Healing</Link></li>
            <li><Link href="/resources/meditation">Meditation Techniques</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Community</h2>
          <ul className="space-y-2">
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/engage">Engage</Link></li>
            <li><Link href="/newsletter">Newsletter</Link></li>
            <li><Link href="/community">Community Hub</Link></li>
            <li><Link href="/collaboration">Collaboration</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Shop</h2>
          <ul className="space-y-2">
            <li><Link href="/shop">Shop Home</Link></li>
            <li><Link href="/cosmic-merchandise">Cosmic Merchandise</Link></li>
            <li><Link href="/collaborative-shopping">Group Shopping</Link></li>
            <li><Link href="/cart">Shopping Cart</Link></li>
            <li><Link href="/checkout">Checkout</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Legal & Info</h2>
          <ul className="space-y-2">
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/sitemap">Sitemap</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}