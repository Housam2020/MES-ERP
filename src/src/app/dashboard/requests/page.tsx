// Add this at the very top of the file
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

// Your component code remains the same below...


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

        // Fetch user details including group
        const { data: userData } = await supabase
          .from("users")
          .select("id, group_id, groups(id, name)")
          .eq("id", user.id)
          .single();

        setCurrentUser(userData);

        // Base query for payment requests
        let paymentRequestsQuery = supabase
          .from("payment_requests")
          .select("*, groups(name)")
          .order("timestamp", { ascending: false });

        // Base query for budget requests
        let budgetRequestsQuery = supabase
          .from("annual_budget_form") // Fetch from the annual_budget_form table
          .select("id, club_name, requested_mes_funding, created_at") // Select only the required fields
          .order("created_at", { ascending: false });

        // Determine request visibility based on permissions
        if (permissions.includes("view_all_requests")) {
          // Admin can see all requests
        } else if (permissions.includes("view_club_requests")) {
          // Club leaders/admins see requests from their group
          if (userData?.group_id) {
            // Filter by club_name instead of group_id
            budgetRequestsQuery = budgetRequestsQuery.eq("club_name", userData.groups.name);
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
        if (budgetRequestsError) {
          console.error("Error fetching budget requests:", budgetRequestsError);
          throw budgetRequestsError;
        }
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

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    // Update UI immediately
    setPaymentRequests(
      paymentRequests.map((request) =>
        request.request_id === requestId
          ? { ...request, status: newStatus }
          : request
      )
    );

    // Find the request to get its details
    const request = paymentRequests.find((r) => r.request_id === requestId);

    // Print params on request to console for debugging
    console.log("Request:", request);

    // Send email notification
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
                ? `Payment Requests for ${currentUser?.groups?.name || "Your Club"}`
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
                ? `Budget Requests for ${currentUser?.groups?.name || "Your Club"}`
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
                    <th className="py-2 px-4 bg-gray-50 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-2 px-4 border-b">{request.club_name}</td>
                      <td className="py-2 px-4 border-b">${request.requested_mes_funding}</td>
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
