"use client";
import React, { Suspense, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Footer from "@/components/dashboard/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Lazy load the Payment row component correctly:
const EditableStatusRow = React.lazy(() =>
  import("@/components/dashboard/EditableStatusRow")
);

// Import the Budget row component normally
import EditableBudgetStatusRow from "@/components/dashboard/EditableBudgetStatusRow";

export default function RequestsPage() {
  // Tab state: "payment" or "budget"
  const [activeTab, setActiveTab] = useState("payment");

  // Data & UI state
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [budgetRequests, setBudgetRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewableGroups, setViewableGroups] = useState([]);
  const [error, setError] = useState(null);

  // Supabase & Permissions
  const supabase = createClient();
  const router = useRouter();
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissions();

  // Fetch data once permissions are known
  useEffect(() => {
    async function fetchData() {
      try {
        // Check if user is logged in
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // -- Fetch current user info
        const { data: userData } = await supabase
          .from("users")
          .select("id, email, fullName")
          .eq("id", user.id)
          .single();
        setCurrentUser(userData);

        // -- Determine which groups this user can view
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
          const rolePerms = rolePermissions
            .map((rp) => rp.permissions?.name)
            .filter(Boolean);

          if (rolePerms.includes("view_club_requests") && assignment.group_id) {
            viewableGroupIds.push(assignment.group_id);
          }
        });

        // -- Fetch viewable group names (for display)
        if (viewableGroupIds.length > 0) {
          const { data: viewableGroupsData } = await supabase
            .from("groups")
            .select("id, name")
            .in("id", viewableGroupIds);
          setViewableGroups(viewableGroupsData || []);
        }

        // -- Fetch Payment Requests
        let paymentRequestsQuery = supabase
          .from("payment_requests")
          .select("*, groups(name)")
          .order("timestamp", { ascending: false });

        if (!permissions.includes("view_all_requests")) {
          if (permissions.includes("view_club_requests")) {
            if (viewableGroupIds.length > 0) {
              paymentRequestsQuery = paymentRequestsQuery.in(
                "group_id",
                viewableGroupIds
              );
            } else {
              paymentRequestsQuery = paymentRequestsQuery.eq("user_id", user.id);
            }
          } else {
            paymentRequestsQuery = paymentRequestsQuery.eq("user_id", user.id);
          }
        }

        const {
          data: paymentData,
          error: paymentError,
        } = await paymentRequestsQuery;

        if (paymentError) {
          throw new Error(paymentError.message);
        }

        setPaymentRequests(paymentData || []);

        // -- Fetch Budget Requests
        let budgetQuery = supabase
          .from("annual_budget_form")
          .select("id, club_name, requested_mes_funding, created_at, status")
          .order("created_at", { ascending: false });

        // If user cannot see all requests or club requests, force an empty result
        if (
          !permissions.includes("view_all_requests") &&
          !permissions.includes("view_club_requests")
        ) {
          budgetQuery = budgetQuery.in("id", []);
        }

        const {
          data: budgetData,
          error: budgetError,
        } = await budgetQuery;

        if (budgetError) {
          throw new Error(budgetError.message);
        }

        setBudgetRequests(budgetData || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading && !permissionsError) {
      fetchData();
    }
  }, [permissions, permissionsLoading, permissionsError, router, supabase]);

  // ------------------------
  // Status update handlers
  // ------------------------
  const handlePaymentStatusUpdate = async (requestId, newStatus) => {
    setPaymentRequests((prev) =>
      prev.map((r) =>
        r.request_id === requestId ? { ...r, status: newStatus } : r
      )
    );

    const request = paymentRequests.find((r) => r.request_id === requestId);
    if (!request) return;

    try {
      // Optionally send an email or do other side effects
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

  const handleBudgetStatusUpdate = (id, newStatus) => {
    setBudgetRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    // You could also do a Supabase update or side effect here if necessary
  };

  // Combine these for a single “still loading” check
  const isStillLoading = loading || permissionsLoading;

  // Handle major errors
  if (permissionsError) {
    return (
      <div className="p-6 text-red-600">
        Error: {permissionsError.message}
      </div>
    );
  }
  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  // Prepare display of viewable group names
  const viewableGroupsDisplay =
    viewableGroups.length > 0
      ? viewableGroups.map((g) => g.name).join(", ")
      : "Your Managed Clubs";

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-grow">
        <div className="container mx-auto p-6">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <Button
                  variant={activeTab === "payment" ? "default" : "outline"}
                  onClick={() => setActiveTab("payment")}
                >
                  Payment Requests
                </Button>
                <Button
                  variant={activeTab === "budget" ? "default" : "outline"}
                  onClick={() => setActiveTab("budget")}
                  className="ml-4"
                >
                  Budget Requests
                </Button>
              </div>

              <div>
                {activeTab === "payment" &&
                  (permissions.includes("create_requests") ||
                    permissions.includes("view_all_requests")) && (
                    <Link href="/forms">
                      <Button>Create New Payment Request</Button>
                    </Link>
                  )}
                {activeTab === "budget" &&
                  (permissions.includes("create_budget_requests") ||
                    permissions.includes("view_all_requests")) && (
                    <Link href="/dashboard/annual_form">
                      <Button>Create New Budget Request</Button>
                    </Link>
                  )}
              </div>
            </CardHeader>

            <CardContent>
              {isStillLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Payment Requests Table wrapped in Suspense */}
                  <Suspense fallback={<div className="text-center py-8">Loading Payment Requests Table...</div>}>
                    <div className={activeTab === "payment" ? "" : "hidden"}>
                      {paymentRequests.length > 0 ? (
                        <table className="min-w-full text-sm">
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
                                onStatusUpdate={handlePaymentStatusUpdate}
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
                  </Suspense>

                  {/* Budget Requests Table */}
                  <div className={activeTab === "budget" ? "" : "hidden"}>
                    {budgetRequests.length > 0 ? (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="py-2 px-4 bg-gray-50 text-left">
                              Club Name
                            </th>
                            <th className="py-2 px-4 bg-gray-50 text-left">
                              Requested MES Funding
                            </th>
                            <th className="py-2 px-4 bg-gray-50 text-left">
                              Status
                            </th>
                            <th className="py-2 px-4 bg-gray-50 text-left">
                              Date
                            </th>
                            <th className="py-2 px-4 bg-gray-50 text-left">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgetRequests.map((request) => (
                            <EditableBudgetStatusRow
                              key={request.id}
                              request={request}
                              onStatusUpdate={handleBudgetStatusUpdate}
                            />
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No budget requests found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
