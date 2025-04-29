
/**
 * SitemapPage.tsx
 * 
 * Enhanced with cosmic sacred geometry theme.
 */
import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import SacredGeometry from "@/components/cosmic/SacredGeometry";
import { Card, CardContent } from "@/components/ui/card";
import { Compass, Map, Home, Music, BookOpen, ShoppingBag, FileText, User, Shield, History, Component } from "lucide-react";

export default function SitemapPage() {
  const { user } = useAuth();
  const pageTopRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    document.title = "Sitemap - Dale Loves Whales";
    // Scroll to top of page when component mounts
    pageTopRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e8e6e3] relative" ref={pageTopRef}>
      {/* Cosmic Background */}
      <CosmicBackground opacity={0.5} color="teal" nebulaEffect={true} />
      
      {/* Sacred geometry elements in page margins */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry type="flower-of-life" size={120} animate={true} />
        </div>
        <div className="absolute bottom-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry type="vesica-piscis" size={120} animate={true} />
        </div>
        
        {/* Right margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 right-5 opacity-10 hidden md:block">
          <SacredGeometry type="metatron-cube" size={120} animate={true} />
        </div>
        <div className="absolute bottom-40 right-5 opacity-10 hidden md:block">
          <SacredGeometry type="pentagram" size={120} animate={true} />
        </div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto py-16 px-4">
        {/* Header with cosmic styling */}
        <div className="relative mb-12">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-14 -right-14 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl"></div>
          
          <div className="text-center cosmic-slide-up">
            <div className="inline-flex justify-center items-center mb-6 p-4 rounded-full bg-gradient-to-br from-teal-900/40 to-cyan-900/40 border border-teal-500/20">
              <Map className="h-10 w-10 text-teal-400" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300">
              Sitemap
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-cyan-500 mx-auto mb-6"></div>
            <p className="text-lg text-teal-100/90 max-w-2xl mx-auto">
              Your guide to navigating all pages of the Dale Loves Whales cosmic journey
            </p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Pages */}
          <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
              
              <div className="flex items-center mb-4 space-x-2">
                <Home className="h-5 w-5 text-teal-400" />
                <h2 className="text-xl font-semibold text-teal-300">Main Pages</h2>
              </div>
              
              <ul className="space-y-2 text-teal-100/90">
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/" className="hover:text-cyan-300 transition-colors">Home</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/about" className="hover:text-cyan-300 transition-colors">About</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/contact" className="hover:text-cyan-300 transition-colors">Contact</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/tour" className="hover:text-cyan-300 transition-colors">Tour</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/blog" className="hover:text-cyan-300 transition-colors">Blog</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/engage" className="hover:text-cyan-300 transition-colors">Engage</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/newsletter" className="hover:text-cyan-300 transition-colors">Newsletter</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/collaboration" className="hover:text-cyan-300 transition-colors">Collaboration</Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Music & Experience */}
          <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
              
              <div className="flex items-center mb-4 space-x-2">
                <Music className="h-5 w-5 text-teal-400" />
                <h2 className="text-xl font-semibold text-teal-300">Music & Experience</h2>
              </div>
              
              <ul className="space-y-2 text-teal-100/90">
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/music-release" className="hover:text-cyan-300 transition-colors">New Music</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/archived-music" className="hover:text-cyan-300 transition-colors">Archived Music</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/cosmic-connectivity" className="hover:text-cyan-300 transition-colors">Cosmic Connectivity</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/cosmic-experience" className="hover:text-cyan-300 transition-colors">Cosmic Experience</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/cosmic-immersive" className="hover:text-cyan-300 transition-colors">Immersive Experience</Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
              
              <div className="flex items-center mb-4 space-x-2">
                <BookOpen className="h-5 w-5 text-teal-400" />
                <h2 className="text-xl font-semibold text-teal-300">Resources</h2>
              </div>
              
              <ul className="space-y-2 text-teal-100/90">
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/resources/frequency-guide" className="hover:text-cyan-300 transition-colors">Frequency Guide</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/resources/sacred-geometry" className="hover:text-cyan-300 transition-colors">Sacred Geometry</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/resources/sound-healing" className="hover:text-cyan-300 transition-colors">Sound Healing</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/resources/meditation" className="hover:text-cyan-300 transition-colors">Meditation</Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Shop */}
          <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
              
              <div className="flex items-center mb-4 space-x-2">
                <ShoppingBag className="h-5 w-5 text-teal-400" />
                <h2 className="text-xl font-semibold text-teal-300">Shop</h2>
              </div>
              
              <ul className="space-y-2 text-teal-100/90">
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/shop" className="hover:text-cyan-300 transition-colors">Shop Home</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/shop/cosmic-merchandise" className="hover:text-cyan-300 transition-colors">Cosmic Merchandise</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/cart" className="hover:text-cyan-300 transition-colors">Shopping Cart</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/shop/track-order" className="hover:text-cyan-300 transition-colors">Track Order</Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Legal & Info */}
          <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
              
              <div className="flex items-center mb-4 space-x-2">
                <FileText className="h-5 w-5 text-teal-400" />
                <h2 className="text-xl font-semibold text-teal-300">Legal & Info</h2>
              </div>
              
              <ul className="space-y-2 text-teal-100/90">
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/terms" className="hover:text-cyan-300 transition-colors">Terms of Service</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/privacy" className="hover:text-cyan-300 transition-colors">Privacy Policy</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/data-request" className="hover:text-cyan-300 transition-colors">Data Request</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/faq" className="hover:text-cyan-300 transition-colors">FAQ</Link>
                </li>
                <li className="transition-transform hover:translate-x-1">
                  <Link href="/sitemap" className="hover:text-cyan-300 transition-colors">Sitemap</Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* User Level Pages */}
          {user && (
            <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
                
                <div className="flex items-center mb-4 space-x-2">
                  <User className="h-5 w-5 text-teal-400" />
                  <h2 className="text-xl font-semibold text-teal-300">User Pages</h2>
                </div>
                
                <ul className="space-y-2 text-teal-100/90">
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/portal" className="hover:text-cyan-300 transition-colors">User Dashboard</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/shop/order-history" className="hover:text-cyan-300 transition-colors">Order History</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/collaborative-shopping" className="hover:text-cyan-300 transition-colors">Group Shopping</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/profile" className="hover:text-cyan-300 transition-colors">Profile Settings</Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Admin Level Pages */}
          {user?.role === 'admin' && (
            <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
                
                <div className="flex items-center mb-4 space-x-2">
                  <Shield className="h-5 w-5 text-teal-400" />
                  <h2 className="text-xl font-semibold text-teal-300">Admin Pages</h2>
                </div>
                
                <ul className="space-y-2 text-teal-100/90">
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin" className="hover:text-cyan-300 transition-colors">Admin Dashboard</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin/posts" className="hover:text-cyan-300 transition-colors">Content Management</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin/users" className="hover:text-cyan-300 transition-colors">User Management</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin/analytics" className="hover:text-cyan-300 transition-colors">Analytics</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin/shop" className="hover:text-cyan-300 transition-colors">Shop Management</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin/media" className="hover:text-cyan-300 transition-colors">Media Management</Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* SuperAdmin Level Pages */}
          {user?.role === 'superadmin' && (
            <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
                
                <div className="flex items-center mb-4 space-x-2">
                  <Shield className="h-5 w-5 text-red-400" />
                  <h2 className="text-xl font-semibold text-teal-300">System Administration</h2>
                </div>
                
                <ul className="space-y-2 text-teal-100/90">
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin/security" className="hover:text-cyan-300 transition-colors">Security Dashboard</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin/system" className="hover:text-cyan-300 transition-colors">System Settings</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin/roles" className="hover:text-cyan-300 transition-colors">Role Management</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin/audit-logs" className="hover:text-cyan-300 transition-colors">Audit Logs</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/admin/database" className="hover:text-cyan-300 transition-colors">Database Management</Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Legacy Pages - Admin Only */}
          {user?.role === 'admin' && (
            <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
                
                <div className="flex items-center mb-4 space-x-2">
                  <History className="h-5 w-5 text-teal-400" />
                  <h2 className="text-xl font-semibold text-teal-300">Legacy Pages</h2>
                </div>
                
                <ul className="space-y-2 text-teal-100/90">
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/archived/archive_page_old" className="hover:text-cyan-300 transition-colors">Old Archive</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/archived/cosmic_experience_page_old" className="hover:text-cyan-300 transition-colors">Old Cosmic Experience</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/archived/shop_page_old" className="hover:text-cyan-300 transition-colors">Old Shop</Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Demo Pages - Admin Only */}
          {user?.role === 'admin' && (
            <Card className="cosmic-glow-box bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/20 shadow-lg backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 h-40 w-40 bg-teal-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
                
                <div className="flex items-center mb-4 space-x-2">
                  <Component className="h-5 w-5 text-teal-400" />
                  <h2 className="text-xl font-semibold text-teal-300">Demo Pages</h2>
                </div>
                
                <ul className="space-y-2 text-teal-100/90">
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/test/cosmic" className="hover:text-cyan-300 transition-colors">Cosmic Components Demo</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/test/audio" className="hover:text-cyan-300 transition-colors">Audio Components Demo</Link>
                  </li>
                  <li className="transition-transform hover:translate-x-1">
                    <Link href="/components" className="hover:text-cyan-300 transition-colors">Component Catalog</Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="text-center p-6 bg-gradient-to-br from-teal-900/20 to-cyan-900/20 rounded-xl border border-teal-500/20 backdrop-blur-sm mt-12 mb-6 relative cosmic-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
          
          <p className="flex items-center justify-center gap-3 text-lg max-w-2xl mx-auto relative z-10 text-teal-100/90">
            <Compass className="h-5 w-5 text-teal-400" />
            <span>
              Not finding what you're looking for? Visit our{' '}
              <Link href="/contact" className="text-teal-300 hover:text-cyan-300 transition-colors underline">
                contact page
              </Link>{' '}
              for assistance.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
