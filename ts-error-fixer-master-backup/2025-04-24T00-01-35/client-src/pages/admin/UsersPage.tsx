/**
 * UsersPage.tsx
 * 
 * Enhanced User Management page for the Admin Portal
 */
import React from "react";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  RefreshCw,
  Lock,
  Shield,
  User,
  UserCheck,
  UserX,
  CheckCircle,
  AlertCircle,
  Filter
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types
interface User {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  isBanned: boolean;
  twoFactorEnabled: boolean;
  lastLogin: string | null;
  loginAttempts: number;
  createdAt: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const usersPerPage = 10;

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  // Change user role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'changeRole', role })
      });
      if (!res.ok) throw new Error('Failed to update user role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "User Updated",
        description: "User role has been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update user role',
        variant: "destructive"
      });
    }
  });

  // Ban/unban user mutation
  const toggleBanMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: number; isBanned: boolean }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isBanned ? 'banUser' : 'unbanUser' })
      });
      if (!res.ok) throw new Error(`Failed to ${isBanned ? 'ban' : 'unban'} user`);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: variables.isBanned ? "User Banned" : "User Unbanned",
        description: `User has been ${variables.isBanned ? 'banned' : 'unbanned'} successfully`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update user status',
        variant: "destructive"
      });
    }
  });

  // Reset 2FA for a user
  const reset2FAMutation = useMutation({
    mutationFn: async ({ userId }: { userId: number }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset2FA' })
      });
      if (!res.ok) throw new Error('Failed to reset 2FA');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "2FA Reset",
        description: "Two-factor authentication has been reset for this user"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to reset 2FA',
        variant: "destructive"
      });
    }
  });

  // Filter users based on search query and filters
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      searchQuery === "" || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" 
      || (statusFilter === "active" && !user.isBanned)
      || (statusFilter === "banned" && user.isBanned);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  // Paginate users
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Total pages for pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // View user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
  };

  // Role badge component
  const RoleBadge = ({ role }: { role: string }) => {
    switch(role) {
      case 'super_admin':
        return <Badge className="bg-red-500 hover:bg-red-600">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Admin</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new user. They will receive an email to set their password.
                  </DialogDescription>
                </DialogHeader>
                {/* User creation form would go here */}
                <DialogFooter>
                  <Button type="submit" className="mt-4">Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage all users, their roles, and access permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap md:flex-nowrap">
                <div className="flex items-center w-full md:w-auto gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>2FA</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.length > 0 ? (
                        paginatedUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage 
                                    src={`https://api.dicebear.com/7.x/personas/svg?seed=${user.username}`} 
                                    alt={user.username} 
                                  />
                                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.username}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <RoleBadge role={user.role} />
                            </TableCell>
                            <TableCell>
                              {user.isBanned ? (
                                <Badge variant="destructive">Banned</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.twoFactorEnabled ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                    <User className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  
                                  {user.role !== 'super_admin' && (
                                    <DropdownMenuItem 
                                      onClick={() => changeRoleMutation.mutate({ 
                                        userId: user.id, 
                                        role: user.role === 'admin' ? 'user' : 'admin' 
                                      })}
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuItem 
                                    onClick={() => toggleBanMutation.mutate({ 
                                      userId: user.id, 
                                      isBanned: !user.isBanned
                                    })}
                                  >
                                    {user.isBanned ? (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                                        Unban User
                                      </>
                                    ) : (
                                      <>
                                        <UserX className="h-4 w-4 mr-2 text-red-500" />
                                        Ban User
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  
                                  {user.twoFactorEnabled && (
                                    <DropdownMenuItem 
                                      onClick={() => reset2FAMutation.mutate({ userId: user.id })}
                                    >
                                      <Lock className="h-4 w-4 mr-2" />
                                      Reset 2FA
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* User details dialog */}
        <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedUser && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={`https://api.dicebear.com/7.x/personas/svg?seed=${selectedUser.username}`} 
                        alt={selectedUser.username} 
                      />
                      <AvatarFallback>{selectedUser.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {selectedUser.username}
                  </DialogTitle>
                  <DialogDescription>
                    User details and account information
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Email</h4>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Role</h4>
                    <p className="text-sm">
                      <RoleBadge role={selectedUser.role} />
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Status</h4>
                    <p className="text-sm">
                      {selectedUser.isBanned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Active
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm flex items-center">
                      {selectedUser.twoFactorEnabled ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                          Disabled
                        </>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Account Created</h4>
                    <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Last Login</h4>
                    <p className="text-sm">
                      {selectedUser.lastLogin 
                        ? new Date(selectedUser.lastLogin).toLocaleString() 
                        : "Never logged in"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Login Attempts</h4>
                    <p className="text-sm">{selectedUser.loginAttempts}</p>
                  </div>
                </div>
                <DialogFooter className="flex justify-between">
                  {!selectedUser.isBanned ? (
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        toggleBanMutation.mutate({ 
                          userId: selectedUser.id, 
                          isBanned: true 
                        });
                        setIsUserDetailsOpen(false);
                      }}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Ban User
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="border-green-500 text-green-500 hover:bg-green-50"
                      onClick={() => {
                        toggleBanMutation.mutate({ 
                          userId: selectedUser.id, 
                          isBanned: false 
                        });
                        setIsUserDetailsOpen(false);
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Unban User
                    </Button>
                  )}
                  {selectedUser.role !== 'admin' && selectedUser.role !== 'super_admin' ? (
                    <Button
                      onClick={() => {
                        changeRoleMutation.mutate({ 
                          userId: selectedUser.id, 
                          role: 'admin' 
                        });
                        setIsUserDetailsOpen(false);
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Make Admin
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (selectedUser.role !== 'super_admin') {
                          changeRoleMutation.mutate({ 
                            userId: selectedUser.id, 
                            role: 'user' 
                          });
                          setIsUserDetailsOpen(false);
                        }
                      }}
                      disabled={selectedUser.role === 'super_admin'}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Remove Admin
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}