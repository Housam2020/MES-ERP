"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/dashboard/AdminHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function RolesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch all users for role and group management
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, email, role, group_id");

      if (!usersError) setUsers(usersData);

      // Fetch all groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("id, name");

      if (!groupsError) setGroups(groupsData);
    }

    fetchData();
  }, []);

  // Function to update user roles
  const updateUserRole = async (userId, newRole) => {
    setLoading(true);
    const res = await fetch("/api/update-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newRole }),
    });

    if (!res.ok) {
      alert("Failed to update role");
    } else {
      alert("Role updated successfully!");
      setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
    }
    setLoading(false);
  };

  // Function to update user groups
  const updateUserGroup = async (userId, newGroupId) => {
    setLoading(true);
    const res = await fetch("/api/update-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newGroupId }),
    });

    if (!res.ok) {
      alert("Failed to update group");
    } else {
      alert("Group updated successfully!");
      setUsers(users.map((user) => (user.id === userId ? { ...user, group_id: newGroupId } : user)));
    }
    setLoading(false);
  };

  // Function to create a new group
  const createGroup = async () => {
    if (!newGroupName.trim()) return alert("Group name cannot be empty.");

    const { data, error } = await supabase
      .from("groups")
      .insert([{ name: newGroupName }])
      .select();

    if (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group.");
    } else {
      alert("Group created successfully!");
      setGroups([...groups, ...data]);
      setNewGroupName("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Create Group Section */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Group</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="flex-1 border border-gray-300 p-2 rounded"
                />
                <button 
                  onClick={createGroup}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Manage Users Section */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white text-center">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2">Email</th>
                      <th className="border border-gray-300 px-4 py-2">Role</th>
                      <th className="border border-gray-300 px-4 py-2">Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <select
                            defaultValue={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="p-1 border border-gray-300 rounded text-center"
                          >
                            <option value="user">User</option>
                            <option value="club_admin">Club Admin</option>
                            <option value="mes_admin">MES Admin</option>
                          </select>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <select
                            value={user.group_id || ""}
                            onChange={(e) => updateUserGroup(user.id, e.target.value)}
                            className="p-1 border border-gray-300 rounded text-center bg-white"
                          >
                            <option value="">None</option>
                            {groups.map((group) => (
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
      </main>
    </div>
  );
}
