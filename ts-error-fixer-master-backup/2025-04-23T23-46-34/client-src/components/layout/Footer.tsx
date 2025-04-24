/**
 * @deprecated This component is deprecated. Please use MainFooter.tsx instead.
 * This file will be removed in a future update.
 */
import React from "react";


import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export function Footer() {
  const [email, setEmail] = useState("");
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription here
  };

  return (
    <footer className="bg-[#0a325c] mt-16 border-t border-[#00ebd6]">
      <div className="container mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Links Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#00ebd6]">Quick Links</h4>
            <nav>
              <ul className="space-y-2">
                <li><Link href="/" className="text-[#e8e6e3] hover:text-[#00ebd6]">Home</Link></li>
                <li><Link href="/about" className="text-[#e8e6e3] hover:text-[#00ebd6]">About</Link></li>
                <li><Link href="/music-release" className="text-[#e8e6e3] hover:text-[#00ebd6]">New Music</Link></li>
                <li><Link href="/archived-music" className="text-[#e8e6e3] hover:text-[#00ebd6]">Archived Music</Link></li>
                <li><Link href="/tour" className="text-[#e8e6e3] hover:text-[#00ebd6]" onClick={() => window.scrollTo(0, 0)}>Tour</Link></li>
                <li><Link href="/cosmic-experience-immersive" className="text-[#e8e6e3] hover:text-[#00ebd6]">Cosmic Experience & Immersive</Link></li>
                <li><Link href="/shop" className="text-[#e8e6e3] hover:text-[#00ebd6]">Shop</Link></li>
                <li><Link href="/blog" className="text-[#e8e6e3] hover:text-[#00ebd6]">Blog</Link></li>
                <li><Link href="/contact" className="text-[#e8e6e3] hover:text-[#00ebd6]">Contact</Link></li>
                <li><Link href="/newsletter" className="text-[#e8e6e3] hover:text-[#00ebd6]">Newsletter</Link></li>
                <li><Link href="/collaboration" className="text-[#e8e6e3] hover:text-[#00ebd6]">Collaboration</Link></li>
                <li><Link href="/gifts-and-sponsorships" className="text-[#e8e6e3] hover:text-[#00ebd6]">Gifts and Sponsorships</Link></li>
                <li><Link href="/blog" className="text-[#e8e6e3] hover:text-[#00ebd6]">Blog</Link></li>
                <li><Link href="/newsletter" className="text-[#e8e6e3] hover:text-[#00ebd6]">Newsletter</Link></li>
                <li><Link href="/shop" className="text-[#e8e6e3] hover:text-[#00ebd6]">Shop</Link></li>
                <li><hr className="border-[#00ebd6]/20 my-2" /></li>
                <li><Link href="/test/cosmic" className="text-[#00ebd6]/70 hover:text-[#00ebd6]">Cosmic UI Demo</Link></li>
                <li><Link href="/test/audio" className="text-[#00ebd6]/70 hover:text-[#00ebd6]">Audio Components</Link></li>
                <li><Link href="/test/new" className="text-[#00ebd6]/70 hover:text-[#00ebd6]">New Components</Link></li>
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <li>
                    <Link 
                      href="/admin" 
                      className="text-[#fe0064] hover:text-[#00ebd6] font-semibold"
                    >
                      Admin Portal
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>

          {/* Social Media Icons Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#00ebd6]">Follow Us</h4>
            <div className="flex gap-4">
              <a 
                href="https://facebook.com/DaleTheWhale" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#e8e6e3] hover:text-[#00ebd6]"
              >
                <img src="/icons8-facebook-48.png" alt="Facebook" className="w-8 h-8" />
              </a>
              <a 
                href="https://twitter.com/DaleTheWhale" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#e8e6e3] hover:text-[#00ebd6]"
              >
                <img src="/icons8-twitter-48.png" alt="Twitter" className="w-8 h-8" />
              </a>
              <a 
                href="https://instagram.com/DaleTheWhale" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#e8e6e3] hover:text-[#00ebd6]"
              >
                <img src="/icons8-instagram-48.png" alt="Instagram" className="w-8 h-8" />
              </a>
            </div>
          </div>

          {/* Newsletter Signup Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#00ebd6]">Join Our Newsletter</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-3 py-2 bg-[#303436] text-[#e8e6e3] border border-[#00ebd6] rounded-md"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#00ebd6] text-[#303436] rounded-md hover:bg-[#0056b3]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="mt-8 pt-8 border-t border-[#00ebd6]/20 text-center text-[#e8e6e3]">
          <p>&copy; {new Date().getFullYear()} Dale Loves Whales. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}