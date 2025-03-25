"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditRoleDialog({ 
  role,
  availablePermissions, 
  permissionCategories, 
  groups,
  currentUserGroups,
  canManageAllRoles,
  onRoleUpdated
}) {
  const supabase = createClient();
  const [roleName, setRoleName] = useState(role.name);
  const [selectedPermissions, setSelectedPermissions] = useState(role.permissions || []);
  const [isGlobal, setIsGlobal] = useState(role.isGlobal);
  const [selectedGroup, setSelectedGroup] = useState(role.groups?.length > 0 ? role.groups[0] : "");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  
  // Filter groups based on user's permissions
  const availableGroups = canManageAllRoles 
    ? groups 
    : groups.filter(group => currentUserGroups.some(ug => ug.id === group.id));

  // Reset form when role changes
  useEffect(() => {
    setRoleName(role.name);
    setSelectedPermissions(role.permissions || []);
    setIsGlobal(role.isGlobal);
    setSelectedGroup(role.groups?.length > 0 ? role.groups[0] : "");
  }, [role]);

  const handlePermissionToggle = (permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };
  
  const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId);
  };

  const handleUpdateRole = async () => {
    if (!roleName.trim()) {
      alert("Role name cannot be empty");
      return;
    }
    
    if (selectedPermissions.length === 0) {
      alert("Please select at least one permission");
      return;
    }
    
    if (!isGlobal && !selectedGroup) {
      alert("Please select a group or make the role global");
      return;
    }

    if (!canManageAllRoles) {
      isGlobal = false;
    }

    try {
      setLoading(true);

      // Check if new role name already exists (only if name changed)
      if (roleName !== role.name) {
        const { data: existingRole } = await supabase
          .from("roles")
          .select("id")
          .eq("name", roleName)
          .single();

        if (existingRole) {
          alert("A role with this name already exists");
          return;
        }
      }

      // 1. Update the role name
      const { error: roleUpdateError } = await supabase
        .from("roles")
        .update({ name: roleName })
        .eq("id", role.id);

      if (roleUpdateError) throw roleUpdateError;

      // 2. Delete existing permissions
      const { error: deletePermissionsError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", role.id);

      if (deletePermissionsError) throw deletePermissionsError;

      // 3. Insert new permissions
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
            role_id: role.id,
            permission_id: permissionData.id
          });
      });

      await Promise.all(permissionInserts);
      
      // 4. Delete existing group_roles
      const { error: deleteGroupRolesError } = await supabase
        .from("group_roles")
        .delete()
        .eq("role_id", role.id);

      if (deleteGroupRolesError) throw deleteGroupRolesError;
      
      // 5. Create the new group_roles entry
      if (isGlobal) {
        // Add a global role entry
        await supabase
          .from("group_roles")
          .insert({
            role_id: role.id,
            is_global: true
          });
      } else if (selectedGroup) {
        // Add group-specific role entry
        await supabase
          .from("group_roles")
          .insert({
            role_id: role.id,
            group_id: selectedGroup,
            is_global: false
          });
      }

      // 6. Prepare the updated role object for state update
      const updatedRole = { 
        ...role,
        name: roleName, 
        permissions: selectedPermissions,
        isGlobal: isGlobal,
        groups: isGlobal ? [] : [selectedGroup]
      };

      // 7. Update parent component state
      onRoleUpdated(updatedRole);
      
      // 8. Close dialog
      setOpen(false);
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Role: {role.name}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="groups">Group Assignment</TabsTrigger>
          </TabsList>
          
          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="role-name" className="text-sm font-medium">Role Name</label>
              <Input 
                id="role-name"
                placeholder="Enter role name" 
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            
            {/* Only show global option for admins */}
            {canManageAllRoles && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is-global" 
                  checked={isGlobal}
                  onCheckedChange={() => setIsGlobal(!isGlobal)}
                />
                <label htmlFor="is-global" className="text-sm font-medium">
                  Global Role (can be assigned independently of group)
                </label>
              </div>
            )}
            
            <DialogFooter className="mt-4">
              <Button onClick={() => setActiveTab("permissions")}>
                Next: Edit Permissions
              </Button>
            </DialogFooter>
          </TabsContent>
          
          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4 py-4">
            <div className="max-h-[300px] overflow-y-auto space-y-4">
              {Object.entries(permissionCategories).map(([category, { label, permissions }]) => (
                <div key={category} className="space-y-2">
                  <h3 className="font-semibold">{label}</h3>
                  <div className="pl-4 space-y-2">
                    {permissions.map((perm) => (
                      // Only show permissions user is allowed to assign
                      availablePermissions.includes(perm) && (
                        <div key={perm} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${perm}`}
                            checked={selectedPermissions.includes(perm)}
                            onCheckedChange={() => handlePermissionToggle(perm)}
                          />
                          <label htmlFor={`perm-${perm}`} className="text-sm">{perm}</label>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={() => setActiveTab("basic")}>
                Back
              </Button>
              <Button onClick={() => setActiveTab("groups")}>
                Next: Edit Groups
              </Button>
            </DialogFooter>
          </TabsContent>
          
          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4 py-4">
            {isGlobal ? (
              <div className="text-center p-4 bg-gray-50 rounded">
                <p>This is a global role and can be assigned to users independent of group membership.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm mb-2">
                  Select the group this role will be available in:
                </div>
                <Select
                  value={selectedGroup}
                  onValueChange={handleGroupSelect}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={() => setActiveTab("permissions")}>
                Back
              </Button>
              <Button 
                onClick={handleUpdateRole}
                disabled={loading || !roleName || selectedPermissions.length === 0 || (!isGlobal && !selectedGroup)}
              >
                {loading ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
