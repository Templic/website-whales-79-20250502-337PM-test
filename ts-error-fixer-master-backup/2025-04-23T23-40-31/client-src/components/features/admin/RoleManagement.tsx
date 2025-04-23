/**
 * RoleManagement.tsx
 * 
 * Component for managing user roles and permissions
 * This is a placeholder that will be implemented with full functionality
 */
import React from 'react';
import { ShieldCheck, UserCog, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const RoleManagement: React.FC = () => {
  // Sample data for display purposes
  const sampleRoles = [
    {
      id: 1,
      name: "User",
      description: "Standard user account with basic access",
      permissions: ["view_content", "comment", "submit_feedback"],
      userCount: 254
    },
    {
      id: 2,
      name: "Editor",
      description: "Can create and edit content",
      permissions: ["view_content", "comment", "submit_feedback", "create_content", "edit_content"],
      userCount: 15
    },
    {
      id: 3,
      name: "Admin",
      description: "Full access to most system features",
      permissions: ["view_content", "comment", "submit_feedback", "create_content", "edit_content", "approve_content", "manage_users", "view_analytics"],
      userCount: 5
    },
    {
      id: 4,
      name: "Super Admin",
      description: "Unrestricted access to all system features",
      permissions: ["view_content", "comment", "submit_feedback", "create_content", "edit_content", "approve_content", "manage_users", "view_analytics", "manage_system", "manage_roles"],
      userCount: 2
    }
  ];

  // Format permission name for display
  const formatPermission = (permission: string) => {
    return permission
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-md bg-muted">
        <h3 className="font-semibold mb-2 flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5 text-indigo-600" />
          Role Management
        </h3>
        <p className="text-muted-foreground">
          The Role Management component for creating and managing user roles and permissions is currently under development. Check back soon for the full implementation.
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">System Roles</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Role
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleRoles.map(role => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>{role.userCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {role.permissions.slice(0, 3).map(permission => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {formatPermission(permission)}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" disabled={role.name === "Super Admin"}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;