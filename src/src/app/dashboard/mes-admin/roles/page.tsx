"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/dashboard/AdminHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface Role {
  id: string;
  name: string;
  group_id?: string;
}

interface Permission {
  id: string;
  name: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

interface User {
  id: string;
  group_id?: string;
}

export default function RolesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  useEffect(() => {
    async function checkAccessAndFetchData() {
      setLoading(true);
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!user || userError) {
          router.push("/login");
          return;
        }

        // Get user's details including group_id
        const { data: userData, error: userDetailsError } = await supabase
          .from('users')
          .select('id, group_id')
          .eq('id', user.id)
          .single();

        if (userDetailsError) throw userDetailsError;
        setCurrentUser(userData);

        // Get user's permissions
        const { data: permData, error: permError } = await supabase
          .from('role_permissions')
          .select(`
            permissions (name),
            roles!inner (
              users!inner (id)
            )
          `)
          .eq('roles.users.id', user.id);

        if (permError) throw permError;
        const userPerms = permData.map(p => p.permissions.name);
        setUserPermissions(userPerms);

        // Check if user can manage roles
        if (!userPerms.includes('manage_all_roles') && !userPerms.includes('manage_club_roles')) {
          router.push("/dashboard/mes-admin");
          return;
        }

        // Fetch roles (filtered by group_id for club admins)
        let rolesQuery = supabase.from('roles').select('*');
        if (!userPerms.includes('manage_all_roles') && userData.group_id) {
          rolesQuery = rolesQuery.eq('group_id', userData.group_id);
        }
        const { data: rolesData, error: rolesError } = await rolesQuery;
        
        if (rolesError) throw rolesError;
        setRoles(rolesData);

        // Fetch permissions
        const { data: permsData, error: permsError } = await supabase
          .from('permissions')
          .select('*');
        
        if (permsError) throw permsError;
        setPermissions(permsData);

        // Fetch role permissions
        const { data: rolePermsData, error: rolePermsError } = await supabase
          .from('role_permissions')
          .select('*');
        
        if (rolePermsError) throw rolePermsError;
        setRolePermissions(rolePermsData);

      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    checkAccessAndFetchData();
  }, []);

  const hasRolePermission = (roleId: string, permissionId: string) => {
    return rolePermissions.some(
      rp => rp.role_id === roleId && rp.permission_id === permissionId
    );
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      setError('Role name cannot be empty');
      return;
    }

    try {
      const { data: newRole, error: createError } = await supabase
        .from('roles')
        .insert([{ 
          name: newRoleName,
          group_id: userPermissions.includes('manage_all_roles') ? null : currentUser?.group_id
        }])
        .select()
        .single();

      if (createError) throw createError;

      setRoles([...roles, newRole]);
      setNewRoleName("");
      setIsCreateDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error creating role:', error);
      setError('Failed to create role');
    }
  };

  const handlePermissionToggle = async (roleId: string, permissionId: string) => {
    const exists = hasRolePermission(roleId, permissionId);
    
    try {
      if (exists) {
        // Remove permission
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .match({ role_id: roleId, permission_id: permissionId });

        if (error) throw error;

        setRolePermissions(rolePermissions.filter(
          rp => !(rp.role_id === roleId && rp.permission_id === permissionId)
        ));
      } else {
        // Add permission
        const { error } = await supabase
          .from('role_permissions')
          .insert([{ role_id: roleId, permission_id: permissionId }]);

        if (error) throw error;

        setRolePermissions([...rolePermissions, { role_id: roleId, permission_id: permissionId }]);
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
      setError('Failed to update permission');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setRoles(roles.filter(role => role.id !== roleId));
    } catch (error) {
      console.error('Error deleting role:', error);
      setError('Failed to delete role');
    }
  };

  // Filter permissions based on user's access level
  const getAvailablePermissions = () => {
    if (userPermissions.includes('manage_all_roles')) {
      return permissions;
    }
    
    // Club admins can only assign permissions they have
    return permissions.filter(permission => 
      userPermissions.includes(permission.name) &&
      !['manage_all_roles', 'view_all_requests'].includes(permission.name)
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Role Management</CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Create New Role</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>
                        Enter a name for the new role. You can manage permissions after creation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Role Name</Label>
                        <Input
                          id="name"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="Enter role name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateRole}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    {getAvailablePermissions().map(permission => (
                      <TableHead key={permission.id} className="text-center">
                        {permission.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map(role => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      {getAvailablePermissions().map(permission => (
                        <TableCell key={permission.id} className="text-center">
                          <Checkbox
                            checked={hasRolePermission(role.id, permission.id)}
                            onCheckedChange={() => handlePermissionToggle(role.id, permission.id)}
                            disabled={
                              !userPermissions.includes('manage_all_roles') &&
                              ['manage_all_roles', 'view_all_requests'].includes(permission.name)
                            }
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                          className="ml-2"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
