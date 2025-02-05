"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/dashboard/AdminHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  email: string;
  group_id: string | null;
}

interface Group {
  id: string;
  name: string;
}

export default function OrganizationPage() {
  const supabase = createClient();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    async function checkAccessAndFetchData() {
      setLoading(true);
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!user || userError) {
          router.push("/login");
          return;
        }

        // Check if user has permission to manage organizations
        const { data: permData, error: permError } = await supabase
          .from('role_permissions')
          .select(`
            permissions (name),
            roles!inner (
              users!inner (id)
            )
          `)
          .eq('roles.users.id', user.id);

        if (permError) throw permError;
        
        const userPerms = permData.map(p => p.permissions.name);
        if (!userPerms.includes('manage_all_roles')) {
          router.push("/dashboard/mes-admin");
          return;
        }

        // Fetch all users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, group_id');

        if (usersError) throw usersError;
        setUsers(usersData);

        // Fetch all groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*');

        if (groupsError) throw groupsError;
        setGroups(groupsData);

      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    checkAccessAndFetchData();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Group name cannot be empty');
      return;
    }

    try {
      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert([{ name: newGroupName }])
        .select()
        .single();

      if (createError) throw createError;

      setGroups([...groups, newGroup]);
      setNewGroupName("");
      setIsCreateDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group');
    }
  };

  const handleUpdateUserGroup = async (userId: string, groupId: string | null) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ group_id: groupId })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, group_id: groupId } : user
      ));
    } catch (error) {
      console.error('Error updating user group:', error);
      setError('Failed to update user group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      setGroups(groups.filter(group => group.id !== groupId));
      // Reset group_id for users in this group
      setUsers(users.map(user => 
        user.group_id === groupId ? { ...user, group_id: null } : user
      ));
    } catch (error) {
      console.error('Error deleting group:', error);
      setError('Failed to delete group');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Create Group Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Groups</CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Create New Group</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                      <DialogDescription>
                        Enter a name for the new group.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Group Name</Label>
                        <Input
                          id="name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter group name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateGroup}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Member Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map(group => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>
                        {users.filter(user => user.group_id === group.id).length}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Manage Users Card */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Group</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <select
                          value={user.group_id || ""}
                          onChange={(e) => handleUpdateUserGroup(user.id, e.target.value || null)}
                          className="p-2 border rounded"
                        >
                          <option value="">No Group</option>
                          {groups.map(group => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
