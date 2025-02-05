"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import ClubAdminHeader from "@/components/dashboard/ClubAdminHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ClubRolesPage() {
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

      // Fetch user role and group ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, group_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData || userData.role !== "club_admin") {
        console.error("Access denied: User is not a Club Admin");
        router.push("/dashboard/user");
        return;
      }

      const groupId = userData.group_id;

      // Fetch users in the same group
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, email, role, group_id")
        .eq("group_id", groupId);

      if (!usersError) setUsers(usersData);

      // Fetch groups for the club admin's group
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("id, name")
        .eq("id", groupId);

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
      <ClubAdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Create Group Section - Disabled for Club Admin as they manage a single group */}
          <Card>
            <CardHeader>
              <CardTitle>Club Group Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                {groups.length > 0 && (
                  <div className="flex-1">
                    <p className="font-medium">Current Group: {groups[0].name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manage Users Section */}
          <Card>
            <CardHeader>
              <CardTitle>Manage Club Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white text-center">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2">Email</th>
                      <th className="border border-gray-300 px-4 py-2">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="p-1 border border-gray-300 rounded text-center"
                          >
                            <option value="user">User</option>
                            <option value="club_admin">Club Admin</option>
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
