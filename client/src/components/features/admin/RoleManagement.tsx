/**
 * RoleManagement.tsx
 * 
 * Component for managing user roles and permissions
 * Allows admins to define and edit roles and their associated permissions
 */
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Lock, UserCog, Shield, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Types for user roles and permissions
interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string | null;
  isSystem: boolean;
}

interface Permission {
  id: number;
  name: string;
  code: string;
  description: string;
  category: string;
}

// Form schemas
const roleSchema = z.object({
  name: z.string().min(3, {
    message: "Role name must be at least 3 characters.",
  }),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters."
  }),
  permissions: z.array(z.number()).min(1, {
    message: "Select at least one permission."
  })
});

type RoleFormValues = z.infer<typeof roleSchema>;

// Permission categories
const permissionCategories = [
  "content",
  "users",
  "products",
  "analytics",
  "settings",
  "security"
];

const RoleManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form setup
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  // Fetch all roles
  const { data: roles, isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['/api/admin/roles'],
    queryFn: () => apiRequest('GET', '/api/admin/roles'),
  });

  // Fetch all available permissions
  const { data: permissions, isLoading: isLoadingPermissions } = useQuery<Permission[]>({
    queryKey: ['/api/admin/permissions'],
    queryFn: () => apiRequest('GET', '/api/admin/permissions'),
  });

  // Fetch single role details
  const { data: roleDetails, isLoading: isLoadingRoleDetails } = useQuery<Role>({
    queryKey: ['/api/admin/roles', selectedRoleId],
    queryFn: () => apiRequest('GET', `/api/admin/roles/${selectedRoleId}`),
    enabled: !!selectedRoleId && isEditDialogOpen,
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: RoleFormValues) => {
      return apiRequest('POST', '/api/admin/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Role created",
        description: "The role has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create role. Please try again.",
        variant: "destructive",
      });
      console.error("Create role error:", error);
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: (data: RoleFormValues & { id: number }) => {
      return apiRequest('PATCH', `/api/admin/roles/${data.id}`, {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles', selectedRoleId] });
      setIsEditDialogOpen(false);
      setSelectedRoleId(null);
      toast({
        title: "Role updated",
        description: "The role has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
      console.error("Update role error:", error);
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) => {
      return apiRequest('DELETE', `/api/admin/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      setIsDeleteDialogOpen(false);
      setSelectedRoleId(null);
      toast({
        title: "Role deleted",
        description: "The role has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      });
      console.error("Delete role error:", error);
    },
  });

  // Handle role creation
  const onCreateSubmit = (data: RoleFormValues) => {
    createRoleMutation.mutate(data);
  };

  // Handle role update
  const onEditSubmit = (data: RoleFormValues) => {
    if (selectedRoleId) {
      updateRoleMutation.mutate({
        ...data,
        id: selectedRoleId,
      });
    }
  };

  // Handle role deletion
  const handleDeleteRole = () => {
    if (selectedRoleId) {
      deleteRoleMutation.mutate(selectedRoleId);
    }
  };

  // Handle edit role click
  const handleEditRole = (roleId: number) => {
    setSelectedRoleId(roleId);
    setIsEditDialogOpen(true);
    
    // Populate form with role details
    if (roleDetails) {
      form.reset({
        name: roleDetails.name,
        description: roleDetails.description,
        permissions: roleDetails.permissions.map(p => p.id),
      });
    }
  };

  // Handle delete role click
  const handleDeleteClick = (roleId: number) => {
    setSelectedRoleId(roleId);
    setIsDeleteDialogOpen(true);
  };

  // Filter roles based on active tab and search query
  const filteredRoles = roles?.filter(role => {
    const matchesSearch = searchQuery === "" || 
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "system") return role.isSystem && matchesSearch;
    if (activeTab === "custom") return !role.isSystem && matchesSearch;
    
    return matchesSearch;
  });

  // Group permissions by category
  const groupedPermissions = permissions?.reduce<Record<string, Permission[]>>((acc, permission) => {
    const category = permission.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {});

  // Render role icon based on role name
  const getRoleIcon = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return <ShieldAlert className="h-4 w-4 mr-1" />;
    if (name.includes('super')) return <Shield className="h-4 w-4 mr-1" />;
    if (name.includes('moderator')) return <Lock className="h-4 w-4 mr-1" />;
    return <UserCog className="h-4 w-4 mr-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Role Management</h2>
        <Button onClick={() => {
          form.reset({
            name: "",
            description: "",
            permissions: [],
          });
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Role
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Roles</TabsTrigger>
          <TabsTrigger value="system">System Roles</TabsTrigger>
          <TabsTrigger value="custom">Custom Roles</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>
              Manage user roles and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRoles ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableCaption>List of available roles</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles?.length ? (
                    filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {getRoleIcon(role.name)}
                            {role.name}
                          </div>
                        </TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">
                              {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(role.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.isSystem ? "secondary" : "default"}>
                            {role.isSystem ? "System" : "Custom"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRole(role.id)}
                            disabled={role.isSystem}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(role.id)}
                            disabled={role.isSystem}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No roles found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Content Editor" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for the role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Can edit and approve content" {...field} />
                    </FormControl>
                    <FormDescription>
                      A brief description of the role's responsibilities
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <FormDescription className="mb-4">
                      Select the permissions for this role
                    </FormDescription>
                    
                    {isLoadingPermissions ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <div className="border rounded-md p-4 space-y-4">
                        {groupedPermissions && Object.entries(groupedPermissions).map(([category, perms]) => (
                          <div key={category} className="space-y-2">
                            <h4 className="font-medium capitalize">{category}</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {perms.map((permission) => (
                                <FormField
                                  key={permission.id}
                                  control={form.control}
                                  name="permissions"
                                  render={({ field }) => (
                                    <FormItem
                                      key={permission.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(permission.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, permission.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== permission.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="text-sm font-normal">
                                          {permission.name}
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                          {permission.description}
                                        </p>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createRoleMutation.isPending}>
                  {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Modify the role's details and permissions
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingRoleDetails ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Content Editor" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for the role
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Can edit and approve content" {...field} />
                      </FormControl>
                      <FormDescription>
                        A brief description of the role's responsibilities
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions"
                  render={() => (
                    <FormItem>
                      <FormLabel>Permissions</FormLabel>
                      <FormDescription className="mb-4">
                        Select the permissions for this role
                      </FormDescription>
                      
                      {isLoadingPermissions ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : (
                        <div className="border rounded-md p-4 space-y-4">
                          {groupedPermissions && Object.entries(groupedPermissions).map(([category, perms]) => (
                            <div key={category} className="space-y-2">
                              <h4 className="font-medium capitalize">{category}</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {perms.map((permission) => (
                                  <FormField
                                    key={permission.id}
                                    control={form.control}
                                    name="permissions"
                                    render={({ field }) => (
                                      <FormItem
                                        key={permission.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(permission.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, permission.id])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== permission.id
                                                    )
                                                  );
                                            }}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel className="text-sm font-normal">
                                            {permission.name}
                                          </FormLabel>
                                          <p className="text-xs text-muted-foreground">
                                            {permission.description}
                                          </p>
                                        </div>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateRoleMutation.isPending}>
                    {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;