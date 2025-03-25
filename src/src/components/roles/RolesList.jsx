"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, Info, Edit } from 'lucide-react';
import { Badge } from "@/components/ui/badge"; 
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import EditRoleDialog from "@/components/roles/EditRoleDialog";

export default function RolesList({ 
  roles, 
  groups,
  currentUserGroups, 
  canManageAllRoles,
  availablePermissions,
  permissionCategories,
  onRoleDeleted,
  onRoleUpdated
}) {
  const supabase = createClient();
  const [deleteRoleId, setDeleteRoleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Group name lookup map for efficiency
  const groupNameMap = groups.reduce((acc, group) => {
    acc[group.id] = group.name;
    return acc;
  }, {});
  
  // Check if user can manage this role
  const canManageRole = (role) => {
    if (canManageAllRoles) return true;
    
    // Club managers can't manage global roles
    if (role.isGlobal) return false;
    
    // For non-admins, they can only manage roles in their manageable groups
    // Since roles can only belong to one group now, we can simplify this check
    return role.groups.length === 1 && 
           currentUserGroups.some(ug => ug.id === role.groups[0]);
  };
  
  const handleDeleteRole = async () => {
    if (!deleteRoleId) return;
    
    try {
      setLoading(true);
      
      // First check if any users have this role assigned
      const { count: userRoleCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact" })
        .eq("role_id", deleteRoleId);
      
      if (userRoleCount > 0) {
        alert(`Cannot delete role. ${userRoleCount} user(s) are currently assigned to this role.`);
        return;
      }
      
      // Delete from group_roles first
      const { error: groupRolesError } = await supabase
        .from("group_roles")
        .delete()
        .eq("role_id", deleteRoleId);
      
      if (groupRolesError) throw groupRolesError;
      
      // Delete from role_permissions
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
      
      // Update parent component
      onRoleDeleted(deleteRoleId);
      setDeleteRoleId(null);
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("Failed to delete role: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="py-2 px-4 bg-gray-50 text-left">Role Name</th>
            <th className="py-2 px-4 bg-gray-50 text-left">Scope</th>
            <th className="py-2 px-4 bg-gray-50 text-left">Groups</th>
            <th className="py-2 px-4 bg-gray-50 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id}>
              <td className="py-2 px-4 border-b">{role.name}</td>
              <td className="py-2 px-4 border-b">
                {role.isGlobal ? (
                  <Badge>Global</Badge>
                ) : (
                  <Badge variant="outline">Group Specific</Badge>
                )}
              </td>
              <td className="py-2 px-4 border-b">
                {role.groups.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {role.groups.map(groupId => (
                      <Badge key={groupId} variant="secondary" className="text-xs">
                        {groupNameMap[groupId] || "Unknown"}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  role.isGlobal ? "All groups" : "No groups assigned"
                )}
              </td>
              <td className="py-2 px-4 border-b">
                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedRole(role)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{role.name} Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <h3 className="font-medium mb-2">Permissions:</h3>
                          <div className="pl-4 space-y-1">
                            {role.permissions.map(perm => (
                              <div key={perm} className="text-sm">
                                • {perm}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {canManageRole(role) && (
                    <>
                      <EditRoleDialog
                        role={role}
                        availablePermissions={availablePermissions}
                        permissionCategories={permissionCategories}
                        groups={groups}
                        currentUserGroups={currentUserGroups}
                        canManageAllRoles={canManageAllRoles}
                        onRoleUpdated={onRoleUpdated}
                      />
                      
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
                            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteRole}
                              disabled={loading}
                            >
                              {loading ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {roles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No roles found. Create a new role to get started.
        </div>
      )}
    </>
  );
}
