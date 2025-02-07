"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PROTECTED_PERMISSIONS } from "@/config/permissions";
import { usePermissions } from "@/hooks/usePermissions";

export default function UsersPage() {
  const supabase = createClient();
  const router = useRouter();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserGroup, setCurrentUserGroup] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

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
        const canManageUsers = permissions.includes('manage_all_users') || 
                             permissions.includes('manage_club_users');

        if (!canManageUsers) {
          router.push("/dashboard/home");
          return;
        }

        // Get current user's data
        const { data: userData } = await supabase
          .from('users')
          .select(`
            id,
            group_id,
            groups:groups!users_group_id_fkey (
              id,
              name
            )
          `)
          .eq('id', user.id)
          .single();
        
        setCurrentUser(userData);
        setCurrentUserGroup(userData?.groups);

        // Fetch roles with their permissions
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
        
        const rolesWithPerms = rolesData?.map(role => ({
          ...role,
          permissions: role.role_permissions?.map(rp => rp.permissions.name) || []
        })) || [];

        setRoles(rolesWithPerms);

        // Fetch groups
        const { data: groupsData } = await supabase
          .from("groups")
          .select("*");
        setGroups(groupsData || []);

        // Base query for users
        let usersQuery = supabase
          .from("users")
          .select(`
            id,
            email,
            role_id,
            group_id,
            roles:roles!users_role_id_fkey (
              id,
              name,
              role_permissions (
                permissions (
                  name
                )
              )
            ),
            groups:groups!users_group_id_fkey (
              id,
              name
            )
          `);

        // If user only has club-level access, show users from their group AND users with no group
        if (!permissions.includes('manage_all_users') && userData?.group_id) {
          usersQuery = usersQuery.or(`group_id.eq.${userData.group_id},group_id.is.null`);
        }

        const { data: usersData, error: usersError } = await usersQuery;
        
        if (usersError) {
          console.error("Error fetching users:", usersError.message);
        } else {
          setUsers(usersData || []);
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

  const updateUserRole = async (userId: string, newRoleId: string) => {
    try {
      const response = await fetch("/api/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRoleId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role_id: newRoleId, roles: roles.find(r => r.id === newRoleId) }
          : user
      ));
    } catch (error) {
      console.error("Error updating role:", error);
      alert(error.message || "Failed to update role");
    }
  };

  const updateUserGroup = async (userId: string, newGroupId: string | null) => {
    try {
      const response = await fetch("/api/update-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newGroupId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update group");
      }

      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              group_id: newGroupId, 
              groups: newGroupId ? groups.find(g => g.id === newGroupId) : null 
            }
          : user
      ));
    } catch (error) {
      console.error("Error updating group:", error);
      alert(error.message || "Failed to update group");
    }
  };

  // Filter available groups based on permissions
  const availableGroups = groups.filter(group => {
    if (permissions.includes('manage_all_users')) {
      return true; // MES admins can assign any group
    }
    // Club leaders can only assign to their own group
    return group.id === currentUserGroup?.id;
  });

  if (loading || permissionsLoading) return <div>Loading...</div>;

  return (
    <div>
      <DashboardHeader />
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
                    <th className="py-2 px-4 bg-gray-50 text-left">Role</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Group</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="py-2 px-4 border-b">{user.email}</td>
                      <td className="py-2 px-4 border-b">
                        <select
                          value={user.role_id || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            updateUserRole(user.id, value);
                          }}
                          className="border rounded p-1"
                          disabled={
                            user.id === currentUser?.id || 
                            user.roles?.role_permissions?.some(rp => 
                              PROTECTED_PERMISSIONS.includes(rp.permissions.name) && 
                              !permissions.includes('manage_all_users')
                            )
                          }
                        >
                          <option value="">Select Role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-4 border-b">
                        <select
                          value={user.group_id || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateUserGroup(user.id, value ? value : null);
                          }}
                          className="border rounded p-1"
                          disabled={
                            !permissions.includes('manage_all_users') && 
                            user.roles?.role_permissions?.some(rp => 
                              PROTECTED_PERMISSIONS.includes(rp.permissions.name)
                            )
                          }
                        >
                          <option value="">No Group</option>
                          {availableGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
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
