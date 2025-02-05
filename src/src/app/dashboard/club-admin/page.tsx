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
import ClubAdminHeader from "@/components/dashboard/ClubAdminHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import EditableStatusRow from "@/components/dashboard/EditableStatusRow";
import _ from 'lodash';

export default function ClubAdminDashboard() {
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

      // Fetch user role and group ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, group_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData || userData.role !== "club_admin") {
        console.error("Access denied: User is not a Club Admin");
        router.push("/dashboard/user");
        return;
      }

      const groupId = userData.group_id;

      // Fetch payment requests for the Club Admin's group
      const { data: requests, error: requestsError } = await supabase
        .from("payment_requests")
        .select("*, groups(name)")
        .eq("group_id", groupId)
        .order("timestamp", { ascending: true });

      // Fetch users in the same group
      const { data: groupUsers, error: usersError } = await supabase
        .from("users")
        .select("id, email, role")
        .eq("group_id", groupId);

      if (!requestsError) setPaymentRequests(requests);
      if (!usersError) setUsers(groupUsers);

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

  // Update payment request status
  const updatePaymentRequestStatus = (requestId, newStatus) => {
    setPaymentRequests(currentRequests =>
      currentRequests.map(request =>
        request.request_id === requestId
          ? { ...request, status: newStatus }
          : request
      )
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <ClubAdminHeader />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Metrics Section */}
        {dashboardMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            {/* Group Members */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Group Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardMetrics.totalUsers} Members
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reimbursement Requests Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Group Reimbursement Requests
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
