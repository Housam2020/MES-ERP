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

  // Simple helper functions for permission checks
  const isAdmin = () => permissions.includes("manage_all_users");
  const canManageClubUsers = () => permissions.includes("manage_club_users");
  const isUserInGroup = (groupId) => currentUserGroups.some(g => g.id === groupId);
  const hasProtectedPermissions = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.hasProtectedPermissions || false;
  };

  // Auto-select the first/only available group on component mount
  useEffect(() => {
    const availableGroups = groups.filter(group => isAdmin() || isUserInGroup(group.id));
    
    // If there's only one group available and no group is currently selected, select it automatically
    if (availableGroups.length === 1 && !selectedGroup) {
      setSelectedGroup(availableGroups[0].id);
    }
  }, [groups, selectedGroup, isAdmin, isUserInGroup]);

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

  // Check if current user can manage this specific user role
  const canManageUserRole = (userRole) => {
    // Admin can manage any role
    if (isAdmin()) return true;
    
    // Can't manage global roles unless admin
    if (userRole.is_global) return false;
    
    // Need club management permission
    if (!canManageClubUsers()) return false;
    
    // Can only manage roles in groups you're authorized for
    return isUserInGroup(userRole.group_id);
  };

  // Get available roles for the selected group/global context
  const getAvailableRoles = () => {
    // Admin check for global roles
    if (!selectedGroup && !isAdmin()) {
      return []; // Only admins can assign global roles
    }
    
    // Group permission check
    if (selectedGroup && !isAdmin() && !isUserInGroup(selectedGroup)) {
      return []; // Can't assign roles in groups you don't manage
    }
    
    // Filter by global/group
    let filteredRoles;
    if (!selectedGroup) {
      // Global roles
      filteredRoles = roles.filter(role => role.isGlobal);
    } else {
      // Group roles - might need to check both the groups array and isGlobal flag
      filteredRoles = roles.filter(role => 
        role.groups.includes(selectedGroup) || 
        (role.groups.length === 0 && !role.isGlobal)
      );
    }
    
    // Filter out protected roles for non-admins
    if (!isAdmin()) {
      filteredRoles = filteredRoles.filter(role => !role.hasProtectedPermissions);
    }
    
    return filteredRoles;
  };

  const addUserRole = async () => {
    if (!selectedRole) {
      alert("Please select a role");
      return;
    }

    // Security checks
    if (hasProtectedPermissions(selectedRole) && !isAdmin()) {
      alert("You don't have permission to assign roles with admin privileges");
      return;
    }

    if (selectedGroup && !isAdmin() && !isUserInGroup(selectedGroup)) {
      alert("You don't have permission to manage users in this group");
      return;
    }

    if (!selectedGroup && !isAdmin()) {
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
      
      // Security checks
      if (roleToRemove.is_global && !isAdmin()) {
        alert("You don't have permission to remove global roles");
        return;
      }
      
      if (roleToRemove.group_id && !isAdmin() && !isUserInGroup(roleToRemove.group_id)) {
        alert("You don't have permission to manage users in this group");
        return;
      }
      
      if (hasProtectedPermissions(roleToRemove.role_id) && !isAdmin()) {
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

                {canManageUserRole(userRole) && !isCurrentUser && (
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
              {isAdmin() && <option value="">No group (Global)</option>}
              {groups
                .filter(group => isAdmin() || isUserInGroup(group.id))
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
