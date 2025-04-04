
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState<string>(title);
  const [shopSubmenuOpen, setShopSubmenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = () => {
    // In a real app, this would be connected to authentication
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:block",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="px-4 py-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-cosmic-primary/20 flex items-center justify-center text-cosmic-primary">
                <LayoutDashboard size={20} />
              </div>
              <h2 className="ml-3 text-lg font-semibold">Admin Portal</h2>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </Button>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              <Button
                variant={activePage === "Dashboard" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActivePage("Dashboard");
                  navigate("/admin");
                }}
              >
                <LayoutDashboard className="mr-3 h-4 w-4" />
                Dashboard
              </Button>
              
              <div>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setShopSubmenuOpen(!shopSubmenuOpen)}
                >
                  <ShoppingBag className="mr-3 h-4 w-4" />
                  Shop
                  <ChevronDown className={cn(
                    "ml-auto h-4 w-4 transition-transform",
                    shopSubmenuOpen && "transform rotate-180"
                  )} />
                </Button>
                
                {shopSubmenuOpen && (
                  <div className="pl-9 space-y-1 mt-1">
                    <Button
                      variant={activePage === "Products" ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setActivePage("Products");
                        navigate("/admin/products");
                      }}
                    >
                      Products
                    </Button>
                    <Button
                      variant={activePage === "Orders" ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setActivePage("Orders");
                        navigate("/admin/orders");
                      }}
                    >
                      Orders
                    </Button>
                  </div>
                )}
              </div>
              
              <Button
                variant={activePage === "Users" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActivePage("Users");
                  navigate("/admin/users");
                }}
              >
                <Users className="mr-3 h-4 w-4" />
                Users
              </Button>
              
              <Button
                variant={activePage === "Settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActivePage("Settings");
                  navigate("/admin/settings");
                }}
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </Button>
            </div>
          </nav>
          
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center px-4">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <h1 className="text-xl font-semibold ml-4">{title}</h1>
        </header>
        
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
