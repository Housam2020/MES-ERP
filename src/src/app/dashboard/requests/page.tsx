"use client";
import React, { Suspense, useState, useEffect, useRef } from "react";
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

  // Modal state for warnings
  const [warningModalMessage, setWarningModalMessage] = useState(null);
  // Use a ref to store the promise resolver so we can await the modal dismissal
  const warningModalPromiseResolverRef = useRef(null);

  // Helper: showWarning returns a promise that resolves when the user closes the modal
  const showWarning = (message) => {
    return new Promise((resolve) => {
      setWarningModalMessage(message);
      warningModalPromiseResolverRef.current = resolve;
    });
  };

  // Close modal handler
  const closeModal = () => {
    if (warningModalPromiseResolverRef.current) {
      warningModalPromiseResolverRef.current();
    }
    setWarningModalMessage(null);
    warningModalPromiseResolverRef.current = null;
  };

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
    // 1) Optimistically update local state
    setPaymentRequests((prev) =>
      prev.map((r) =>
        r.request_id === requestId ? { ...r, status: newStatus } : r
      )
    );

    // 2) Find the old request
    const request = paymentRequests.find((r) => r.request_id === requestId);
    if (!request) return;

    const oldStatus = request.status;

    // 3a) If going from "Submitted" -> "Reimbursed", add the expense line
    if (oldStatus === "Submitted" && newStatus === "Reimbursed") {
      try {
        if (!request.group_id) {
          alert("No group_id found for this request.");
          return;
        }

        // Fetch the group's current total
        const { data: groupData, error: grpErr } = await supabase
          .from("groups")
          .select("*")
          .eq("id", request.group_id)
          .single();

        if (grpErr || !groupData) {
          console.error("Error fetching group:", grpErr);
          alert("Could not find group for this request");
          return;
        }

        const currentBudget = Number(groupData.total_budget ?? 0);
        const reimburseAmount = Number(request.amount_requested_cad ?? 0);

        // Warn if budget would go below zero using our modal
        if (reimburseAmount > currentBudget) {
          await showWarning(
            `⚠️ Warning: The club only has $${currentBudget.toFixed(
              2
            )} left, but this reimbursement is $${reimburseAmount.toFixed(
              2
            )}. Proceeding anyway.`
          );
        }

        // Create a descriptive label
        const formattedDate = new Date(request.timestamp).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        const label = `Reimbursed to ${request.full_name ?? "Unknown"} for ${
          request.role_title ?? "unknown role"
        } (${request.payment_type ?? "unknown type"}) on ${formattedDate}`;

        // Insert an expense line so it subtracts from the budget
        const { error: lineErr } = await supabase
          .from("operating_budget_lines")
          .insert({
            group_id: request.group_id,
            line_label: label,
            amount: reimburseAmount,
            line_type: "expense",
            request_id: requestId,
          });

        if (lineErr) {
          console.error("Error inserting expense line:", lineErr);
          alert("❌ Failed to insert expense line into budget table.");
        } else {
          const newBudget = currentBudget - reimburseAmount;
          // Update the group's total budget
          const { error: updErr } = await supabase
            .from("groups")
            .update({ total_budget: newBudget })
            .eq("id", request.group_id);

          if (updErr) {
            console.error("Error updating group total_budget:", updErr);
            alert("❌ Failed to update the group's total budget.");
          }
        }
      } catch (err) {
        console.error("Error during reimbursement flow:", err);
      }
    }
    // 3b) If going from "Reimbursed" -> "Submitted", remove the expense line(s)
    else if (oldStatus === "Reimbursed" && newStatus === "Submitted") {
      try {
        if (!request.group_id) {
          alert("No group_id found for this request.");
          return;
        }

        // Fetch any expense lines associated with this request
        const { data: expenseLines, error: expenseErr } = await supabase
          .from("operating_budget_lines")
          .select("id, amount")
          .eq("request_id", requestId);

        if (expenseErr) {
          console.error("Error fetching expense lines:", expenseErr);
          alert("Error fetching expense lines for removal");
          return;
        }

        // Sum the total amount that was subtracted
        const totalRemoved = expenseLines.reduce(
          (sum, line) => sum + Number(line.amount),
          0
        );

        // Delete all expense lines associated with this request
        const { error: deleteErr } = await supabase
          .from("operating_budget_lines")
          .delete()
          .eq("request_id", requestId);

        if (deleteErr) {
          console.error("Error deleting expense lines:", deleteErr);
          alert("❌ Failed to remove expense line(s) from budget table.");
        } else {
          // Fetch the group's current total budget
          const { data: groupData, error: grpErr } = await supabase
            .from("groups")
            .select("total_budget")
            .eq("id", request.group_id)
            .single();

          if (grpErr || !groupData) {
            console.error("Error fetching group for update:", grpErr);
            alert("Could not update group budget.");
            return;
          }
          const currentBudget = Number(groupData.total_budget ?? 0);
          // Add back the removed expense amount
          const newBudget = currentBudget + totalRemoved;

          const { error: updErr } = await supabase
            .from("groups")
            .update({ total_budget: newBudget })
            .eq("id", request.group_id);

          if (updErr) {
            console.error("Error updating group total_budget:", updErr);
            alert("❌ Failed to update the group's total budget.");
          }
        }
      } catch (err) {
        console.error("Error during status reversal:", err);
      }
    }

    // 4) Update the request’s status in the DB
    try {
      const { error: statusErr } = await supabase
        .from("payment_requests")
        .update({ status: newStatus })
        .eq("request_id", requestId);

      if (statusErr) {
        console.error("Error updating request status:", statusErr);
        alert("❌ Could not update request status in DB.");
      }
    } catch (err) {
      console.error("Error finalizing status change:", err);
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

      {/* Warning Modal: Closes on clicking the "X" or the overlay */}
      {warningModalMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white p-4 rounded shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 text-xl"
            >
              &times;
            </button>
            <div>{warningModalMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}
