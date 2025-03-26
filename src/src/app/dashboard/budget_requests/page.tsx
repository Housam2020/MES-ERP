"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RequestsPage() {
  const supabase = createClient();
  const router = useRouter();
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissions();
  const [budgetRequests, setBudgetRequests] = useState([]);
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

        if (permissions.includes("view_all_requests") || permissions.includes("view_club_requests")) {
          try {
            let budgetRequestsQuery = supabase
              .from("annual_budget_form")
              .select("id, club_name, requested_mes_funding, created_at, status, group_id")
              .order("created_at", { ascending: false });

            if (permissions.includes("view_club_requests") && !permissions.includes("view_all_requests")) {
              if (viewableGroupIds.length > 0) {
                budgetRequestsQuery = budgetRequestsQuery.in("group_id", viewableGroupIds);
              } else {
                budgetRequestsQuery = budgetRequestsQuery.eq("id", "no-results-will-match-this");
              }
            }

            const { data: budgetRequestsData, error: budgetRequestsError } = await budgetRequestsQuery;

            if (budgetRequestsError) {
              console.error("Error fetching budget requests:", budgetRequestsError);
              setBudgetRequests([]);
            } else {
              setBudgetRequests(budgetRequestsData || []);
            }
          } catch (budgetError) {
            console.error("Error in budget requests section:", budgetError);
            setBudgetRequests([]);
          }
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
        {/* Budget Requests Table */}
        {(permissions.includes("view_all_requests") || permissions.includes("view_club_requests")) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {permissions.includes("view_all_requests")
                  ? "All Budget Requests"
                  : `Budget Requests for ${viewableGroupsDisplay}`}
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
                {budgetRequests.length > 0 ? (
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
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No budget requests found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
