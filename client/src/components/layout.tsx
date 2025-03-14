import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Home, User } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/portal">
                  <Button variant="ghost">
                    <User className="h-4 w-4 mr-2" />
                    Portal
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button>Login</Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
