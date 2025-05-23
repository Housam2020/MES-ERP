"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Footer from "@/components/dashboard/Footer";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Clock, FileText } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const supabase = createClient();
  const router = useRouter();
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalAmount: 0,
    pendingRequests: 0,
    totalUsers: 0,
    userRequests: 0,
    userAmount: 0,
  });
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

        // Fetch current user details
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
          ? [
              ...new Map(
                userGroupsData.map((item) => [item.group_id, item.groups])
              ).values(),
            ]
          : [];

        setUserGroups(groups);

        // Fetch user's full permissions from the user_roles table
        const { data: permissionsData } = await supabase
          .from("user_roles")
          .select(`
            role_id,
            roles!inner (
              role_permissions!inner (
                permissions!inner (
                  name
                )
              )
            )
          `)
          .eq("user_id", user.id);

        // Flatten permissions from all roles
        const userPermissions =
          permissionsData?.flatMap(
            (role) => role.roles?.role_permissions?.map((rp) => rp.permissions.name) || []
          ) || [];

        // Always fetch user's own requests
        let userRequestsQuery = supabase
          .from("payment_requests")
          .select("*", { count: "exact" })
          .eq("user_id", user.id);

        const { count: userRequestsCount } = await userRequestsQuery;
        const { data: userRequestsData } = await userRequestsQuery;

        const userAmount =
          userRequestsData?.reduce(
            (sum, req) => sum + (req.amount_requested_cad || 0),
            0
          ) || 0;

        // Default stats object with user's personal stats
        const statsUpdate = {
          userRequests: userRequestsCount || 0,
          userAmount,
        };

        // Add additional stats for users with broader permissions
        if (
          userPermissions.includes("view_all_requests") ||
          userPermissions.includes("view_club_requests")
        ) {
          // Prepare query for broader stats
          let statsQuery = supabase
            .from("payment_requests")
            .select("*", { count: "exact" });

          // Apply group filter for club-level access
          if (
            !userPermissions.includes("view_all_requests") &&
            userPermissions.includes("view_club_requests")
          ) {
            // Get user's group IDs
            const groupIds = groups.map((group) => group.id);

            if (groupIds.length > 0) {
              // Filter requests for any of the user's groups
              statsQuery = statsQuery.in("group_id", groupIds);
            }
          }

          const { count: totalRequests } = await statsQuery;
          const { data: requestsData } = await statsQuery;

          statsUpdate.totalRequests = totalRequests || 0;
          statsUpdate.totalAmount =
            requestsData?.reduce(
              (sum, req) => sum + (req.amount_requested_cad || 0),
              0
            ) || 0;
          statsUpdate.pendingRequests =
            requestsData?.filter((req) => req.status === "Submitted").length ||
            0;
        }

        // Add total users for full admins
        if (userPermissions.includes("view_all_requests")) {
          const { count } = await supabase
            .from("users")
            .select("*", { count: "exact" });
          statsUpdate.totalUsers = count || 0;
        }

        setStats((prevStats) => ({ ...prevStats, ...statsUpdate }));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading) {
      fetchData();
    }
  }, [permissions, permissionsLoading]);

  if (loading || permissionsLoading) return <div>Loading...</div>;

  // Get the primary group for display (first group or empty string)
  const primaryGroup = userGroups.length > 0 ? userGroups[0].name : "";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header at the top */}
      <DashboardHeader />

      {/* Main content grows to push footer to the bottom */}
      <main className="flex-grow">
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {/* Your Requests Card */}
            <Link href="/dashboard/requests" className="h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between h-12">
                  <CardTitle className="text-sm font-medium">
                    Your Requests
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex flex-col items-start justify-start flex-grow">
                  {/* Reserve space for the main stat */}
                  <div className="min-h-[40px]">
                    <div className="text-2xl font-bold">
                      {stats.userRequests}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total Amount: ${stats.userAmount.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Total/Club Requests Card */}
            {(permissions.includes("view_club_requests") ||
              permissions.includes("view_all_requests")) && (
              <>
                <Link href="/dashboard/requests" className="h-full">
                  <Card className="h-full flex flex-col cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between h-12">
                      <CardTitle className="text-sm font-medium">
                        {permissions.includes("view_all_requests")
                          ? "Total Requests"
                          : `${primaryGroup || "Club"} Requests`}
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex flex-col items-start justify-start flex-grow">
                      {/* Reserve space for the main stat */}
                      <div className="min-h-[40px]">
                        <div className="text-2xl font-bold">
                          {stats.totalRequests}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total Amount: ${stats.totalAmount.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Pending Requests Card */}
                <Link href="/dashboard/requests" className="h-full">
                  <Card className="h-full flex flex-col cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between h-12">
                      <CardTitle className="text-sm font-medium">
                        Pending Requests
                      </CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex flex-col items-start justify-start flex-grow">
                      {/* Reserve space for the main stat */}
                      <div className="min-h-[40px]">
                        <div className="text-2xl font-bold">
                          {stats.pendingRequests}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </>
            )}

            {/* Total Users Card (Admin Only) */}
            {permissions.includes("view_all_requests") && (
              <Link href="/dashboard/users" className="h-full">
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between h-12">
                    <CardTitle className="text-sm font-medium">
                      Total Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="flex flex-col items-start justify-start flex-grow">
                    {/* Reserve space for the main stat */}
                    <div className="min-h-[40px]">
                      <div className="text-2xl font-bold">
                        {stats.totalUsers}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Footer at the bottom */}
      <Footer />
    </div>
  );
}
