"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { 
  DollarSign, 
  Users, 
  Clock, 
  FileText 
} from 'lucide-react';
import AdminHeader from "@/components/dashboard/AdminHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import EditableStatusRow from "@/components/dashboard/EditableStatusRow";
import _ from 'lodash';

export default function MESAdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState([]);
  const [userGroupId, setUserGroupId] = useState(null);

  useEffect(() => {
    async function checkAccessAndFetchData() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Get user's group and permissions
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('group_id')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;
        setUserGroupId(userData.group_id);

        const { data: permData, error: permError } = await supabase
          .from('role_permissions')
          .select(`
            permissions (name),
            roles!inner (
              users!inner (id)
            )
          `)
          .eq('roles.users.id', user.id);

        if (permError) throw permError;
        const permissions = permData.map(p => p.permissions.name);
        setUserPermissions(permissions);

        // Check if user has permission to view requests
        if (!permissions.includes('view_all_requests') && 
            !permissions.includes('view_club_requests') && 
            !permissions.includes('view_own_requests')) {
          router.push("/dashboard");
          return;
        }

        // Fetch payment requests based on permissions
        let requestsQuery = supabase
          .from("payment_requests")
          .select("*, groups(name)")
          .order("timestamp", { ascending: false });

        // Filter requests based on permissions
        if (!permissions.includes('view_all_requests')) {
          if (permissions.includes('view_club_requests') && userData.group_id) {
            requestsQuery = requestsQuery.eq('group_id', userData.group_id);
          } else {
            requestsQuery = requestsQuery.eq('user_id', user.id);
          }
        }

        const { data: requests, error: requestsError } = await requestsQuery;
        if (requestsError) throw requestsError;
        setPaymentRequests(requests);

        // Fetch users if has appropriate permission
        if (permissions.includes('view_all_requests') || permissions.includes('view_club_requests')) {
          let usersQuery = supabase.from("users").select("id, email, role_id, group_id");
          if (!permissions.includes('view_all_requests')) {
            usersQuery = usersQuery.eq('group_id', userData.group_id);
          }
          const { data: usersData, error: usersError } = await usersQuery;
          if (!usersError) setUsers(usersData);
        }

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAccessAndFetchData();
  }, []);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    if (!paymentRequests.length) return null;

    // Total amount requested
    const totalAmountRequested = _.sumBy(paymentRequests, 'amount_requested_cad');

    // Pending requests
    const pendingRequests = paymentRequests.filter(req => req.status === 'Submitted');

    // Average request amount
    const averageRequestAmount = totalAmountRequested / paymentRequests.length;

    return {
      totalAmountRequested,
      pendingRequestsCount: pendingRequests.length,
      averageRequestAmount,
      totalRequests: paymentRequests.length,
      totalUsers: users.length
    };
  }, [paymentRequests, users]);

  const updatePaymentRequestStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: newStatus })
        .eq('request_id', requestId);

      if (error) throw error;

      setPaymentRequests(currentRequests =>
        currentRequests.map(request =>
          request.request_id === requestId
            ? { ...request, status: newStatus }
            : request
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Metrics Section */}
        {dashboardMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Amount Requested */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {userPermissions.includes('view_all_requests') 
                    ? 'Total Amount Requested'
                    : 'Amount Requested (Your Organization)'}
                </CardTitle>
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

            {/* Total Users */}
            {(userPermissions.includes('view_all_requests') || userPermissions.includes('view_club_requests')) && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {userPermissions.includes('view_all_requests') 
                      ? 'Total Users' 
                      : 'Organization Users'}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardMetrics.totalUsers} Users
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Reimbursement Requests Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {userPermissions.includes('view_all_requests') 
              ? 'All Reimbursement Requests'
              : userPermissions.includes('view_club_requests')
                ? 'Organization Reimbursement Requests'
                : 'Your Reimbursement Requests'}
          </h2>
          <div className="w-full overflow-x-auto">
            <table className="min-w-full bg-white text-center">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Full Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Who Are You</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Amount Requested (CAD)</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Group Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Payment Timeframe</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Reimbursement or Payment</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Timestamp</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentRequests.length > 0 ? (
                  paymentRequests.map((request) => (
                    <EditableStatusRow 
                      key={request.request_id} 
                      request={request}
                      onStatusUpdate={updatePaymentRequestStatus}
                      canEdit={userPermissions.includes('view_all_requests') || 
                              (userPermissions.includes('view_club_requests') && 
                               request.group_id === userGroupId)}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-4 text-center text-gray-600">
                      No payment requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
