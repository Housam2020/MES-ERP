"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Clock, FileText } from 'lucide-react';
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
    userAmount: 0
  });
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

        // Fetch current user details
        const { data: userData } = await supabase
          .from('users')
          .select('id, group_id, groups(id, name)')
          .eq('id', user.id)
          .single();

        setCurrentUser(userData);

        // Fetch user's full permissions
        const { data: permissionsData } = await supabase
          .from('users')
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
          .eq('id', user.id)
          .single();

        const userPermissions = permissionsData?.roles?.role_permissions?.map(
          rp => rp.permissions.name
        ) || [];

        // Always fetch user's own requests
        let userRequestsQuery = supabase
          .from("payment_requests")
          .select("*", { count: "exact" })
          .eq("user_id", user.id);

        const { count: userRequestsCount } = await userRequestsQuery;
        const { data: userRequestsData } = await userRequestsQuery;
        
        const userAmount = userRequestsData?.reduce((sum, req) => sum + (req.amount_requested_cad || 0), 0) || 0;

        // Default stats object with user's personal stats
        const statsUpdate = {
          userRequests: userRequestsCount || 0,
          userAmount
        };

        // Add additional stats for users with broader permissions
        if (userPermissions.includes('view_all_requests') || 
            userPermissions.includes('view_club_requests')) {
          
          // Prepare query for broader stats
          let statsQuery = supabase
            .from("payment_requests")
            .select("*", { count: "exact" });

          // Apply group filter for club-level access
          if (!userPermissions.includes('view_all_requests') && 
              userPermissions.includes('view_club_requests')) {
            if (userData?.group_id) {
              statsQuery = statsQuery.eq('group_id', userData.group_id);
            }
          }

          const { count: totalRequests } = await statsQuery;
          const { data: requestsData } = await statsQuery;
          
          statsUpdate.totalRequests = totalRequests || 0;
          statsUpdate.totalAmount = requestsData?.reduce((sum, req) => sum + (req.amount_requested_cad || 0), 0) || 0;
          statsUpdate.pendingRequests = requestsData?.filter(req => req.status === "Submitted").length || 0;
        }

        // Add total users for full admins
        if (userPermissions.includes('view_all_requests')) {
          const { count } = await supabase
            .from("users")
            .select("*", { count: "exact" });
          statsUpdate.totalUsers = count || 0;
        }

        setStats(prevStats => ({ ...prevStats, ...statsUpdate }));
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

  return (
    <div>
    <DashboardHeader />
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Always show user's personal requests */}
        <Link href="/dashboard/requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.userRequests}</div>
              <p className="text-xs text-muted-foreground">Total Amount: ${stats.userAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
        </Link>

        {/* Conditionally render broader stats based on permissions */}
        {(permissions.includes('view_club_requests') || permissions.includes('view_all_requests')) && (
          <>
            <Link href="/dashboard/requests">
              <Card className="cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {permissions.includes('view_all_requests') 
                      ? "Total Requests" 
                      : `${currentUser?.groups?.name || 'Club'} Requests`}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRequests}</div>
                  <p className="text-xs text-muted-foreground">Total Amount: ${stats.totalAmount.toFixed(2)}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/requests">
              <Card className="cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                </CardContent>
              </Card>
            </Link>
          </>
        )}

          {/* Admin-only stat */}
          {permissions.includes('view_all_requests') && (
            <Link href="/dashboard/users">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
