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
    if (!selectedGroup) {
      return roles.filter(
        (role) => role.isGlobal && !role.groups.length
      );
    } else {
      return roles.filter((role) =>
        role.groups.includes(selectedGroup)
      );
    }
  };

  const canManageRole = (userRole) => {
    if (permissions.includes("manage_all_users")) return true;

    if (permissions.includes("manage_club_users")) {
      if (!userRole.group_id) return false;
      return currentUserGroups.some((g) => g.id === userRole.group_id);
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
              <option value="">No group (Global)</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
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
