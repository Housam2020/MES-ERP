"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/dashboard/AdminHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  DollarSign, 
  Users, 
  CheckCircle, 
  Clock, 
  PieChart, 
  FileText 
} from 'lucide-react';
import _ from 'lodash';

export default function MESAdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAccessAndFetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userRole, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (roleError || !userRole || userRole.role !== "mes_admin") {
        console.error("Access denied: User is not an MES Admin");
        router.push("/dashboard/user");
        return;
      }

      // Fetch payment requests
      const { data: requests, error: requestsError } = await supabase
        .from("payment_requests")
        .select("*, groups(name)")
        .order("timestamp", { ascending: true });

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, email, role, group_id");

      if (!requestsError) setPaymentRequests(requests);
      if (!usersError) setUsers(usersData);

      setLoading(false);
    }

    checkAdminAccessAndFetchData();
  }, []);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    if (!paymentRequests.length || !users.length) return null;

    // Total amount requested
    const totalAmountRequested = _.sumBy(paymentRequests, 'amount_requested_cad');

    // Pending requests
    const pendingRequests = paymentRequests.filter(req => req.status === 'pending');

    // Average request amount
    const averageRequestAmount = totalAmountRequested / paymentRequests.length;

    // User distribution
    const userRoleDistribution = _.countBy(users, 'role');

    return {
      totalAmountRequested,
      pendingRequestsCount: pendingRequests.length,
      averageRequestAmount,
      userRoleDistribution,
      totalRequests: paymentRequests.length,
      totalUsers: users.length
    };
  }, [paymentRequests, users]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        {dashboardMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Amount Requested */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount Requested</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${dashboardMetrics.totalAmountRequested.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            {/* Pending Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardMetrics.pendingRequestsCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  out of {dashboardMetrics.totalRequests} total requests
                </p>
              </CardContent>
            </Card>

            {/* Average Request Amount */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Request Amount</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${dashboardMetrics.averageRequestAmount.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            {/* User Role Distribution */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Roles</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardMetrics.totalUsers} Total Users
                </div>
                <div className="text-xs text-muted-foreground">
                  {Object.entries(dashboardMetrics.userRoleDistribution).map(([role, count]) => (
                    <div key={role}>{role}: {count}</div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <a 
                  href="/dashboard/mes-admin/analytics" 
                  className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center"
                >
                  View Full Analytics
                </a>
                <a 
                  href="/dashboard/mes-admin/roles" 
                  className="block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-center"
                >
                  Manage Roles
                </a>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
