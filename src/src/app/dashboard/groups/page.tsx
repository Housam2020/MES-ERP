"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function GroupsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [deleteGroupId, setDeleteGroupId] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        // Check if user has permission to manage groups
        if (!permissions.includes('manage_groups')) {
          router.push("/dashboard/home");
          return;
        }

        // Fetch all groups
        const { data: groupsData } = await supabase
          .from("groups")
          .select("*");

        // Get user counts for each group (counting distinct users)
        const userCounts = {};
        
        // For each group, get the distinct count of users
        for (const group of groupsData) {
          const { count } = await supabase
            .from("user_roles")
            .select("user_id", { count: "exact", head: true })
            .eq("group_id", group.id)
            .not("user_id", "is", null);
            
          userCounts[group.id] = count || 0;
        }
        
        // Format group data with user counts
        const formattedGroups = groupsData.map(group => ({
          ...group,
          userCount: userCounts[group.id] || 0
        }));

        setGroups(formattedGroups || []);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading) {
      fetchData();
    }
  }, [permissions, permissionsLoading]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert("Group name cannot be empty");
      return;
    }

    try {
      // Check if group name already exists
      const { data: existingGroup } = await supabase
        .from("groups")
        .select("id")
        .eq("name", newGroupName)
        .single();

      if (existingGroup) {
        alert("A group with this name already exists");
        return;
      }

      const { data: newGroup, error } = await supabase
        .from("groups")
        .insert({ name: newGroupName })
        .select()
        .single();

      if (error) throw error;

      setGroups([...groups, {...newGroup, userCount: 0}]);
      setNewGroupName("");
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupId) return;

    try {
      // Get the current group to check its user count
      const groupToDelete = groups.find(g => g.id === deleteGroupId);
      
      if (groupToDelete.userCount > 0) {
        alert(`Cannot delete group. ${groupToDelete.userCount} user(s) are currently assigned to this group.`);
        return;
      }

      // Also check if any roles are associated with this group
      const { count: roleCount } = await supabase
        .from("group_roles")
        .select("*", { count: "exact" })
        .eq("group_id", deleteGroupId);

      if (roleCount && roleCount > 0) {
        alert(`Cannot delete group. ${roleCount} role(s) are currently associated with this group.`);
        return;
      }

      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", deleteGroupId);

      if (error) throw error;

      setGroups(groups.filter(group => group.id !== deleteGroupId));
      setDeleteGroupId(null);
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group: " + error.message);
    }
  };

  if (loading || permissionsLoading) return <div>Loading...</div>;

  return (
    <div>
      <DashboardHeader />
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Group Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Create New Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Group Name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                  <Button
                    onClick={handleCreateGroup}
                    disabled={!newGroupName}
                  >
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="mt-6">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-gray-50 text-left">Group Name</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Members</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id}>
                      <td className="py-2 px-4 border-b">{group.name}</td>
                      <td className="py-2 px-4 border-b">{group.userCount}</td>
                      <td className="py-2 px-4 border-b">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setDeleteGroupId(group.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the group. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteGroup}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
