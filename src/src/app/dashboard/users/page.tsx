"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PROTECTED_PERMISSIONS } from "@/config/permissions";
import UserRow from "@/components/users/UserRow";

// Import the Footer
import Footer from "@/components/dashboard/Footer";

export default function UsersPage() {
  const supabase = createClient();
  const router = useRouter();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserGroups, setCurrentUserGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Helper function to check if user is admin
  const isAdmin = () => permissions.includes("manage_all_users");

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Check if user has required permissions
        const canManageUsers =
          permissions.includes("manage_all_users") ||
          permissions.includes("manage_club_users");

        if (!canManageUsers) {
          router.push("/dashboard/home");
          return;
        }

        // Get current user's data
        const { data: userData } = await supabase
          .from("users")
          .select("id, email")
          .eq("id", user.id)
          .single();

        setCurrentUser(userData);

        // Get current user's manageable groups - only those where they have manage_club_users permission
        const { data: userRolesWithPermissions } = await supabase
          .from("user_roles")
          .select(`
            id,
            group_id,
            groups (
              id,
              name
            ),
            roles (
              id,
              name,
              role_permissions (
                permissions (name)
              )
            )
          `)
          .eq("user_id", user.id)
          .not("group_id", "is", null);

        // Filter to only include groups where user has manage_club_users permission
        const manageableGroups = [];

        if (userRolesWithPermissions) {
          userRolesWithPermissions.forEach((userRole) => {
            if (!userRole.groups) return;

            // Extract permissions for this role
            const permissions = userRole.roles?.role_permissions
              ?.map((rp) => rp.permissions?.name)
              .filter(Boolean) || [];

            // If user has manage_club_users permission for this group, add it
            if (permissions.includes("manage_club_users")) {
              manageableGroups.push(userRole.groups);
            }
          });
        }

        // Create unique list of groups
        const uniqueGroups = [
          ...new Map(manageableGroups.map((group) => [group.id, group])).values(),
        ];

        setCurrentUserGroups(uniqueGroups);

        // Fetch all roles with their permissions
        const { data: rolesData } = await supabase
          .from("roles")
          .select(`
            id,
            name,
            role_permissions (
              permissions (name)
            )
          `);

        // Fetch group roles mapping
        const { data: groupRolesData } = await supabase
          .from("group_roles")
          .select(`
            id,
            role_id,
            group_id,
            is_global
          `);

        // Create structured available roles data
        const formattedRoles = rolesData.map((role) => {
          // Extract permissions
          const rolePermissions =
            role.role_permissions?.map((rp) => rp.permissions?.name).filter(Boolean) || [];

          // Check if this role has any protected permissions
          const hasProtectedPermissions = rolePermissions.some(
            (permission) => PROTECTED_PERMISSIONS.includes(permission)
          );

          // Find all group role entries for this role
          const roleEntries = groupRolesData.filter((gr) => gr.role_id === role.id);

          if (roleEntries.length === 0) {
            // Default to global if no entries found
            return {
              ...role,
              isGlobal: true,
              groups: [],
              permissions: rolePermissions,
              hasProtectedPermissions,
            };
          }

          // Check if any entries are marked as global
          const isGlobal = roleEntries.some((re) => re.is_global);

          // Get groups this role is associated with
          const groupIds = roleEntries
            .filter((re) => !re.is_global && re.group_id)
            .map((re) => re.group_id);

          return {
            ...role,
            isGlobal,
            groups: groupIds,
            permissions: rolePermissions,
            hasProtectedPermissions,
          };
        });

        setAvailableRoles(formattedRoles);

        // Fetch groups
        const { data: groupsData } = await supabase.from("groups").select("*");
        setGroups(groupsData || []);

        // Fetch users based on permissions
        if (isAdmin()) {
          // Admins can see all users
          const { data: allUsers } = await supabase.from("users").select("id, email");

          setUsers(allUsers || []);
        } else {
          // Club managers can only see users in their groups
          const manageableGroupIds = uniqueGroups.map((g) => g.id);

          if (manageableGroupIds.length === 0) {
            setUsers([]);
            setLoading(false);
            return;
          }

          // Get all users who are members of groups the current user can manage
          const { data: userGroupRelations } = await supabase
            .from("user_roles")
            .select("user_id, group_id")
            .in("group_id", manageableGroupIds);

          if (!userGroupRelations || userGroupRelations.length === 0) {
            setUsers([]);
            setLoading(false);
            return;
          }

          // Get unique user IDs
          const uniqueUserIds = [
            ...new Set(userGroupRelations.map((ugr) => ugr.user_id)),
          ];

          // Always include current user
          if (!uniqueUserIds.includes(user.id)) {
            uniqueUserIds.push(user.id);
          }

          // Fetch user details
          const { data: filteredUsers } = await supabase
            .from("users")
            .select("id, email")
            .in("id", uniqueUserIds);

          setUsers(filteredUsers || []);
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading) {
      fetchData();
    }
  }, [permissions, permissionsLoading]);

  if (loading || permissionsLoading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-grow">
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 bg-gray-50 text-left">Email</th>
                      <th className="py-2 px-4 bg-gray-50 text-left">Assigned Roles</th>
                      <th className="py-2 px-4 bg-gray-50 text-left">Add Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        groups={groups}
                        roles={availableRoles}
                        currentUserGroups={currentUserGroups}
                        permissions={permissions}
                        isCurrentUser={user.id === currentUser?.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
