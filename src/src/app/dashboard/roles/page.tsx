"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { 
  PROTECTED_PERMISSIONS, 
  ProtectedPermission, 
  ClubPermission, 
  UserPermission,
  Permission
} from "@/config/permissions";

// Categorize permissions
const PERMISSION_CATEGORIES = {
  admin: {
    label: 'Admin Permissions',
    permissions: PROTECTED_PERMISSIONS
  },
  club: {
    label: 'Club Permissions',
    permissions: [
      'manage_club_users',
      'manage_club_roles',
      'view_club_requests',
      'manage_club_requests'
    ] as ClubPermission[]
  },
  user: {
    label: 'User Permissions',
    permissions: ['create_requests'] as UserPermission[]
  }
};

export default function RolesPage() {
  const supabase = createClient();
  const router = useRouter();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  // Determine user's role creation capabilities
  const canManageAllRoles = permissions.includes('manage_all_roles');
  const canManageClubRoles = permissions.includes('manage_club_roles');

  useEffect(() => {
    async function fetchData() {
      try {
        // Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Check role management permissions
        if (!canManageAllRoles && !canManageClubRoles) {
          router.push("/dashboard/home");
          return;
        }

        // Fetch current user's full details
        const { data: userData } = await supabase
          .from('users')
          .select(`
            id,
            group_id,
            roles!inner (
              id,
              name,
              role_permissions (
                permissions (
                  name
                )
              )
            )
          `)
          .eq('id', user.id)
          .single();

        setCurrentUser(userData);

        // Fetch all roles with their permissions
        const { data: rolesData } = await supabase
          .from("roles")
          .select(`
            id,
            name,
            role_permissions (
              permissions (
                name
              )
            )
          `);

        // Transform roles to include flattened permissions
        const transformedRoles = rolesData?.map(role => ({
          ...role,
          permissions: role.role_permissions?.map(rp => rp.permissions.name) || []
        })) || [];

        setRoles(transformedRoles);
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading) {
      fetchData();
    }
  }, [permissions, permissionsLoading]);

  // Filter available permissions based on user's role
  const availablePermissions = useMemo(() => {
    if (canManageAllRoles) {
      // Admin can select all permissions
      return Object.values(PERMISSION_CATEGORIES)
        .flatMap(category => category.permissions);
    }

    if (canManageClubRoles) {
      // Club leaders can only select club and user permissions
      return [
        ...PERMISSION_CATEGORIES.club.permissions,
        ...PERMISSION_CATEGORIES.user.permissions
      ];
    }

    return [];
  }, [canManageAllRoles, canManageClubRoles]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      alert("Role name cannot be empty");
      return;
    }

    try {
      // Check if role name already exists
      const { data: existingRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", newRoleName)
        .single();

      if (existingRole) {
        alert("A role with this name already exists");
        return;
      }

      // Start a transaction
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .insert({ name: newRoleName })
        .select()
        .single();

      if (roleError) throw roleError;

      // Insert permissions
      const permissionInserts = selectedPermissions.map(async (permName) => {
        // First, get the permission ID
        const { data: permissionData } = await supabase
          .from("permissions")
          .select("id")
          .eq("name", permName)
          .single();

        if (!permissionData) return null;

        // Then insert role-permission mapping
        return supabase
          .from("role_permissions")
          .insert({
            role_id: roleData.id,
            permission_id: permissionData.id
          });
      });

      await Promise.all(permissionInserts);

      // Refresh roles list
      setRoles([
        ...roles, 
        { 
          id: roleData.id, 
          name: newRoleName, 
          permissions: selectedPermissions 
        }
      ]);

      // Reset form
      setNewRoleName("");
      setSelectedPermissions([]);
    } catch (error) {
      console.error("Error creating role:", error);
      alert("Failed to create role");
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleId) return;

    try {
      // Check if any users have this role
      const { count: userCount } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .eq("role_id", deleteRoleId);

      if (userCount && userCount > 0) {
        alert(`Cannot delete role. ${userCount} user(s) are currently assigned to this role.`);
        return;
      }

      // Delete role-permissions first
      const { error: rolePermError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", deleteRoleId);

      if (rolePermError) throw rolePermError;

      // Delete the role
      const { error: roleError } = await supabase
        .from("roles")
        .delete()
        .eq("id", deleteRoleId);

      if (roleError) throw roleError;

      // Update local state
      setRoles(roles.filter(role => role.id !== deleteRoleId));
      
      // Reset delete role state
      setDeleteRoleId(null);
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("Failed to delete role");
    }
  };

  const handlePermissionToggle = (permission: Permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  if (loading || permissionsLoading) return <div>Loading...</div>;

  return (
    <div>
      <DashboardHeader />
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>
              {canManageAllRoles 
                ? "Create and manage roles with full permissions" 
                : "Create and manage roles with club-level permissions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Create New Role</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input 
                    placeholder="Role Name" 
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                  
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, { label, permissions }]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="font-semibold">{label}</h3>
                      {permissions.map((perm) => (
                        // Only show permissions user is allowed to assign
                        availablePermissions.includes(perm) && (
                          <div key={perm} className="flex items-center space-x-2">
                            <Checkbox
                              id={perm}
                              checked={selectedPermissions.includes(perm)}
                              onCheckedChange={() => handlePermissionToggle(perm)}
                            />
                            <label htmlFor={perm}>{perm}</label>
                          </div>
                        )
                      ))}
                    </div>
                  ))}
                  
                  <Button 
                    onClick={handleCreateRole}
                    disabled={!newRoleName || selectedPermissions.length === 0}
                  >
                    Create Role
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Existing Roles List */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Existing Roles</h2>
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-gray-50 text-left">Role Name</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Permissions</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td className="py-2 px-4 border-b">{role.name}</td>
                      <td className="py-2 px-4 border-b">
                        {role.permissions.join(", ")}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="icon"
                              onClick={() => setDeleteRoleId(role.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the role. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteRole}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
