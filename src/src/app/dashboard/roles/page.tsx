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
import { 
  PROTECTED_PERMISSIONS, 
  ProtectedPermission, 
  ClubPermission, 
  UserPermission,
  Permission
} from "@/config/permissions";
import RolesList from "@/components/roles/RolesList";
import CreateRoleDialog from "@/components/roles/CreateRoleDialog";

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
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserGroups, setCurrentUserGroups] = useState([]);

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

        // Get user's role assignments with permissions
        const { data: userRoleAssignments } = await supabase
          .from('user_roles')
          .select(`
            role_id,
            group_id,
            roles (
              id,
              name,
              role_permissions (
                permissions (
                  name
                )
              )
            )
          `)
          .eq('user_id', user.id);

        console.log("User role assignments:", userRoleAssignments);

        // Determine which groups the user has manage_club_roles permission in
        const managableGroupIds = [];
        userRoleAssignments?.forEach(assignment => {
          // Extract permissions from this role
          const rolePermissions = assignment.roles?.role_permissions || [];
          const permissions = rolePermissions.map(rp => rp.permissions?.name).filter(Boolean);
          
          // If this role has manage_club_roles permission and is assigned to a group
          if (permissions.includes('manage_club_roles') && assignment.group_id) {
            managableGroupIds.push(assignment.group_id);
          }
        });

        console.log("Groups where user can manage roles:", managableGroupIds);

        // Get details of the groups the user can manage
        const { data: managableGroups } = await supabase
          .from('groups')
          .select('id, name')
          .in('id', managableGroupIds);

        setCurrentUserGroups(managableGroups || []);

        // Fetch all groups for dropdown selection
        const { data: allGroupsData } = await supabase
          .from("groups")
          .select("id, name");
        
        setGroups(allGroupsData || []);

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

        // Fetch role-group associations
        const { data: groupRolesData } = await supabase
          .from("group_roles")
          .select("role_id, group_id, is_global");
        
        // Add group info to roles
        const rolesWithGroupInfo = transformedRoles.map(role => {
          const roleGroupData = groupRolesData?.filter(gr => gr.role_id === role.id) || [];
          
          return {
            ...role,
            isGlobal: roleGroupData.some(gr => gr.is_global),
            groups: roleGroupData
              .filter(gr => !gr.is_global)
              .map(gr => gr.group_id)
          };
        });
        
        // Filter roles based on user's permissions
        const visibleRoles = canManageAllRoles
          ? rolesWithGroupInfo  // Admin can see all roles
          : rolesWithGroupInfo.filter(role => 
              // For club managers, only show roles in groups they can manage
              role.groups.some(groupId => 
                managableGroups.some(group => group.id === groupId)
              )
            );
        
        setRoles(visibleRoles);
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

  // Handle role creation
  const handleRoleCreate = (newRole) => {
    setRoles([...roles, newRole]);
  };

  // Handle role deletion
  const handleRoleDelete = (roleId) => {
    setRoles(roles.filter(role => role.id !== roleId));
  };

  // Handle role update
  const handleRoleUpdate = (updatedRole) => {
    setRoles(roles.map(role => 
      role.id === updatedRole.id ? updatedRole : role
    ));
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
            <CreateRoleDialog 
              availablePermissions={availablePermissions}
              permissionCategories={PERMISSION_CATEGORIES}
              groups={groups}
              currentUserGroups={currentUserGroups}
              canManageAllRoles={canManageAllRoles}
              onRoleCreated={handleRoleCreate}
            />

            {/* Existing Roles List */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Existing Roles</h2>
              <RolesList 
                roles={roles}
                groups={groups}
                currentUserGroups={currentUserGroups}
                canManageAllRoles={canManageAllRoles}
                availablePermissions={availablePermissions}
                permissionCategories={PERMISSION_CATEGORIES}
                onRoleDeleted={handleRoleDelete}
                onRoleUpdated={handleRoleUpdate}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
