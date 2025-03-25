
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, Search } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: string;
  updatedAt: string | null;
  isBanned?: boolean;
}

interface UserManagementProps {
  onAction: (userId: string, action: 'promote' | 'demote' | 'delete' | 'ban' | 'unban') => void;
}

export default function UserManagement({ onAction }: UserManagementProps) {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(res => {
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    })
  });

  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Determine if current user can perform actions based on role
  const canPromoteToAdmin = (targetUser: User) => 
    currentUser?.role === 'super_admin' && targetUser.role === 'user';
  
  const canDemoteToUser = (targetUser: User) => 
    currentUser?.role === 'super_admin' && targetUser.role === 'admin';
  
  const canDelete = (targetUser: User) => 
    (currentUser?.role === 'super_admin' || 
    (currentUser?.role === 'admin' && targetUser.role === 'user')) && 
    targetUser.id !== currentUser?.id;
    
  const canBan = (targetUser: User) =>
    (currentUser?.role === 'super_admin' || 
    (currentUser?.role === 'admin' && targetUser.role === 'user')) && 
    targetUser.id !== currentUser?.id && 
    !targetUser.isBanned;
    
  const canUnban = (targetUser: User) =>
    (currentUser?.role === 'super_admin' || 
    (currentUser?.role === 'admin' && targetUser.role === 'user')) && 
    targetUser.id !== currentUser?.id && 
    targetUser.isBanned;

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded flex gap-2 items-center">
        <AlertCircle className="text-red-500" />
        <span>Error loading users: {error instanceof Error ? error.message : 'Unknown error'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers?.map((user) => (
                <TableRow 
                  key={user.id} 
                  className={user.isBanned ? "bg-red-50" : ""}
                >
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={
                      user.role === 'super_admin' ? "destructive" :
                      user.role === 'admin' ? "default" : "outline"
                    }>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="space-x-2">
                    {canPromoteToAdmin(user) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction(user.id.toString(), 'promote')}
                      >
                        Promote
                      </Button>
                    )}
                    {canDemoteToUser(user) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction(user.id.toString(), 'demote')}
                      >
                        Demote
                      </Button>
                    )}
                    {canDelete(user) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => confirm(`Are you sure you want to delete user ${user.username}?`) &&
                          onAction(user.id.toString(), 'delete')}
                      >
                        Delete
                      </Button>
                    )}
                    {canBan(user) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => confirm(`Are you sure you want to ban user ${user.username}?`) &&
                          onAction(user.id.toString(), 'ban')}
                      >
                        Ban
                      </Button>
                    )}
                    {canUnban(user) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction(user.id.toString(), 'unban')}
                      >
                        Unban
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
