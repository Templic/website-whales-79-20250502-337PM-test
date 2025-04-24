import React from 'react';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Settings,
  Users,
  FileText,
  Folders,
  Music,
  ShoppingBag,
  Mail,
  Bell,
  Shield,
  Database,
  Clock,
  LogOut,
  Image,
  Video,
  Grid,
  Film,
  FileAudio,
  MessageSquare,
  Home,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const mainNavItems = [
    { name: 'Dashboard', href: '/admin', icon: <BarChart className="h-5 w-5" /> },
    { name: 'Analytics', href: '/admin/analytics', icon: <BarChart className="h-5 w-5" /> },
    { name: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { name: 'Content', href: '/admin/content', icon: <FileText className="h-5 w-5" /> },
    { name: 'Content Workflow', href: '/admin/content-workflow', icon: <Folders className="h-5 w-5" /> },
    { name: 'Content Scheduler', href: '/admin/content-scheduler', icon: <Clock className="h-5 w-5" /> },
    { name: 'Music', href: '/admin/music', icon: <Music className="h-5 w-5" /> },
    { name: 'Shop', href: '/admin/shop', icon: <ShoppingBag className="h-5 w-5" /> },
    { name: 'Comments', href: '/admin/comments', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Newsletter', href: '/admin/newsletter', icon: <Mail className="h-5 w-5" /> },
  ];

  const mediaNavItems = [
    { name: 'Media Library', href: '/admin/media', icon: <Image className="h-5 w-5" /> },
    { name: 'Image Galleries', href: '/admin/media/gallery', icon: <Grid className="h-5 w-5" /> },
    { name: 'Video Manager', href: '/admin/media/video', icon: <Film className="h-5 w-5" /> },
    { name: 'Audio Manager', href: '/admin/media/audio', icon: <FileAudio className="h-5 w-5" /> },
  ];

  const systemNavItems = [
    { name: 'Security', href: '/admin/security', icon: <Shield className="h-5 w-5" /> },
    { name: 'Alerts', href: '/admin/security/alerts', icon: <Bell className="h-5 w-5" /> },
    { name: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
    { name: 'Database', href: '/admin/database', icon: <Database className="h-5 w-5" /> },
  ];

  const isActive = (href: string) => {
    return location === href;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 p-4 border-b flex justify-between items-center">
        <Link href="/">
          <a className="font-bold text-xl">Admin Portal</a>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-10 bg-black bg-opacity-50" onClick={toggleMobileMenu}>
          <div className="absolute top-14 left-0 right-0 bottom-0 bg-white dark:bg-gray-800 overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="space-y-6">
              <div>
                <h3 className="text-xs uppercase text-muted-foreground font-medium mb-2">Main</h3>
                <nav className="space-y-1">
                  {mainNavItems.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={`flex items-center px-3 py-2 text-sm rounded-md ${
                          isActive(item.href)
                            ? 'text-white bg-primary'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={toggleMobileMenu}
                      >
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <h3 className="text-xs uppercase text-muted-foreground font-medium mb-2">Media</h3>
                <nav className="space-y-1">
                  {mediaNavItems.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={`flex items-center px-3 py-2 text-sm rounded-md ${
                          isActive(item.href)
                            ? 'text-white bg-primary'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={toggleMobileMenu}
                      >
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <h3 className="text-xs uppercase text-muted-foreground font-medium mb-2">System</h3>
                <nav className="space-y-1">
                  {systemNavItems.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={`flex items-center px-3 py-2 text-sm rounded-md ${
                          isActive(item.href)
                            ? 'text-white bg-primary'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={toggleMobileMenu}
                      >
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="pt-4 mt-4 border-t">
                <Link href="/">
                  <a className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" onClick={toggleMobileMenu}>
                    <Home className="h-5 w-5" />
                    <span className="ml-3">Back to Website</span>
                  </a>
                </Link>
                <Link href="/auth">
                  <a className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" onClick={toggleMobileMenu}>
                    <LogOut className="h-5 w-5" />
                    <span className="ml-3">Logout</span>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop layout */}
      <div className="flex h-screen overflow-hidden pt-0 lg:pt-0">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-gray-800 border-r overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 mb-5">
                <span className="text-xl font-bold">Admin Portal</span>
              </div>
              <div className="px-3 mt-4">
                <h3 className="text-xs uppercase text-muted-foreground font-medium mb-2">Main</h3>
                <nav className="space-y-1">
                  {mainNavItems.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <a className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        isActive(item.href)
                          ? 'text-white bg-primary'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}>
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="px-3 mt-6">
                <h3 className="text-xs uppercase text-muted-foreground font-medium mb-2">Media</h3>
                <nav className="space-y-1">
                  {mediaNavItems.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <a className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        isActive(item.href)
                          ? 'text-white bg-primary'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}>
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="px-3 mt-6">
                <h3 className="text-xs uppercase text-muted-foreground font-medium mb-2">System</h3>
                <nav className="space-y-1">
                  {systemNavItems.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <a className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        isActive(item.href)
                          ? 'text-white bg-primary'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}>
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="flex-grow" />
              <div className="px-3 mt-6 mb-4 space-y-1">
                <Link href="/">
                  <a className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                    <Home className="h-5 w-5" />
                    <span className="ml-3">Back to Website</span>
                  </a>
                </Link>
                <Link href="/auth">
                  <a className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                    <LogOut className="h-5 w-5" />
                    <span className="ml-3">Logout</span>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative z-0 overflow-y-auto pt-16 lg:pt-0 focus:outline-none">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}