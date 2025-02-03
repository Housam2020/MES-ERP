"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import EditableStatusRow from "./EditableStatusRow";

export default function MESAdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [paymentRequests, setPaymentRequests] = useState([]);
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

      const { data: userRole, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (roleError || !userRole || userRole.role !== "mes_admin") {
        console.error("Access denied: User is not an MES Admin");
        router.push("/dashboard/user");
        return;
      }

      // Fetch all payment requests
      const { data: requests, error: requestsError } = await supabase
        .from("payment_requests")
        .select("*, groups(name)") // Join groups table
        .order("timestamp", { ascending: true });

      if (requestsError) {
        console.error("Error fetching payment requests:", requestsError);
      } else {
        setPaymentRequests(requests);
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
      {/* Header */}
      <header className="w-full bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-lg font-semibold">MES Admin Dashboard</h1>
          <form action="/signout" method="post">
            <button className="rounded-full border border-solid border-white/[.2] transition-colors flex items-center justify-center hover:bg-blue-700 text-sm h-10 px-4">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center bg-gray-100 p-10">
        {/* Reimbursement Requests Table */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Reimbursement Requests</h2>
        <div className="w-full overflow-x-auto mb-10">
          <table className="min-w-full bg-white text-center">
            <thead>
              <tr>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Full Name</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Who Are You</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Amount Requested (CAD)</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Group Name</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Payment Timeframe</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Reimbursement or Payment</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Timestamp</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentRequests.length > 0 ? (
                paymentRequests.map((request) => (
                  <EditableStatusRow key={request.request_id} request={request} />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-600">
                    No payment requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create Group Section */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create a New Group</h2>
        <div className="flex space-x-2 mb-8">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Enter group name"
            className="border border-gray-300 p-2 rounded"
          />
          <button onClick={createGroup} className="bg-green-500 text-white px-4 py-2 rounded">
            Create
          </button>
        </div>

        {/* Manage Users Section */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Manage Users</h2>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full bg-white text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Role</th>
                <th className="border border-gray-300 px-4 py-2">Group</th>
              </tr>
            </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="border border-gray-300 px-4 py-2">{user.email}</td>

                    {/* Role Dropdown */}
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

                    {/* Group Dropdown */}
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
      </main>
    </div>
  );
}
