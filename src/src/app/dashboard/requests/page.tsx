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
        let requestsQuery = supabase
          .from("payment_requests")
          .select("*, groups(name)")
          .order("timestamp", { ascending: false });

        // Determine request visibility based on permissions
        if (permissions.includes("view_all_requests")) {
          // Admin can see all requests
          // No additional filtering needed
        } else if (permissions.includes("view_club_requests")) {
          // Club leaders/admins see requests from their group
          if (userData?.group_id) {
            requestsQuery = requestsQuery.eq("group_id", userData.group_id);
          }
        } else {
          // Regular users see only their own requests
          requestsQuery = requestsQuery.eq("user_id", user.id);
        }

        const { data: requests, error: requestsError } = await requestsQuery;

        if (requestsError) throw requestsError;
        setPaymentRequests(requests || []);
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {permissions.includes("view_all_requests")
                ? "All Payment Requests"
                : permissions.includes("view_club_requests")
                ? `Payment Requests for ${
                    currentUser?.groups?.name || "Your Club"
                  }`
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
                    <th className="py-2 px-4 bg-gray-50 text-left">
                      Timeframe
                    </th>
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
      </div>
    </div>
  );
}
