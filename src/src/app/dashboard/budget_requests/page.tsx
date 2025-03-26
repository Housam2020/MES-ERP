"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BudgetRequestsPage() {
  const supabase = createClient();
  const router = useRouter();
  const {
    permissions,
    loading: permissionsLoading,
    error: permissionsError,
  } = usePermissions();

  const [budgetRequests, setBudgetRequests] = useState([]);
  const [loading, setLoading] = useState(true);
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

        let query = supabase
          .from("annual_budget_form")
          .select("id, club_name, requested_mes_funding, created_at, status")
          .order("created_at", { ascending: false });

        if (
          !permissions.includes("view_all_requests") &&
          !permissions.includes("view_club_requests")
        ) {
          // If no permissions to view anything, return empty results
          query = query.eq("id", "no-results-will-match");
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          console.error("Error fetching budget requests:", queryError);
          setError(queryError.message);
        } else {
          setBudgetRequests(data || []);
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading && !permissionsError) {
      fetchData();
    }
  }, [permissions, permissionsLoading, permissionsError]);

  if (loading || permissionsLoading) return <div className="p-6">Loading...</div>;
  if (permissionsError)
    return <div className="p-6 text-red-600">Error: {permissionsError.message}</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div>
      <DashboardHeader />
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Budget Requests</CardTitle>
            {permissions.includes("create_budget_requests") && (
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
                        <td className="py-2 px-4 border-b">
                          ${request.requested_mes_funding?.toLocaleString()}
                        </td>
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
      </div>
    </div>
  );
}
