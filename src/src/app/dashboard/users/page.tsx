"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PROTECTED_PERMISSIONS } from "@/config/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import UserRow from "@/components/users/UserRow";

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
          .select('id, email')
          .eq('id', user.id)
          .single();
        
        setCurrentUser(userData);

        // Get current user's groups
        const { data: userGroupsData } = await supabase
          .from('user_roles')
          .select(`
            group_id,
            groups (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .not('group_id', 'is', null);
        
        // Extract unique groups
        const currentGroups = userGroupsData
          ? [...new Map(userGroupsData.map(item => 
              [item.group_id, item.groups]
            )).values()]
          : [];
        
        setCurrentUserGroups(currentGroups);

        // Fetch all roles
        const { data: rolesData } = await supabase
          .from("roles")
          .select(`
            id,
            name
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
        const formattedRoles = rolesData.map(role => {
          // Find all group role entries for this role
          const roleEntries = groupRolesData.filter(gr => gr.role_id === role.id);
          
          if (roleEntries.length === 0) {
            // Default to global if no entries found
            return {
              ...role,
              isGlobal: true,
              groups: []
            };
          }
          
          // Check if any entries are marked as global
          const isGlobal = roleEntries.some(re => re.is_global);
          
          // Get groups this role is associated with
          const groupIds = roleEntries
            .filter(re => !re.is_global && re.group_id)
            .map(re => re.group_id);
            
          return {
            ...role,
            isGlobal,
            groups: groupIds
          };
        });
        
        setAvailableRoles(formattedRoles);

        // Fetch groups
        const { data: groupsData } = await supabase
          .from("groups")
          .select("*");
        setGroups(groupsData || []);

        // Fetch basic user info
        let usersQuery = supabase
          .from("users")
          .select('id, email');

        const { data: usersData, error: usersError } = await usersQuery;
        
        if (usersError) {
          console.error("Error fetching users:", usersError.message);
          return;
        }

        // Filter users based on permission
        let filteredUsers = usersData;
        
        if (!permissions.includes('manage_all_users') && currentGroups.length > 0) {
          // Club managers can only see users in their groups
          // We'll do the actual filtering after getting user-role data
          
          // Get all user-group relationships
          const { data: userGroupRelations } = await supabase
            .from("user_roles")
            .select("user_id, group_id")
            .not("group_id", "is", null);
            
          // Get group IDs that current user can manage
          const manageableGroupIds = currentGroups.map(g => g.id);
          
          // Filter users who are in the current user's groups
          const usersInMyGroups = userGroupRelations
            .filter(ugr => manageableGroupIds.includes(ugr.group_id))
            .map(ugr => ugr.user_id);
            
          // Get unique user IDs
          const uniqueUserIds = [...new Set(usersInMyGroups)];
          
          // Filter users
          filteredUsers = usersData.filter(u => 
            uniqueUserIds.includes(u.id) || u.id === user.id
          );
        }
        
        setUsers(filteredUsers);
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

  // Filter available groups based on permissions
  const availableGroups = groups.filter(group => {
    if (permissions.includes('manage_all_users')) {
      return true; // MES admins can assign any group
    }
    // Club leaders can only assign to their own groups
    return currentUserGroups.some(ug => ug.id === group.id);
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
                    <th className="py-2 px-4 bg-gray-50 text-left">Assigned Roles</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Add Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow 
                      key={user.id}
                      user={user}
                      groups={availableGroups}
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
    </div>
  );
}
