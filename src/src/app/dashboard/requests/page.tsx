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
  const [userGroups, setUserGroups] = useState([]);
  const [viewableGroups, setViewableGroups] = useState([]);
  const [error, setError] = useState(null);

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

        const { data: userData } = await supabase
          .from("users")
          .select("id, email, fullName")
          .eq("id", user.id)
          .single();

        setCurrentUser(userData);

        const { data: userRoleAssignments } = await supabase
          .from("user_roles")
          .select(`
            role_id,
            group_id,
            roles (
              id,
              name,
              role_permissions (
                permissions (
                  name
                )
              )
            )
          `)
          .eq("user_id", user.id);

        const viewableGroupIds = [];
        userRoleAssignments?.forEach((assignment) => {
          const rolePermissions = assignment.roles?.role_permissions || [];
          const rolePerms = rolePermissions.map((rp) => rp.permissions?.name).filter(Boolean);

          if (rolePerms.includes("view_club_requests") && assignment.group_id) {
            viewableGroupIds.push(assignment.group_id);
          }
        });

        const { data: userGroupsData, error: groupsError } = await supabase
          .from("user_roles")
          .select("group_id, groups(id, name)")
          .eq("user_id", user.id)
          .not("group_id", "is", null);

        if (groupsError) {
          console.error("Error fetching user groups:", groupsError);
          setError(groupsError.message);
        }

        const allGroups = userGroupsData
          ? userGroupsData
              .filter((item) => item.groups)
              .map((item) => item.groups)
              .filter((group, index, self) => index === self.findIndex((g) => g.id === group.id))
          : [];

        setUserGroups(allGroups);

        if (viewableGroupIds.length > 0) {
          const { data: viewableGroupsData } = await supabase
            .from("groups")
            .select("id, name")
            .in("id", viewableGroupIds);

          setViewableGroups(viewableGroupsData || []);
        }

        let paymentRequestsQuery = supabase
          .from("payment_requests")
          .select("*, groups(name)")
          .order("timestamp", { ascending: false });

        if (permissions.includes("view_all_requests")) {
          // Show all requests
        } else if (permissions.includes("view_club_requests")) {
          if (viewableGroupIds.length > 0) {
            paymentRequestsQuery = paymentRequestsQuery.in("group_id", viewableGroupIds);
          } else {
            paymentRequestsQuery = paymentRequestsQuery.eq("user_id", user.id);
          }
        } else {
          paymentRequestsQuery = paymentRequestsQuery.eq("user_id", user.id);
        }

        const { data: paymentRequestsData, error: paymentRequestsError } = await paymentRequestsQuery;

        if (paymentRequestsError) {
          console.error("Error fetching payment requests:", paymentRequestsError);
          setError(paymentRequestsError.message);
        } else {
          setPaymentRequests(paymentRequestsData || []);
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        setError(error.message);
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
  if (error) return <div>Error loading data: {error}</div>;

  const viewableGroupsDisplay =
    viewableGroups.length > 0
      ? viewableGroups.map((g) => g.name).join(", ")
      : "Your Managed Clubs";

  return (
    <div>
      <DashboardHeader />
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {permissions.includes("view_all_requests")
                ? "All Payment Requests"
                : permissions.includes("view_club_requests")
                ? `Payment Requests for ${viewableGroupsDisplay}`
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
              {paymentRequests.length > 0 ? (
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
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No payment requests found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
