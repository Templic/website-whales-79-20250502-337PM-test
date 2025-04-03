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
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/tour">Tour</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/engage">Engage</Link></li>
            <li><Link href="/newsletter">Newsletter</Link></li>
            <li><Link href="/collaboration">Collaboration</Link></li>
            <li><Link href="/community">Community</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Music & Experience</h2>
          <ul className="space-y-2">
            <li><Link href="/music-release">New Music</Link></li>
            <li><Link href="/archived-music">Archived Music</Link> <span className="text-sm text-cyan-400">(recommended)</span></li>
            <li><Link href="/music-archive">Music Archive</Link> <span className="text-sm text-gray-400">(redirects to Archived Music)</span></li>
            <li><Link href="/cosmic-experience">Cosmic Experience</Link></li>
            <li><Link href="/immersive">Immersive Experience</Link></li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-2 text-gray-400">Archive Legacy Pages</h3>
          <ul className="space-y-2 text-gray-400">
            <li><Link href="/pages/archived-music/old">Archived Music (Legacy)</Link></li>
            <li><Link href="/pages/music-archive/old">Music Archive (Legacy)</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Shop</h2>
          <ul className="space-y-2">
            <li><Link href="/shop">Shop Home</Link></li>
            <li><Link href="/cart">Shopping Cart</Link></li>
            <li><Link href="/checkout">Checkout</Link></li>
            <li><Link href="/collaborative-shopping">Group Shopping</Link></li>
            <li><Link href="/shop/collaborative">Collaborative Shopping</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">User Account</h2>
          <ul className="space-y-2">
            <li><Link href="/auth">Login/Register</Link></li>
            <li><Link href="/portal">User Dashboard</Link></li>
            <li><Link href="/recover-password">Password Recovery</Link></li>
            <li><Link href="/reset-password">Reset Password</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Admin</h2>
          <ul className="space-y-2">
            <li><Link href="/admin">Admin Portal</Link></li>
            <li><Link href="/admin/analytics">Analytics</Link></li>
            <li><Link href="/admin/users">Users</Link></li>
            <li><Link href="/admin/posts">Posts</Link></li>
            <li><Link href="/admin/music">Music</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Legal & Info</h2>
          <ul className="space-y-2">
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/sitemap">Sitemap</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Demo Pages</h2>
          <ul className="space-y-2">
            <li><Link href="/test/cosmic">Cosmic UI Demo</Link></li>
            <li><Link href="/test/audio">Audio Components Demo</Link></li>
            <li><Link href="/test/new">New Components Demo</Link></li>
            <li><Link href="/cosmic-components">Cosmic Components</Link></li>
            <li><Link href="/cosmic-test">Cosmic Test</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}