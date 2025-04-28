
import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function SitemapPage() {
  const { user } = useAuth();
  
  useEffect(() => {
    document.title = "Sitemap - Dale Loves Whales";
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-4xl font-bold mb-8">Sitemap</h1>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Public Pages */}
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
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Music & Experience</h2>
          <ul className="space-y-2">
            <li><Link href="/music-release">New Music</Link></li>
            <li><Link href="/archived-music">Archived Music</Link></li>
            <li><Link href="/cosmic-connectivity">Cosmic Connectivity</Link></li>
            <li><Link href="/cosmic-experience">Cosmic Experience</Link></li>
            <li><Link href="/cosmic-immersive">Immersive Experience</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Resources</h2>
          <ul className="space-y-2">
            <li><Link href="/resources/frequency-guide">Frequency Guide</Link></li>
            <li><Link href="/resources/sacred-geometry">Sacred Geometry</Link></li>
            <li><Link href="/resources/sound-healing">Sound Healing</Link></li>
            <li><Link href="/resources/meditation">Meditation</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Shop</h2>
          <ul className="space-y-2">
            <li><Link href="/shop">Shop Home</Link></li>
            <li><Link href="/shop/cosmic-merchandise">Cosmic Merchandise</Link></li>
            <li><Link href="/cart">Shopping Cart</Link></li>
            <li><Link href="/shop/track-order">Track Order</Link></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Legal & Info</h2>
          <ul className="space-y-2">
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/data-request">Data Request</Link></li>
            <li><Link href="/sitemap">Sitemap</Link></li>
          </ul>
        </section>

        {/* User Level Pages */}
        {user && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">User Pages</h2>
            <ul className="space-y-2">
              <li><Link href="/portal">User Dashboard</Link></li>
              <li><Link href="/shop/order-history">Order History</Link></li>
              <li><Link href="/collaborative-shopping">Group Shopping</Link></li>
              <li><Link href="/profile">Profile Settings</Link></li>
            </ul>
          </section>
        )}

        {/* Admin Level Pages */}
        {user?.role === 'admin' && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Admin Pages</h2>
            <ul className="space-y-2">
              <li><Link href="/admin">Admin Dashboard</Link></li>
              <li><Link href="/admin/posts">Content Management</Link></li>
              <li><Link href="/admin/users">User Management</Link></li>
              <li><Link href="/admin/analytics">Analytics</Link></li>
              <li><Link href="/admin/shop">Shop Management</Link></li>
              <li><Link href="/admin/media">Media Management</Link></li>
            </ul>
          </section>
        )}

        {/* SuperAdmin Level Pages */}
        {user?.role === 'superadmin' && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">System Administration</h2>
            <ul className="space-y-2">
              <li><Link href="/admin/security">Security Dashboard</Link></li>
              <li><Link href="/admin/system">System Settings</Link></li>
              <li><Link href="/admin/roles">Role Management</Link></li>
              <li><Link href="/admin/audit-logs">Audit Logs</Link></li>
              <li><Link href="/admin/database">Database Management</Link></li>
            </ul>
          </section>
        )}

        {/* Legacy Pages - Admin Only */}
        {user?.role === 'admin' && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Legacy Pages</h2>
            <ul className="space-y-2">
              <li><Link href="/archived/archive_page_old">Old Archive</Link></li>
              <li><Link href="/archived/cosmic_experience_page_old">Old Cosmic Experience</Link></li>
              <li><Link href="/archived/shop_page_old">Old Shop</Link></li>
            </ul>
          </section>
        )}

        {/* Demo Pages - Admin Only */}
        {user?.role === 'admin' && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Demo Pages</h2>
            <ul className="space-y-2">
              <li><Link href="/test/cosmic">Cosmic Components Demo</Link></li>
              <li><Link href="/test/audio">Audio Components Demo</Link></li>
              <li><Link href="/components">Component Catalog</Link></li>
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
