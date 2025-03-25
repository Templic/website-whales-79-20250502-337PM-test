
import React from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserManagementProps {
  onAction: (userId: string, action: 'promote' | 'demote' | 'delete') => void;
}

export default function UserManagement({ onAction }: UserManagementProps) {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => fetch('/api/admin/users').then(res => res.json())
  });

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(user.id, 'promote')}
                >
                  Promote
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(user.id, 'demote')}
                >
                  Demote
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onAction(user.id, 'delete')}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
