import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Gauge, 
  Users, 
  FileText, 
  Music, 
  ShoppingBag, 
  MessageSquare, 
  Mail, 
  ShieldAlert, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  LogOut,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Admin navigation items
  const navItems: NavItem[] = [
    { title: "Dashboard", href: "/admin", icon: <Gauge size={20} /> },
    { title: "Users", href: "/admin/users", icon: <Users size={20} /> },
    { title: "Blog Posts", href: "/admin/posts", icon: <FileText size={20} /> },
    { title: "Music", href: "/admin/music", icon: <Music size={20} /> },
    { title: "Media", href: "/admin/media", icon: <FileText size={20} /> },
    { title: "Shop", href: "/admin/shop", icon: <ShoppingBag size={20} /> },
    { title: "Comments", href: "/admin/comments", icon: <MessageSquare size={20} /> },
    { title: "Newsletter", href: "/admin/newsletter", icon: <Mail size={20} /> },
    { title: "Database", href: "/admin/database", icon: <Database size={20} />, requiredRole: 'super_admin' },
    { title: "Security", href: "/admin/security", icon: <ShieldAlert size={20} />, requiredRole: 'super_admin' },
    { title: "Settings", href: "/admin/settings", icon: <Settings size={20} /> },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredRole) return true;
    if (item.requiredRole === 'admin' && (user?.role === 'admin' || user?.role === 'super_admin')) return true;
    if (item.requiredRole === 'super_admin' && user?.role === 'super_admin') return true;
    return false;
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div 
        className={`bg-muted h-full flex flex-col border-r transition-all duration-300 ${
          collapsed ? "w-[80px]" : "w-[250px]"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Admin Portal</h2>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2">
            <TooltipProvider>
              {filteredNavItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Tooltip key={item.href} delayDuration={collapsed ? 100 : 1000}>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={`w-full justify-start mb-1 ${
                            collapsed ? "px-2" : "px-3"
                          }`}
                        >
                          <span className="mr-2">{item.icon}</span>
                          {!collapsed && <span>{item.title}</span>}
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </nav>
        </ScrollArea>

        <div className="p-4 border-t">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage 
                  src={`https://api.dicebear.com/7.x/personas/svg?seed=${user?.username || 'admin'}`} 
                  alt={user?.username || 'Admin'} 
                />
                <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{user?.username || 'Admin'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || 'admin'}</p>
              </div>
            </div>
          ) : (
            <Avatar className="h-9 w-9 mx-auto">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/personas/svg?seed=${user?.username || 'admin'}`} 
                alt={user?.username || 'Admin'} 
              />
              <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
            </Avatar>
          )}
          <Separator className="my-4" />
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100 ${
              collapsed ? "px-2" : "px-3"
            }`}
            onClick={logout}
          >
            <LogOut size={18} className="mr-2" />
            {!collapsed && "Logout"}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}