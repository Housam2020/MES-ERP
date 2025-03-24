"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import EditableStatusRow from "@/components/dashboard/EditableStatusRow";

export default function RequestsPage() {
  const supabase = createClient();
  const router = useRouter();
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissions();
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [budgetRequests, setBudgetRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userGroups, setUserGroups] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch user details
        const { data: userData } = await supabase
          .from("users")
          .select("id, email, fullName")
          .eq("id", user.id)
          .single();

        setCurrentUser(userData);

        // Fetch user's groups through the user_roles table
        const { data: userGroupsData } = await supabase
          .from("user_roles")
          .select("group_id, groups(id, name)")
          .eq("user_id", user.id)
          .not("group_id", "is", null);

        // Extract unique groups
        const groups = userGroupsData
          ? [...new Map(userGroupsData.map(item => [item.group_id, item.groups])).values()]
          : [];
        
        setUserGroups(groups);

        // Base query for payment requests
        let paymentRequestsQuery = supabase
          .from("payment_requests")
          .select("*, groups(name)")
          .order("timestamp", { ascending: false });

        // Base query for budget requests
        let budgetRequestsQuery = supabase
          .from("annual_budget_form")
          .select("id, club_name, requested_mes_funding, created_at, status")
          .order("created_at", { ascending: false });

        // Determine request visibility based on permissions
        if (permissions.includes("view_all_requests")) {
          // Admin can see all requests
        } else if (permissions.includes("view_club_requests")) {
          // Club leaders/admins see requests from their groups
          if (groups.length > 0) {
            const groupIds = groups.map(group => group.id);
            paymentRequestsQuery = paymentRequestsQuery.in("group_id", groupIds);
            
            // For budget requests, we need to filter by club name
            // This might need adjustment if budget requests have group_id instead of club_name
            const groupNames = groups.map(group => group.name);
            budgetRequestsQuery = budgetRequestsQuery.in("club_name", groupNames);
          }
        } else {
          // Regular users see only their own requests
          paymentRequestsQuery = paymentRequestsQuery.eq("user_id", user.id);
          budgetRequestsQuery = budgetRequestsQuery.eq("user_id", user.id);
        }

        // Fetch payment requests
        const { data: paymentRequestsData, error: paymentRequestsError } = await paymentRequestsQuery;
        if (paymentRequestsError) throw paymentRequestsError;
        setPaymentRequests(paymentRequestsData || []);

        // Fetch budget requests
        const { data: budgetRequestsData, error: budgetRequestsError } = await budgetRequestsQuery;
        if (budgetRequestsError) throw budgetRequestsError;
        setBudgetRequests(budgetRequestsData || []);
      } catch (error) {
        console.error("Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading && !permissionsError) {
      fetchData();
    }
  }, [permissions, permissionsLoading, permissionsError]);

  const handleStatusUpdate = async (requestId, newStatus) => {
    setPaymentRequests(
      paymentRequests.map((request) =>
        request.request_id === requestId
          ? { ...request, status: newStatus }
          : request
      )
    );

    const request = paymentRequests.find((r) => r.request_id === requestId);
    console.log("Request:", request);

    try {
      await fetch("/api/send-email-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          newStatus,
          amount: request.amount_requested_cad,
          userEmail: request.email_address,
        }),
      });
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  };

  if (loading || permissionsLoading) return <div>Loading...</div>;
  if (permissionsError)
    return <div>Error loading permissions: {permissionsError.message}</div>;

  // Get a display name for user's groups
  const userGroupsDisplay = userGroups.length > 0 
    ? userGroups.map(g => g.name).join(", ")
    : "Your Clubs";

  return (
    <div>
      <DashboardHeader />
      <div className="container mx-auto p-6">
        {/* Payment Requests Table */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {permissions.includes("view_all_requests")
                ? "All Payment Requests"
                : permissions.includes("view_club_requests")
                ? `Payment Requests for ${userGroupsDisplay}`
                : "Your Payment Requests"}
            </CardTitle>
            {(permissions.includes("create_requests") ||
              permissions.includes("view_all_requests")) && (
              <Link href="/forms">
                <Button>Create New Request</Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-gray-50 text-left">Name</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Role</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Amount</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Group</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Timeframe</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Type</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Date</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRequests.map((request) => (
                    <EditableStatusRow
                      key={request.request_id}
                      request={request}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Budget Requests Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {permissions.includes("view_all_requests")
                ? "All Budget Requests"
                : permissions.includes("view_club_requests")
                ? `Budget Requests for ${userGroupsDisplay}`
                : "Your Budget Requests"}
            </CardTitle>
            {(permissions.includes("create_budget_requests") ||
              permissions.includes("view_all_requests")) && (
              <Link href="/budget-forms">
                <Button>Create New Budget Request</Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-gray-50 text-left">Club Name</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Requested MES Funding</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Status</th>
                    <th className="py-2 px-4 bg-gray-50 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-2 px-4 border-b">{request.club_name}</td>
                      <td className="py-2 px-4 border-b">${request.requested_mes_funding}</td>
                      <td className="py-2 px-4 border-b">{request.status}</td>
                      <td className="py-2 px-4 border-b">
                        {new Date(request.created_at).toLocaleDateString()}
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
