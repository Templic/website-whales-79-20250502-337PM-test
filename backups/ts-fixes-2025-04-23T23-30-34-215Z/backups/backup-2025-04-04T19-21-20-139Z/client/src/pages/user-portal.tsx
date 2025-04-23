import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserCircle, LogOut } from "lucide-react";

export default function UserPortal() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Portal</h1>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            "Logging out..."
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </>
          )}
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <UserCircle className="h-12 w-12" />
          <div>
            <h2 className="text-xl font-semibold">{user?.username}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="capitalize">{user?.role}</span>
        </div>
      </Card>

      {user?.role === "admin" || user?.role === "super_admin" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Admin Tools</h3>
            <ul className="space-y-2">
              <li>
                <Button variant="link" className="p-0">
                  Manage Users
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0">
                  Content Moderation
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0">
                  System Settings
                </Button>
              </li>
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
