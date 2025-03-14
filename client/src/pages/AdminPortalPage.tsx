import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

export default function AdminPortalPage() {
  const { user } = useAuth();
  
  // Redirect non-admin users
  if (user && user.role === 'user') {
    return <Redirect to="/" />;
  }

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: user?.role === 'admin' || user?.role === 'super_admin'
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-[#00ebd6] mb-8">Admin Portal</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* User Management Section */}
        <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">User Management</h2>
          <div className="space-y-4">
            {users?.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-sm rounded bg-[rgba(0,235,214,0.2)] text-[#00ebd6]">
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Analytics Section */}
        <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Analytics Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-[#00ebd6]">{users?.length || 0}</p>
            </div>
            <div className="p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
              <p className="text-sm text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-[#00ebd6]">
                {users?.filter(u => u.role !== 'user').length || 0}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
