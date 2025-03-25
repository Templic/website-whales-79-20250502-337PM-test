
import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChartBar, LogOut, ArrowLeft } from "lucide-react";
import { ToDoList } from "@/components/admin/ToDoList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsData {
  activeUsers: number;
  newRegistrations: number;
  contentReports: number;
  systemHealth: string;
}

export default function AdminPortalPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Admin Portal";
  }, []);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-[#00ebd6]">Admin Portal</h1>
        <div className="flex gap-2">
          <Link href="/admin/analytics">
            <Button
              variant="default"
              className="bg-[#00ebd6] text-[#303436] hover:bg-[#00c2b0]"
            >
              <ChartBar className="mr-2 h-4 w-4" />
              Advanced Analytics
            </Button>
          </Link>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/users">
                <Button className="w-full">Manage Users</Button>
              </Link>
              <Link href="/admin/subscribers">
                <Button className="w-full" variant="outline">Newsletter Subscribers</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/posts">
                <Button className="w-full">Manage Posts</Button>
              </Link>
              <Link href="/admin/music">
                <Button className="w-full" variant="outline">Music Library</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/comments">
                <Button className="w-full">Review Comments</Button>
              </Link>
              <Link href="/admin/reports">
                <Button className="w-full" variant="outline">Content Reports</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <ToDoList />
      </div>
    </div>
  );
}
