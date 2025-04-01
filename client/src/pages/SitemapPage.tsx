
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
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Music</h2>
          <ul className="space-y-2">
            <li><Link href="/music-release">New Music</Link></li>
            <li><Link href="/archived-music">Archived Music</Link></li>
            <li><Link href="/tour">Tour</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Community</h2>
          <ul className="space-y-2">
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/engage">Engage</Link></li>
            <li><Link href="/newsletter">Newsletter</Link></li>
            <li><Link href="/collaboration">Collaboration</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Account</h2>
          <ul className="space-y-2">
            <li><Link href="/auth">Login/Register</Link></li>
            <li><Link href="/user-portal">User Dashboard</Link></li>
            <li><Link href="/admin">Admin Portal</Link></li>
            <li><Link href="/password-recovery">Password Recovery</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Experience</h2>
          <ul className="space-y-2">
            <li><Link href="/cosmic-experience">Cosmic Experience</Link></li>
            <li><Link href="/immersive">Immersive Journey</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Legal</h2>
          <ul className="space-y-2">
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/sitemap">Sitemap</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
