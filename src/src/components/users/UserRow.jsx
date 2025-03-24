"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { PROTECTED_PERMISSIONS } from "@/config/permissions";
import { Trash2, Plus } from "lucide-react";

export default function UserRow({
  user,
  groups,
  roles,
  currentUserGroups,
  permissions,
  isCurrentUser,
}) {
  const supabase = createClient();
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  useEffect(() => {
    async function fetchUserRoles() {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select(
            `
              id,
              role_id,
              group_id,
              is_global,
              roles (id, name),
              groups (id, name)
            `
          )
          .eq("user_id", user.id);

        if (error) throw error;
        setUserRoles(data || []);
      } catch (error) {
        console.error("Error fetching user roles:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRoles();
  }, [user.id]);

  const addUserRole = async () => {
    if (!selectedRole) {
      alert("Please select a role");
      return;
    }

    // Security check: Prevent assigning roles with protected permissions
    // if the current user doesn't have manage_all_users permission
    const roleToAdd = roles.find(r => r.id === selectedRole);
    if (roleToAdd?.hasProtectedPermissions && !permissions.includes("manage_all_users")) {
      alert("You don't have permission to assign roles with admin privileges");
      return;
    }

    // Security check: Verify the user can manage the selected group
    if (selectedGroup && !permissions.includes("manage_all_users")) {
      const canManageSelectedGroup = currentUserGroups.some(g => g.id === selectedGroup);
      if (!canManageSelectedGroup) {
        alert("You don't have permission to manage users in this group");
        return;
      }
    }

    // Security check: Prevent assigning global roles without admin permissions
    if (!selectedGroup && !permissions.includes("manage_all_users")) {
      alert("You don't have permission to assign global roles");
      return;
    }

    const newUserRole = {
      user_id: user.id,
      role_id: selectedRole,
    };

    if (selectedGroup) {
      newUserRole.group_id = selectedGroup;
      newUserRole.is_global = false;
    } else {
      newUserRole.is_global = true;
    }

    const existingRole = userRoles.find(
      (ur) =>
        ur.role_id === selectedRole &&
        ((newUserRole.is_global && ur.is_global) ||
          ur.group_id === newUserRole.group_id)
    );

    if (existingRole) {
      alert("This role assignment already exists");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("user_roles")
        .insert(newUserRole)
        .select(`
          id,
          role_id,
          group_id,
          is_global,
          roles (id, name),
          groups (id, name)
        `);

      if (error) throw error;

      setUserRoles([...userRoles, data[0]]);
      setSelectedRole("");
      setSelectedGroup("");
    } catch (error) {
      console.error("Error adding role:", error);
      alert("Failed to add role: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeUserRole = async (roleId) => {
    try {
      // Get the role we're trying to remove
      const roleToRemove = userRoles.find(r => r.id === roleId);
      
      if (!roleToRemove) {
        alert("Role not found");
        return;
      }
      
      // Security check: Verify the user can manage this role
      // For global roles, only admin users can remove them
      if (roleToRemove.is_global && !permissions.includes("manage_all_users")) {
        alert("You don't have permission to remove global roles");
        return;
      }
      
      // For group-specific roles, verify the user can manage this group
      if (roleToRemove.group_id && !permissions.includes("manage_all_users")) {
        const canManageGroup = currentUserGroups.some(g => g.id === roleToRemove.group_id);
        if (!canManageGroup) {
          alert("You don't have permission to manage users in this group");
          return;
        }
      }
      
      // Check if this role has protected permissions
      const roleDetails = roles.find(r => r.id === roleToRemove.role_id);
      if (roleDetails?.hasProtectedPermissions && !permissions.includes("manage_all_users")) {
        alert("You don't have permission to remove roles with admin privileges");
        return;
      }
      
      setLoading(true);

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      setUserRoles(userRoles.filter((ur) => ur.id !== roleId));
    } catch (error) {
      console.error("Error removing role:", error);
      alert("Failed to remove role: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableRoles = () => {
    // First, check if the user can manage the selected group
    if (selectedGroup && !permissions.includes("manage_all_users")) {
      const canManageSelectedGroup = currentUserGroups.some(g => g.id === selectedGroup);
      if (!canManageSelectedGroup) {
        return []; // Don't show any roles if user can't manage this group
      }
    }

    // Then filter roles based on group selection
    let filteredRoles;
    if (!selectedGroup) {
      // For global roles, only users with manage_all_users should have access
      if (!permissions.includes("manage_all_users")) {
        return []; // Don't allow assigning global roles without admin permissions
      }
      filteredRoles = roles.filter(
        (role) => role.isGlobal && !role.groups.length
      );
    } else {
      filteredRoles = roles.filter((role) =>
        role.groups.includes(selectedGroup)
      );
    }
    
    // Additional security filter: if user doesn't have manage_all_users permission,
    // remove roles that have protected permissions
    if (!permissions.includes("manage_all_users")) {
      filteredRoles = filteredRoles.filter(role => !role.hasProtectedPermissions);
    }
    
    return filteredRoles;
  };

  const canManageRole = (userRole) => {
    // Check if the role has protected permissions - if so, only users with manage_all_users can manage it
    const roleData = roles.find(r => r.id === userRole.role_id);
    if (roleData?.hasProtectedPermissions && !permissions.includes("manage_all_users")) {
      return false;
    }
    
    // Admin users can manage all roles
    if (permissions.includes("manage_all_users")) return true;
  
    // For club-specific management
    if (permissions.includes("manage_club_users")) {
      // Can't manage global roles
      if (!userRole.group_id) return false;
      
      // Assuming user roles are structured so we can determine which groups they can manage
      const groupsUserCanManage = currentUserGroups.filter(group => {
        // In a proper implementation, this would check if manage_club_users applies to this group
        // This is a simplified version that would need to be adjusted based on your data structure
        return group.userHasManagementPermission === true; 
      });
      
      return groupsUserCanManage.some(g => g.id === userRole.group_id);
    }
  
    return false;
  };

  if (loading) {
    return (
      <tr>
        <td colSpan="3" className="py-4 text-center">
          Loading...
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="py-2 px-4 border-b">{user.email}</td>

      <td className="py-2 px-4 border-b">
        <div className="space-y-2">
          {userRoles.length === 0 ? (
            <div className="text-sm text-gray-500">No roles assigned</div>
          ) : (
            userRoles.map((userRole) => (
              <div
                key={userRole.id}
                className="flex items-center justify-between bg-gray-50 p-2 rounded"
              >
                <div>
                  <span className="font-medium">
                    {userRole.roles?.name}
                  </span>
                  {userRole.group_id && (
                    <span className="text-sm text-gray-600">
                      {" "}
                      in {userRole.groups?.name}
                    </span>
                  )}
                  {userRole.is_global && !userRole.group_id && (
                    <span className="text-sm text-gray-600">
                      {" "}
                      (Global)
                    </span>
                  )}
                </div>

                {canManageRole(userRole) && !isCurrentUser && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-500"
                    onClick={() => removeUserRole(userRole.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </td>

      <td className="py-2 px-4 border-b">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <select
              className="border rounded p-1 text-sm w-1/3"
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedRole("");
              }}
            >
              {permissions.includes("manage_all_users") && (
                <option value="">No group (Global)</option>
              )}
              {groups
                .filter(group => 
                  permissions.includes("manage_all_users") || 
                  currentUserGroups.some(ug => ug.id === group.id)
                )
                .map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))
              }
            </select>

            <select
              className="border rounded p-1 text-sm w-1/3"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={getAvailableRoles().length === 0}
            >
              <option value="">Select role</option>
              {getAvailableRoles().map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              className="flex items-center"
              onClick={addUserRole}
              disabled={isCurrentUser || loading || !selectedRole}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}
