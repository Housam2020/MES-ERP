"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

export default function CreateRoleDialog({ 
  availablePermissions, 
  permissionCategories, 
  groups,
  currentUserGroups,
  canManageAllRoles,
  onRoleCreated
}) {
  const supabase = createClient();
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isGlobal, setIsGlobal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Filter groups based on user's permissions
  const availableGroups = canManageAllRoles 
    ? groups 
    : groups.filter(group => currentUserGroups.some(ug => ug.id === group.id));
  
  const resetForm = () => {
    setNewRoleName("");
    setSelectedPermissions([]);
    setIsGlobal(false);
    setSelectedGroup("");
    setActiveTab("basic");
  };

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

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
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

      // 1. Create the base role
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .insert({ name: newRoleName })
        .select()
        .single();

      if (roleError) throw roleError;

      // 2. Insert permissions
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
      
      // 3. Create the group_roles entry
      if (isGlobal) {
        // Add a global role entry
        await supabase
          .from("group_roles")
          .insert({
            role_id: roleData.id,
            is_global: true
          });
      } else if (selectedGroup) {
        // Add group-specific role entry
        await supabase
          .from("group_roles")
          .insert({
            role_id: roleData.id,
            group_id: selectedGroup,
            is_global: false
          });
      }

      // 4. Prepare the complete role object for state update
      const newRole = { 
        id: roleData.id, 
        name: newRoleName, 
        permissions: selectedPermissions,
        isGlobal: isGlobal,
        groups: isGlobal ? [] : [selectedGroup]
      };

      // 5. Update parent component state
      onRoleCreated(newRole);
      
      // 6. Reset form and close dialog
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error creating role:", error);
      alert("Failed to create role: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Role</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
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
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
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
                Next: Select Permissions
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
                Next: Select Groups
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
                onClick={handleCreateRole}
                disabled={!newRoleName || selectedPermissions.length === 0 || (!isGlobal && !selectedGroup)}
              >
                Create Role
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
